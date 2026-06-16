import { lerp, useMotion } from "@rbxts/pretty-react-hooks";
import React, { useEffect, useState } from "@rbxts/react";
import { UITheme } from "ui/theme";

export function Switch({
	Checked,
	Disabled = false,
	LayoutOrder,
	Size = UDim2.fromOffset(54, 30),
	onChanged,
}: {
	Checked: boolean;
	Disabled?: boolean;
	LayoutOrder?: number;
	Size?: UDim2;
	onChanged?: (checked: boolean) => void;
}) {
	const [hovered, setHovered] = useState(false);
	const [progress, setProgress] = useMotion(Checked ? 1 : 0);
	const [scale, setScale] = useMotion(1);

	useEffect(() => {
		setProgress.spring(Checked ? 1 : 0, { tension: 190, friction: 22 });
		setScale.spring(hovered && !Disabled ? 1.04 : 1, {
			tension: 180,
			friction: 20,
		});
	}, [Checked, hovered, Disabled]);

	return (
		<textbutton
			Size={Size}
			LayoutOrder={LayoutOrder}
			AutoButtonColor={false}
			Active={!Disabled}
			Text=""
			BackgroundColor3={progress.map((amount) =>
				UITheme.colors.surfaceRaised.Lerp(UITheme.colors.accent, amount),
			)}
			BackgroundTransparency={Disabled ? 0.5 : 0.1}
			BorderSizePixel={0}
			Event={{
				MouseEnter: () => setHovered(true),
				MouseLeave: () => setHovered(false),
				MouseButton1Click: () => {
					if (!Disabled) onChanged?.(!Checked);
				},
			}}
		>
			<uiscale Scale={scale} />
			<uicorner CornerRadius={UITheme.radius.pill} />
			<uistroke
				Color={progress.map((amount) =>
					UITheme.colors.stroke.Lerp(UITheme.colors.accent, amount),
				)}
				Transparency={progress.map((amount) => lerp(0.78, 0.2, amount))}
				Thickness={2}
			/>
			<frame
				AnchorPoint={new Vector2(0, 0.5)}
				Position={progress.map(
					(amount) => new UDim2(0, lerp(4, 28, amount), 0.5, 0),
				)}
				Size={UDim2.fromOffset(22, 22)}
				BackgroundColor3={UITheme.colors.text}
				BackgroundTransparency={Disabled ? 0.25 : 0}
				BorderSizePixel={0}
			>
				<uicorner CornerRadius={UITheme.radius.pill} />
			</frame>
		</textbutton>
	);
}
