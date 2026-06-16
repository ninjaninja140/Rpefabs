import { Workspace } from '@rbxts/services';
import type { LoadedPrefab, PrefabInfo } from 'services/PrefabService';

// ─────────────────────────────────────────────────────────────────────────────
// Enums & interfaces
// ─────────────────────────────────────────────────────────────────────────────

export enum PlacementPivot {
	Center = 'Center',
	BackCenter = 'BackCenter',
	BackLeft = 'BackLeft',
	BackRight = 'BackRight',
}

export enum SnapMode {
	None = 'None',
	Grid = 'Grid',
	Face = 'Face',
}

export enum PlacementMode {
	Single = 'Single',
	Array = 'Array',
}

/** Which face of the object the arc pivots from. Maps to Roblox NormalId. */
export type ArcAxis = 'X' | 'Y' | 'Z';

/** Which rotation type (Yaw / Pitch / Roll). Roll only valid for Y axis. */
export type ArcRotationType = 'Yaw' | 'Pitch' | 'Roll';

/** Alignment of the pivot point on the face. */
export type ArcAlignment = 'Inside' | 'Middle' | 'Outside';

export type FaceAlignment = 'Left' | 'Center' | 'Right';

export interface ArcConfig {
	enabled: boolean;
	angle: number; // degrees, positive or negative, -270..270
	axis: ArcAxis;
	rotationType: ArcRotationType;
	faceAlignment: FaceAlignment;
	alignment: ArcAlignment;
	flipAxis: boolean;
	swapSides: boolean;
}

export interface PlacedPrefabEntry {
	model: Model;
	prefabName: string;
}

export interface SnapConfig {
	mode: SnapMode;
	gridSize: number;
	faceSnapDistance: number;
	rotationOffset: number; // degrees, flat Y rotation of each placed piece
}

export interface ArrayPlacementAnchor {
	cframe: CFrame;
	halfSize: Vector3;
}
// ─────────────────────────────────────────────────────────────────────────────
// Arc math — edge-to-edge chaining
// ─────────────────────────────────────────────────────────────────────────────

function getDirectionVector(direction: 'px' | 'nx' | 'pz' | 'nz'): Vector3 {
	if (direction === 'px') return new Vector3(1, 0, 0);
	if (direction === 'nx') return new Vector3(-1, 0, 0);
	if (direction === 'pz') return new Vector3(0, 0, 1);
	return new Vector3(0, 0, -1);
}

const FACE_ALIGNMENT_OFFSETS: Record<FaceAlignment, number> = {
	Left: -0.5,
	Center: 0,
	Right: 0.5,
};

const ALIGNMENT_OFFSETS: Record<ArcAlignment, number> = {
	Inside: 0.5,
	Middle: 0,
	Outside: -0.5,
};

/**
 * Given the previous model's CFrame, its size, and the arc config,
 * returns the CFrame for the next model placed edge-to-edge and rotated by angle.
 */
function computeNextArcCFrame(
	prevCF: CFrame,
	size: Vector3,
	cfg: ArcConfig,
	direction: 'px' | 'nx' | 'pz' | 'nz'
): CFrame {
	let rotAxis: Vector3;
	if (cfg.axis === 'X') rotAxis = new Vector3(1, 0, 0);
	else if (cfg.axis === 'Z') rotAxis = new Vector3(0, 0, 1);
	else rotAxis = new Vector3(0, 1, 0);

	if (cfg.swapSides) rotAxis = rotAxis.mul(-1);

	const angleRad = math.rad(cfg.angle);
	const stepDir = getDirectionVector(direction);

	const stride = direction === 'px' || direction === 'nx' ? size.X : size.Z;

	// Depth-wise hinge offset (Inner/Center/Outer)
	const depthOffset = ALIGNMENT_OFFSETS[cfg.alignment];

	// Face-wise hinge offset (Left/Center/Right)
	const faceOffset = FACE_ALIGNMENT_OFFSETS[cfg.faceAlignment];

	// Perpendicular direction along the face (rotate stepDir 90° around rotAxis)
	let perpDir = rotAxis.Cross(stepDir);
	if (perpDir.Magnitude < 0.001) {
		// stepDir is parallel to rotAxis — pick a sensible perpendicular
		if (cfg.axis === 'X') perpDir = new Vector3(0, 0, 1);
		else if (cfg.axis === 'Y') perpDir = new Vector3(1, 0, 0);
		else perpDir = new Vector3(1, 0, 0);
	}
	perpDir = perpDir.Unit;

	// Width of the model along the face direction
	const faceWidth = direction === 'px' || direction === 'nx' ? size.Z : size.X;

	// Offset from model center to hinge point
	const centerToHinge = stepDir.mul(stride * depthOffset).add(perpDir.mul(faceWidth * faceOffset));

	// After rotating, the next model's center is half a stride away from the hinge
	const hingeToNextCenter = stepDir.mul(stride / 2);

	const rotationCF = cfg.flipAxis
		? CFrame.fromAxisAngle(rotAxis, -angleRad)
		: CFrame.fromAxisAngle(rotAxis, angleRad);

	const hingeCF = prevCF.mul(new CFrame(centerToHinge));
	const rotatedCF = hingeCF.mul(rotationCF);
	const nextCF = rotatedCF.mul(new CFrame(hingeToNextCenter));

	return nextCF;
}

/**
 * For single placement chaining (step 1).
 */
function computeArcTransform(size: Vector3, anchorCF: CFrame, cfg: ArcConfig): CFrame | undefined {
	if (cfg.angle === 0) return undefined;
	const lookDir = new Vector3(anchorCF.LookVector.X, 0, anchorCF.LookVector.Z);
	let direction: 'px' | 'nx' | 'pz' | 'nz' = 'pz';
	if (lookDir.Magnitude > 0.01) {
		const absX = math.abs(lookDir.X);
		const absZ = math.abs(lookDir.Z);
		if (absX > absZ) {
			direction = lookDir.X > 0 ? 'px' : 'nx';
		} else {
			direction = lookDir.Z > 0 ? 'pz' : 'nz';
		}
	}
	return computeNextArcCFrame(anchorCF, size, cfg, direction);
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function ensurePrimaryPart(model: Model): void {
	if (model.PrimaryPart) return;
	const [cframe, size] = model.GetBoundingBox();
	if (size.X === 0 || size.Y === 0 || size.Z === 0) return;
	const part = new Instance('Part');
	part.Name = '__PrimaryPart__';
	part.Shape = Enum.PartType.Block;
	part.CanCollide = false;
	part.CFrame = cframe;
	part.Size = size;
	part.Transparency = 1;
	part.Parent = model;
	model.PrimaryPart = part;
}

function groundedCFrame(position: Vector3, rotationDeg: number, model: Model): CFrame {
	const [, size] = model.GetBoundingBox();
	const halfHeight = size.Y / 2;
	return new CFrame(position.X, position.Y + halfHeight, position.Z).mul(CFrame.Angles(0, math.rad(rotationDeg), 0));
}

// ─────────────────────────────────────────────────────────────────────────────
// PlacementSystem class
// ─────────────────────────────────────────────────────────────────────────────

class PlacementSystemClass {
	// ── state ─────────────────────────────────────────────────────────────────
	private placedPrefabs: PlacedPrefabEntry[] = [];
	private previousPrefabsByType: Map<string, Model> = new Map();

	private snapConfig: SnapConfig = {
		mode: SnapMode.Grid,
		gridSize: 1,
		faceSnapDistance: 5,
		rotationOffset: 0,
	};

	private selectedPrefab: LoadedPrefab | undefined;
	private shadowModel: Model | undefined;

	private placementMode: PlacementMode = PlacementMode.Single;
	private pivotMode: PlacementPivot = PlacementPivot.Center;

	public setPivotMode(mode: PlacementPivot) {
		this.pivotMode = mode;
	}

	public getPivotMode() {
		return this.pivotMode;
	}

	// Arc (Archimedes-style) configuration
	private arcConfig: ArcConfig = {
		enabled: false,
		angle: 10,
		axis: 'X',
		rotationType: 'Yaw',
		alignment: 'Inside',
		faceAlignment: 'Center',
		flipAxis: false,
		swapSides: false,
	};

	// Array mode state
	private arrayAnchor: ArrayPlacementAnchor | undefined;
	private arrayArrows: Model[] = [];
	private arrayPreviewModels: Model[] = [];
	private _arraySpacing = 0;

	// The CFrame of the *last* placed model — used for arc chaining
	private lastPlacedCF: CFrame | undefined;

	// ── arc public API ────────────────────────────────────────────────────────

	getArcConfig(): ArcConfig {
		return { ...this.arcConfig };
	}

	setArcConfig(partial: Partial<ArcConfig>) {
		this.arcConfig = { ...this.arcConfig, ...partial };
		// Rebuild shadow preview when config changes
		if (this.selectedPrefab) this.refreshShadow();
	}

	/**
	 * Given the last placed model's CFrame, return the CFrame for the next
	 * placement according to the current arc config. Used to preview and place.
	 */
	getNextArcCFrame(baseCF: CFrame): CFrame | undefined {
		if (!this.selectedPrefab || !this.arcConfig.enabled || this.arcConfig.angle === 0) return undefined;

		const size = this.selectedPrefabSize!;
		return computeArcTransform(size, baseCF, this.arcConfig);
	}

	getLastPlacedCF(): CFrame | undefined {
		return this.lastPlacedCF;
	}

	resetArcChain() {
		this.lastPlacedCF = undefined;
	}

	// ── shadow helpers ────────────────────────────────────────────────────────

	private selectedPrefabSize: Vector3 | undefined;

	setSelectedPrefab(prefab: LoadedPrefab | undefined) {
		this.selectedPrefab = prefab;
		this.lastPlacedCF = undefined;
		if (prefab) {
			this.selectedPrefabSize = prefab.model.GetBoundingBox()[1]; // cache size
			if (!this.shadowModel) {
				this.createShadowModel(prefab);
			}
		} else if (!prefab && this.shadowModel) {
			this.destroyShadow();
			this.selectedPrefabSize = undefined;
		}
	}

	getSelectedPrefab(): LoadedPrefab | undefined {
		return this.selectedPrefab;
	}

	private createShadowModel(prefab: LoadedPrefab) {
		this.destroyShadow();
		const shadow = prefab.model.Clone();
		shadow.Name = 'Shadow';
		const infoScript = shadow.FindFirstChild('Prefab.info');
		if (infoScript?.IsA('ModuleScript')) infoScript.Destroy();
		ensurePrimaryPart(shadow);
		for (const desc of shadow.GetDescendants()) {
			if (desc.IsA('BasePart')) {
				const part = desc as BasePart;
				part.Transparency = 0.6;
				part.Color = Color3.fromRGB(100, 150, 255);
				desc.CanQuery = false;
				desc.CanCollide = false;
				desc.CanTouch = false;
			}
		}
		this.shadowModel = shadow;
	}

	private destroyShadow() {
		if (this.shadowModel) {
			this.shadowModel.Destroy();
			this.shadowModel = undefined;
		}
	}

	private refreshShadow() {
		if (!this.selectedPrefab) return;
		this.createShadowModel(this.selectedPrefab);
	}

	/**
	 * Move the shadow to the correct position.
	 *
	 * If arc mode is on and we have a lastPlacedCF, the shadow snaps to the
	 * arc-predicted next position — otherwise it follows the mouse.
	 */
	updateShadowPosition(hitPosition: Vector3) {
		if (!this.shadowModel || !this.selectedPrefab) return;
		if (!this.shadowModel.Parent) this.shadowModel.Parent = Workspace;

		let targetCF: CFrame;

		if (this.arcConfig.enabled && this.lastPlacedCF) {
			const arcCF = this.getNextArcCFrame(this.lastPlacedCF);
			if (arcCF) {
				targetCF = arcCF;
			} else {
				targetCF = groundedCFrame(hitPosition, this.snapConfig.rotationOffset, this.selectedPrefab.model);
			}
		} else {
			targetCF = groundedCFrame(hitPosition, this.snapConfig.rotationOffset, this.selectedPrefab.model);
		}

		this.shadowModel.PivotTo(targetCF);
	}

	getShadowModel(): Model | undefined {
		return this.shadowModel;
	}

	// ── snapping ──────────────────────────────────────────────────────────────

	private getPivotOffset(size: Vector3): Vector3 {
		switch (this.pivotMode) {
			case PlacementPivot.Center:
				return Vector3.zero;

			case PlacementPivot.BackCenter:
				return new Vector3(0, 0, size.Z / 2);

			case PlacementPivot.BackLeft:
				return new Vector3(-size.X / 2, 0, size.Z / 2);

			case PlacementPivot.BackRight:
				return new Vector3(size.X / 2, 0, size.Z / 2);
		}
	}

	private snapPosition(position: Vector3, rotation: number): CFrame {
		const rotCF = CFrame.Angles(0, math.rad(rotation), 0);

		const model = this.selectedPrefab!.model;
		const size = model.GetExtentsSize();

		const pivotOffset = this.getPivotOffset(size);

		// base position (your snap logic stays here)
		let basePosition = new CFrame(position);

		if (this.snapConfig.mode === SnapMode.Grid) {
			const g = this.snapConfig.gridSize;
			const sx = math.round(position.X / g) * g;
			const sz = math.round(position.Z / g) * g;
			basePosition = new CFrame(new Vector3(sx, position.Y, sz));
		}

		if (this.snapConfig.mode === SnapMode.Face) {
			const nearby = Workspace.GetPartBoundsInRadius(position, this.snapConfig.faceSnapDistance);
			if (nearby.size() > 0) {
				const snapped = this.snapToFace(position, nearby[0]);
				basePosition = new CFrame(snapped);
			}
		}

		const base = basePosition.mul(rotCF);

		// 🔥 key fix: pivot must follow rotation
		const rotatedPivot = rotCF.mul(new CFrame(pivotOffset));

		return base.mul(rotatedPivot);
	}

	private snapToFace(position: Vector3, part: BasePart): Vector3 {
		const ps = part.Size;
		const pp = part.Position;
		const localPos = pp.sub(position);
		const dists = [
			math.abs(localPos.X - ps.X / 2),
			math.abs(localPos.X + ps.X / 2),
			math.abs(localPos.Y - ps.Y / 2),
			math.abs(localPos.Y + ps.Y / 2),
			math.abs(localPos.Z - ps.Z / 2),
			math.abs(localPos.Z + ps.Z / 2),
		];
		let minD = math.huge,
			face = 0;
		for (let i = 0; i < 6; i++) {
			if (dists[i] < minD) {
				minD = dists[i];
				face = i;
			}
		}
		const s = position;
		if (face === 0) return new Vector3(pp.X + ps.X / 2, s.Y, s.Z);
		if (face === 1) return new Vector3(pp.X - ps.X / 2, s.Y, s.Z);
		if (face === 2) return new Vector3(s.X, pp.Y + ps.Y / 2, s.Z);
		if (face === 3) return new Vector3(s.X, pp.Y - ps.Y / 2, s.Z);
		if (face === 4) return new Vector3(s.X, s.Y, pp.Z + ps.Z / 2);
		return new Vector3(s.X, s.Y, pp.Z - ps.Z / 2);
	}

	// ── single placement ──────────────────────────────────────────────────────

	placePrefab(position: Vector3, rotation: number = 0): Model | undefined {
		if (!this.selectedPrefab) return undefined;

		let finalCF: CFrame;

		if (this.arcConfig.enabled && this.lastPlacedCF) {
			// Arc chain: place at the predicted arc position
			const arcCF = this.getNextArcCFrame(this.lastPlacedCF);
			if (arcCF) {
				finalCF = arcCF;
			} else {
				// Fallback: straight placement with snap
				const snapped = this.snapPosition(position, rotation);
				finalCF = groundedCFrame(snapped.Position, rotation, this.selectedPrefab.model);
			}
		} else {
			const snapped = this.snapPosition(position, rotation);
			finalCF = groundedCFrame(snapped.Position, rotation, this.selectedPrefab.model);
		}

		const placed = this.spawnPrefab(this.selectedPrefab, finalCF);
		this.lastPlacedCF = finalCF;
		return placed;
	}

	private spawnPrefab(prefab: LoadedPrefab, pivotCF: CFrame): Model {
		const instance = prefab.model.Clone();
		const infoScript = instance.FindFirstChild('Prefab.info') as ModuleScript | undefined;
		let callback: ((prev: Model | undefined, next: Model) => void) | undefined;
		if (infoScript?.IsA('ModuleScript')) {
			const req = require(infoScript) as { prefab?: PrefabInfo };
			callback = req.prefab?.AddedCallback;
			infoScript.Destroy();
		}
		const gen = instance.FindFirstChild('__PrimaryPart__');
		if (gen) gen.Destroy();
		ensurePrimaryPart(instance);
		instance.PivotTo(pivotCF);
		instance.Parent = Workspace;
		const tempPP = instance.FindFirstChild('__PrimaryPart__');
		if (tempPP) tempPP.Destroy();
		const prevModel = this.previousPrefabsByType.get(prefab.name);
		if (callback) {
			task.spawn(() => {
				try {
					callback!(prevModel, instance);
				} catch (e) {
					warn(`Prefab callback error (${prefab.name}):`, e);
				}
			});
		}
		this.previousPrefabsByType.set(prefab.name, instance);
		this.placedPrefabs.push({ model: instance, prefabName: prefab.name });
		return instance;
	}

	// ── undo / cancel ─────────────────────────────────────────────────────────

	undoLastPlacement(): boolean {
		if (this.placedPrefabs.size() === 0) return false;
		const last = this.placedPrefabs.pop();
		if (!last) return false;
		const { prefabName } = last;
		let newPrev: Model | undefined;
		for (let i = this.placedPrefabs.size() - 1; i >= 0; i--) {
			if (this.placedPrefabs[i].prefabName === prefabName) {
				newPrev = this.placedPrefabs[i].model;
				break;
			}
		}
		if (newPrev) this.previousPrefabsByType.set(prefabName, newPrev);
		else this.previousPrefabsByType.delete(prefabName);
		last.model.Destroy();

		// Rewind arc chain: restore lastPlacedCF to the previous entry of same type
		const prevEntry = this.placedPrefabs.filter((e) => e.prefabName === prefabName).pop();
		if (prevEntry) {
			const [cf] = prevEntry.model.GetBoundingBox();
			this.lastPlacedCF = cf;
		} else {
			this.lastPlacedCF = undefined;
		}

		return true;
	}

	cancelPlacement() {
		this.destroyShadow();
		this.clearArrayState();
		this.selectedPrefab = undefined;
		this.lastPlacedCF = undefined;
	}

	// ── snap config ───────────────────────────────────────────────────────────

	setSnapMode(mode: SnapMode) {
		this.snapConfig.mode = mode;
	}
	getSnapMode(): SnapMode {
		return this.snapConfig.mode;
	}
	setGridSize(size: number) {
		this.snapConfig.gridSize = math.max(0.1, size);
	}
	setRotationOffset(rotation: number) {
		this.snapConfig.rotationOffset = rotation % 360;
	}
	getRotationOffset(): number {
		return this.snapConfig.rotationOffset;
	}

	// ── placement mode ────────────────────────────────────────────────────────

	setPlacementMode(mode: PlacementMode) {
		if (this.placementMode === mode) return;
		this.placementMode = mode;
		if (mode === PlacementMode.Single) this.clearArrayState();
	}
	getPlacementMode(): PlacementMode {
		return this.placementMode;
	}

	// ── array placement ───────────────────────────────────────────────────────

	setArraySpacing(s: number) {
		this._arraySpacing = math.max(0, s);
	}
	getArraySpacing(): number {
		return this._arraySpacing;
	}

	anchorArrayPlacement(position: Vector3, rotation: number): Model | undefined {
		if (!this.selectedPrefab) return undefined;
		this.clearArrayState();
		const snapped = this.snapPosition(position, rotation);
		const groundedCF2 = groundedCFrame(snapped.Position, rotation, this.selectedPrefab.model);
		const size = this.selectedPrefabSize!;
		this.arrayAnchor = { cframe: groundedCF2, halfSize: size.div(2) };
		const placed = this.spawnPrefab(this.selectedPrefab, groundedCF2);
		this.lastPlacedCF = groundedCF2;
		this.spawnArrayArrows(groundedCF2, size);
		return placed;
	}

	getArrayAnchor(): ArrayPlacementAnchor | undefined {
		return this.arrayAnchor;
	}

	private spawnArrayArrows(anchorCF: CFrame, modelSize: Vector3) {
		this.clearArrows();
		const dirs: Array<{ id: string; offset: Vector3; rot: number }> = [
			{ id: 'px', offset: new Vector3(modelSize.X / 2 + 2, 0, 0), rot: -90 },
			{ id: 'nx', offset: new Vector3(-(modelSize.X / 2 + 2), 0, 0), rot: 90 },
			{ id: 'pz', offset: new Vector3(0, 0, modelSize.Z / 2 + 2), rot: 180 },
			{ id: 'nz', offset: new Vector3(0, 0, -(modelSize.Z / 2 + 2)), rot: 0 },
		];
		for (const dir of dirs) {
			const arrow = this.createArrowModel(dir.id);
			// Rotate the offset by the anchor's rotation
			const worldOffset = anchorCF.VectorToWorldSpace(dir.offset);
			const pos = anchorCF.Position.add(worldOffset);
			const cf = new CFrame(pos).mul(anchorCF.sub(anchorCF.Position)).mul(CFrame.Angles(0, math.rad(dir.rot), 0));
			ensurePrimaryPart(arrow);
			arrow.PivotTo(cf);
			arrow.Parent = Workspace;
			this.arrayArrows.push(arrow);
		}
	}

	private createArrowModel(id: string): Model {
		const model = new Instance('Model');
		model.Name = `__ArrayArrow_${id}__`;
		const shaft = new Instance('Part');
		shaft.Name = 'Shaft';
		shaft.Shape = Enum.PartType.Block;
		shaft.Size = new Vector3(0.3, 0.3, 1.5);
		shaft.CFrame = new CFrame(0, 0, 0);
		shaft.Color = Color3.fromRGB(255, 200, 0);
		shaft.Material = Enum.Material.Neon;
		shaft.CanCollide = false;
		shaft.CastShadow = false;
		shaft.Parent = model;
		model.PrimaryPart = shaft;
		const head = new Instance('Part');
		head.Name = 'Head';
		head.Shape = Enum.PartType.Block;
		head.Size = new Vector3(0.7, 0.7, 0.7);
		head.CFrame = new CFrame(0, 0, 1.1);
		head.Color = Color3.fromRGB(255, 200, 0);
		head.Material = Enum.Material.Neon;
		head.CanCollide = false;
		head.CastShadow = false;
		head.Parent = model;
		const weld = new Instance('WeldConstraint');
		weld.Part0 = shaft;
		weld.Part1 = head;
		weld.Parent = shaft;
		return model;
	}

	private clearArrows() {
		for (const a of this.arrayArrows) {
			if (a.Parent) a.Destroy();
		}
		this.arrayArrows = [];
	}

	getArrayArrows(): Model[] {
		return this.arrayArrows;
	}

	/**
	 * Preview N copies from the anchor in the given direction.
	 * If arc mode is on, copies follow the arc curve; otherwise they are linear.
	 */
	previewArrayExtension(direction: 'px' | 'nx' | 'pz' | 'nz', count: number) {
		if (!this.arrayAnchor || !this.selectedPrefab || count <= 0) {
			this.clearArrayPreview();
			return;
		}
		this.clearArrayPreview();

		if (this.arcConfig.enabled && this.arcConfig.angle !== 0) {
			const size = this.selectedPrefabSize!;
			let currentCF = this.arrayAnchor.cframe;
			for (let i = 1; i <= count; i++) {
				currentCF = computeNextArcCFrame(currentCF, size, this.arcConfig, direction);
				const ghost = this.createGhostModel(this.selectedPrefab, currentCF, Color3.fromRGB(255, 200, 80));
				ghost.Parent = Workspace;
				this.arrayPreviewModels.push(ghost);
			}
		} else {
			// Linear preview
			const step = this.getStepVector(direction);
			const size = this.selectedPrefabSize!;
			const stride =
				direction === 'px' || direction === 'nx' ? size.X + this._arraySpacing : size.Z + this._arraySpacing;

			for (let i = 1; i <= count; i++) {
				const offset = step.mul(stride * i);
				const pos = this.arrayAnchor.cframe.Position.add(offset);
				const cf = new CFrame(pos.X, this.arrayAnchor.cframe.Position.Y, pos.Z).mul(
					CFrame.Angles(0, math.rad(this.snapConfig.rotationOffset), 0)
				);
				const ghost = this.createGhostModel(this.selectedPrefab, cf, Color3.fromRGB(255, 200, 80));
				ghost.Parent = Workspace;
				this.arrayPreviewModels.push(ghost);
			}
		}
	}

	private createGhostModel(prefab: LoadedPrefab, cf: CFrame, color: Color3): Model {
		const ghost = prefab.model.Clone();
		const info = ghost.FindFirstChild('Prefab.info');
		if (info?.IsA('ModuleScript')) info.Destroy();
		ensurePrimaryPart(ghost);
		for (const desc of ghost.GetDescendants()) {
			if (desc.IsA('BasePart')) {
				const bp = desc as BasePart;
				bp.Transparency = 0.75;
				bp.CanCollide = false;
				bp.Color = color;
			}
		}
		ghost.PivotTo(cf);
		return ghost;
	}

	clearArrayPreview() {
		for (const m of this.arrayPreviewModels) {
			if (m.Parent) m.Destroy();
		}
		this.arrayPreviewModels = [];
	}

	/**
	 * Commit N copies in a direction from the anchor.
	 * Uses arc curve if arc mode is on, otherwise linear.
	 */
	commitArrayExtension(direction: 'px' | 'nx' | 'pz' | 'nz', count: number): Model[] {
		if (!this.arrayAnchor || !this.selectedPrefab || count <= 0) return [];
		this.clearArrayPreview();

		const placed: Model[] = [];

		if (this.arcConfig.enabled && this.arcConfig.angle !== 0) {
			const size = this.selectedPrefabSize!;
			let currentCF = this.arrayAnchor.cframe;
			for (let i = 1; i <= count; i++) {
				currentCF = computeNextArcCFrame(currentCF, size, this.arcConfig, direction);
				const m = this.spawnPrefab(this.selectedPrefab, currentCF);
				placed.push(m);
			}
			if (placed.size() > 0) this.lastPlacedCF = currentCF;
		} else {
			const step = this.getStepVector(direction);
			const [, size] = this.selectedPrefab.model.GetBoundingBox();
			const stride =
				direction === 'px' || direction === 'nx' ? size.X + this._arraySpacing : size.Z + this._arraySpacing;

			for (let i = 1; i <= count; i++) {
				const offset = step.mul(stride * i);
				const pos = this.arrayAnchor.cframe.Position.add(offset);
				const cf = new CFrame(pos.X, this.arrayAnchor.cframe.Position.Y, pos.Z).mul(
					CFrame.Angles(0, math.rad(this.snapConfig.rotationOffset), 0)
				);
				const m = this.spawnPrefab(this.selectedPrefab, cf);
				placed.push(m);
			}
		}

		// Shift anchor to the last placed model
		if (placed.size() > 0) {
			const lastModel = placed[placed.size() - 1];
			const [lastCF] = lastModel.GetBoundingBox();
			this.arrayAnchor = { cframe: lastCF, halfSize: this.arrayAnchor.halfSize };
		}

		this.spawnArrayArrows(this.arrayAnchor.cframe, this.arrayAnchor.halfSize.mul(2));
		return placed;
	}

	private getStepVector(direction: 'px' | 'nx' | 'pz' | 'nz'): Vector3 {
		if (direction === 'px') return new Vector3(1, 0, 0);
		if (direction === 'nx') return new Vector3(-1, 0, 0);
		if (direction === 'pz') return new Vector3(0, 0, 1);
		return new Vector3(0, 0, -1);
	}

	clearArrayState() {
		this.clearArrows();
		this.clearArrayPreview();
		this.arrayAnchor = undefined;
	}

	isArrayAnchored(): boolean {
		return this.arrayAnchor !== undefined;
	}

	// ── misc ──────────────────────────────────────────────────────────────────

	getPlacedCount(): number {
		return this.placedPrefabs.size();
	}

	clearAll() {
		for (const e of this.placedPrefabs) e.model.Destroy();
		this.placedPrefabs = [];
	}
}

export const PlacementSystem = new PlacementSystemClass();
