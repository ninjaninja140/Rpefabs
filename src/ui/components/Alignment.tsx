import React from '@rbxts/react';

export function Alignment({
	Display = 'flex-row',
	Horizontal = 'center',
	Vertical = 'center',
	Padding = 0,
}: {
	Display?: 'flex-row' | 'flex-col';
	Horizontal?: 'left' | 'center' | 'right';
	Vertical?: 'top' | 'center' | 'bottom';
	Padding?: number;
}) {
	return (
		<uilistlayout
			FillDirection={Display === 'flex-row' ? Enum.FillDirection.Horizontal : Enum.FillDirection.Vertical}
			Padding={new UDim(0, Padding)}
			HorizontalAlignment={
				Horizontal === 'left'
					? Enum.HorizontalAlignment.Left
					: Horizontal === 'right'
						? Enum.HorizontalAlignment.Right
						: Enum.HorizontalAlignment.Center
			}
			VerticalAlignment={
				Vertical === 'top'
					? Enum.VerticalAlignment.Top
					: Vertical === 'bottom'
						? Enum.VerticalAlignment.Bottom
						: Enum.VerticalAlignment.Center
			}
		/>
	);
}
