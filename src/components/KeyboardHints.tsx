import React from "@rbxts/react";
import { UITheme } from "ui/theme";

export function KeyboardHints() {
	return (
		<frame
			Size={new UDim2(1, 0, 0, 0)}
			AutomaticSize={Enum.AutomaticSize.Y}
			BackgroundColor3={UITheme.colors.surface}
			BackgroundTransparency={0.3}
			BorderSizePixel={0}
		>
			<uipadding
				PaddingTop={new UDim(0, 8)}
				PaddingBottom={new UDim(0, 8)}
				PaddingLeft={new UDim(0, 12)}
				PaddingRight={new UDim(0, 12)}
			/>
			<uilistlayout
				FillDirection={Enum.FillDirection.Vertical}
				HorizontalAlignment={Enum.HorizontalAlignment.Left}
				VerticalAlignment={Enum.VerticalAlignment.Top}
				Padding={new UDim(0, 4)}
				SortOrder={Enum.SortOrder.LayoutOrder}
			/>

			<textlabel
				Size={new UDim2(1, 0, 0, 18)}
				BackgroundTransparency={1}
				Font={Enum.Font.Unknown}
				FontFace={UITheme.fonts.semiBold}
				Text="Keyboard Shortcuts:"
				TextColor3={UITheme.colors.text}
				TextSize={12}
				TextXAlignment={Enum.TextXAlignment.Left}
			/>

			<textlabel
				Size={new UDim2(1, 0, 0, 16)}
				BackgroundTransparency={1}
				Font={Enum.Font.Unknown}
				FontFace={UITheme.fonts.regular}
				Text="ESC - Cancel placement"
				TextColor3={UITheme.colors.textMuted}
				TextSize={11}
				TextXAlignment={Enum.TextXAlignment.Left}
			/>

			<textlabel
				Size={new UDim2(1, 0, 0, 16)}
				BackgroundTransparency={1}
				Font={Enum.Font.Unknown}
				FontFace={UITheme.fonts.regular}
				Text="Ctrl+Z - Undo last placement"
				TextColor3={UITheme.colors.textMuted}
				TextSize={11}
				TextXAlignment={Enum.TextXAlignment.Left}
			/>

			<textlabel
				Size={new UDim2(1, 0, 0, 16)}
				BackgroundTransparency={1}
				Font={Enum.Font.Unknown}
				FontFace={UITheme.fonts.regular}
				Text="Click to place prefab at mouse position"
				TextColor3={UITheme.colors.textMuted}
				TextSize={11}
				TextXAlignment={Enum.TextXAlignment.Left}
			/>
		</frame>
	);
}
