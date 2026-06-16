import React, { useState } from "@rbxts/react";
import { UITheme } from "ui/theme";

export function RadioGroup({
	Options,
	SelectedValue = Options[0]?.value,
	Disabled = false,
	Layout = "vertical",
	LayoutOrder,
	onChange,
}: {
	Options: Array<{ value: string; label: string }>;
	SelectedValue?: string;
	Disabled?: boolean;
	Layout?: "vertical" | "horizontal";
	LayoutOrder?: number;
	onChange?: (value: string) => void;
}) {
	const [glowState, setGlowState] = useState<Record<string, number>>({});
	const [hoverAlphaState, setHoverAlphaState] = useState<
		Record<string, number>
	>({});
	const [pulseState, setPulseState] = useState<Record<string, number>>({});

	React.useEffect(() => {
		let running = true;

		task.spawn(() => {
			while (running) {
				const t = tick() % 1;
				const pulse = math.sin(t * math.pi * 2) * 0.5 + 0.5;

				setPulseState((prev) => ({ ...prev, default: pulse }));
				task.wait(1 / 60);
			}
		});

		return () => {
			running = false;
		};
	}, []);

	const handleHoverStart = (value: string) => {
		if (!Disabled) {
			const start = hoverAlphaState[value] ?? 0;
			const duration = 0.15;
			const startTime = tick();

			task.spawn(() => {
				while (true) {
					const alpha = math.min((tick() - startTime) / duration, 1);
					const hoverVal = start + (1 - start) * alpha;

					setHoverAlphaState((prev) => ({ ...prev, [value]: hoverVal }));

					if (alpha >= 1) break;
					task.wait();
				}
			});
		}
	};

	const handleHoverEnd = (value: string) => {
		const start = hoverAlphaState[value] ?? 0;
		const duration = 0.15;
		const startTime = tick();

		task.spawn(() => {
			while (true) {
				const alpha = math.min((tick() - startTime) / duration, 1);
				const hoverVal = start + (0 - start) * alpha;

				setHoverAlphaState((prev) => ({ ...prev, [value]: hoverVal }));

				if (alpha >= 1) break;
				task.wait();
			}
		});
	};

	const handleSelect = (value: string) => {
		if (!Disabled && SelectedValue !== value) {
			onChange?.(value);

			const start = glowState[value] ?? 0;
			const target = 1;
			const duration = 0.2;
			const startTime = tick();

			task.spawn(() => {
				while (true) {
					const alpha = math.min((tick() - startTime) / duration, 1);

					setGlowState((prev) => ({
						...prev,
						[value]: start + (target - start) * alpha,
					}));

					if (alpha >= 1) break;
					task.wait();
				}
			});
		}
	};

	return (
		<frame
			Size={new UDim2(0, 0, 0, 0)}
			AutomaticSize={Enum.AutomaticSize.XY}
			LayoutOrder={LayoutOrder}
			BackgroundTransparency={1}
			BorderSizePixel={0}
		>
			<uilistlayout
				FillDirection={
					Layout === "vertical"
						? Enum.FillDirection.Vertical
						: Enum.FillDirection.Horizontal
				}
				Padding={new UDim(0, 12)}
			/>
			{Options.map((option) => (
				<frame
					key={option.value}
					Size={new UDim2(0, 0, 0, 24)}
					AutomaticSize={Enum.AutomaticSize.X}
					BackgroundTransparency={1}
					BorderSizePixel={0}
				>
					<uilistlayout
						FillDirection={Enum.FillDirection.Horizontal}
						Padding={new UDim(0, 8)}
					/>

					{/* Radio button */}
					<textbutton
						Size={UDim2.fromOffset(20, 20)}
						AutoButtonColor={false}
						Active={!Disabled}
						Text=""
						BackgroundColor3={UITheme.colors.surface}
						BackgroundTransparency={0.1}
						BorderSizePixel={0}
						Event={{
							MouseEnter: () => handleHoverStart(option.value),
							MouseLeave: () => handleHoverEnd(option.value),
							MouseButton1Click: () => handleSelect(option.value),
						}}
					>
						<uicorner CornerRadius={new UDim(0.5, 0)} />
						<uistroke
							Color={UITheme.colors.stroke}
							Transparency={0.72}
							Thickness={2}
						/>

						<uistroke
							ApplyStrokeMode={Enum.ApplyStrokeMode.Border}
							Color={UITheme.colors.accent}
							Transparency={1 - (hoverAlphaState[option.value] ?? 0)}
							Thickness={math.clamp(
								2 +
									(pulseState.default ?? 0) * 1 +
									(glowState[option.value] ?? 0) * 1.5,
								2,
								4,
							)}
						/>

						{SelectedValue === option.value && (
							<frame
								Size={UDim2.fromOffset(10, 10)}
								Position={new UDim2(0.5, 0, 0.5, 0)}
								AnchorPoint={new Vector2(0.5, 0.5)}
								BackgroundColor3={UITheme.colors.accent}
								BorderSizePixel={0}
							>
								<uicorner CornerRadius={new UDim(0.5, 0)} />
							</frame>
						)}
					</textbutton>

					{/* Label */}
					<textbutton
						Size={new UDim2(0, 0, 0, 20)}
						AutomaticSize={Enum.AutomaticSize.X}
						AutoButtonColor={false}
						Active={!Disabled}
						Text={option.label}
						BackgroundTransparency={1}
						BorderSizePixel={0}
						Font={Enum.Font.Unknown}
						FontFace={UITheme.fonts.regular}
						TextColor3={
							Disabled ? UITheme.colors.textMuted : UITheme.colors.text
						}
						TextSize={14}
						TextXAlignment={Enum.TextXAlignment.Left}
						TextYAlignment={Enum.TextYAlignment.Center}
						Event={{
							MouseButton1Click: () => handleSelect(option.value),
						}}
					/>
				</frame>
			))}
		</frame>
	);
}
