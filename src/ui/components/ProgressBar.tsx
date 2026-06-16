import { useMotion } from "@rbxts/pretty-react-hooks";
import React, { useEffect } from "@rbxts/react";
import { UITheme } from "ui/theme";

/**
 * A horizontal progress bar for displaying task completion.
 *
 * @example
 * <Progress Value={0.72} />
 * <Progress Value={0.5} Tone="success" ShowLabel />
 * <Progress Value={undefined} />  // indeterminate
 */
export function Progress({
	Value,
	Tone = "accent",
	ShowLabel = false,
	Size,
	LayoutOrder,
}: {
	Value?: number;
	Tone?: "accent" | "success" | "warning" | "danger";
	ShowLabel?: boolean;
	Size?: UDim2;
	LayoutOrder?: number;
}) {
	const TONE_COLORS: Record<string, Color3> = {
		accent: UITheme.colors.accent,
		success: UITheme.colors.success,
		warning: UITheme.colors.warning,
		danger: UITheme.colors.danger,
	};

	const fillColor = TONE_COLORS[Tone];
	const clampedValue =
		Value !== undefined ? math.clamp(Value, 0, 1) : undefined;

	const [fillWidth, setFillWidth] = useMotion(clampedValue ?? 0);

	useEffect(() => {
		if (clampedValue !== undefined) {
			setFillWidth.spring(clampedValue, { tension: 160, friction: 22 });
		}
	}, [clampedValue]);

	return (
		<frame
			Size={Size ?? new UDim2(1, 0, 0, ShowLabel ? 28 : 8)}
			LayoutOrder={LayoutOrder}
			BackgroundTransparency={1}
		>
			{ShowLabel && clampedValue !== undefined && (
				<textlabel
					Size={new UDim2(1, 0, 0, 16)}
					BackgroundTransparency={1}
					Font={Enum.Font.Unknown}
					FontFace={UITheme.fonts.semiBold}
					Text={`${math.round(clampedValue * 100)}%`}
					TextColor3={UITheme.colors.textMuted}
					TextSize={12}
					TextXAlignment={Enum.TextXAlignment.Right}
				/>
			)}
			<frame
				AnchorPoint={new Vector2(0, 1)}
				Position={UDim2.fromScale(0, 1)}
				Size={new UDim2(1, 0, 0, 8)}
				BackgroundColor3={UITheme.colors.surfaceRaised}
				BackgroundTransparency={0.1}
				BorderSizePixel={0}
			>
				<uicorner CornerRadius={UITheme.radius.pill} />
				<uistroke
					Color={UITheme.colors.stroke}
					Transparency={0.8}
					Thickness={1}
				/>
				<frame
					Size={fillWidth.map((w) => new UDim2(w, 0, 1, 0))}
					BackgroundColor3={fillColor}
					BackgroundTransparency={0}
					BorderSizePixel={0}
				>
					<uicorner CornerRadius={UITheme.radius.pill} />
				</frame>
			</frame>
		</frame>
	);
}
