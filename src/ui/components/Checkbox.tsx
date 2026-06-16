import React, { useState } from "@rbxts/react";
import { LucideIcon } from "ui/components/LucideIcon";
import { UITheme } from "ui/theme";

export function Checkbox({
	Checked = false,
	Disabled = false,
	Label,
	Size = UDim2.fromOffset(20, 20),
	LayoutOrder,
	onChange,
}: {
	Checked?: boolean;
	Disabled?: boolean;
	Label?: string;
	Size?: UDim2;
	LayoutOrder?: number;
	onChange?: (checked: boolean) => void;
}) {
	const [hovered, setHovered] = useState(false);
	const [glow, setGlow] = useState(0);
	const [hoverAlpha, setHoverAlpha] = useState(0);

	const handleClick = () => {
		if (!Disabled) onChange?.(!Checked);
	};

	React.useEffect(() => {
		let running = true;

		const target = hovered && !Disabled ? 1 : 0;
		const start = hoverAlpha;
		const duration = 0.15;
		const startTime = tick();

		task.spawn(() => {
			while (running) {
				const alpha = math.min((tick() - startTime) / duration, 1);
				const value = start + (target - start) * alpha;

				setHoverAlpha(value);

				if (alpha >= 1) break;
				task.wait();
			}
		});

		return () => {
			running = false;
		};
	}, [hovered, Disabled]);

	React.useEffect(() => {
		let running = true;

		task.spawn(() => {
			const start = glow;
			const target = Checked ? 1 : 0;
			const duration = 0.2;
			const startTime = tick();

			while (running) {
				const alpha = math.min((tick() - startTime) / duration, 1);

				setGlow(start + (target - start) * alpha);

				if (alpha >= 1) break;

				task.wait();
			}
		});

		return () => {
			running = false;
		};
	}, [Checked]);

	const checkbox = (
		<textbutton
			Size={Size}
			LayoutOrder={LayoutOrder}
			AutoButtonColor={false}
			Active={!Disabled}
			Text=""
			BackgroundColor3={
				Disabled
					? UITheme.colors.surfaceRaised
					: Checked
						? UITheme.colors.accent
						: UITheme.colors.surface
			}
			BackgroundTransparency={Disabled ? 0.4 : Checked ? 0.1 : 0.1}
			BorderSizePixel={0}
			Event={{
				MouseEnter: () => !Disabled && setHovered(true),
				MouseLeave: () => setHovered(false),
				MouseButton1Click: handleClick,
			}}
		>
			<uicorner CornerRadius={UITheme.radius.sm} />
			<uistroke
				Color={UITheme.colors.stroke}
				Transparency={0.72}
				Thickness={2}
			/>

			<uistroke
				ApplyStrokeMode={Enum.ApplyStrokeMode.Border}
				Color={UITheme.colors.accent}
				Transparency={1 - hoverAlpha}
				Thickness={math.clamp(2 + glow * 1.5, 2, 4)}
			/>

			<frame
				Size={UDim2.fromScale(1, 1)}
				BackgroundTransparency={1}
				BorderSizePixel={0}
			>
				<uicorner CornerRadius={UITheme.radius.sm} />
			</frame>
			{Checked ? (
				<frame
					Size={UDim2.fromScale(1, 1)}
					BackgroundTransparency={1}
					BorderSizePixel={0}
				>
					<LucideIcon
						IconName="check"
						IconSize={14}
						ImageColor3={
							Disabled ? UITheme.colors.textMuted : UITheme.colors.text
						}
					/>
				</frame>
			) : undefined}
		</textbutton>
	);

	if (Label) {
		return (
			<textbutton
				Size={new UDim2(0, 0, 0, 0)}
				AutomaticSize={Enum.AutomaticSize.XY}
				BackgroundTransparency={1}
				BorderSizePixel={0}
				Text=""
				AutoButtonColor={false}
				Event={{
					MouseButton1Click: handleClick,
				}}
			>
				<uilistlayout
					FillDirection={Enum.FillDirection.Horizontal}
					Padding={new UDim(0, 8)}
				/>
				{checkbox}
				<textlabel
					Size={new UDim2(0, 0, 0, 20)}
					AutomaticSize={Enum.AutomaticSize.X}
					BackgroundTransparency={1}
					BorderSizePixel={0}
					Font={Enum.Font.Unknown}
					FontFace={UITheme.fonts.regular}
					Text={Label}
					TextColor3={Disabled ? UITheme.colors.textMuted : UITheme.colors.text}
					TextSize={14}
					TextXAlignment={Enum.TextXAlignment.Left}
					TextYAlignment={Enum.TextYAlignment.Center}
				/>
			</textbutton>
		);
	}

	return checkbox;
}
