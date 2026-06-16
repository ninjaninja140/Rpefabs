import React, { useState } from '@rbxts/react';
import { type ArcAxis, type ArcConfig, type ArcRotationType, PlacementSystem } from 'PlacementSystem';
import { UITheme } from './theme';
import { PillButton, SmallButton } from './ui/Button';
import { SectionLabel } from './ui/SectionLabel';

export function ArcPanel({ arc, onArcChange }: { arc: ArcConfig; onArcChange: (partial: Partial<ArcConfig>) => void }) {
	const [angleInput, setAngleInput] = useState(tostring(arc.angle));

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

					{/* ── Gap Compensation ── */}
					<frame
						Size={new UDim2(1, 0, 0, 0)}
						AutomaticSize={Enum.AutomaticSize.Y}
						BackgroundTransparency={1}
						BorderSizePixel={0}
						LayoutOrder={7}
					>
						<uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, 4)} />
						<SectionLabel text='GAP FILL' />
						<frame Size={new UDim2(1, 0, 0, 30)} BackgroundTransparency={1} BorderSizePixel={0}>
							<uilistlayout FillDirection={Enum.FillDirection.Horizontal} Padding={new UDim(0, 4)} />
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
										onArcChange({
											gapCompensation:
												math.round(math.clamp(arc.gapCompensation - 0.05, -1, 1) * 100) / 100,
										});
									},
								}}
							>
								<uicorner CornerRadius={UITheme.radius.sm} />
							</textbutton>
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
									Text={tostring(math.round(arc.gapCompensation * 100))}
									TextColor3={UITheme.colors.text}
									TextSize={13}
									TextXAlignment={Enum.TextXAlignment.Center}
									ClearTextOnFocus={false}
									Change={{
										Text: (rbx: unknown) => {
											if (typeIs(rbx, 'Instance') && (rbx as Instance).IsA('TextBox')) {
												const n = tonumber((rbx as TextBox).Text) as number | undefined;
												if (n !== undefined) {
													onArcChange({ gapCompensation: math.clamp(n / 100, -1, 1) });
												}
											}
										},
									}}
								/>
							</frame>
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
										onArcChange({
											gapCompensation:
												math.round(math.clamp(arc.gapCompensation + 0.05, -1, 1) * 100) / 100,
										});
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
							Text='Higher = tighter fit · Lower = more spacing'
							TextColor3={UITheme.colors.textMuted}
							TextSize={9}
							TextXAlignment={Enum.TextXAlignment.Left}
						/>
					</frame>

					{/* ── Options row ── */}
					<frame
						Size={new UDim2(1, 0, 0, 0)}
						AutomaticSize={Enum.AutomaticSize.Y}
						BackgroundTransparency={1}
						BorderSizePixel={0}
						LayoutOrder={6}
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
						layoutOrder={7}
					/>
				</>
			)}
		</frame>
	);
}
