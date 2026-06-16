import React, { useEffect, useState } from '@rbxts/react';
import { PlacementUI } from 'components/PlacementUI';
import { PrefabLibrary } from 'components/PrefabLibrary';
import { PlacementSystem } from 'services/PlacementSystem';
import { type LoadedPrefab, PrefabService } from 'services/PrefabService';

export function PrefabsApp({ mouse }: { mouse: Mouse }) {
	const [prefabs, setPrefabs] = useState<LoadedPrefab[]>([]);
	const [selectedPrefab, setSelectedPrefab] = useState<LoadedPrefab | undefined>(undefined);
	const [isPlacing, setIsPlacing] = useState(false);
	const [isCreatingPrefab, setIsCreatingPrefab] = useState(false);

	useEffect(() => {
		// Load prefabs on mount
		const loaded = PrefabService.scanPrefabs();
		setPrefabs(loaded);

		// Subscribe to prefab changes
		const unsubscribe = PrefabService.onPrefabsChanged((updated) => {
			setPrefabs(updated);
		});

		return () => unsubscribe();
	}, []);

	const handlePrefabSelect = (prefab: LoadedPrefab) => {
		setSelectedPrefab(prefab);
		PlacementSystem.setSelectedPrefab(prefab);
		setIsPlacing(true);
	};

	const handleCancelPlacement = () => {
		setIsPlacing(false);
		setSelectedPrefab(undefined);
		PlacementSystem.cancelPlacement();
	};

	const handleUndo = () => {
		PlacementSystem.undoLastPlacement();
	};

	const handleCreatePrefab = async (selectedModel: Model, prefabName: string) => {
		const infoModule = await PrefabService.createPrefabFromModel(selectedModel, prefabName);
		if (infoModule) {
			// Attempt to open the script for editing using the plugin API
			try {
				// In Roblox Studio, the plugin object has OpenScript method
				plugin.OpenScript(infoModule);
			} catch (error) {
				print(`Could not open script: ${error}`);
			}
			setIsCreatingPrefab(false);
		}
	};

	return (
		<frame
			Size={new UDim2(1, 0, 1, 0)}
			BackgroundColor3={Color3.fromRGB(13, 14, 18)}
			BackgroundTransparency={0}
			BorderSizePixel={0}
		>
			{isPlacing && selectedPrefab ? (
				<PlacementUI
					prefab={selectedPrefab}
					onCancel={handleCancelPlacement}
					onUndo={handleUndo}
					mouse={mouse}
				/>
			) : (
				<PrefabLibrary
					mouse={mouse}
					prefabs={prefabs}
					onSelectPrefab={handlePrefabSelect}
					isCreatingPrefab={isCreatingPrefab}
					onToggleCreatePrefab={setIsCreatingPrefab}
					onCreatePrefab={handleCreatePrefab}
				/>
			)}
		</frame>
	);
}
