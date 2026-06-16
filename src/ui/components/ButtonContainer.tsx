import { lerp, useMotion } from "@rbxts/pretty-react-hooks";
import React, { useEffect, useState } from "@rbxts/react";
import { UITheme } from "ui/theme";

export function ButtonContainer({
	children,
	Size = new UDim2(0, 180, 0, 48),
	Position,
	AnchorPoint,
	LayoutOrder,
	ZIndex = 1,
	Disabled = false,
	Selected = false,
	Padding = 10,
	BackgroundColor3 = UITheme.colors.surface,
	onClick,
}: {
	children?: React.ReactNode;
	Size?: UDim2;
	Position?: UDim2;
	AnchorPoint?: Vector2;
	LayoutOrder?: number;
	ZIndex?: number;
	Disabled?: boolean;
	Selected?: boolean;
	Padding?: number;
	BackgroundColor3?: Color3;
	onClick?: (rbx: TextButton) => void;
}) {
	const [hovered, setHovered] = useState(false);
	const [pressed, setPressed] = useState(false);
	const [progress, setProgress] = useMotion(Selected ? 1 : 0);
	const [scale, setScale] = useMotion(1);

	useEffect(() => {
		setProgress.spring(Selected || hovered ? 1 : 0, {
			tension: 180,
			friction: 22,
		});
		setScale.spring(pressed ? 0.985 : hovered && !Disabled ? 1.018 : 1, {
			tension: 220,
			friction: 20,
		});
	}, [hovered, pressed, Selected, Disabled]);

	const interactive = !Disabled;

	return (
		<textbutton
			Size={Size}
			Position={Position}
			AnchorPoint={AnchorPoint}
			LayoutOrder={LayoutOrder}
			ZIndex={ZIndex}
			AutoButtonColor={false}
			Active={interactive}
			BackgroundColor3={BackgroundColor3}
			BackgroundTransparency={Disabled ? 0.5 : 0.18}
			BorderSizePixel={0}
			Text=""
			ClipsDescendants={true}
			Event={{
				MouseEnter: () => setHovered(true),
				MouseLeave: () => {
					setHovered(false);
					setPressed(false);
				},
				MouseButton1Down: () => setPressed(true),
				MouseButton1Up: () => setPressed(false),
				MouseButton1Click: (rbx) => {
					if (interactive) onClick?.(rbx);
				},
			}}
		>
			<uiscale Scale={scale} />
			<uicorner CornerRadius={UITheme.radius.md} />
			<uistroke
				Color={progress.map((amount) =>
					UITheme.colors.stroke.Lerp(UITheme.colors.accent, amount),
				)}
				Transparency={progress.map((amount) =>
					lerp(0.72, Disabled ? 0.86 : 0.08, amount),
				)}
				Thickness={2}
			/>
			<frame
				Size={UDim2.fromScale(1, 1)}
				BackgroundTransparency={1}
				ClipsDescendants={true}
				ZIndex={ZIndex}
			>
				<uicorner CornerRadius={UITheme.radius.md} />
				<uigradient
					Color={new ColorSequence(UITheme.colors.accent)}
					Transparency={progress.map(
						(amount) => new NumberSequence(lerp(1, 0.45, amount), 1),
					)}
					Rotation={-35}
				/>
			</frame>
			<frame
				Size={UDim2.fromScale(1, 1)}
				BackgroundTransparency={1}
				ZIndex={ZIndex + 1}
			>
				<uipadding
					PaddingTop={new UDim(0, Padding)}
					PaddingBottom={new UDim(0, Padding)}
					PaddingLeft={new UDim(0, Padding)}
					PaddingRight={new UDim(0, Padding)}
				/>
				{children}
			</frame>
		</textbutton>
	);
}
