import React from '@rbxts/react';
import type { ArrayDirection } from 'components/PlacementUI';
import { UITheme } from 'components/theme';

const DIR_LABELS: Record<ArrayDirection, string> = { px: '+X →', nx: '← -X', pz: '+Z ↓', nz: '↑ -Z' };

export function DirectionButton({
	dir,
	active,
	onClick,
}: {
	dir: ArrayDirection;
	active: boolean;
	onClick: () => void;
}) {
	return (
		<textbutton
			Size={new UDim2(0.5, -4, 0, 30)}
			BackgroundColor3={active ? UITheme.colors.accent : UITheme.colors.surfaceRaised}
			BackgroundTransparency={active ? 0.08 : 0.25}
			BorderSizePixel={0}
			Font={Enum.Font.Unknown}
			FontFace={active ? UITheme.fonts.semiBold : UITheme.fonts.regular}
			Text={DIR_LABELS[dir]}
			TextColor3={UITheme.colors.text}
			TextSize={12}
			AutoButtonColor={false}
			Event={{ Activated: onClick }}
		>
			<uicorner CornerRadius={UITheme.radius.sm} />
		</textbutton>
	);
}

export function PillButton({
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

export function SmallButton({
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
