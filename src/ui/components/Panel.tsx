import React from "@rbxts/react";
import { UITheme } from "ui/theme";

export function Panel({
	children,
	Size = UDim2.fromScale(0, 0),
	Position,
	AnchorPoint,
	LayoutOrder,
	ZIndex = 1,
	BackgroundColor3 = UITheme.colors.surface,
	BackgroundTransparency = 0.16,
	StrokeColor3 = UITheme.colors.stroke,
	StrokeTransparency = 0.72,
	Padding = 12,
	ClipsDescendants = true,
}: {
	children?: React.ReactNode;
	Size?: UDim2;
	Position?: UDim2;
	AnchorPoint?: Vector2;
	LayoutOrder?: number;
	ZIndex?: number;
	BackgroundColor3?: Color3;
	BackgroundTransparency?: number;
	StrokeColor3?: Color3;
	StrokeTransparency?: number;
	Padding?: number;
	ClipsDescendants?: boolean;
}) {
	return (
		<frame
			Size={Size}
			Position={Position}
			AnchorPoint={AnchorPoint}
			LayoutOrder={LayoutOrder}
			AutomaticSize={!Size ? Enum.AutomaticSize.XY : Enum.AutomaticSize.None}
			ZIndex={ZIndex}
			BackgroundColor3={BackgroundColor3}
			BackgroundTransparency={BackgroundTransparency}
			BorderSizePixel={0}
			ClipsDescendants={ClipsDescendants}
		>
			<uicorner CornerRadius={UITheme.radius.md} />
			<uistroke
				Color={StrokeColor3}
				Transparency={StrokeTransparency}
				Thickness={2}
			/>
			<uipadding
				PaddingTop={new UDim(0, Padding)}
				PaddingBottom={new UDim(0, Padding)}
				PaddingLeft={new UDim(0, Padding)}
				PaddingRight={new UDim(0, Padding)}
			/>
			{children}
		</frame>
	);
}
