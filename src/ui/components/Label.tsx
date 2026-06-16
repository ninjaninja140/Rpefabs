import React from "@rbxts/react";
import { UITheme } from "ui/theme";

export function Label({
	Text,
	For,
	Size = new UDim2(1, 0, 0, 18),
	LayoutOrder,
	Required = false,
}: {
	Text: string;
	For?: string;
	Size?: UDim2;
	LayoutOrder?: number;
	Required?: boolean;
}) {
	return (
		<frame
			Size={Size}
			LayoutOrder={LayoutOrder}
			BackgroundTransparency={1}
			BorderSizePixel={0}
		>
			<uilistlayout
				FillDirection={Enum.FillDirection.Horizontal}
				Padding={new UDim(0, 4)}
			/>
			<textlabel
				Size={new UDim2(0, 0, 1, 0)}
				AutomaticSize={Enum.AutomaticSize.X}
				BackgroundTransparency={1}
				BorderSizePixel={0}
				Font={Enum.Font.Unknown}
				FontFace={UITheme.fonts.medium}
				Text={Text}
				TextColor3={UITheme.colors.text}
				TextSize={14}
				TextXAlignment={Enum.TextXAlignment.Left}
				TextYAlignment={Enum.TextYAlignment.Center}
			/>
			{Required && (
				<textlabel
					Size={new UDim2(0, 0, 1, 0)}
					AutomaticSize={Enum.AutomaticSize.X}
					BackgroundTransparency={1}
					BorderSizePixel={0}
					Font={Enum.Font.Unknown}
					FontFace={UITheme.fonts.medium}
					Text="*"
					TextColor3={UITheme.colors.danger}
					TextSize={14}
					TextXAlignment={Enum.TextXAlignment.Left}
					TextYAlignment={Enum.TextYAlignment.Center}
				/>
			)}
		</frame>
	);
}
