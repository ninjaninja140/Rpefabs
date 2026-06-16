import React, { useEffect, useState } from '@rbxts/react';
import type { LoadedPrefab } from 'services/PrefabService';
import { Button } from 'ui/components/Button';
import { Input } from 'ui/components/Input';
import { UITheme } from 'ui/theme';
import { PlacementSystem, SnapMode } from '../services/PlacementSystem';

function formatRotation(rot: number): string {
	return tostring(math.floor(rot * 10) / 10);
}

export function PlacementUI({
	prefab,
	rotation,
	onRotationChange,
	onCancel,
	onUndo,
	mouse,
}: {
	prefab: LoadedPrefab;
	rotation: number;
	onRotationChange: (rotation: number) => void;
	onCancel: () => void;
	onUndo: () => void;
	mouse: Mouse;
}) {
	const [canUndo, setCanUndo] = useState(false);
	const [snapMode, setSnapMode] = useState(PlacementSystem.getSnapMode());
	const [gridSize, setGridSize] = useState('1');
	const [placedCount, setPlacedCount] = useState(0);

	useEffect(() => {
		// Update shadow model position when mouse moves
		const renderConnection = game.GetService('RunService').RenderStepped.Connect(() => {
			// Get snapped CFrame based on current snap mode
			const snappedCFrame = PlacementSystem.getSnappedCFrame(mouse.Hit.Position, rotation);
			PlacementSystem.updateShadowPosition(snappedCFrame);
		});

		// Handle mouse click to place prefab
		const inputConnection = game.GetService('UserInputService').InputBegan.Connect((input, gameProcessed) => {
			if (gameProcessed) return;
			if (input.UserInputType === Enum.UserInputType.MouseButton1) {
				const placed = PlacementSystem.placePrefab(mouse.Hit.Position, rotation);
				if (placed) {
					setCanUndo(true);
					setPlacedCount(PlacementSystem.getPlacedCount());
				}
			}
		});

		// Handle keyboard shortcuts
		const keyInputConnection = game.GetService('UserInputService').InputBegan.Connect((input, gameProcessed) => {
			if (gameProcessed) return;
			if (input.KeyCode === Enum.KeyCode.Escape) {
				onCancel();
			}
			if (
				input.KeyCode === Enum.KeyCode.Z &&
				game.GetService('UserInputService').IsKeyDown(Enum.KeyCode.LeftControl)
			) {
				onUndo();
				setCanUndo(PlacementSystem.getPlacedCount() > 1);
				setPlacedCount(PlacementSystem.getPlacedCount() - 1);
			}
		});

		return () => {
			renderConnection.Disconnect();
			inputConnection.Disconnect();
			keyInputConnection.Disconnect();
		};
	}, [rotation]);

	const handleRotationLeft = () => {
		onRotationChange((rotation - 2.5 + 360) % 360);
	};

	const handleRotationRight = () => {
		onRotationChange((rotation + 2.5) % 360);
	};

	const handleRotationSliderChange = (value: string) => {
		const numValue = tonumber(value) as number;
		if (numValue !== undefined && numValue >= 0 && numValue <= 360) {
			onRotationChange(numValue);
		}
	};

	const handleSnapModeChange = (mode: SnapMode) => {
		setSnapMode(mode);
		PlacementSystem.setSnapMode(mode);
	};

	const handleGridSizeChange = (value: string) => {
		setGridSize(value);
		const size = tonumber(value) as number;
		if (size && size > 0) {
			PlacementSystem.setGridSize(size);
		}
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
				HorizontalAlignment={Enum.HorizontalAlignment.Left}
				VerticalAlignment={Enum.VerticalAlignment.Top}
				Padding={new UDim(0, 0)}
				SortOrder={Enum.SortOrder.LayoutOrder}
			/>

			{/* Header */}
			<frame
				Size={new UDim2(1, 0, 0, 80)}
				BackgroundColor3={UITheme.colors.surfaceRaised}
				BackgroundTransparency={0.1}
				BorderSizePixel={0}
				LayoutOrder={0}
			>
				<uipadding
					PaddingTop={new UDim(0, 12)}
					PaddingBottom={new UDim(0, 12)}
					PaddingLeft={new UDim(0, 12)}
					PaddingRight={new UDim(0, 12)}
				/>
				<uilistlayout
					FillDirection={Enum.FillDirection.Vertical}
					HorizontalAlignment={Enum.HorizontalAlignment.Left}
					VerticalAlignment={Enum.VerticalAlignment.Top}
					Padding={new UDim(0, 6)}
					SortOrder={Enum.SortOrder.LayoutOrder}
				/>

				<textlabel
					Size={new UDim2(1, 0, 0, 20)}
					BackgroundTransparency={1}
					Font={Enum.Font.Unknown}
					FontFace={UITheme.fonts.semiBold}
					Text={`Placing: ${prefab.name}`}
					TextColor3={UITheme.colors.text}
					TextSize={16}
					TextXAlignment={Enum.TextXAlignment.Left}
					TextYAlignment={Enum.TextYAlignment.Center}
				/>

				<textlabel
					Size={new UDim2(1, 0, 0, 16)}
					BackgroundTransparency={1}
					Font={Enum.Font.Unknown}
					FontFace={UITheme.fonts.regular}
					Text={`Placed: ${placedCount} prefab${placedCount !== 1 ? 's' : ''}`}
					TextColor3={UITheme.colors.textMuted}
					TextSize={12}
					TextXAlignment={Enum.TextXAlignment.Left}
				/>
			</frame>

			{/* Rotation and Snap Controls */}
			<frame
				Size={new UDim2(1, 0, 0, 240)}
				BackgroundColor3={UITheme.colors.surface}
				BackgroundTransparency={0.2}
				BorderSizePixel={0}
				LayoutOrder={1}
			>
				<uipadding
					PaddingTop={new UDim(0, 12)}
					PaddingBottom={new UDim(0, 12)}
					PaddingLeft={new UDim(0, 12)}
					PaddingRight={new UDim(0, 12)}
				/>
				<uilistlayout
					FillDirection={Enum.FillDirection.Vertical}
					HorizontalAlignment={Enum.HorizontalAlignment.Left}
					VerticalAlignment={Enum.VerticalAlignment.Top}
					Padding={new UDim(0, 8)}
					SortOrder={Enum.SortOrder.LayoutOrder}
				/>

				<textlabel
					Size={new UDim2(1, 0, 0, 20)}
					BackgroundTransparency={1}
					Font={Enum.Font.Unknown}
					FontFace={UITheme.fonts.regular}
					Text={`Rotation: ${formatRotation(rotation)}°`}
					TextColor3={UITheme.colors.text}
					TextSize={14}
					TextXAlignment={Enum.TextXAlignment.Left}
				/>

				<frame Size={new UDim2(1, 0, 0, 48)} BackgroundTransparency={1} BorderSizePixel={0}>
					<uilistlayout
						FillDirection={Enum.FillDirection.Vertical}
						HorizontalAlignment={Enum.HorizontalAlignment.Left}
						VerticalAlignment={Enum.VerticalAlignment.Center}
						Padding={new UDim(0, 6)}
						SortOrder={Enum.SortOrder.LayoutOrder}
					/>

					<frame Size={new UDim2(1, 0, 0, 28)} BackgroundTransparency={1} BorderSizePixel={0} LayoutOrder={0}>
						<uilistlayout
							FillDirection={Enum.FillDirection.Horizontal}
							HorizontalAlignment={Enum.HorizontalAlignment.Left}
							VerticalAlignment={Enum.VerticalAlignment.Center}
							Padding={new UDim(0, 8)}
							SortOrder={Enum.SortOrder.LayoutOrder}
						/>

						<textbutton
							Size={new UDim2(0, 32, 1, 0)}
							BackgroundColor3={UITheme.colors.surfaceRaised}
							BackgroundTransparency={0}
							BorderSizePixel={0}
							Font={Enum.Font.Unknown}
							FontFace={UITheme.fonts.bold}
							Text='-'
							TextColor3={UITheme.colors.text}
							TextSize={14}
							LayoutOrder={0}
							Event={{
								Activated: handleRotationLeft,
							}}
						>
							<uicorner CornerRadius={new UDim(0, 4)} />
						</textbutton>

						<textbox
							Size={new UDim2(1, -80, 1, 0)}
							BackgroundColor3={UITheme.colors.surfaceRaised}
							BackgroundTransparency={0}
							BorderSizePixel={0}
							Font={Enum.Font.Unknown}
							FontFace={UITheme.fonts.regular}
							Text={formatRotation(rotation)}
							TextColor3={UITheme.colors.text}
							TextSize={12}
							TextXAlignment={Enum.TextXAlignment.Center}
							ClearTextOnFocus={false}
							LayoutOrder={1}
							Event={{
								FocusLost: () => {
									// Keep the current value on focus loss
								},
							}}
							Change={{
								Text: (rbx: unknown) => {
									if (rbx !== undefined && typeIs(rbx, 'Instance') && rbx.IsA('TextBox')) {
										handleRotationSliderChange((rbx as TextBox).Text);
									}
								},
							}}
						>
							<uicorner CornerRadius={new UDim(0, 4)} />
						</textbox>

						<textbutton
							Size={new UDim2(0, 32, 1, 0)}
							BackgroundColor3={UITheme.colors.surfaceRaised}
							BackgroundTransparency={0}
							BorderSizePixel={0}
							Font={Enum.Font.Unknown}
							FontFace={UITheme.fonts.bold}
							Text='+'
							TextColor3={UITheme.colors.text}
							TextSize={14}
							LayoutOrder={2}
							Event={{
								Activated: handleRotationRight,
							}}
						>
							<uicorner CornerRadius={new UDim(0, 4)} />
						</textbutton>
					</frame>

					<textlabel
						Size={new UDim2(1, 0, 0, 14)}
						BackgroundTransparency={1}
						Font={Enum.Font.Unknown}
						FontFace={UITheme.fonts.regular}
						Text='Increments: ±2.5°'
						TextColor3={UITheme.colors.textMuted}
						TextSize={11}
						TextXAlignment={Enum.TextXAlignment.Left}
						LayoutOrder={1}
					/>
				</frame>

				{/* Snap Mode Section */}
				<textlabel
					Size={new UDim2(1, 0, 0, 20)}
					BackgroundTransparency={1}
					Font={Enum.Font.Unknown}
					FontFace={UITheme.fonts.regular}
					Text={`Snap Mode: ${snapMode}`}
					TextColor3={UITheme.colors.text}
					TextSize={14}
					TextXAlignment={Enum.TextXAlignment.Left}
				/>

				<frame
					Size={new UDim2(1, 0, 0, 0)}
					AutomaticSize={Enum.AutomaticSize.Y}
					BackgroundTransparency={1}
					BorderSizePixel={0}
				>
					<uilistlayout
						FillDirection={Enum.FillDirection.Horizontal}
						HorizontalAlignment={Enum.HorizontalAlignment.Left}
						VerticalAlignment={Enum.VerticalAlignment.Center}
						Padding={new UDim(0, 8)}
						SortOrder={Enum.SortOrder.LayoutOrder}
					/>

					<Button
						Text='None'
						Variant={snapMode === SnapMode.None ? 'primary' : 'secondary'}
						SizeVariant='sm'
						onClick={() => handleSnapModeChange(SnapMode.None)}
						LayoutOrder={0}
					/>

					<Button
						Text='Grid'
						Variant={snapMode === SnapMode.Grid ? 'primary' : 'secondary'}
						SizeVariant='sm'
						onClick={() => handleSnapModeChange(SnapMode.Grid)}
						LayoutOrder={1}
					/>

					<Button
						Text='Face'
						Variant={snapMode === SnapMode.Face ? 'primary' : 'secondary'}
						SizeVariant='sm'
						onClick={() => handleSnapModeChange(SnapMode.Face)}
						LayoutOrder={2}
					/>
				</frame>

				{snapMode === SnapMode.Grid && (
					<>
						<textlabel
							Size={new UDim2(1, 0, 0, 20)}
							BackgroundTransparency={1}
							Font={Enum.Font.Unknown}
							FontFace={UITheme.fonts.regular}
							Text='Grid Size:'
							TextColor3={UITheme.colors.text}
							TextSize={12}
							TextXAlignment={Enum.TextXAlignment.Left}
						/>
						<Input
							Value={gridSize}
							onChange={handleGridSizeChange}
							Placeholder='Grid size...'
							Size={new UDim2(0.5, -4, 0, 30)}
						/>
					</>
				)}
			</frame>

			{/* Spacer */}
			<frame Size={new UDim2(1, 0, 1, -320)} BackgroundTransparency={1} BorderSizePixel={0} LayoutOrder={2} />

			{/* Bottom Controls */}
			<frame
				Size={new UDim2(1, 0, 0, 60)}
				BackgroundColor3={UITheme.colors.surface}
				BackgroundTransparency={0.2}
				BorderSizePixel={0}
				LayoutOrder={3}
			>
				<uipadding
					PaddingTop={new UDim(0, 12)}
					PaddingBottom={new UDim(0, 12)}
					PaddingLeft={new UDim(0, 12)}
					PaddingRight={new UDim(0, 12)}
				/>
				<uilistlayout
					FillDirection={Enum.FillDirection.Horizontal}
					HorizontalAlignment={Enum.HorizontalAlignment.Right}
					VerticalAlignment={Enum.VerticalAlignment.Center}
					Padding={new UDim(0, 8)}
					SortOrder={Enum.SortOrder.LayoutOrder}
				/>

				<Button
					Text='Undo'
					Variant='secondary'
					SizeVariant='sm'
					Disabled={!canUndo}
					onClick={onUndo}
					LayoutOrder={0}
				/>

				<Button Text='Cancel' Variant='danger' SizeVariant='sm' onClick={onCancel} LayoutOrder={1} />
			</frame>
		</frame>
	);
}
