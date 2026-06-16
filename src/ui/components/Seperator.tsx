import React from "@rbxts/react";
import { UITheme } from "ui/theme";

/**
 * A thin horizontal or vertical rule for visually separating content.
 *
 * @example
 * <Separator />
 * <Separator Orientation="vertical" Size={new UDim2(0, 1, 0, 32)} />
 */
export function Separator({
	Orientation = "horizontal",
	Size,
	LayoutOrder,
	Transparency = 0.72,
}: {
	Orientation?: "horizontal" | "vertical";
	Size?: UDim2;
	LayoutOrder?: number;
	Transparency?: number;
}) {
	const defaultSize =
		Orientation === "horizontal"
			? new UDim2(1, 0, 0, 1)
			: new UDim2(0, 1, 1, 0);

	return (
		<frame
			Size={Size ?? defaultSize}
			LayoutOrder={LayoutOrder}
			BackgroundColor3={UITheme.colors.stroke}
			BackgroundTransparency={Transparency}
			BorderSizePixel={0}
		/>
	);
}
