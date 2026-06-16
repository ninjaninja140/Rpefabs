import React from '@rbxts/react';
import { UITheme } from 'components/theme';

export function ScrollArea({
	children,
	Size = UDim2.fromScale(1, 1),
	LayoutOrder,
	Padding = 10,
	ScrollBarThickness = 6,
	CanvasSize = UDim2.fromScale(0, 0),
	AutomaticCanvasSize = Enum.AutomaticSize.Y,
	ScrollingDirection = Enum.ScrollingDirection.Y,
	BackgroundColor3 = UITheme.colors.surface,
	BackgroundTransparency = 0.22,
}: {
	children?: React.ReactNode;
	Size?: UDim2;
	LayoutOrder?: number;
	Padding?: number;
	ScrollBarThickness?: number;
	CanvasSize?: UDim2;
	AutomaticCanvasSize?: Enum.AutomaticSize;
	ScrollingDirection?: Enum.ScrollingDirection;
	BackgroundColor3?: Color3;
	BackgroundTransparency?: number;
}) {
	return (
		<scrollingframe
			Size={Size}
			LayoutOrder={LayoutOrder}
			BackgroundColor3={BackgroundColor3}
			BackgroundTransparency={BackgroundTransparency}
			BorderSizePixel={0}
			CanvasSize={CanvasSize}
			AutomaticCanvasSize={AutomaticCanvasSize}
			ScrollingDirection={ScrollingDirection}
			ScrollBarThickness={ScrollBarThickness}
			ScrollBarImageColor3={UITheme.colors.accent}
			ScrollBarImageTransparency={0}
			ClipsDescendants={true}
		>
			<uistroke Color={UITheme.colors.stroke} Transparency={0.78} Thickness={2} />
			<uipadding
				PaddingTop={new UDim(0, Padding)}
				PaddingBottom={new UDim(0, Padding)}
				PaddingLeft={new UDim(0, Padding)}
				PaddingRight={new UDim(0, Padding + ScrollBarThickness)}
			/>
			{children}
		</scrollingframe>
	);
}
