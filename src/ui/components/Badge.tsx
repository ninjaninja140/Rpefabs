import React from "@rbxts/react";
import { UITheme } from "ui/theme";

type BadgeTone =
	| "default"
	| "accent"
	| "success"
	| "warning"
	| "danger"
	| "muted";

const TONE_COLORS: Record<BadgeTone, Color3> = {
	default: UITheme.colors.surfaceRaised,
	accent: UITheme.colors.accent,
	success: UITheme.colors.success,
	warning: UITheme.colors.warning,
	danger: UITheme.colors.danger,
	muted: Color3.fromRGB(60, 62, 74),
};

/**
 * A small inline label for status, counts, or categories.
 *
 * @example
 * <Badge Label="New" Tone="accent" />
 * <Badge Label="99+" Tone="danger" />
 */
export function Badge({
	Label,
	Tone = "default",
	LayoutOrder,
}: {
	Label: string;
	Tone?: BadgeTone;
	LayoutOrder?: number;
}) {
	const bg = TONE_COLORS[Tone];
	const isLight = Tone === "success" || Tone === "warning";
	const textColor = isLight ? Color3.fromRGB(10, 12, 18) : UITheme.colors.text;

	return (
		<frame
			Size={new UDim2(0, 0, 0, 20)}
			AutomaticSize={Enum.AutomaticSize.X}
			LayoutOrder={LayoutOrder}
			BackgroundColor3={bg}
			BackgroundTransparency={Tone === "default" ? 0.1 : 0.18}
			BorderSizePixel={0}
		>
			<uicorner CornerRadius={UITheme.radius.pill} />
			<uistroke Color={bg} Transparency={0.6} Thickness={1} />
			<uipadding
				PaddingLeft={new UDim(0, 7)}
				PaddingRight={new UDim(0, 7)}
				PaddingTop={new UDim(0, 2)}
				PaddingBottom={new UDim(0, 2)}
			/>
			<textlabel
				Size={new UDim2(0, 0, 1, 0)}
				AutomaticSize={Enum.AutomaticSize.X}
				BackgroundTransparency={1}
				Font={Enum.Font.Unknown}
				FontFace={UITheme.fonts.semiBold}
				Text={Label}
				TextColor3={textColor}
				TextSize={11}
				TextXAlignment={Enum.TextXAlignment.Center}
			/>
		</frame>
	);
}
