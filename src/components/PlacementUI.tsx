import React, { useEffect, useState } from '@rbxts/react';
import { RunService, UserInputService, Workspace } from '@rbxts/services';
import type { LoadedPrefab } from 'services/PrefabService';
import { Button } from 'ui/components/Button';
import { Input } from 'ui/components/Input';
import { UITheme } from 'ui/theme';
import { PlacementMode, PlacementSystem, SnapMode } from '../services/PlacementSystem';

function formatRotation(rot: number): string {
	return tostring(math.floor(rot * 10) / 10);
}

// ---------------------------------------------------------------------------
// Mode tab strip
// ---------------------------------------------------------------------------

function ModeTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
	return (
		<textbutton
			Size={new UDim2(0.5, -2, 1, 0)}
			BackgroundColor3={active ? UITheme.colors.accent : UITheme.colors.surfaceRaised}
			BackgroundTransparency={active ? 0.08 : 0.2}
			BorderSizePixel={0}
			Font={Enum.Font.Unknown}
			FontFace={active ? UITheme.fonts.semiBold : UITheme.fonts.regular}
			Text={label}
			TextColor3={UITheme.colors.text}
			TextSize={13}
			AutoButtonColor={false}
			Event={{ Activated: onClick }}
		>
			<uicorner CornerRadius={UITheme.radius.sm} />
			{active && <uistroke Color={UITheme.colors.accent} Transparency={0.35} Thickness={1} />}
		</textbutton>
	);
}

// ---------------------------------------------------------------------------
// Arrow direction button (used in array panel)
// ---------------------------------------------------------------------------

type ArrayDirection = 'px' | 'nx' | 'pz' | 'nz';

const DIR_LABELS: Record<ArrayDirection, string> = {
	px: '+X →',
	nx: '← -X',
	pz: '+Z ↓',
	nz: '↑ -Z',
};

function DirectionButton({ dir, active, onClick }: { dir: ArrayDirection; active: boolean; onClick: () => void }) {
	return (
		<textbutton
			Size={new UDim2(0.5, -4, 0, 32)}
			BackgroundColor3={active ? UITheme.colors.warning : UITheme.colors.surfaceRaised}
			BackgroundTransparency={active ? 0.08 : 0.25}
			BorderSizePixel={0}
			Font={Enum.Font.Unknown}
			FontFace={active ? UITheme.fonts.semiBold : UITheme.fonts.regular}
			Text={DIR_LABELS[dir]}
			TextColor3={active ? Color3.fromRGB(20, 16, 0) : UITheme.colors.text}
			TextSize={12}
			AutoButtonColor={false}
			Event={{ Activated: onClick }}
		>
			<uicorner CornerRadius={UITheme.radius.sm} />
		</textbutton>
	);
}

// ---------------------------------------------------------------------------
// Main PlacementUI
// ---------------------------------------------------------------------------

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
	// ---- shared state --------------------------------------------------------
	const [canUndo, setCanUndo] = useState(false);
	const [snapMode, setSnapMode] = useState(PlacementSystem.getSnapMode());
	const [gridSize, setGridSize] = useState('1');
	const [placedCount, setPlacedCount] = useState(0);
	const [placementMode, setPlacementMode] = useState(PlacementSystem.getPlacementMode());

	// ---- array mode state ----------------------------------------------------
	const [arrayAnchored, setArrayAnchored] = useState(false);
	const [activeDir, setActiveDir] = useState<ArrayDirection | undefined>();
	const [arrayCount, setArrayCount] = useState('5');
	const [arraySpacing, setArraySpacing] = useState('0');

	// ---- input connections ---------------------------------------------------
	useEffect(() => {
		// Update shadow every frame
		const renderConn = RunService.RenderStepped.Connect(() => {
			if (PlacementSystem.getPlacementMode() === PlacementMode.Array && PlacementSystem.isArrayAnchored()) {
				const shadow = PlacementSystem.getShadowModel();
				if (shadow?.Parent) {
					shadow.Parent = undefined;
				}
				return;
			}

			const shadow = PlacementSystem.getShadowModel();
			if (shadow && !shadow.Parent) {
				shadow.Parent = Workspace;
			}

			const camera = Workspace.CurrentCamera;
			if (!camera) return;

			const mousePos = UserInputService.GetMouseLocation();

			const ray = camera.ViewportPointToRay(mousePos.X, mousePos.Y);
			const result = Workspace.Raycast(ray.Origin, ray.Direction.mul(1000));

			if (!result) return;

			PlacementSystem.updateShadowPosition(result.Position);
		});

		// Mouse / keyboard input
		const inputConn = UserInputService.InputBegan.Connect((input, gameProcessed) => {
			if (gameProcessed) return;

			// ---- keyboard shortcuts ------------------------------------------
			if (input.UserInputType === Enum.UserInputType.Keyboard) {
				if (input.KeyCode === Enum.KeyCode.Escape) {
					onCancel();
					return;
				}
				if (input.KeyCode === Enum.KeyCode.Z && UserInputService.IsKeyDown(Enum.KeyCode.LeftControl)) {
					onUndo();
					setCanUndo(PlacementSystem.getPlacedCount() > 1);
					setPlacedCount(math.max(0, PlacementSystem.getPlacedCount() - 1));
					return;
				}
			}

			// ---- left-click --------------------------------------------------
			if (input.UserInputType !== Enum.UserInputType.MouseButton1) return;

			const currentMode = PlacementSystem.getPlacementMode();

			if (currentMode === PlacementMode.Single) {
				// Single: place prefab immediately
				const placed = PlacementSystem.placePrefab(mouse.Hit.Position, rotation);
				if (placed) {
					setCanUndo(true);
					setPlacedCount(PlacementSystem.getPlacedCount());
				}
			} else {
				// Array mode
				if (!PlacementSystem.isArrayAnchored()) {
					// First click: anchor the model
					const placed = PlacementSystem.anchorArrayPlacement(mouse.Hit.Position, rotation);
					if (placed) {
						setCanUndo(true);
						setArrayAnchored(true);
						setPlacedCount(PlacementSystem.getPlacedCount());
					}
				}
				// Subsequent clicks on arrows are handled by the arrow buttons in the UI
			}
		});

		return () => {
			renderConn.Disconnect();
			inputConn.Disconnect();
		};
	}, [rotation, placementMode]);

	// ---- keep array preview live when direction / count changes --------------
	useEffect(() => {
		if (placementMode !== PlacementMode.Array || !arrayAnchored || !activeDir) {
			PlacementSystem.clearArrayPreview();
			return;
		}

		const n = tonumber(arrayCount) as number | undefined;
		if (n !== undefined && n > 0) {
			PlacementSystem.previewArrayExtension(activeDir, math.floor(n));
		} else {
			PlacementSystem.clearArrayPreview();
		}
	}, [activeDir, arrayCount, arrayAnchored, placementMode]);

	// ---- handlers ------------------------------------------------------------

	const handleRotationLeft = () => onRotationChange((rotation - 2.5 + 360) % 360);
	const handleRotationRight = () => onRotationChange((rotation + 2.5) % 360);

	const handleRotationInput = (value: string) => {
		const n = tonumber(value) as number | undefined;
		if (n !== undefined && n >= 0 && n <= 360) onRotationChange(n);
	};

	const handleSnapModeChange = (mode: SnapMode) => {
		setSnapMode(mode);
		PlacementSystem.setSnapMode(mode);
	};

	const handleGridSizeChange = (value: string) => {
		setGridSize(value);
		const n = tonumber(value) as number | undefined;
		if (n && n > 0) PlacementSystem.setGridSize(n);
	};

	const handleModeSwitch = (mode: PlacementMode) => {
		PlacementSystem.setPlacementMode(mode);
		setPlacementMode(mode);
		setArrayAnchored(false);
		setActiveDir(undefined);
		PlacementSystem.clearArrayState();
	};

	const handleSpacingChange = (value: string) => {
		setArraySpacing(value);
		const n = tonumber(value) as number | undefined;
		if (n !== undefined) PlacementSystem.setArraySpacing(n);
	};

	const handleDirSelect = (dir: ArrayDirection) => {
		setActiveDir((prev) => (prev === dir ? undefined : dir));
	};

	const handleCommitArray = () => {
		if (!activeDir) return;
		const n = tonumber(arrayCount) as number | undefined;
		if (!n || n <= 0) return;
		PlacementSystem.commitArrayExtension(activeDir, math.floor(n));
		setPlacedCount(PlacementSystem.getPlacedCount());
		setCanUndo(true);
		setActiveDir(undefined);
	};

	const handleResetAnchor = () => {
		PlacementSystem.clearArrayState();
		setArrayAnchored(false);
		setActiveDir(undefined);
	};

	// ---- render --------------------------------------------------------------

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

			{/* ── Header ─────────────────────────────────────────────────── */}
			<frame
				Size={new UDim2(1, 0, 0, 72)}
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
					Padding={new UDim(0, 4)}
					SortOrder={Enum.SortOrder.LayoutOrder}
				/>
				<textlabel
					Size={new UDim2(1, 0, 0, 20)}
					BackgroundTransparency={1}
					Font={Enum.Font.Unknown}
					FontFace={UITheme.fonts.semiBold}
					Text={`Placing: ${prefab.name}`}
					TextColor3={UITheme.colors.text}
					TextSize={15}
					TextXAlignment={Enum.TextXAlignment.Left}
				/>
				<textlabel
					Size={new UDim2(1, 0, 0, 14)}
					BackgroundTransparency={1}
					Font={Enum.Font.Unknown}
					FontFace={UITheme.fonts.regular}
					Text={`${placedCount} prefab${placedCount !== 1 ? 's' : ''} placed`}
					TextColor3={UITheme.colors.textMuted}
					TextSize={11}
					TextXAlignment={Enum.TextXAlignment.Left}
				/>
			</frame>

			{/* ── Mode strip ─────────────────────────────────────────────── */}
			<frame
				Size={new UDim2(1, 0, 0, 40)}
				BackgroundColor3={UITheme.colors.surface}
				BackgroundTransparency={0}
				BorderSizePixel={0}
				LayoutOrder={1}
			>
				<uipadding
					PaddingTop={new UDim(0, 6)}
					PaddingBottom={new UDim(0, 6)}
					PaddingLeft={new UDim(0, 10)}
					PaddingRight={new UDim(0, 10)}
				/>
				<uilistlayout
					FillDirection={Enum.FillDirection.Horizontal}
					Padding={new UDim(0, 4)}
					SortOrder={Enum.SortOrder.LayoutOrder}
				/>
				<ModeTab
					label='Single'
					active={placementMode === PlacementMode.Single}
					onClick={() => handleModeSwitch(PlacementMode.Single)}
				/>
				<ModeTab
					label='Array'
					active={placementMode === PlacementMode.Array}
					onClick={() => handleModeSwitch(PlacementMode.Array)}
				/>
			</frame>

			{/* ── Rotation & snap ────────────────────────────────────────── */}
			<frame
				Size={new UDim2(1, 0, 0, 0)}
				AutomaticSize={Enum.AutomaticSize.Y}
				BackgroundColor3={UITheme.colors.surface}
				BackgroundTransparency={0.2}
				BorderSizePixel={0}
				LayoutOrder={2}
			>
				<uipadding
					PaddingTop={new UDim(0, 10)}
					PaddingBottom={new UDim(0, 10)}
					PaddingLeft={new UDim(0, 12)}
					PaddingRight={new UDim(0, 12)}
				/>
				<uilistlayout
					FillDirection={Enum.FillDirection.Vertical}
					Padding={new UDim(0, 8)}
					SortOrder={Enum.SortOrder.LayoutOrder}
				/>

				{/* Rotation label */}
				<textlabel
					Size={new UDim2(1, 0, 0, 16)}
					BackgroundTransparency={1}
					Font={Enum.Font.Unknown}
					FontFace={UITheme.fonts.semiBold}
					Text='Rotation'
					TextColor3={UITheme.colors.textMuted}
					TextSize={11}
					TextXAlignment={Enum.TextXAlignment.Left}
				/>

				{/* -/input/+ row */}
				<frame Size={new UDim2(1, 0, 0, 28)} BackgroundTransparency={1} BorderSizePixel={0}>
					<uilistlayout
						FillDirection={Enum.FillDirection.Horizontal}
						Padding={new UDim(0, 6)}
						SortOrder={Enum.SortOrder.LayoutOrder}
					/>

					<textbutton
						Size={new UDim2(0, 28, 1, 0)}
						BackgroundColor3={UITheme.colors.surfaceRaised}
						BackgroundTransparency={0}
						BorderSizePixel={0}
						Font={Enum.Font.Unknown}
						FontFace={UITheme.fonts.bold}
						Text='-'
						TextColor3={UITheme.colors.text}
						TextSize={14}
						LayoutOrder={0}
						AutoButtonColor={false}
						Event={{ Activated: handleRotationLeft }}
					>
						<uicorner CornerRadius={UITheme.radius.sm} />
					</textbutton>

					<textbox
						Size={new UDim2(1, -80, 1, 0)}
						BackgroundColor3={UITheme.colors.surfaceRaised}
						BackgroundTransparency={0}
						BorderSizePixel={0}
						Font={Enum.Font.Unknown}
						FontFace={UITheme.fonts.regular}
						Text={`${formatRotation(rotation)}°`}
						TextColor3={UITheme.colors.text}
						TextSize={12}
						TextXAlignment={Enum.TextXAlignment.Center}
						ClearTextOnFocus={false}
						LayoutOrder={1}
						Change={{
							Text: (rbx: unknown) => {
								if (typeIs(rbx, 'Instance') && rbx.IsA('TextBox')) {
									handleRotationInput((rbx as TextBox).Text.gsub('°', '')[0]);
								}
							},
						}}
					>
						<uicorner CornerRadius={UITheme.radius.sm} />
					</textbox>

					<textbutton
						Size={new UDim2(0, 28, 1, 0)}
						BackgroundColor3={UITheme.colors.surfaceRaised}
						BackgroundTransparency={0}
						BorderSizePixel={0}
						Font={Enum.Font.Unknown}
						FontFace={UITheme.fonts.bold}
						Text='+'
						TextColor3={UITheme.colors.text}
						TextSize={14}
						LayoutOrder={2}
						AutoButtonColor={false}
						Event={{ Activated: handleRotationRight }}
					>
						<uicorner CornerRadius={UITheme.radius.sm} />
					</textbutton>
				</frame>

				<textlabel
					Size={new UDim2(1, 0, 0, 12)}
					BackgroundTransparency={1}
					Font={Enum.Font.Unknown}
					FontFace={UITheme.fonts.regular}
					Text='±2.5° per click'
					TextColor3={UITheme.colors.textMuted}
					TextSize={10}
					TextXAlignment={Enum.TextXAlignment.Left}
				/>

				{/* Snap section */}
				<textlabel
					Size={new UDim2(1, 0, 0, 16)}
					BackgroundTransparency={1}
					Font={Enum.Font.Unknown}
					FontFace={UITheme.fonts.semiBold}
					Text='Snap'
					TextColor3={UITheme.colors.textMuted}
					TextSize={11}
					TextXAlignment={Enum.TextXAlignment.Left}
				/>

				<frame Size={new UDim2(1, 0, 0, 28)} BackgroundTransparency={1} BorderSizePixel={0}>
					<uilistlayout
						FillDirection={Enum.FillDirection.Horizontal}
						Padding={new UDim(0, 6)}
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
							Size={new UDim2(1, 0, 0, 14)}
							BackgroundTransparency={1}
							Font={Enum.Font.Unknown}
							FontFace={UITheme.fonts.regular}
							Text='Grid size (studs)'
							TextColor3={UITheme.colors.textMuted}
							TextSize={11}
							TextXAlignment={Enum.TextXAlignment.Left}
						/>
						<Input
							Value={gridSize}
							onChange={handleGridSizeChange}
							Placeholder='e.g. 4'
							Size={new UDim2(0.5, -4, 0, 28)}
						/>
					</>
				)}
			</frame>

			{/* ── Array panel (only in Array mode) ───────────────────────── */}
			{placementMode === PlacementMode.Array && (
				<frame
					Size={new UDim2(1, 0, 0, 0)}
					AutomaticSize={Enum.AutomaticSize.Y}
					BackgroundColor3={UITheme.colors.surface}
					BackgroundTransparency={0.05}
					BorderSizePixel={0}
					LayoutOrder={3}
				>
					<uistroke Color={UITheme.colors.accent} Transparency={0.75} Thickness={1} />
					<uipadding
						PaddingTop={new UDim(0, 10)}
						PaddingBottom={new UDim(0, 12)}
						PaddingLeft={new UDim(0, 12)}
						PaddingRight={new UDim(0, 12)}
					/>
					<uilistlayout
						FillDirection={Enum.FillDirection.Vertical}
						Padding={new UDim(0, 8)}
						SortOrder={Enum.SortOrder.LayoutOrder}
					/>

					{/* Section label */}
					<textlabel
						Size={new UDim2(1, 0, 0, 16)}
						BackgroundTransparency={1}
						Font={Enum.Font.Unknown}
						FontFace={UITheme.fonts.semiBold}
						Text='Array Placement'
						TextColor3={UITheme.colors.textMuted}
						TextSize={11}
						TextXAlignment={Enum.TextXAlignment.Left}
					/>

					{/* Instruction */}
					<textlabel
						Size={new UDim2(1, 0, 0, 0)}
						AutomaticSize={Enum.AutomaticSize.Y}
						BackgroundTransparency={1}
						Font={Enum.Font.Unknown}
						FontFace={UITheme.fonts.regular}
						Text={
							!arrayAnchored
								? 'Click in the viewport to place the anchor prefab, then use the direction buttons below to extend the array.'
								: 'Anchor placed. Pick a direction, set the count, then click Place.'
						}
						TextColor3={arrayAnchored ? UITheme.colors.success : UITheme.colors.textMuted}
						TextSize={11}
						TextXAlignment={Enum.TextXAlignment.Left}
						TextWrapped={true}
					/>

					{arrayAnchored && (
						<>
							{/* Direction grid 2x2 */}
							<textlabel
								Size={new UDim2(1, 0, 0, 14)}
								BackgroundTransparency={1}
								Font={Enum.Font.Unknown}
								FontFace={UITheme.fonts.semiBold}
								Text='Direction'
								TextColor3={UITheme.colors.textMuted}
								TextSize={11}
								TextXAlignment={Enum.TextXAlignment.Left}
							/>

							<frame Size={new UDim2(1, 0, 0, 70)} BackgroundTransparency={1} BorderSizePixel={0}>
								<uilistlayout
									FillDirection={Enum.FillDirection.Vertical}
									Padding={new UDim(0, 4)}
									SortOrder={Enum.SortOrder.LayoutOrder}
								/>
								{/* Row 1 */}
								<frame Size={new UDim2(1, 0, 0, 32)} BackgroundTransparency={1} BorderSizePixel={0}>
									<uilistlayout
										FillDirection={Enum.FillDirection.Horizontal}
										Padding={new UDim(0, 8)}
										SortOrder={Enum.SortOrder.LayoutOrder}
									/>
									<DirectionButton
										dir='px'
										active={activeDir === 'px'}
										onClick={() => handleDirSelect('px')}
									/>
									<DirectionButton
										dir='nx'
										active={activeDir === 'nx'}
										onClick={() => handleDirSelect('nx')}
									/>
								</frame>
								{/* Row 2 */}
								<frame Size={new UDim2(1, 0, 0, 32)} BackgroundTransparency={1} BorderSizePixel={0}>
									<uilistlayout
										FillDirection={Enum.FillDirection.Horizontal}
										Padding={new UDim(0, 8)}
										SortOrder={Enum.SortOrder.LayoutOrder}
									/>
									<DirectionButton
										dir='pz'
										active={activeDir === 'pz'}
										onClick={() => handleDirSelect('pz')}
									/>
									<DirectionButton
										dir='nz'
										active={activeDir === 'nz'}
										onClick={() => handleDirSelect('nz')}
									/>
								</frame>
							</frame>

							{/* Count & spacing row */}
							<frame
								Size={new UDim2(1, 0, 0, 0)}
								AutomaticSize={Enum.AutomaticSize.Y}
								BackgroundTransparency={1}
								BorderSizePixel={0}
							>
								<uilistlayout
									FillDirection={Enum.FillDirection.Horizontal}
									Padding={new UDim(0, 12)}
									SortOrder={Enum.SortOrder.LayoutOrder}
								/>

								<frame
									Size={new UDim2(0.5, -6, 0, 0)}
									AutomaticSize={Enum.AutomaticSize.Y}
									BackgroundTransparency={1}
									BorderSizePixel={0}
								>
									<uilistlayout
										FillDirection={Enum.FillDirection.Vertical}
										Padding={new UDim(0, 4)}
									/>
									<textlabel
										Size={new UDim2(1, 0, 0, 14)}
										BackgroundTransparency={1}
										Font={Enum.Font.Unknown}
										FontFace={UITheme.fonts.regular}
										Text='Count'
										TextColor3={UITheme.colors.textMuted}
										TextSize={11}
										TextXAlignment={Enum.TextXAlignment.Left}
									/>
									<Input
										Value={arrayCount}
										onChange={setArrayCount}
										Placeholder='5'
										Size={new UDim2(1, 0, 0, 28)}
									/>
								</frame>

								<frame
									Size={new UDim2(0.5, -6, 0, 0)}
									AutomaticSize={Enum.AutomaticSize.Y}
									BackgroundTransparency={1}
									BorderSizePixel={0}
								>
									<uilistlayout
										FillDirection={Enum.FillDirection.Vertical}
										Padding={new UDim(0, 4)}
									/>
									<textlabel
										Size={new UDim2(1, 0, 0, 14)}
										BackgroundTransparency={1}
										Font={Enum.Font.Unknown}
										FontFace={UITheme.fonts.regular}
										Text='Spacing'
										TextColor3={UITheme.colors.textMuted}
										TextSize={11}
										TextXAlignment={Enum.TextXAlignment.Left}
									/>
									<Input
										Value={arraySpacing}
										onChange={handleSpacingChange}
										Placeholder='0'
										Size={new UDim2(1, 0, 0, 28)}
									/>
								</frame>
							</frame>

							{/* Place / reset buttons */}
							<frame Size={new UDim2(1, 0, 0, 32)} BackgroundTransparency={1} BorderSizePixel={0}>
								<uilistlayout
									FillDirection={Enum.FillDirection.Horizontal}
									Padding={new UDim(0, 8)}
									SortOrder={Enum.SortOrder.LayoutOrder}
								/>
								<Button
									Text='Place Array'
									Variant={activeDir ? 'primary' : 'secondary'}
									SizeVariant='sm'
									Disabled={activeDir === undefined}
									onClick={handleCommitArray}
									LayoutOrder={0}
									Size={new UDim2(0.6, -4, 1, 0)}
								/>
								<Button
									Text='Reset Anchor'
									Variant='secondary'
									SizeVariant='sm'
									onClick={handleResetAnchor}
									LayoutOrder={1}
									Size={new UDim2(0.4, -4, 1, 0)}
								/>
							</frame>
						</>
					)}
				</frame>
			)}

			{/* ── Spacer ─────────────────────────────────────────────────── */}
			<frame Size={new UDim2(1, 0, 1, 0)} BackgroundTransparency={1} BorderSizePixel={0} LayoutOrder={4} />

			{/* ── Bottom controls ────────────────────────────────────────── */}
			<frame
				Size={new UDim2(1, 0, 0, 52)}
				BackgroundColor3={UITheme.colors.surface}
				BackgroundTransparency={0.1}
				BorderSizePixel={0}
				LayoutOrder={5}
			>
				<uistroke Color={UITheme.colors.stroke} Transparency={0.85} Thickness={1} />
				<uipadding
					PaddingTop={new UDim(0, 10)}
					PaddingBottom={new UDim(0, 10)}
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
