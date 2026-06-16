import { Workspace } from '@rbxts/services';
import type { LoadedPrefab } from 'services/PrefabService';

export enum SnapMode {
	None = 'None',
	Grid = 'Grid',
	Face = 'Face',
}

export enum PlacementMode {
	Single = 'Single',
	Array = 'Array',
}

export interface PlacedPrefabEntry {
	model: Model;
	prefabName: string;
}

export interface SnapConfig {
	mode: SnapMode;
	gridSize: number;
	faceSnapDistance: number;
	rotationOffset: number;
}

export interface ArrayPlacementAnchor {
	/** World-space CFrame of the anchored first prefab */
	cframe: CFrame;
	/** Bounding-box half-extents of the prefab */
	halfSize: Vector3;
}

export interface ArrayPlacementPreview {
	direction: 'px' | 'nx' | 'pz' | 'nz';
	count: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Ensure a Model has a PrimaryPart so MoveTo / PivotTo work reliably. */
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

/**
 * Return the CFrame the model should be pivoted to so that its bounding-box
 * *bottom* sits at `groundY` and its horizontal centre sits at `(x, z)`.
 *
 * This fixes the "shadow flies toward the camera" bug: previously we called
 * MoveTo(mouse.Hit.Position) which moves the PrimaryPart (not the model
 * pivot) to that point, causing the whole model to drift when the PrimaryPart
 * is not at the geometric centre.
 */
function groundedCFrame(position: Vector3, rotation: number, model: Model): CFrame {
	const [, size] = model.GetBoundingBox();
	const halfHeight = size.Y / 2;

	return new CFrame(position.X, position.Y + halfHeight, position.Z).mul(CFrame.Angles(0, math.rad(rotation), 0));
}

// ---------------------------------------------------------------------------
// Placement system
// ---------------------------------------------------------------------------

class PlacementSystemClass {
	// ---- state ---------------------------------------------------------------
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

	// ---- mode ----------------------------------------------------------------
	private placementMode: PlacementMode = PlacementMode.Single;

	// Array mode state
	private arrayAnchor: ArrayPlacementAnchor | undefined;
	private arrayArrows: Model[] = [];
	private arrayPreviewModels: Model[] = [];
	private _arraySpacing = 0;

	// ---- shadow helpers ------------------------------------------------------

	setSelectedPrefab(prefab: LoadedPrefab | undefined) {
		this.selectedPrefab = prefab;
		if (prefab && !this.shadowModel) {
			this.createShadowModel(prefab);
		} else if (!prefab && this.shadowModel) {
			this.destroyShadow();
		}
	}

	getSelectedPrefab(): LoadedPrefab | undefined {
		return this.selectedPrefab;
	}

	private createShadowModel(prefab: LoadedPrefab) {
		this.destroyShadow();

		const shadow = prefab.model.Clone();
		shadow.Name = 'Shadow';

		const prefabInfo = shadow.FindFirstChild('Prefab.info');
		if (prefabInfo?.IsA('ModuleScript')) prefabInfo.Destroy();

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

	/**
	 * Move the shadow so its bottom rests on the hit surface.
	 * Uses PivotTo (not MoveTo) so the model's geometric origin is placed
	 * correctly regardless of where the PrimaryPart happens to be.
	 */
	updateShadowPosition(hitPosition: Vector3) {
		if (!this.shadowModel || !this.selectedPrefab) return;

		if (!this.shadowModel.Parent) {
			this.shadowModel.Parent = Workspace;
		}

		const grounded = groundedCFrame(hitPosition, this.snapConfig.rotationOffset, this.selectedPrefab.model);

		this.shadowModel.PivotTo(grounded);
	}

	getShadowModel(): Model | undefined {
		return this.shadowModel;
	}

	// ---- snapping ------------------------------------------------------------

	private snapPosition(position: Vector3, rotation: number): CFrame {
		const rotCF = CFrame.Angles(0, math.rad(rotation), 0);

		if (this.snapConfig.mode === SnapMode.None) {
			return new CFrame(position).mul(rotCF);
		}

		if (this.snapConfig.mode === SnapMode.Grid) {
			const g = this.snapConfig.gridSize;
			const sx = math.round(position.X / g) * g;
			const sy = position.Y; // keep surface Y as-is
			const sz = math.round(position.Z / g) * g;
			return new CFrame(new Vector3(sx, sy, sz)).mul(rotCF);
		}

		if (this.snapConfig.mode === SnapMode.Face) {
			const nearby = this.findNearbyParts(position, this.snapConfig.faceSnapDistance);
			if (nearby.size() > 0) {
				const snapped = this.snapToFace(position, nearby[0]);
				return new CFrame(snapped).mul(rotCF);
			}
			return new CFrame(position).mul(rotCF);
		}

		return new CFrame(position).mul(rotCF);
	}

	private findNearbyParts(position: Vector3, distance: number): BasePart[] {
		return Workspace.GetPartBoundsInRadius(position, distance);
	}

	private snapToFace(position: Vector3, part: BasePart): Vector3 {
		const partSize = part.Size;
		const partPos = part.Position;
		const localPos = partPos.sub(position);

		const distances = [
			math.abs(localPos.X - partSize.X / 2),
			math.abs(localPos.X + partSize.X / 2),
			math.abs(localPos.Y - partSize.Y / 2),
			math.abs(localPos.Y + partSize.Y / 2),
			math.abs(localPos.Z - partSize.Z / 2),
			math.abs(localPos.Z + partSize.Z / 2),
		];

		let minDist = math.huge;
		let faceIndex = 0;
		for (let i = 0; i < 6; i++) {
			if (distances[i] < minDist) {
				minDist = distances[i];
				faceIndex = i;
			}
		}

		const s = new Vector3(position.X, position.Y, position.Z);
		if (faceIndex === 0) return new Vector3(partPos.X + partSize.X / 2, s.Y, s.Z);
		if (faceIndex === 1) return new Vector3(partPos.X - partSize.X / 2, s.Y, s.Z);
		if (faceIndex === 2) return new Vector3(s.X, partPos.Y + partSize.Y / 2, s.Z);
		if (faceIndex === 3) return new Vector3(s.X, partPos.Y - partSize.Y / 2, s.Z);
		if (faceIndex === 4) return new Vector3(s.X, s.Y, partPos.Z + partSize.Z / 2);
		return new Vector3(s.X, s.Y, partPos.Z - partSize.Z / 2);
	}

	getSnappedCFrame(position: Vector3, rotation: number): CFrame {
		return this.snapPosition(position, rotation);
	}

	// ---- single placement ----------------------------------------------------

	placePrefab(position: Vector3, rotation: number = 0): Model | undefined {
		if (!this.selectedPrefab) return undefined;

		const snappedCF = this.snapPosition(position, rotation);
		// Ground the CFrame the same way we ground the shadow
		const finalCF = groundedCFrame(snappedCF.Position, rotation, this.selectedPrefab.model);

		return this.spawnPrefab(this.selectedPrefab, finalCF);
	}

	private spawnPrefab(prefab: LoadedPrefab, pivotCF: CFrame): Model {
		const instance = prefab.model.Clone();

		const infoScript = instance.FindFirstChild('Prefab.info');
		if (infoScript?.IsA('ModuleScript')) infoScript.Destroy();

		// Remove any generated primary part from the source before ensurePrimaryPart
		const gen = instance.FindFirstChild('__PrimaryPart__');
		if (gen) gen.Destroy();

		ensurePrimaryPart(instance);
		instance.PivotTo(pivotCF);
		instance.Parent = Workspace;

		// Clean up temp primary part
		const tempPP = instance.FindFirstChild('__PrimaryPart__');
		if (tempPP) tempPP.Destroy();

		// Callbacks
		const prefabName = prefab.name;
		const previousPrefab = this.previousPrefabsByType.get(prefabName);
		const callback = prefab.AddedCallback;

		if (callback) {
			print(`Running callback for ${prefabName}`);

			task.spawn(() => {
				try {
					callback(previousPrefab, instance);
				} catch (err) {
					warn(`Prefab callback error (${prefabName}):`, err);
				}
			});
		}
		this.previousPrefabsByType.set(prefabName, instance);

		this.placedPrefabs.push({ model: instance, prefabName });
		return instance;
	}

	// ---- undo / cancel -------------------------------------------------------

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
		if (newPrev) {
			this.previousPrefabsByType.set(prefabName, newPrev);
		} else {
			this.previousPrefabsByType.delete(prefabName);
		}

		last.model.Destroy();
		return true;
	}

	cancelPlacement() {
		this.destroyShadow();
		this.clearArrayState();
		this.selectedPrefab = undefined;
	}

	// ---- snap config ---------------------------------------------------------

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

	// ---- placement mode ------------------------------------------------------

	setPlacementMode(mode: PlacementMode) {
		if (this.placementMode === mode) return;
		this.placementMode = mode;
		if (mode === PlacementMode.Single) {
			this.clearArrayState();
		}
	}

	getPlacementMode(): PlacementMode {
		return this.placementMode;
	}

	// ---- array placement -----------------------------------------------------

	setArraySpacing(spacing: number) {
		this._arraySpacing = math.max(0, spacing);
	}
	getArraySpacing(): number {
		return this._arraySpacing;
	}

	/** Called when user clicks to anchor the first prefab in array mode. */
	anchorArrayPlacement(position: Vector3, rotation: number): Model | undefined {
		if (!this.selectedPrefab) return undefined;

		// Clear any previous anchor
		this.clearArrayState();

		const snappedCF = this.snapPosition(position, rotation);
		const groundedCF2 = groundedCFrame(snappedCF.Position, rotation, this.selectedPrefab.model);

		const [, size] = this.selectedPrefab.model.GetBoundingBox();
		this.arrayAnchor = {
			cframe: groundedCF2,
			halfSize: size.div(2),
		};

		// Spawn the anchor prefab
		const placed = this.spawnPrefab(this.selectedPrefab, groundedCF2);

		// Spawn direction arrows
		this.spawnArrayArrows(groundedCF2, size);

		return placed;
	}

	getArrayAnchor(): ArrayPlacementAnchor | undefined {
		return this.arrayAnchor;
	}

	/** Spawn arrow indicators on the four horizontal faces of the anchor. */
	private spawnArrayArrows(anchorCF: CFrame, modelSize: Vector3) {
		this.clearArrows();

		const dirs: Array<{ id: 'px' | 'nx' | 'pz' | 'nz'; offset: Vector3; rot: number }> = [
			{ id: 'px', offset: new Vector3(modelSize.X / 2 + 2, 0, 0), rot: -90 },
			{ id: 'nx', offset: new Vector3(-(modelSize.X / 2 + 2), 0, 0), rot: 90 },
			{ id: 'pz', offset: new Vector3(0, 0, modelSize.Z / 2 + 2), rot: 180 },
			{ id: 'nz', offset: new Vector3(0, 0, -(modelSize.Z / 2 + 2)), rot: 0 },
		];

		for (const dir of dirs) {
			const arrow = this.createArrowModel(dir.id);
			const arrowPos = anchorCF.Position.add(dir.offset);
			const arrowCF = new CFrame(arrowPos).mul(CFrame.Angles(0, math.rad(dir.rot), 0));

			ensurePrimaryPart(arrow);
			arrow.PivotTo(arrowCF);
			arrow.Parent = Workspace;
			this.arrayArrows.push(arrow);
		}
	}

	/**
	 * Build a simple arrow Model from basic Parts.
	 * Arrow points in the +Z direction; caller rotates it into place.
	 */
	private createArrowModel(id: string): Model {
		const model = new Instance('Model');
		model.Name = `__ArrayArrow_${id}__`;

		// Shaft
		const shaft = new Instance('Part');
		shaft.Name = 'Shaft';
		shaft.Shape = Enum.PartType.Block;
		shaft.Size = new Vector3(0.3, 0.3, 1.5);
		shaft.CFrame = new CFrame(0, 0, 0);
		shaft.Color = Color3.fromRGB(255, 200, 0);
		shaft.Material = Enum.Material.Neon;
		shaft.CanCollide = false;
		shaft.CastShadow = false;
		shaft.Transparency = 0;
		shaft.Parent = model;
		model.PrimaryPart = shaft;

		// Head (cone-like wedge)
		const head = new Instance('Part');
		head.Name = 'Head';
		head.Shape = Enum.PartType.Block;
		head.Size = new Vector3(0.7, 0.7, 0.7);
		head.CFrame = new CFrame(0, 0, 1.1);
		head.Color = Color3.fromRGB(255, 200, 0);
		head.Material = Enum.Material.Neon;
		head.CanCollide = false;
		head.CastShadow = false;
		head.Transparency = 0;
		head.Parent = model;

		// Weld head to shaft
		const weld = new Instance('WeldConstraint');
		weld.Part0 = shaft;
		weld.Part1 = head;
		weld.Parent = shaft;

		return model;
	}

	private clearArrows() {
		for (const arrow of this.arrayArrows) {
			if (arrow.Parent) arrow.Destroy();
		}
		this.arrayArrows = [];
	}

	/** Get arrow models so the UI can raycast against them. */
	getArrayArrows(): Model[] {
		return this.arrayArrows;
	}

	/**
	 * Preview N prefabs extending from the anchor in the given direction.
	 * Destroys the old preview first.
	 */
	previewArrayExtension(direction: 'px' | 'nx' | 'pz' | 'nz', count: number) {
		if (!this.arrayAnchor || !this.selectedPrefab || count <= 0) {
			this.clearArrayPreview();
			return;
		}

		this.clearArrayPreview();

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
			const ghost = this.selectedPrefab.model.Clone();
			const info = ghost.FindFirstChild('Prefab.info');
			if (info?.IsA('ModuleScript')) info.Destroy();

			ensurePrimaryPart(ghost);

			for (const desc of ghost.GetDescendants()) {
				if (desc.IsA('BasePart')) {
					const bp = desc as BasePart;
					bp.Transparency = 0.75;
					bp.CanCollide = false;
					bp.Color = Color3.fromRGB(255, 200, 80);
				}
			}

			ghost.PivotTo(cf);
			ghost.Parent = Workspace;
			this.arrayPreviewModels.push(ghost);
		}
	}

	clearArrayPreview() {
		for (const m of this.arrayPreviewModels) {
			if (m.Parent) m.Destroy();
		}
		this.arrayPreviewModels = [];
	}

	/**
	 * Commit N prefabs in a direction from the current anchor.
	 */
	commitArrayExtension(direction: 'px' | 'nx' | 'pz' | 'nz', count: number): Model[] {
		if (!this.arrayAnchor || !this.selectedPrefab || count <= 0) return [];

		this.clearArrayPreview();

		const step = this.getStepVector(direction);
		const [, size] = this.selectedPrefab.model.GetBoundingBox();
		const stride =
			direction === 'px' || direction === 'nx' ? size.X + this._arraySpacing : size.Z + this._arraySpacing;

		const placed: Model[] = [];
		for (let i = 1; i <= count; i++) {
			const offset = step.mul(stride * i);
			const pos = this.arrayAnchor.cframe.Position.add(offset);
			const cf = new CFrame(pos.X, this.arrayAnchor.cframe.Position.Y, pos.Z).mul(
				CFrame.Angles(0, math.rad(this.snapConfig.rotationOffset), 0)
			);
			const model = this.spawnPrefab(this.selectedPrefab, cf);
			placed.push(model);
		}

		// Update anchor arrows to encompass new extent
		if (placed.size() > 0) {
			const lastModel = placed[placed.size() - 1];
			const [lastCF, lastSize] = lastModel.GetBoundingBox();
			// Extend arrows from new edge
			this.spawnArrayArrows(this.arrayAnchor.cframe, this.arrayAnchor.halfSize.mul(2));
		}

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

	// ---- misc ----------------------------------------------------------------

	getPlacedCount(): number {
		return this.placedPrefabs.size();
	}

	clearAll() {
		for (const entry of this.placedPrefabs) entry.model.Destroy();
		this.placedPrefabs = [];
	}
}

export const PlacementSystem = new PlacementSystemClass();
