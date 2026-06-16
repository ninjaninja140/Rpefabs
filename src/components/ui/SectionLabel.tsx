import React from '@rbxts/react';
import { UITheme } from 'components/theme';

export function SectionLabel({ text }: { text: string }) {
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
