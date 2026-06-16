import React from '@rbxts/react';
import { UITheme } from 'components/theme';

export function ModeTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
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
