import { useMotion } from "@rbxts/pretty-react-hooks";
import React, { useEffect } from "@rbxts/react";
import { RunService } from "@rbxts/services";
import { UITheme } from "ui/theme";

export function Spinner({
	Size: sizePx = 48,
	Color = UITheme.colors.accent,
	LayoutOrder,
}: {
	Size?: number;
	Color?: Color3;
	LayoutOrder?: number;
}) {
	const dotSize = math.max(4, sizePx / 8);
	const spacing = dotSize * 4;

	// Animation states for each dot (offset along x-axis)
	const [dot1X, setDot1X] = useMotion(0);
	const [dot2X, setDot2X] = useMotion(0);
	const [dot3X, setDot3X] = useMotion(0);

	useEffect(() => {
		let time = 0;
		const conn = RunService.Heartbeat.Connect((dt) => {
			time += dt;

			// Each dot bounces with staggered timing
			// Period: 7s per bounce (slower), staggered by 0.35s
			const frequency = 7;
			const stagger = 0.35;

			// Calculate position using sine wave (0 to 1 normalized)
			const dot1Time = (time % frequency) / frequency;
			const dot2Time = ((time - stagger) % frequency) / frequency;
			const dot3Time = ((time - stagger * 2) % frequency) / frequency;

			// Bounce easing: goes from 0 to 1 and back
			const bounce = (t: number) => {
				return t < 0.5 ? t * 2 : 2 - t * 2;
			};

			// Calculate max bounds - dots stay within container
			const containerWidth = sizePx + 96 * 2;
			const maxOffset = containerWidth / 2 - dotSize / 2;

			// Move dots horizontally, clamped to bounds
			const range = spacing * 12;
			const clamp = (value: number) =>
				math.max(-maxOffset, math.min(maxOffset, value));

			setDot1X.immediate(clamp(bounce(dot1Time) * range - range / 2));
			setDot2X.immediate(clamp(bounce(dot2Time) * range - range / 2));
			setDot3X.immediate(clamp(bounce(dot3Time) * range - range / 2));
		});
		return () => conn.Disconnect();
	}, []);

	return (
		<frame
			Size={new UDim2(0, sizePx + 96 * 2, 0, sizePx)}
			LayoutOrder={LayoutOrder}
			BackgroundTransparency={1}
			BorderSizePixel={0}
		>
			{/* Container for dots */}
			<frame
				Size={UDim2.fromScale(1, 1)}
				AnchorPoint={new Vector2(0.5, 0.5)}
				Position={UDim2.fromScale(0.5, 0.5)}
				BackgroundTransparency={1}
				BorderSizePixel={0}
			>
				{/* Dot 1 */}
				<frame
					Size={new UDim2(0, dotSize, 0, dotSize)}
					Position={dot1X.map((x) => new UDim2(0.5, x, 0.5, 0))}
					AnchorPoint={new Vector2(0.5, 0.5)}
					BackgroundColor3={Color}
					BorderSizePixel={0}
				>
					<uicorner CornerRadius={new UDim(1, 0)} />
				</frame>

				{/* Dot 2 */}
				<frame
					Size={new UDim2(0, dotSize, 0, dotSize)}
					Position={dot2X.map((x) => new UDim2(0.5, x, 0.5, 0))}
					AnchorPoint={new Vector2(0.5, 0.5)}
					BackgroundColor3={Color}
					BorderSizePixel={0}
				>
					<uicorner CornerRadius={new UDim(1, 0)} />
				</frame>

				{/* Dot 3 */}
				<frame
					Size={new UDim2(0, dotSize, 0, dotSize)}
					Position={dot3X.map((x) => new UDim2(0.5, x, 0.5, 0))}
					AnchorPoint={new Vector2(0.5, 0.5)}
					BackgroundColor3={Color}
					BorderSizePixel={0}
				>
					<uicorner CornerRadius={new UDim(1, 0)} />
				</frame>
			</frame>
		</frame>
	);
}
