import React, { useEffect, useRef, useState } from '@rbxts/react';
import { RunService, UserInputService, Workspace } from '@rbxts/services';
import { ArcPanel } from 'components/ArcPanel';
import { UITheme } from 'components/theme';
import { DirectionButton, PillButton, SmallButton } from 'components/ui/Button';
import { ModeTab } from 'components/ui/ModeTab';
import { SectionLabel } from 'components/ui/SectionLabel';
import { type ArcConfig, PlacementMode, PlacementSystem, SnapMode } from 'PlacementSystem';
import type { LoadedPrefab } from 'PrefabService';

export type ArrayDirection = 'px' | 'nx' | 'pz' | 'nz';

export function PlacementUI({ prefab, onCancel, mouse }: { prefab: LoadedPrefab; onCancel: () => void; mouse: Mouse }) {
	const [placementRotation, setPlacementRotation] = useState(PlacementSystem.getRotationOffset());
	const [snapMode, setSnapMode] = useState(PlacementSystem.getSnapMode());
	const [gridSize, setGridSize] = useState('1');
	const [placementMode, setPlacementMode] = useState(PlacementSystem.getPlacementMode());
	const [arc, setArcState] = useState<ArcConfig>(PlacementSystem.getArcConfig());
	const activeDirRef = useRef<ArrayDirection | undefined>();
	const arrayCountRef = useRef('5');

	// Array mode
	const [arrayAnchored, setArrayAnchored] = useState(PlacementSystem.isArrayAnchored());
	const [activeDir, setActiveDir] = useState<ArrayDirection | undefined>();
	const [arrayCount, setArrayCount] = useState('5');
	const [arraySpacing, setArraySpacing] = useState('0');

	const handleArcChange = (partial: Partial<ArcConfig>) => {
		PlacementSystem.setArcConfig(partial);
		setArcState(PlacementSystem.getArcConfig());
	};

	useEffect(() => {
		const renderConn = RunService.RenderStepped.Connect(() => {
			if (PlacementSystem.getPlacementMode() === PlacementMode.Array && PlacementSystem.isArrayAnchored()) {
				const shadow = PlacementSystem.getShadowModel();
				if (shadow?.Parent) shadow.Parent = undefined;
				return;
			}
			const shadow = PlacementSystem.getShadowModel();
			if (shadow && !shadow.Parent) shadow.Parent = Workspace;
			const camera = Workspace.CurrentCamera;
			if (!camera) return;
			const mousePos = UserInputService.GetMouseLocation();
			const ray = camera.ViewportPointToRay(mousePos.X, mousePos.Y);
			const result = Workspace.Raycast(ray.Origin, ray.Direction.mul(1000));
			if (!result) return;
			PlacementSystem.updateShadowPosition(result.Position);
		});

		return () => {
			renderConn.Disconnect();
		};
	}, [placementMode, arc]);

	useEffect(() => {
		const inputConn = UserInputService.InputBegan.Connect((input, gameProcessed) => {
			if (gameProcessed) return;
			if (PlacementSystem.isSelectionModeActive()) return;
			if (input.UserInputType === Enum.UserInputType.Keyboard) {
				if (input.KeyCode === Enum.KeyCode.Escape) {
					onCancel();
					return;
				}
			}

			if (input.UserInputType !== Enum.UserInputType.MouseButton1) return;

			if (input.KeyCode === Enum.KeyCode.Z && UserInputService.IsKeyDown(Enum.KeyCode.LeftControl)) {
				PlacementSystem.cancelPlacement();
				onCancel();
				return;
			}

			const currentMode = PlacementSystem.getPlacementMode();

			if (currentMode === PlacementMode.Single)
				PlacementSystem.placePrefab(mouse.Hit.Position, PlacementSystem.getRotationOffset());
		});

		return () => {
			inputConn.Disconnect();
		};
	}, []);

	useEffect(() => {
		if (placementMode !== PlacementMode.Array || !arrayAnchored) {
			PlacementSystem.clearArrayPreview();
			return;
		}
		if (arc.enabled && arc.angle !== 0) {
			if (!activeDir) {
				PlacementSystem.clearArrayPreview();
				return;
			}
			const n = tonumber(arrayCount) as number | undefined;
			if (n !== undefined && n > 0) PlacementSystem.previewArrayExtension(activeDir, math.floor(n));

			return;
		}

		if (!activeDir) {
			PlacementSystem.clearArrayPreview();
			return;
		}
		const n = tonumber(arrayCount) as number | undefined;
		if (n !== undefined && n > 0) PlacementSystem.previewArrayExtension(activeDir, math.floor(n));
		else PlacementSystem.clearArrayPreview();
	}, [activeDir, arrayCount, arrayAnchored, placementMode, arc]);

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

	const handleRotationChange = (value: string) => {
		const n = tonumber(value) as number | undefined;
		if (n !== undefined) {
			PlacementSystem.setRotationOffset(n);
			setPlacementRotation(PlacementSystem.getRotationOffset());
		}
	};

	const handleSpacingChange = (value: string) => {
		setArraySpacing(value);
		const n = tonumber(value) as number | undefined;
		if (n !== undefined) PlacementSystem.setArraySpacing(n);
	};

	const handleDirSelect = (dir: ArrayDirection) => {
		setActiveDir((prev) => {
			const nextDir = prev === dir ? undefined : dir;
			activeDirRef.current = nextDir;
			return nextDir;
		});
	};

	const handleCommitArray = () => {
		const n = tonumber(arrayCount) as number | undefined;
		if (!n || n <= 0) return;
		if (!activeDir) return;
		PlacementSystem.commitArrayExtension(activeDir, math.floor(n));
	};

	const handleResetAnchor = () => {
		PlacementSystem.clearArrayState();
		setArrayAnchored(false);
		setActiveDir(undefined);
		activeDirRef.current = undefined;
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

			{/* ── Header ───────────────────────────────────────────────────── */}
			<frame
				Size={new UDim2(1, 0, 0, 56)}
				BackgroundColor3={UITheme.colors.surfaceRaised}
				BackgroundTransparency={0.1}
				BorderSizePixel={0}
				LayoutOrder={0}
			>
				<uipadding
					PaddingTop={new UDim(0, 10)}
					PaddingBottom={new UDim(0, 10)}
					PaddingLeft={new UDim(0, 12)}
					PaddingRight={new UDim(0, 12)}
				/>
				<uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, 3)} />
				<textlabel
					Size={new UDim2(1, 0, 0, 18)}
					BackgroundTransparency={1}
					Font={Enum.Font.Unknown}
					FontFace={UITheme.fonts.semiBold}
					Text={`Placing: ${prefab.name}`}
					TextColor3={UITheme.colors.text}
					TextSize={15}
					TextXAlignment={Enum.TextXAlignment.Left}
				/>
			</frame>

			{/* ── Mode strip ───────────────────────────────────────────────── */}
			<frame
				Size={new UDim2(1, 0, 0, 38)}
				BackgroundColor3={UITheme.colors.surface}
				BackgroundTransparency={0}
				BorderSizePixel={0}
				LayoutOrder={1}
			>
				<uipadding
					PaddingTop={new UDim(0, 5)}
					PaddingBottom={new UDim(0, 5)}
					PaddingLeft={new UDim(0, 10)}
					PaddingRight={new UDim(0, 10)}
				/>
				<uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, 4)} />
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

			{/* ── Scrollable body ──────────────────────────────────────────── */}
			<scrollingframe
				Size={new UDim2(1, 0, 1, -56 - 38 - 48)}
				LayoutOrder={2}
				BackgroundTransparency={1}
				BorderSizePixel={0}
				CanvasSize={new UDim2(0, 0, 0, 0)}
				AutomaticCanvasSize={Enum.AutomaticSize.Y}
				ScrollingDirection={Enum.ScrollingDirection.Y}
				ScrollBarThickness={4}
				ScrollBarImageColor3={UITheme.colors.accent}
				ScrollBarImageTransparency={0.2}
			>
				<uilistlayout
					FillDirection={Enum.FillDirection.Vertical}
					Padding={new UDim(0, 0)}
					SortOrder={Enum.SortOrder.LayoutOrder}
				/>

				{/* thin separator */}
				<frame
					Size={new UDim2(1, 0, 0, 1)}
					BackgroundColor3={UITheme.colors.stroke}
					BackgroundTransparency={0.7}
					BorderSizePixel={0}
					LayoutOrder={1}
				/>

				{/* ── Snap panel ── */}
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
					<uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, 6)} />
					<SectionLabel text='SNAP' />
					<frame Size={new UDim2(1, 0, 0, 26)} BackgroundTransparency={1} BorderSizePixel={0}>
						<uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, 4)} />
						<PillButton
							label='None'
							active={snapMode === SnapMode.None}
							onClick={() => handleSnapModeChange(SnapMode.None)}
						/>
						<PillButton
							label='Grid'
							active={snapMode === SnapMode.Grid}
							onClick={() => handleSnapModeChange(SnapMode.Grid)}
						/>
						<PillButton
							label='Face'
							active={snapMode === SnapMode.Face}
							onClick={() => handleSnapModeChange(SnapMode.Face)}
						/>
					</frame>
					{snapMode === SnapMode.Grid && (
						<>
							<SectionLabel text='ROTATION (degrees)' />
							<frame
								Size={new UDim2(0.5, 0, 0, 28)}
								BackgroundColor3={UITheme.colors.surfaceRaised}
								BackgroundTransparency={0.08}
								BorderSizePixel={0}
							>
								<uicorner CornerRadius={UITheme.radius.sm} />
								<textbox
									Size={UDim2.fromScale(1, 1)}
									BackgroundTransparency={1}
									BorderSizePixel={0}
									Font={Enum.Font.Unknown}
									FontFace={UITheme.fonts.regular}
									Text={tostring(placementRotation)}
									TextColor3={UITheme.colors.text}
									TextSize={12}
									TextXAlignment={Enum.TextXAlignment.Center}
									ClearTextOnFocus={false}
									Change={{
										Text: (rbx: unknown) => {
											if (typeIs(rbx, 'Instance') && (rbx as Instance).IsA('TextBox')) {
												handleRotationChange((rbx as TextBox).Text);
											}
										},
									}}
								/>
							</frame>
							<SectionLabel text='GRID SIZE (studs)' />
							<frame
								Size={new UDim2(0.5, 0, 0, 28)}
								BackgroundColor3={UITheme.colors.surfaceRaised}
								BackgroundTransparency={0.08}
								BorderSizePixel={0}
							>
								<uicorner CornerRadius={UITheme.radius.sm} />
								<textbox
									Size={UDim2.fromScale(1, 1)}
									BackgroundTransparency={1}
									BorderSizePixel={0}
									Font={Enum.Font.Unknown}
									FontFace={UITheme.fonts.regular}
									Text={gridSize}
									TextColor3={UITheme.colors.text}
									TextSize={12}
									TextXAlignment={Enum.TextXAlignment.Center}
									ClearTextOnFocus={false}
									Change={{
										Text: (rbx: unknown) => {
											if (typeIs(rbx, 'Instance') && (rbx as Instance).IsA('TextBox'))
												handleGridSizeChange((rbx as TextBox).Text);
										},
									}}
								/>
							</frame>
						</>
					)}
				</frame>

				{/* ── Array panel ── */}
				{placementMode === PlacementMode.Array && (
					<frame
						Size={new UDim2(1, 0, 0, 0)}
						AutomaticSize={Enum.AutomaticSize.Y}
						BackgroundColor3={UITheme.colors.surface}
						BackgroundTransparency={0.05}
						BorderSizePixel={0}
						LayoutOrder={4}
					>
						<uistroke Color={UITheme.colors.accent} Transparency={0.75} Thickness={1} />
						<uipadding
							PaddingTop={new UDim(0, 10)}
							PaddingBottom={new UDim(0, 10)}
							PaddingLeft={new UDim(0, 12)}
							PaddingRight={new UDim(0, 12)}
						/>
						<uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, 7)} />

						<textlabel
							Size={new UDim2(1, 0, 0, 0)}
							AutomaticSize={Enum.AutomaticSize.Y}
							BackgroundTransparency={1}
							Font={Enum.Font.Unknown}
							FontFace={UITheme.fonts.regular}
							Text={
								!arrayAnchored
									? 'Click in viewport to place the anchor prefab.'
									: arc.enabled
										? 'Anchor placed. Set count then click Place — copies follow the arc curve.'
										: 'Anchor placed. Pick a direction, set count, click Place.'
							}
							TextColor3={arrayAnchored ? UITheme.colors.success : UITheme.colors.textMuted}
							TextSize={11}
							TextXAlignment={Enum.TextXAlignment.Left}
							TextWrapped={true}
						/>

						{arrayAnchored && (
							<>
								{/* ── Arc panel ── */}
								<frame
									Size={new UDim2(1, 0, 0, 0)}
									AutomaticSize={Enum.AutomaticSize.Y}
									BackgroundColor3={UITheme.colors.surface}
									BackgroundTransparency={0.1}
									BorderSizePixel={0}
									LayoutOrder={0}
								>
									<uipadding
										PaddingTop={new UDim(0, 10)}
										PaddingBottom={new UDim(0, 10)}
										PaddingLeft={new UDim(0, 12)}
										PaddingRight={new UDim(0, 12)}
									/>
									<ArcPanel arc={arc} onArcChange={handleArcChange} />
								</frame>

								{/* thin separator */}
								<frame
									Size={new UDim2(1, 0, 0, 1)}
									BackgroundColor3={UITheme.colors.stroke}
									BackgroundTransparency={0.7}
									BorderSizePixel={0}
									LayoutOrder={3}
								/>

								{/* Direction grid — hidden when arc is doing the layout */}
								{!arc.enabled && (
									<>
										<SectionLabel text='DIRECTION' />
										<frame
											Size={new UDim2(1, 0, 0, 68)}
											BackgroundTransparency={1}
											BorderSizePixel={0}
										>
											<uilistlayout
												FillDirection={Enum.FillDirection.Vertical}
												Padding={new UDim(0, 4)}
											/>
											<frame
												Size={new UDim2(1, 0, 0, 30)}
												BackgroundTransparency={1}
												BorderSizePixel={0}
											>
												<uilistlayout
													FillDirection={Enum.FillDirection.Horizontal}
													Padding={new UDim(0, 8)}
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
											<frame
												Size={new UDim2(1, 0, 0, 30)}
												BackgroundTransparency={1}
												BorderSizePixel={0}
											>
												<uilistlayout
													FillDirection={Enum.FillDirection.Horizontal}
													Padding={new UDim(0, 8)}
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
									</>
								)}

								{/* Count / Spacing */}
								<frame
									Size={new UDim2(1, 0, 0, 0)}
									AutomaticSize={Enum.AutomaticSize.Y}
									BackgroundTransparency={1}
									BorderSizePixel={0}
								>
									<uilistlayout
										FillDirection={Enum.FillDirection.Horizontal}
										Padding={new UDim(0, 10)}
									/>
									{/* Count */}
									<frame
										Size={new UDim2(0.5, -5, 0, 0)}
										AutomaticSize={Enum.AutomaticSize.Y}
										BackgroundTransparency={1}
										BorderSizePixel={0}
									>
										<uilistlayout
											FillDirection={Enum.FillDirection.Vertical}
											Padding={new UDim(0, 3)}
										/>
										<SectionLabel text='COUNT' />
										<frame
											Size={new UDim2(1, 0, 0, 28)}
											BackgroundColor3={UITheme.colors.surfaceRaised}
											BackgroundTransparency={0.08}
											BorderSizePixel={0}
										>
											<uicorner CornerRadius={UITheme.radius.sm} />
											<textbox
												Size={UDim2.fromScale(1, 1)}
												BackgroundTransparency={1}
												BorderSizePixel={0}
												Font={Enum.Font.Unknown}
												FontFace={UITheme.fonts.regular}
												Text={arrayCount}
												TextColor3={UITheme.colors.text}
												TextSize={12}
												TextXAlignment={Enum.TextXAlignment.Center}
												ClearTextOnFocus={false}
												Change={{
													Text: (rbx) => {
														setArrayCount(rbx.Text);
														arrayCountRef.current = rbx.Text;
													},
												}}
											/>
										</frame>
									</frame>
									{/* Spacing — only for linear */}
									{!arc.enabled && (
										<frame
											Size={new UDim2(0.5, -5, 0, 0)}
											AutomaticSize={Enum.AutomaticSize.Y}
											BackgroundTransparency={1}
											BorderSizePixel={0}
										>
											<uilistlayout
												FillDirection={Enum.FillDirection.Vertical}
												Padding={new UDim(0, 3)}
											/>
											<SectionLabel text='SPACING' />
											<frame
												Size={new UDim2(1, 0, 0, 28)}
												BackgroundColor3={UITheme.colors.surfaceRaised}
												BackgroundTransparency={0.08}
												BorderSizePixel={0}
											>
												<uicorner CornerRadius={UITheme.radius.sm} />
												<textbox
													Size={UDim2.fromScale(1, 1)}
													BackgroundTransparency={1}
													BorderSizePixel={0}
													Font={Enum.Font.Unknown}
													FontFace={UITheme.fonts.regular}
													Text={arraySpacing}
													TextColor3={UITheme.colors.text}
													TextSize={12}
													TextXAlignment={Enum.TextXAlignment.Center}
													ClearTextOnFocus={false}
													Change={{
														Text: (rbx: unknown) => {
															if (
																typeIs(rbx, 'Instance') &&
																(rbx as Instance).IsA('TextBox')
															)
																handleSpacingChange((rbx as TextBox).Text);
														},
													}}
												/>
											</frame>
										</frame>
									)}
								</frame>

								{/* Place / Reset */}
								<frame Size={new UDim2(1, 0, 0, 28)} BackgroundTransparency={1} BorderSizePixel={0}>
									<uilistlayout
										FillDirection={Enum.FillDirection.Horizontal}
										Padding={new UDim(0, 6)}
									/>
									<SmallButton
										text='Place'
										onClick={handleCommitArray}
										accent={true}
										disabled={!arc.enabled && activeDir === undefined}
										layoutOrder={0}
									/>
									<textbutton
										Size={new UDim2(0.38, 0, 1, 0)}
										LayoutOrder={1}
										BackgroundColor3={UITheme.colors.surfaceRaised}
										BackgroundTransparency={0.1}
										BorderSizePixel={0}
										Font={Enum.Font.Unknown}
										FontFace={UITheme.fonts.regular}
										Text='Reset'
										TextColor3={UITheme.colors.textMuted}
										TextSize={12}
										AutoButtonColor={false}
										Event={{ Activated: handleResetAnchor }}
									>
										<uicorner CornerRadius={UITheme.radius.sm} />
									</textbutton>
								</frame>
							</>
						)}
					</frame>
				)}
			</scrollingframe>

			{/* ── Bottom bar ───────────────────────────────────────────────── */}
			<frame
				Size={new UDim2(1, 0, 0, 48)}
				BackgroundColor3={UITheme.colors.surface}
				BackgroundTransparency={0.1}
				BorderSizePixel={0}
				LayoutOrder={3}
			>
				<uistroke Color={UITheme.colors.stroke} Transparency={0.85} Thickness={1} />
				<uipadding
					PaddingTop={new UDim(0, 9)}
					PaddingBottom={new UDim(0, 9)}
					PaddingLeft={new UDim(0, 12)}
					PaddingRight={new UDim(0, 12)}
				/>
				<uilistlayout
					FillDirection={Enum.FillDirection.Horizontal}
					HorizontalAlignment={Enum.HorizontalAlignment.Right}
					VerticalAlignment={Enum.VerticalAlignment.Center}
					Padding={new UDim(0, 8)}
				/>

				{/* Cancel */}
				<textbutton
					Size={new UDim2(0, 64, 1, 0)}
					BackgroundColor3={UITheme.colors.danger}
					BackgroundTransparency={0.08}
					BorderSizePixel={0}
					Font={Enum.Font.Unknown}
					FontFace={UITheme.fonts.semiBold}
					Text='Cancel'
					TextColor3={UITheme.colors.text}
					TextSize={12}
					AutoButtonColor={false}
					Event={{ Activated: onCancel }}
				>
					<uicorner CornerRadius={UITheme.radius.sm} />
				</textbutton>
			</frame>
		</frame>
	);
}
