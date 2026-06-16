import { Workspace } from '@rbxts/services';
import { UITheme } from 'components/theme';
import { PrefabService, type LoadedPrefab, type PrefabInfo } from 'PrefabService';

export enum SnapMode {
	None = 'None',
	Grid = 'Grid',
	Face = 'Face',
}

export enum PlacementMode {
	Single = 'Single',
	Array = 'Array',
}

export type ArcAxis = 'X' | 'Y' | 'Z';
export type ArcRotationType = 'Yaw' | 'Pitch' | 'Roll';
export type ArcAlignment = 'Inside' | 'Middle' | 'Outside';

export interface ArcConfig {
	enabled: boolean;
	angle: number;
	axis: ArcAxis;
	rotationType: ArcRotationType;
	alignment: ArcAlignment;
	flipAxis: boolean;
	swapSides: boolean;
	gapCompensation: number; // 0 = none, 1 = full overlap, negative = spread
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
	cframe: CFrame;
	halfSize: Vector3;
}

function getDirectionVector(direction: 'px' | 'nx' | 'pz' | 'nz'): Vector3 {
	if (direction === 'px') return new Vector3(1, 0, 0);
	if (direction === 'nx') return new Vector3(-1, 0, 0);
	if (direction === 'pz') return new Vector3(0, 0, 1);
	return new Vector3(0, 0, -1);
}

const ALIGNMENT_OFFSETS: Record<ArcAlignment, number> = {
	Inside: 0.5,
	Middle: 0,
	Outside: -0.5,
};

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

	let perpDir = rotAxis.Cross(stepDir);
	if (perpDir.Magnitude < 0.001)
		if (cfg.axis === 'X') perpDir = new Vector3(0, 0, 1);
		else if (cfg.axis === 'Y') perpDir = new Vector3(1, 0, 0);
		else perpDir = new Vector3(1, 0, 0);

	perpDir = perpDir.Unit;

	const depthOffset = ALIGNMENT_OFFSETS[cfg.alignment];
	const centerToHinge = stepDir.mul(stride * depthOffset);
	const compensatedStride = stride * (1 - cfg.gapCompensation * 0.5);
	const hingeToNextCenter = stepDir.mul(compensatedStride / 2);

	const rotationCF = cfg.flipAxis
		? CFrame.fromAxisAngle(rotAxis, -angleRad)
		: CFrame.fromAxisAngle(rotAxis, angleRad);

	const hingeCF = prevCF.mul(new CFrame(centerToHinge));
	const rotatedCF = hingeCF.mul(rotationCF);
	const nextCF = rotatedCF.mul(new CFrame(hingeToNextCenter));

	return nextCF;
}

function computeArcTransform(size: Vector3, anchorCF: CFrame, cfg: ArcConfig): CFrame | undefined {
	if (cfg.angle === 0) return undefined;
	const lookDir = new Vector3(anchorCF.LookVector.X, 0, anchorCF.LookVector.Z);
	let direction: 'px' | 'nx' | 'pz' | 'nz' = 'pz';
	if (lookDir.Magnitude > 0.01) {
		const absX = math.abs(lookDir.X);
		const absZ = math.abs(lookDir.Z);
		if (absX > absZ) direction = lookDir.X > 0 ? 'px' : 'nx';
		else direction = lookDir.Z > 0 ? 'pz' : 'nz';
	}
	return computeNextArcCFrame(anchorCF, size, cfg, direction);
}

// helpers
function ensurePrimaryPart(model: Model): void {
	if (model.PrimaryPart) return;
	const [cframe, size] = model.GetBoundingBox();
	if (size.X === 0 || size.Y === 0 || size.Z === 0) return;

	const part = new Instance('Part');
	part.Name = '__PrimaryPart__';
	part.Shape = Enum.PartType.Block;
	part.CanCollide = false;
	part.CanQuery = false;
	part.CanTouch = false;
	part.CastShadow = false;
	part.Material = Enum.Material.SmoothPlastic;
	part.Transparency = 1;
	part.CFrame = cframe;
	part.Size = size;
	part.Parent = model;
	model.PrimaryPart = part;
}

function groundedCFrame(position: Vector3, rotationDeg: number, model: Model): CFrame {
	const [, size] = model.GetBoundingBox();
	const halfHeight = size.Y / 2;
	return new CFrame(position.X, position.Y + halfHeight, position.Z).mul(CFrame.Angles(0, math.rad(rotationDeg), 0));
}

class PlacementSystemClass {
	private placedPrefabs: PlacedPrefabEntry[] = [];
	private previousPrefabsByType: Map<string, Model | undefined> = new Map();

	private snapConfig: SnapConfig = {
		mode: SnapMode.Grid,
		gridSize: 1,
		faceSnapDistance: 5,
		rotationOffset: 0,
	};

	private selectedPrefab: LoadedPrefab | undefined;
	private shadowModel: Model | undefined;
	private placementMode: PlacementMode = PlacementMode.Single;

	private arcConfig: ArcConfig = {
		enabled: false,
		angle: 10,
		axis: 'X',
		rotationType: 'Yaw',
		alignment: 'Inside',
		flipAxis: false,
		swapSides: false,
		gapCompensation: 0,
	};

	private arrayAnchor: ArrayPlacementAnchor | undefined;
	private arrayArrows: Model[] = [];
	private arrayPreviewModels: Model[] = [];
	private _arraySpacing = 0;

	private lastPlacedCF: CFrame | undefined;

	getArcConfig(): ArcConfig {
		return { ...this.arcConfig };
	}

	setArcConfig(partial: Partial<ArcConfig>) {
		this.arcConfig = { ...this.arcConfig, ...partial };
		if (this.selectedPrefab) {
			if (!this.selectedPrefab) return;
			this.createShadowModel(this.selectedPrefab);
		}
	}

	getNextArcCFrame(baseCF: CFrame): CFrame | undefined {
		if (!this.selectedPrefab || !this.arcConfig.enabled || this.arcConfig.angle === 0) return undefined;

		const size = this.selectedPrefabSize!;
		return computeArcTransform(size, baseCF, this.arcConfig);
	}

	resetArcChain() {
		this.lastPlacedCF = undefined;
	}

	private selectedPrefabSize: Vector3 | undefined;

	setSelectedPrefab(prefab: LoadedPrefab | undefined) {
		this.selectedPrefab = prefab;
		this.lastPlacedCF = undefined;
		if (prefab) {
			this.selectedPrefabSize = prefab.model.GetBoundingBox()[1]; // cache size
			if (!this.shadowModel) this.createShadowModel(prefab);
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

		const selectionBox = new Instance('SelectionBox');
		selectionBox.Name = '__PrefabSelectionBox__';
		selectionBox.Adornee = shadow;
		selectionBox.Color3 = UITheme.colors.accent;
		selectionBox.SurfaceColor3 = UITheme.colors.accent;
		selectionBox.SurfaceTransparency = 0.7;
		selectionBox.LineThickness = 0.05;
		selectionBox.Parent = shadow;

		for (const desc of shadow.GetDescendants())
			if (desc.IsA('BasePart')) {
				const part = desc as BasePart;
				part.Transparency = 0.55;
				desc.CanQuery = false;
				desc.CanCollide = false;
				desc.CanTouch = false;
			}

		if (shadow.FindFirstChild('__PrimaryPart__')) shadow.PrimaryPart!.Transparency = 1;

		this.shadowModel = shadow;
	}

	private destroyShadow() {
		if (this.shadowModel) {
			this.shadowModel.Destroy();
			this.shadowModel = undefined;
		}
	}

	updateShadowPosition(hitPosition: Vector3) {
		if (!this.shadowModel || !this.selectedPrefab) return;
		if (!this.shadowModel.Parent) this.shadowModel.Parent = Workspace;

		let targetCF: CFrame;

		if (this.arcConfig.enabled && this.lastPlacedCF) {
			const arcCF = this.getNextArcCFrame(this.lastPlacedCF);
			if (arcCF) targetCF = arcCF;
			else targetCF = groundedCFrame(hitPosition, this.snapConfig.rotationOffset, this.selectedPrefab.model);
		} else targetCF = groundedCFrame(hitPosition, this.snapConfig.rotationOffset, this.selectedPrefab.model);

		this.shadowModel.PivotTo(targetCF);
	}

	getShadowModel(): Model | undefined {
		return this.shadowModel;
	}

	private snapPosition(position: Vector3, rotation: number): CFrame {
		const rotCF = CFrame.Angles(0, math.rad(rotation), 0);

		// base position
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
		const rotatedPivot = rotCF.mul(new CFrame(Vector3.zero));

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
		for (let i = 0; i < 6; i++)
			if (dists[i] < minD) {
				minD = dists[i];
				face = i;
			}

		const s = position;
		if (face === 0) return new Vector3(pp.X + ps.X / 2, s.Y, s.Z);
		if (face === 1) return new Vector3(pp.X - ps.X / 2, s.Y, s.Z);
		if (face === 2) return new Vector3(s.X, pp.Y + ps.Y / 2, s.Z);
		if (face === 3) return new Vector3(s.X, pp.Y - ps.Y / 2, s.Z);
		if (face === 4) return new Vector3(s.X, s.Y, pp.Z + ps.Z / 2);
		return new Vector3(s.X, s.Y, pp.Z - ps.Z / 2);
	}

	placePrefab(position: Vector3, rotation: number = 0): Model | undefined {
		if (!this.selectedPrefab) return undefined;

		let finalCF: CFrame;

		if (this.arcConfig.enabled && this.arcConfig.angle !== 0 && this.lastPlacedCF) {
			const arcCF = this.getNextArcCFrame(this.lastPlacedCF);
			if (arcCF) finalCF = arcCF;
			else
				finalCF = groundedCFrame(
					this.snapPosition(position, rotation).Position,
					rotation,
					this.selectedPrefab.model
				);
		} else
			finalCF = groundedCFrame(
				this.snapPosition(position, rotation).Position,
				rotation,
				this.selectedPrefab.model
			);

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

		const prefabId = prefab.model.GetAttribute('PrefabID') as string | undefined;
		if (prefabId) instance.SetAttribute('PrefabID', prefabId);
		instance.SetAttribute('PrefabName', prefab.name);

		const tempPP = instance.FindFirstChild('__PrimaryPart__');
		if (tempPP) tempPP.Destroy();
		const prevModel = this.previousPrefabsByType.get(prefab.name);
		if (callback)
			task.spawn(() => {
				try {
					callback!(prevModel, instance);
				} catch (e) {
					warn(`Prefab callback error (${prefab.name}):`, e);
				}
			});

		this.previousPrefabsByType.set(prefab.name, instance);
		this.placedPrefabs.push({ model: instance, prefabName: prefab.name });
		return instance;
	}

	continueFromModel(existingModel: Model): boolean {
		const prefabId = existingModel.GetAttribute('PrefabID') as string | undefined;
		if (!prefabId) return false;

		const allPrefabs = PrefabService.getPrefabs();
		const matchedPrefab = allPrefabs.find((p) => p.model.GetAttribute('PrefabID') === prefabId);

		if (!matchedPrefab) return false;

		this.setSelectedPrefab(matchedPrefab);

		const prefabName = existingModel.GetAttribute('PrefabName') as string;
		if (prefabName) this.previousPrefabsByType.set(prefabName, existingModel);

		this.lastPlacedCF = existingModel.GetPivot();

		return true;
	}

	private selectionModeActive = false;

	setSelectionModeActive(active: boolean) {
		this.selectionModeActive = active;
		if (active && this.shadowModel?.Parent) this.shadowModel.Parent = undefined;
	}

	isSelectionModeActive(): boolean {
		return this.selectionModeActive;
	}

	private highlightedModel: Model | undefined;

	highlightModel(model: Model) {
		this.clearHighlight();
		this.highlightedModel = model;

		const selectionBox = new Instance('SelectionBox');
		selectionBox.Name = '__PrefabSelectionBox__';
		selectionBox.Adornee = model;
		selectionBox.Color3 = UITheme.colors.accent;
		selectionBox.SurfaceColor3 = UITheme.colors.accent;
		selectionBox.SurfaceTransparency = 0.7;
		selectionBox.LineThickness = 0.05;
		selectionBox.Parent = model;
	}

	clearHighlight() {
		if (!this.highlightedModel) return;
		this.highlightedModel.FindFirstAncestor('__PrefabSelectionBox__')?.Destroy();
		this.highlightedModel = undefined;
	}

	canContinueFrom(model: Model): boolean {
		const prefabId = model.GetAttribute('PrefabID') as string | undefined;
		if (!prefabId) return false;

		const allPrefabs = PrefabService.getPrefabs();
		return allPrefabs.some((p) => p.model.GetAttribute('PrefabID') === prefabId);
	}

	cancelPlacement() {
		this.destroyShadow();
		this.clearArrayState();
		if (this.selectedPrefab) this.previousPrefabsByType.delete(this.selectedPrefab.name);
		this.selectedPrefab = undefined;
		this.lastPlacedCF = undefined;
		this.arcConfig.enabled = false;
	}

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

	setPlacementMode(mode: PlacementMode) {
		if (this.placementMode === mode) return;
		this.placementMode = mode;
		if (mode === PlacementMode.Single) {
			this.clearArrayState();
			this.arcConfig.enabled = false;
		}
	}

	getPlacementMode(): PlacementMode {
		return this.placementMode;
	}

	setArraySpacing(s: number) {
		this._arraySpacing = math.max(0, s);
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
		shaft.Color = UITheme.colors.warning;
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
		head.Color = UITheme.colors.warning;
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
				const ghost = this.createGhostModel(this.selectedPrefab, currentCF);
				ghost.Parent = Workspace;
				this.arrayPreviewModels.push(ghost);
			}
		} else {
			const step = this.getStepVector(direction);
			const size = this.selectedPrefabSize!;
			const stride =
				direction === 'px' || direction === 'nx' ? size.X + this._arraySpacing : size.Z + this._arraySpacing;

			const anchorRotation = this.arrayAnchor.cframe.sub(this.arrayAnchor.cframe.Position);
			const rotatedStep = anchorRotation.VectorToWorldSpace(step);

			for (let i = 1; i <= count; i++) {
				const offset = rotatedStep.mul(stride * i);
				const pos = this.arrayAnchor.cframe.Position.add(offset);
				const cf = new CFrame(pos)
					.mul(anchorRotation)
					.mul(CFrame.Angles(0, math.rad(this.snapConfig.rotationOffset), 0));
				const ghost = this.createGhostModel(this.selectedPrefab, cf);
				ghost.Parent = Workspace;
				this.arrayPreviewModels.push(ghost);
			}
		}
	}

	private createGhostModel(prefab: LoadedPrefab, cf: CFrame): Model {
		const ghost = prefab.model.Clone();
		const info = ghost.FindFirstChild('Prefab.info');
		if (info?.IsA('ModuleScript')) info.Destroy();
		ensurePrimaryPart(ghost);

		const selectionBox = new Instance('SelectionBox');
		selectionBox.Name = '__PrefabSelectionBox__';
		selectionBox.Adornee = ghost;
		selectionBox.Color3 = UITheme.colors.accent;
		selectionBox.SurfaceColor3 = UITheme.colors.accent;
		selectionBox.SurfaceTransparency = 0.7;
		selectionBox.LineThickness = 0.05;
		selectionBox.Parent = ghost;

		for (const desc of ghost.GetDescendants())
			if (desc.IsA('BasePart')) {
				desc.Transparency = 0.55;
				desc.CanCollide = false;
			}

		if (ghost.PrimaryPart) ghost.PrimaryPart.Transparency = 1;

		ghost.PivotTo(cf);
		return ghost;
	}

	clearArrayPreview() {
		for (const m of this.arrayPreviewModels) {
			if (m.Parent) m.Destroy();
		}
		this.arrayPreviewModels = [];
	}

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

			// Rotate the step direction by the anchor's rotation so it follows the model's orientation
			const anchorRotation = this.arrayAnchor.cframe.sub(this.arrayAnchor.cframe.Position);
			const rotatedStep = anchorRotation.VectorToWorldSpace(step);

			for (let i = 1; i <= count; i++) {
				const offset = rotatedStep.mul(stride * i);
				const pos = this.arrayAnchor.cframe.Position.add(offset);
				const cf = new CFrame(pos)
					.mul(anchorRotation)
					.mul(CFrame.Angles(0, math.rad(this.snapConfig.rotationOffset), 0));
				const m = this.spawnPrefab(this.selectedPrefab, cf);
				placed.push(m);
			}
		}

		// shift anchor to the last placed model
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

	continueAsArrayAnchor(model: Model) {
		// Use the model's actual pivot CFrame to preserve rotation
		const pivotCF = model.GetPivot();
		const [, size] = model.GetBoundingBox();

		this.arrayAnchor = { cframe: pivotCF, halfSize: size.div(2) };
		this.lastPlacedCF = pivotCF;
		this.spawnArrayArrows(pivotCF, size);
	}
}

export const PlacementSystem = new PlacementSystemClass();
