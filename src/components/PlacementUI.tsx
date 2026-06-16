import React, { useEffect, useRef, useState } from '@rbxts/react';
import { RunService, UserInputService, Workspace } from '@rbxts/services';
import {
	type ArcAxis,
	type ArcConfig,
	type ArcRotationType,
	PlacementMode,
	PlacementPivot,
	PlacementSystem,
	SnapMode,
} from 'services/PlacementSystem';
import type { LoadedPrefab } from 'services/PrefabService';
import { UITheme } from 'ui/theme';

// ─────────────────────────────────────────────────────────────────────────────
// Small reusable primitives
// ─────────────────────────────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
	return (
		<textlabel
			Size={new UDim2(1, 0, 0, 14)}
			BackgroundTransparency={1}
			Font={Enum.Font.Unknown}
			FontFace={UITheme.fonts.semiBold}
			Text={text}
			TextColor3={UITheme.colors.textMuted}
			TextSize={10}
			TextXAlignment={Enum.TextXAlignment.Left}
		/>
	);
}

function PillButton({
	label,
	active,
	onClick,
	layoutOrder,
}: {
	label: string;
	active: boolean;
	onClick: () => void;
	layoutOrder?: number;
}) {
	return (
		<textbutton
			Size={new UDim2(0, 0, 0, 24)}
			AutomaticSize={Enum.AutomaticSize.X}
			LayoutOrder={layoutOrder}
			BackgroundColor3={active ? UITheme.colors.accent : UITheme.colors.surfaceRaised}
			BackgroundTransparency={active ? 0.08 : 0.25}
			BorderSizePixel={0}
			Font={Enum.Font.Unknown}
			FontFace={active ? UITheme.fonts.semiBold : UITheme.fonts.regular}
			Text={label}
			TextColor3={active ? UITheme.colors.text : UITheme.colors.textMuted}
			TextSize={12}
			AutoButtonColor={false}
			Event={{ Activated: onClick }}
		>
			<uicorner CornerRadius={UITheme.radius.pill} />
			<uipadding PaddingLeft={new UDim(0, 8)} PaddingRight={new UDim(0, 8)} />
			{active && <uistroke Color={UITheme.colors.accent} Transparency={0.4} Thickness={1} />}
		</textbutton>
	);
}

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

type ArrayDirection = 'px' | 'nx' | 'pz' | 'nz';
const DIR_LABELS: Record<ArrayDirection, string> = { px: '+X →', nx: '← -X', pz: '+Z ↓', nz: '↑ -Z' };

function DirectionButton({ dir, active, onClick }: { dir: ArrayDirection; active: boolean; onClick: () => void }) {
	return (
		<textbutton
			Size={new UDim2(0.5, -4, 0, 30)}
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

function SmallButton({
	text,
	onClick,
	accent,
	disabled,
	layoutOrder,
}: {
	text: string;
	onClick: () => void;
	accent?: boolean;
	disabled?: boolean;
	layoutOrder?: number;
}) {
	return (
		<textbutton
			Size={new UDim2(1, 0, 0, 28)}
			LayoutOrder={layoutOrder}
			BackgroundColor3={
				disabled ? UITheme.colors.surfaceRaised : accent ? UITheme.colors.accent : UITheme.colors.surfaceRaised
			}
			BackgroundTransparency={disabled ? 0.4 : 0.08}
			BorderSizePixel={0}
			Font={Enum.Font.Unknown}
			FontFace={UITheme.fonts.semiBold}
			Text={text}
			TextColor3={disabled ? UITheme.colors.textMuted : UITheme.colors.text}
			TextSize={12}
			AutoButtonColor={false}
			Active={!disabled}
			Event={{ Activated: disabled ? () => {} : onClick }}
		>
			<uicorner CornerRadius={UITheme.radius.sm} />
		</textbutton>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// Arc controls panel — mirrors Archimedes' Direction + Angle + Control panels
// ─────────────────────────────────────────────────────────────────────────────

function ArcPanel({ arc, onArcChange }: { arc: ArcConfig; onArcChange: (partial: Partial<ArcConfig>) => void }) {
	const [angleInput, setAngleInput] = useState(tostring(arc.angle));

	// Rotation types valid per axis (mirrors Archimedes' defaults)
	const rotTypes: Array<{ axis: ArcAxis; type: ArcRotationType; label: string }> = [
		{ axis: 'X', type: 'Yaw', label: 'X²' },
		{ axis: 'X', type: 'Pitch', label: 'X' },
		{ axis: 'Y', type: 'Roll', label: 'Y²' },
		{ axis: 'Y', type: 'Pitch', label: 'Y' },
		{ axis: 'Z', type: 'Yaw', label: 'Z²' },
		{ axis: 'Z', type: 'Pitch', label: 'Z' },
	];

	const commitAngle = (raw: string) => {
		const n = tonumber(raw) as number | undefined;
		if (n !== undefined) {
			const clamped = math.clamp(n, -270, 270);
			onArcChange({ angle: clamped });
			setAngleInput(tostring(clamped));
		} else {
			setAngleInput(tostring(arc.angle));
		}
	};

	return (
		<frame
			Size={new UDim2(1, 0, 0, 0)}
			AutomaticSize={Enum.AutomaticSize.Y}
			BackgroundTransparency={1}
			BorderSizePixel={0}
		>
			<uilistlayout
				FillDirection={Enum.FillDirection.Vertical}
				Padding={new UDim(0, 8)}
				SortOrder={Enum.SortOrder.LayoutOrder}
			/>

			{/* ── Enable toggle ── */}
			<frame Size={new UDim2(1, 0, 0, 26)} BackgroundTransparency={1} BorderSizePixel={0} LayoutOrder={0}>
				<uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, 8)} />
				<textlabel
					Size={new UDim2(1, -60, 1, 0)}
					BackgroundTransparency={1}
					Font={Enum.Font.Unknown}
					FontFace={UITheme.fonts.semiBold}
					Text='Arc Placement'
					TextColor3={arc.enabled ? UITheme.colors.accent : UITheme.colors.textMuted}
					TextSize={13}
					TextXAlignment={Enum.TextXAlignment.Left}
				/>
				<textbutton
					Size={new UDim2(0, 52, 0, 26)}
					BackgroundColor3={arc.enabled ? UITheme.colors.accent : UITheme.colors.surfaceRaised}
					BackgroundTransparency={0.1}
					BorderSizePixel={0}
					Font={Enum.Font.Unknown}
					FontFace={UITheme.fonts.semiBold}
					Text={arc.enabled ? 'ON' : 'OFF'}
					TextColor3={arc.enabled ? UITheme.colors.text : UITheme.colors.textMuted}
					TextSize={11}
					AutoButtonColor={false}
					Event={{ Activated: () => onArcChange({ enabled: !arc.enabled }) }}
				>
					<uicorner CornerRadius={UITheme.radius.sm} />
				</textbutton>
			</frame>

			{arc.enabled && (
				<>
					{/* ── Angle ── */}
					<frame
						Size={new UDim2(1, 0, 0, 0)}
						AutomaticSize={Enum.AutomaticSize.Y}
						BackgroundTransparency={1}
						BorderSizePixel={0}
						LayoutOrder={1}
					>
						<uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, 4)} />
						<SectionLabel text='ANGLE (degrees)' />
						<frame Size={new UDim2(1, 0, 0, 30)} BackgroundTransparency={1} BorderSizePixel={0}>
							<uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, 4)} />
							{/* − */}
							<textbutton
								Size={new UDim2(0, 28, 1, 0)}
								BackgroundColor3={UITheme.colors.surfaceRaised}
								BackgroundTransparency={0.1}
								BorderSizePixel={0}
								Text='−'
								Font={Enum.Font.Unknown}
								FontFace={UITheme.fonts.bold}
								TextColor3={UITheme.colors.text}
								TextSize={16}
								AutoButtonColor={false}
								Event={{
									Activated: () => {
										const nextArc = math.clamp(arc.angle - 2.5, -270, 270);
										onArcChange({ angle: nextArc });
										setAngleInput(tostring(nextArc));
									},
								}}
							>
								<uicorner CornerRadius={UITheme.radius.sm} />
							</textbutton>

							{/* text input */}
							<frame
								Size={new UDim2(1, -64, 1, 0)}
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
									Text={angleInput}
									TextColor3={UITheme.colors.text}
									TextSize={13}
									TextXAlignment={Enum.TextXAlignment.Center}
									ClearTextOnFocus={false}
									Change={{
										Text: (rbx: unknown) => {
											if (typeIs(rbx, 'Instance') && (rbx as Instance).IsA('TextBox'))
												setAngleInput((rbx as TextBox).Text);
										},
									}}
									Event={{
										FocusLost: () => commitAngle(angleInput),
									}}
								/>
							</frame>

							{/* + */}
							<textbutton
								Size={new UDim2(0, 28, 1, 0)}
								BackgroundColor3={UITheme.colors.surfaceRaised}
								BackgroundTransparency={0.1}
								BorderSizePixel={0}
								Text='+'
								Font={Enum.Font.Unknown}
								FontFace={UITheme.fonts.bold}
								TextColor3={UITheme.colors.text}
								TextSize={16}
								AutoButtonColor={false}
								Event={{
									Activated: () => {
										const nextArc = math.clamp(arc.angle + 2.5, -270, 270);
										onArcChange({ angle: nextArc });
										setAngleInput(tostring(nextArc));
									},
								}}
							>
								<uicorner CornerRadius={UITheme.radius.sm} />
							</textbutton>
						</frame>
						<textlabel
							Size={new UDim2(1, 0, 0, 11)}
							BackgroundTransparency={1}
							Font={Enum.Font.Unknown}
							FontFace={UITheme.fonts.regular}
							Text='±2.5° per click · negative = reverse curve'
							TextColor3={UITheme.colors.textMuted}
							TextSize={9}
							TextXAlignment={Enum.TextXAlignment.Left}
						/>
					</frame>

					{/* ── Direction / RotationType ── */}
					<frame
						Size={new UDim2(1, 0, 0, 0)}
						AutomaticSize={Enum.AutomaticSize.Y}
						BackgroundTransparency={1}
						BorderSizePixel={0}
						LayoutOrder={2}
					>
						<uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, 4)} />
						<SectionLabel text='DIRECTION' />
						<frame Size={new UDim2(1, 0, 0, 56)} BackgroundTransparency={1} BorderSizePixel={0}>
							<uigridlayout
								CellSize={new UDim2(1 / 3, -4, 0, 24)}
								CellPadding={new UDim2(0, 4, 0, 4)}
								HorizontalAlignment={Enum.HorizontalAlignment.Left}
								VerticalAlignment={Enum.VerticalAlignment.Top}
								SortOrder={Enum.SortOrder.LayoutOrder}
							/>
							{rotTypes.map((rt, i) => {
								const isActive = arc.axis === rt.axis && arc.rotationType === rt.type;
								return (
									<textbutton
										key={`${rt.axis}-${rt.type}`}
										LayoutOrder={i}
										BackgroundColor3={
											isActive ? UITheme.colors.accent : UITheme.colors.surfaceRaised
										}
										BackgroundTransparency={isActive ? 0.08 : 0.25}
										BorderSizePixel={0}
										Font={Enum.Font.Unknown}
										FontFace={isActive ? UITheme.fonts.semiBold : UITheme.fonts.regular}
										Text={rt.label}
										TextColor3={isActive ? UITheme.colors.text : UITheme.colors.textMuted}
										TextSize={12}
										AutoButtonColor={false}
										Event={{
											Activated: () => onArcChange({ axis: rt.axis, rotationType: rt.type }),
										}}
									>
										<uicorner CornerRadius={UITheme.radius.sm} />
									</textbutton>
								);
							})}
						</frame>
					</frame>

					{/* ── Alignment ── */}
					<frame
						Size={new UDim2(1, 0, 0, 0)}
						AutomaticSize={Enum.AutomaticSize.Y}
						BackgroundTransparency={1}
						BorderSizePixel={0}
						LayoutOrder={3}
					>
						<uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, 4)} />
						<SectionLabel text='HINGE' />
						<frame Size={new UDim2(1, 0, 0, 26)} BackgroundTransparency={1} BorderSizePixel={0}>
							<uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, 4)} />
							<PillButton
								label='Inner'
								active={arc.alignment === 'Inside'}
								onClick={() => onArcChange({ alignment: 'Inside' })}
							/>
							<PillButton
								label='Center'
								active={arc.alignment === 'Middle'}
								onClick={() => onArcChange({ alignment: 'Middle' })}
							/>
							<PillButton
								label='Outer'
								active={arc.alignment === 'Outside'}
								onClick={() => onArcChange({ alignment: 'Outside' })}
							/>
						</frame>
					</frame>

					{/* ── Face Alignment ── */}
					<frame
						Size={new UDim2(1, 0, 0, 0)}
						AutomaticSize={Enum.AutomaticSize.Y}
						BackgroundTransparency={1}
						BorderSizePixel={0}
						LayoutOrder={4}
					>
						<uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, 4)} />
						<SectionLabel text='CORNER' />
						<frame Size={new UDim2(1, 0, 0, 26)} BackgroundTransparency={1} BorderSizePixel={0}>
							<uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, 4)} />
							<PillButton
								label='Left'
								active={arc.faceAlignment === 'Left'}
								onClick={() => onArcChange({ faceAlignment: 'Left' })}
							/>
							<PillButton
								label='Center'
								active={arc.faceAlignment === 'Center'}
								onClick={() => onArcChange({ faceAlignment: 'Center' })}
							/>
							<PillButton
								label='Right'
								active={arc.faceAlignment === 'Right'}
								onClick={() => onArcChange({ faceAlignment: 'Right' })}
							/>
						</frame>
					</frame>

					{/* ── Options row ── */}
					<frame
						Size={new UDim2(1, 0, 0, 0)}
						AutomaticSize={Enum.AutomaticSize.Y}
						BackgroundTransparency={1}
						BorderSizePixel={0}
						LayoutOrder={4}
					>
						<uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, 4)} />
						<SectionLabel text='OPTIONS' />
						<frame Size={new UDim2(1, 0, 0, 26)} BackgroundTransparency={1} BorderSizePixel={0}>
							<uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, 6)} />
							<PillButton
								label='Flip Axis'
								active={arc.flipAxis}
								onClick={() => onArcChange({ flipAxis: !arc.flipAxis })}
							/>
							<PillButton
								label='Swap Sides'
								active={arc.swapSides}
								onClick={() => onArcChange({ swapSides: !arc.swapSides })}
							/>
						</frame>
					</frame>

					{/* ── Reset chain button ── */}
					<SmallButton
						text='Reset Arc Chain'
						onClick={() => PlacementSystem.resetArcChain()}
						layoutOrder={5}
					/>
				</>
			)}
		</frame>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main PlacementUI
// ─────────────────────────────────────────────────────────────────────────────

export function PlacementUI({
	prefab,
	onCancel,
	onUndo,
	mouse,
}: {
	prefab: LoadedPrefab;
	onCancel: () => void;
	onUndo: () => void;
	mouse: Mouse;
}) {
	const [canUndo, setCanUndo] = useState(false);
	const [snapMode, setSnapMode] = useState(PlacementSystem.getSnapMode());
	const [gridSize, setGridSize] = useState('1');
	const [placedCount, setPlacedCount] = useState(0);
	const [placementMode, setPlacementMode] = useState(PlacementSystem.getPlacementMode());
	const [arc, setArcState] = useState<ArcConfig>(PlacementSystem.getArcConfig());
	const [pivotMode, setPivotMode] = useState(PlacementSystem.getPivotMode());
	const activeDirRef = useRef<ArrayDirection | undefined>();
	const arrayCountRef = useRef('5');

	// Array mode
	const [arrayAnchored, setArrayAnchored] = useState(false);
	const [activeDir, setActiveDir] = useState<ArrayDirection | undefined>();
	const [arrayCount, setArrayCount] = useState('5');
	const [arraySpacing, setArraySpacing] = useState('0');

	// ── arc change handler ────────────────────────────────────────────────────
	const handleArcChange = (partial: Partial<ArcConfig>) => {
		PlacementSystem.setArcConfig(partial);
		setArcState(PlacementSystem.getArcConfig());
	};

	const handlePivotChange = (mode: PlacementPivot) => {
		PlacementSystem.setPivotMode(mode);
		setPivotMode(mode);
	};

	// ── render loop + input ───────────────────────────────────────────────────
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

			if (input.UserInputType === Enum.UserInputType.Keyboard) {
				if (input.KeyCode === Enum.KeyCode.Escape) {
					onCancel();
					return;
				}
				if (input.KeyCode === Enum.KeyCode.Z && UserInputService.IsKeyDown(Enum.KeyCode.LeftControl)) {
					onUndo();
					return;
				}
			}

			if (input.UserInputType !== Enum.UserInputType.MouseButton1) return;

			const currentMode = PlacementSystem.getPlacementMode();

			if (currentMode === PlacementMode.Single) {
				PlacementSystem.placePrefab(mouse.Hit.Position);
			} else {
				if (!PlacementSystem.isArrayAnchored()) {
					PlacementSystem.anchorArrayPlacement(mouse.Hit.Position, 0);
					setArrayAnchored(true); // Update UI state
				} else if (activeDirRef.current) {
					const n = tonumber(arrayCountRef.current) as number | undefined;
					if (n !== undefined && n > 0) {
						PlacementSystem.commitArrayExtension(activeDirRef.current, math.floor(n));
					}
				}
			}
		});

		return () => {
			inputConn.Disconnect();
		};
	}, []); // Keep empty deps — setArrayAnchored is stable

	// ── array preview live update ─────────────────────────────────────────────
	useEffect(() => {
		if (placementMode !== PlacementMode.Array || !arrayAnchored) {
			PlacementSystem.clearArrayPreview();
			return;
		}
		// In arc mode we don't need a direction; always preview from anchor
		if (arc.enabled && arc.angle !== 0) {
			if (!activeDir) {
				PlacementSystem.clearArrayPreview();
				return;
			}
			const n = tonumber(arrayCount) as number | undefined;
			if (n !== undefined && n > 0) {
				PlacementSystem.previewArrayExtension(activeDir, math.floor(n));
			}
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

	// ── handlers ──────────────────────────────────────────────────────────────

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
		// Anchor remains set, just the arrows move
	};

	const handleResetAnchor = () => {
		PlacementSystem.clearArrayState();
		setArrayAnchored(false);
		setActiveDir(undefined);
		activeDirRef.current = undefined;
	};

	// ─────────────────────────────────────────────────────────────────────────
	// Render
	// ─────────────────────────────────────────────────────────────────────────
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
				<textlabel
					Size={new UDim2(1, 0, 0, 13)}
					BackgroundTransparency={1}
					Font={Enum.Font.Unknown}
					FontFace={UITheme.fonts.regular}
					Text={`${placedCount} placed`}
					TextColor3={UITheme.colors.textMuted}
					TextSize={11}
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

				{/* thin separator */}
				<frame
					Size={new UDim2(1, 0, 0, 1)}
					BackgroundColor3={UITheme.colors.stroke}
					BackgroundTransparency={0.7}
					BorderSizePixel={0}
					LayoutOrder={3}
				/>

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

						<SectionLabel text={arc.enabled ? 'ARRAY (ARC CURVE MODE)' : 'ARRAY'} />

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
										<SectionLabel text='PIVOT' />

										<frame
											Size={new UDim2(1, 0, 0, 26)}
											BackgroundTransparency={1}
											BorderSizePixel={0}
										>
											<uilistlayout
												FillDirection={Enum.FillDirection.Horizontal}
												Padding={new UDim(0, 4)}
											/>

											<PillButton
												label='Center'
												active={pivotMode === PlacementPivot.Center}
												onClick={() => handlePivotChange(PlacementPivot.Center)}
											/>

											<PillButton
												label='Back'
												active={pivotMode === PlacementPivot.BackCenter}
												onClick={() => handlePivotChange(PlacementPivot.BackCenter)}
											/>

											<PillButton
												label='Left'
												active={pivotMode === PlacementPivot.BackLeft}
												onClick={() => handlePivotChange(PlacementPivot.BackLeft)}
											/>

											<PillButton
												label='Right'
												active={pivotMode === PlacementPivot.BackRight}
												onClick={() => handlePivotChange(PlacementPivot.BackRight)}
											/>
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

				{/* Undo */}
				<textbutton
					Size={new UDim2(0, 56, 1, 0)}
					BackgroundColor3={UITheme.colors.surfaceRaised}
					BackgroundTransparency={canUndo ? 0.1 : 0.4}
					BorderSizePixel={0}
					Font={Enum.Font.Unknown}
					FontFace={UITheme.fonts.semiBold}
					Text='Undo'
					TextColor3={canUndo ? UITheme.colors.text : UITheme.colors.textMuted}
					TextSize={12}
					AutoButtonColor={false}
					Active={canUndo}
					Event={{ Activated: canUndo ? onUndo : () => {} }}
				>
					<uicorner CornerRadius={UITheme.radius.sm} />
				</textbutton>

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
