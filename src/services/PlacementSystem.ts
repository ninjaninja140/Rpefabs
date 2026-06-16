import { Workspace } from '@rbxts/services';
import type { LoadedPrefab } from 'services/PrefabService';

export enum SnapMode {
	None = 'None',
	Grid = 'Grid',
	Face = 'Face',
}

export enum PlacementMode {
	Single = 'Single',
	Linear = 'Linear',
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

export interface Face {
	name: 'Front' | 'Back' | 'Top' | 'Bottom' | 'Left' | 'Right';
	offset: Vector3;
	rotation: CFrame;
}

export interface LinearPlacementState {
	baseModel: Model;
	direction: Vector3;
	spacing: number;
	count: number;
}

// Helper function to get or create a PrimaryPart based on bounding box
function ensurePrimaryPart(model: Model): void {
	// Check if model already has a PrimaryPart - if so, use it
	if (model.PrimaryPart) return;

	// No BaseParts found, create one using bounding box
	const [cframe, size] = model.GetBoundingBox();

	if (size.X === 0 || size.Y === 0 || size.Z === 0) {
		return; // No valid bounding box
	}

	const tempPart = new Instance('Part');
	tempPart.Name = '__PrimaryPart__';
	tempPart.Shape = Enum.PartType.Block;
	tempPart.CanCollide = false;
	tempPart.CFrame = cframe;
	tempPart.Size = size;
	tempPart.Transparency = 1; // Fully invisible
	tempPart.Parent = model;
	model.PrimaryPart = tempPart;
}

class PlacementSystemClass {
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
	private placementEnabled: boolean = false;
	private placementMode: PlacementMode = PlacementMode.Single;
	private linearState: LinearPlacementState | undefined;
	private arrowModels: Map<string, Model> = new Map(); // direction -> arrow model

	setSelectedPrefab(prefab: LoadedPrefab | undefined) {
		this.selectedPrefab = prefab;
		if (prefab && !this.shadowModel) {
			this.createShadowModel(prefab);
		} else if (!prefab && this.shadowModel) {
			this.shadowModel.Destroy();
			this.shadowModel = undefined;
		}
	}

	getSelectedPrefab(): LoadedPrefab | undefined {
		return this.selectedPrefab;
	}

	private createShadowModel(prefab: LoadedPrefab) {
		if (this.shadowModel) {
			this.shadowModel.Destroy();
		}

		const shadow = prefab.model.Clone();
		shadow.Name = 'Shadow';

		// Remove Prefab.info script if present
		const prefabInfo = shadow.FindFirstChild('Prefab.info');
		if (prefabInfo?.IsA('ModuleScript')) {
			prefabInfo.Destroy();
		}

		// Ensure PrimaryPart is set for proper movement
		ensurePrimaryPart(shadow);

		// Cache descendants to avoid repeated calls
		const descendants = shadow.GetDescendants();

		// Make shadow semi-transparent and blue - OPTIMIZED: single pass
		for (const descendant of descendants) {
			if (descendant.IsA('BasePart')) {
				const part = descendant as BasePart;
				part.Transparency = 0.6;
				part.CanCollide = false;
				part.Color = Color3.fromRGB(100, 150, 255); // Blue tint
			}
		}

		this.shadowModel = shadow;
		this.placementEnabled = true;
	}

	updateShadowPosition(cframe: CFrame) {
		if (this.shadowModel) {
			if (!this.shadowModel.Parent) {
				this.shadowModel.Parent = Workspace;
			}
			// Use MoveTo to move the whole model to the position, preserving rotation
			this.shadowModel.MoveTo(cframe.Position);
		}
	}

	getShadowModel(): Model | undefined {
		return this.shadowModel;
	}

	placePrefab(position: Vector3, rotation: number = 0): Model | undefined {
		if (!this.selectedPrefab) return undefined;

		// Apply snapping
		const snappedPosition = this.snapPosition(position, rotation);

		// Create new instance
		const instance = this.selectedPrefab.model.Clone();

		// Remove Prefab.info script if present
		const prefabInfo = instance.FindFirstChild('Prefab.info');
		if (prefabInfo?.IsA('ModuleScript')) {
			prefabInfo.Destroy();
		}

		// Remove generated __PrimaryPart__ before placement if it exists
		const generatedPrimaryPart = instance.FindFirstChild('__PrimaryPart__');
		if (generatedPrimaryPart) {
			generatedPrimaryPart.Destroy();
		}

		// Ensure PrimaryPart exists for proper placement
		ensurePrimaryPart(instance);

		// Position and rotate
		instance.MoveTo(snappedPosition.Position);
		if (instance.PrimaryPart) {
			instance.PivotTo(snappedPosition);
		}
		instance.Parent = Workspace;

		// Remove the temporary primary part after positioning
		const tempPrimary = instance.FindFirstChild('__PrimaryPart__');
		if (tempPrimary) {
			tempPrimary.Destroy();
		}

		// Call added callback with correct previousPrefab for this type
		const prefabName = this.selectedPrefab.name;
		const previousPrefab = this.previousPrefabsByType.get(prefabName);
		if (this.selectedPrefab.addedCallback) {
			this.selectedPrefab.addedCallback(previousPrefab, instance);
		}

		// Update tracking: now this instance becomes the previous for next placement
		this.previousPrefabsByType.set(prefabName, instance);

		// Track placed prefab
		this.placedPrefabs.push({
			model: instance,
			prefabName: prefabName,
		});

		return instance;
	}

	private snapPosition(position: Vector3, rotation: number): CFrame {
		if (this.snapConfig.mode === SnapMode.None) {
			return new CFrame(position).mul(CFrame.Angles(0, math.rad(rotation), 0));
		}

		if (this.snapConfig.mode === SnapMode.Grid) {
			const grid = this.snapConfig.gridSize;
			// Round to nearest grid point
			const snappedX = math.round(position.X / grid) * grid;
			const snappedY = math.round(position.Y / grid) * grid;
			const snappedZ = math.round(position.Z / grid) * grid;
			return new CFrame(new Vector3(snappedX, snappedY, snappedZ)).mul(CFrame.Angles(0, math.rad(rotation), 0));
		}

		if (this.snapConfig.mode === SnapMode.Face) {
			// Face snapping: find nearby part faces and snap to them
			const nearbyParts = this.findNearbyParts(position, this.snapConfig.faceSnapDistance);
			if (nearbyParts.size() > 0) {
				const nearestPart = nearbyParts[0];
				const snappedPos = this.snapToFace(position, nearestPart as BasePart);
				return new CFrame(snappedPos).mul(CFrame.Angles(0, math.rad(rotation), 0));
			}
			return new CFrame(position).mul(CFrame.Angles(0, math.rad(rotation), 0));
		}

		return new CFrame(position).mul(CFrame.Angles(0, math.rad(rotation), 0));
	}

	private findNearbyParts(position: Vector3, distance: number): BasePart[] {
		// Use GetPartBoundsInRadius to find nearby parts
		const parts = Workspace.GetPartBoundsInRadius(position, distance);
		return parts;
	}

	private snapToFace(position: Vector3, part: BasePart): Vector3 {
		// Get part size and find closest face
		const partSize = part.Size;
		const partPos = part.Position;
		const localPos = partPos.sub(position);

		// Determine which face is closest
		const distances = [
			math.abs(localPos.X - partSize.X / 2), // Right
			math.abs(localPos.X + partSize.X / 2), // Left
			math.abs(localPos.Y - partSize.Y / 2), // Top
			math.abs(localPos.Y + partSize.Y / 2), // Bottom
			math.abs(localPos.Z - partSize.Z / 2), // Front
			math.abs(localPos.Z + partSize.Z / 2), // Back
		];

		let minDist = math.huge;
		let faceIndex = 0;
		for (let i = 0; i < 6; i++) {
			if (distances[i] < minDist) {
				minDist = distances[i];
				faceIndex = i;
			}
		}

		// Snap to the closest face
		const snappedPos = new Vector3(position.X, position.Y, position.Z);
		if (faceIndex === 0) {
			return new Vector3(partPos.X + partSize.X / 2, snappedPos.Y, snappedPos.Z); // Right face
		} else if (faceIndex === 1) {
			return new Vector3(partPos.X - partSize.X / 2, snappedPos.Y, snappedPos.Z); // Left face
		} else if (faceIndex === 2) {
			return new Vector3(snappedPos.X, partPos.Y + partSize.Y / 2, snappedPos.Z); // Top face
		} else if (faceIndex === 3) {
			return new Vector3(snappedPos.X, partPos.Y - partSize.Y / 2, snappedPos.Z); // Bottom face
		} else if (faceIndex === 4) {
			return new Vector3(snappedPos.X, snappedPos.Y, partPos.Z + partSize.Z / 2); // Front face
		} else {
			return new Vector3(snappedPos.X, snappedPos.Y, partPos.Z - partSize.Z / 2); // Back face
		}
	}

	undoLastPlacement(): boolean {
		if (this.placedPrefabs.size() === 0) return false;

		const lastPlaced = this.placedPrefabs.pop();
		if (lastPlaced) {
			const prefabName = lastPlaced.prefabName;

			// Find the previous prefab of the same type before the one we're undoing
			let newPrevious: Model | undefined = undefined;
			for (let i = this.placedPrefabs.size() - 1; i >= 0; i--) {
				if (this.placedPrefabs[i].prefabName === prefabName) {
					newPrevious = this.placedPrefabs[i].model;
					break;
				}
			}

			// Update or remove the previous prefab tracking
			if (newPrevious) {
				this.previousPrefabsByType.set(prefabName, newPrevious);
			} else {
				this.previousPrefabsByType.delete(prefabName);
			}

			lastPlaced.model.Destroy();
			return true;
		}

		return false;
	}

	cancelPlacement() {
		this.placementEnabled = false;
		if (this.shadowModel) {
			this.shadowModel.Destroy();
			this.shadowModel = undefined;
		}
		this.selectedPrefab = undefined;
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

	getSnappedCFrame(position: Vector3, rotation: number): CFrame {
		return this.snapPosition(position, rotation);
	}

	setRotationOffset(rotation: number) {
		this.snapConfig.rotationOffset = rotation % 360;
	}

	getRotationOffset(): number {
		return this.snapConfig.rotationOffset;
	}

	setPlacementMode(mode: PlacementMode) {
		this.placementMode = mode;
		if (mode === PlacementMode.Single) {
			this.clearLinearState();
		}
	}

	getPlacementMode(): PlacementMode {
		return this.placementMode;
	}

	startLinearPlacement(baseModel: Model, direction: Vector3, spacing: number) {
		this.linearState = {
			baseModel,
			direction: direction.Unit,
			spacing,
			count: 1,
		};
	}

	getLinearState(): LinearPlacementState | undefined {
		return this.linearState;
	}

	placeLinearPrefabs(direction: Vector3, count: number, spacing: number, rotation: number): Model[] {
		if (!this.selectedPrefab || !this.linearState) return [];

		const placed: Model[] = [];
		const basePos = this.linearState.baseModel.GetBoundingBox()[0].Position;
		const normDir = direction.Unit;

		for (let i = 0; i < count; i++) {
			const offset = normDir.mul((this.getModelSize(this.selectedPrefab) + spacing) * i);
			const position = basePos.add(offset);
			const instance = this.placePrefab(position, rotation);
			if (instance) {
				placed.push(instance);
			}
		}

		return placed;
	}

	private getModelSize(prefab: LoadedPrefab): number {
		const [, size] = prefab.model.GetBoundingBox();
		return math.max(size.X, size.Y, size.Z);
	}

	private clearLinearState() {
		this.linearState = undefined;
		// Clean up arrow models
		this.arrowModels.forEach((model) => {
			model.Destroy();
		});
		this.arrowModels.clear();
	}

	getPlacedCount(): number {
		return this.placedPrefabs.size();
	}

	clearAll() {
		for (const entry of this.placedPrefabs) {
			entry.model.Destroy();
		}
		this.placedPrefabs.clear();
	}
}

export const PlacementSystem = new PlacementSystemClass();
