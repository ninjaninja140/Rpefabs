import React, { useEffect, useState } from '@rbxts/react';
import { Workspace } from '@rbxts/services';
import type { LoadedPrefab } from 'services/PrefabService';
import { Input } from 'ui/components/Input';
import { ScrollArea } from 'ui/components/ScrollArea';
import { UITheme } from 'ui/theme';
import { KeyboardHints } from './KeyboardHints';
import { PrefabCard } from './PrefabCard';

export function PrefabLibrary({
	mouse,
	prefabs,
	onSelectPrefab,
	isCreatingPrefab,
	onToggleCreatePrefab,
	onCreatePrefab,
}: {
	mouse: Mouse;
	prefabs: LoadedPrefab[];
	onSelectPrefab: (prefab: LoadedPrefab) => void;
	isCreatingPrefab: boolean;
	onToggleCreatePrefab: (creating: boolean) => void;
	onCreatePrefab: (selectedModel: Model, prefabName: string) => Promise<void>;
}) {
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedModel, setSelectedModel] = useState<Model | undefined>();
	const [prefabName, setPrefabName] = useState('');
	const [isSelectingModel, setIsSelectingModel] = useState(false);

	useEffect(() => {
		if (isSelectingModel && isCreatingPrefab) {
			// Listen for Descendant changes to detect model selection from workspace
			// This is a workaround since we can't directly access Selection service
			// Users can also manually select by clicking

			// Create a better approach: listen to mouse position
			let mouseConnection: RBXScriptConnection | undefined;

			mouseConnection = mouse.Move.Connect(() => {
				const target = mouse.Target;
				if (target) {
					let model = target.Parent;
					// Walk up until we find a Model or reach workspace
					while (model && model !== Workspace && !model.IsA('Model')) model = model.Parent;
					if (model && model !== Workspace && model.IsA('Model')) setSelectedModel(model as Model);
				}
			});

			return () => {
				if (mouseConnection) {
					mouseConnection.Disconnect();
				}
			};
		}
	}, [isSelectingModel, isCreatingPrefab]);

	const filteredPrefabs = prefabs.filter(
		(prefab) => prefab.name.lower().find(searchQuery.lower(), 1, true)[0] !== undefined
	);

	const handleStartCreation = () => {
		onToggleCreatePrefab(true);
		setSelectedModel(undefined);
		setPrefabName('');
		setIsSelectingModel(false);
	};

	const handleStartModelSelection = () => {
		setIsSelectingModel(true);
	};

	const handleConfirmModel = () => {
		if (!selectedModel) {
			warn('Please select a model first');
			return;
		}

		if (prefabName === '') {
			warn('Please enter a prefab name');
			return;
		}

		onCreatePrefab(selectedModel, prefabName);
	};

	const handleCancelCreation = () => {
		onToggleCreatePrefab(false);
		setSelectedModel(undefined);
		setPrefabName('');
		setIsSelectingModel(false);
	};

	return (
		<frame
			Size={new UDim2(1, 0, 1, 0)}
			BackgroundColor3={UITheme.colors.surface}
			BackgroundTransparency={0}
			BorderSizePixel={0}
		>
			<uilistlayout
				FillDirection={Enum.FillDirection.Vertical}
				HorizontalAlignment={Enum.HorizontalAlignment.Center}
				VerticalAlignment={Enum.VerticalAlignment.Top}
				Padding={new UDim(0, 0)}
				SortOrder={Enum.SortOrder.LayoutOrder}
			/>

			<frame
				Size={new UDim2(1, 0, 0, 50)}
				BackgroundColor3={UITheme.colors.surface}
				BackgroundTransparency={0.1}
				BorderSizePixel={0}
				LayoutOrder={0}
			>
				<uilistlayout
					FillDirection={Enum.FillDirection.Horizontal}
					HorizontalAlignment={Enum.HorizontalAlignment.Left}
					VerticalAlignment={Enum.VerticalAlignment.Center}
					Padding={new UDim(0, 8)}
					SortOrder={Enum.SortOrder.LayoutOrder}
				/>

				<uipadding
					PaddingTop={new UDim(0, 8)}
					PaddingBottom={new UDim(0, 8)}
					PaddingLeft={new UDim(0, 8)}
					PaddingRight={new UDim(0, 8)}
				/>

				<Input
					Placeholder='Search prefabs...'
					Value={searchQuery}
					onChange={setSearchQuery}
					Size={new UDim2(1, -100, 1, 0)}
				/>

				<textbutton
					Size={new UDim2(0, 80, 1, 0)}
					BackgroundColor3={UITheme.colors.accent}
					BackgroundTransparency={0}
					BorderSizePixel={0}
					Font={Enum.Font.Unknown}
					FontFace={UITheme.fonts.regular}
					Text='+ Add'
					TextColor3={Color3.fromRGB(255, 255, 255)}
					TextSize={12}
					LayoutOrder={1}
					Event={{
						Activated: handleStartCreation,
					}}
				>
					<uicorner CornerRadius={new UDim(0, 4)} />
				</textbutton>
			</frame>

			{isCreatingPrefab ? (
				<frame
					Size={new UDim2(1, 0, 1, -50)}
					BackgroundColor3={UITheme.colors.surface}
					BackgroundTransparency={0}
					BorderSizePixel={0}
					LayoutOrder={1}
				>
					<uilistlayout
						FillDirection={Enum.FillDirection.Vertical}
						HorizontalAlignment={Enum.HorizontalAlignment.Center}
						VerticalAlignment={Enum.VerticalAlignment.Top}
						Padding={new UDim(0, 12)}
						SortOrder={Enum.SortOrder.LayoutOrder}
					/>

					<uipadding
						PaddingTop={new UDim(0, 16)}
						PaddingBottom={new UDim(0, 16)}
						PaddingLeft={new UDim(0, 16)}
						PaddingRight={new UDim(0, 16)}
					/>

					<textlabel
						Size={new UDim2(1, 0, 0, 40)}
						BackgroundTransparency={1}
						Font={Enum.Font.Unknown}
						FontFace={UITheme.fonts.bold}
						Text='Create New Prefab'
						TextColor3={UITheme.colors.text}
						TextSize={16}
						TextXAlignment={Enum.TextXAlignment.Left}
						TextYAlignment={Enum.TextYAlignment.Top}
						LayoutOrder={0}
					/>

					<textlabel
						Size={new UDim2(1, 0, 0, isSelectingModel ? 80 : 60)}
						BackgroundTransparency={1}
						Font={Enum.Font.Unknown}
						FontFace={UITheme.fonts.regular}
						Text={
							isSelectingModel
								? 'Hover over a model in the workspace to select it, or click the Cancel button to stop.'
								: "1. Enter a prefab name\n2. Click 'Select Model' to choose from workspace\n3. Click Create to add the prefab.info script"
						}
						TextColor3={isSelectingModel ? UITheme.colors.warning : UITheme.colors.textMuted}
						TextSize={12}
						TextXAlignment={Enum.TextXAlignment.Left}
						TextYAlignment={Enum.TextYAlignment.Top}
						LayoutOrder={1}
						TextWrapped={true}
					/>

					<Input
						Placeholder='Prefab name...'
						Value={prefabName}
						onChange={setPrefabName}
						Size={new UDim2(1, 0, 0, 36)}
					/>

					<textbutton
						Size={new UDim2(1, 0, 0, 36)}
						BackgroundColor3={isSelectingModel ? UITheme.colors.warning : UITheme.colors.surfaceRaised}
						BackgroundTransparency={0}
						BorderSizePixel={0}
						Font={Enum.Font.Unknown}
						FontFace={UITheme.fonts.regular}
						Text={isSelectingModel ? 'Cancel Selection' : 'Select Model'}
						TextColor3={Color3.fromRGB(255, 255, 255)}
						TextSize={12}
						LayoutOrder={3}
						Event={{
							Activated: () => {
								if (isSelectingModel) {
									setIsSelectingModel(false);
								} else {
									handleStartModelSelection();
								}
							},
						}}
					>
						<uicorner CornerRadius={new UDim(0, 4)} />
					</textbutton>

					<textlabel
						Size={new UDim2(1, 0, 0, 24)}
						BackgroundTransparency={1}
						Font={Enum.Font.Unknown}
						FontFace={UITheme.fonts.regular}
						Text={selectedModel ? `Selected: ${selectedModel.Name}` : 'No model selected'}
						TextColor3={selectedModel ? UITheme.colors.success : UITheme.colors.textMuted}
						TextSize={12}
						TextXAlignment={Enum.TextXAlignment.Left}
						LayoutOrder={4}
					/>

					<frame Size={new UDim2(1, 0, 0, 36)} BackgroundTransparency={1} BorderSizePixel={0} LayoutOrder={5}>
						<uilistlayout
							FillDirection={Enum.FillDirection.Horizontal}
							HorizontalAlignment={Enum.HorizontalAlignment.Right}
							VerticalAlignment={Enum.VerticalAlignment.Center}
							Padding={new UDim(0, 8)}
							SortOrder={Enum.SortOrder.LayoutOrder}
						/>

						<textbutton
							Size={new UDim2(0, 100, 1, 0)}
							BackgroundColor3={UITheme.colors.danger}
							BackgroundTransparency={0}
							BorderSizePixel={0}
							Font={Enum.Font.Unknown}
							FontFace={UITheme.fonts.regular}
							Text='Cancel'
							TextColor3={Color3.fromRGB(255, 255, 255)}
							TextSize={12}
							LayoutOrder={0}
							Event={{
								Activated: handleCancelCreation,
							}}
						>
							<uicorner CornerRadius={new UDim(0, 4)} />
						</textbutton>

						<textbutton
							Size={new UDim2(0, 100, 1, 0)}
							BackgroundColor3={
								selectedModel && prefabName !== '' ? UITheme.colors.accent : UITheme.colors.stroke
							}
							BackgroundTransparency={0}
							BorderSizePixel={0}
							Font={Enum.Font.Unknown}
							FontFace={UITheme.fonts.regular}
							Text='Create'
							TextColor3={Color3.fromRGB(255, 255, 255)}
							TextSize={12}
							LayoutOrder={1}
							Event={{
								Activated: handleConfirmModel,
							}}
						>
							<uicorner CornerRadius={new UDim(0, 4)} />
						</textbutton>
					</frame>
				</frame>
			) : (
				<>
					<KeyboardHints />

					<ScrollArea
						Size={new UDim2(1, 0, 1, -90)}
						AutomaticCanvasSize={Enum.AutomaticSize.Y}
						ScrollingDirection={Enum.ScrollingDirection.Y}
						LayoutOrder={2}
					>
						<frame
							Size={new UDim2(1, -12, 0, 0)}
							AutomaticSize={Enum.AutomaticSize.Y}
							BackgroundTransparency={1}
							BorderSizePixel={0}
						>
							<uilistlayout
								FillDirection={Enum.FillDirection.Horizontal}
								HorizontalAlignment={Enum.HorizontalAlignment.Left}
								VerticalAlignment={Enum.VerticalAlignment.Top}
								Padding={new UDim(0, 8)}
								SortOrder={Enum.SortOrder.LayoutOrder}
								Wraps={true}
							/>

							{filteredPrefabs.map((prefab, index) => (
								<PrefabCard
									key={prefab.name}
									prefab={prefab}
									onSelect={() => onSelectPrefab(prefab)}
									LayoutOrder={index}
								/>
							))}

							{filteredPrefabs.size() === 0 && (
								<textlabel
									Size={new UDim2(1, 0, 0, 100)}
									BackgroundTransparency={1}
									Font={Enum.Font.Unknown}
									FontFace={UITheme.fonts.regular}
									Text='No prefabs found'
									TextColor3={UITheme.colors.textMuted}
									TextSize={14}
									TextXAlignment={Enum.TextXAlignment.Center}
									TextYAlignment={Enum.TextYAlignment.Center}
								/>
							)}
						</frame>
					</ScrollArea>
				</>
			)}
		</frame>
	);
}
