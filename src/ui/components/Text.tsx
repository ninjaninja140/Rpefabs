import React from "@rbxts/react";
import { UITheme } from "ui/theme";

const TEXT_SIZES = {
	"2xs": 8,
	xs: 10,
	sm: 14,
	md: 16,
	lg: 20,
	xl: 26,
	"2xl": 32,
	"3xl": 40,
	"4xl": 52,
	"5xl": 64,
	"6xl": 80,
};

export function Text({
	Text,
	Size = new UDim2(1, 0, 0, TEXT_SIZES.md + 4),
	LayoutOrder,
	Tone = "default",
	Weight = "medium",
	Variant = "md",
	TextXAlignment = Enum.TextXAlignment.Left,
	TextYAlignment = Enum.TextYAlignment.Center,
	TextWrapped = false,
	TextTransparency = 0,
	AutomaticSize,
}: {
	Text: string;
	Size?: UDim2;
	LayoutOrder?: number;
	Tone?: "default" | "muted" | "accent" | "danger" | "success" | "warning";
	Weight?: "regular" | "medium" | "semiBold" | "bold";
	Variant?: keyof typeof TEXT_SIZES;
	TextXAlignment?: Enum.TextXAlignment;
	TextYAlignment?: Enum.TextYAlignment;
	TextWrapped?: boolean;
	TextTransparency?: number;
	AutomaticSize?: Enum.AutomaticSize;
}) {
	const textColor =
		Tone === "muted"
			? UITheme.colors.textMuted
			: Tone === "accent"
				? UITheme.colors.accent
				: Tone === "danger"
					? UITheme.colors.danger
					: Tone === "success"
						? UITheme.colors.success
						: Tone === "warning"
							? UITheme.colors.warning
							: UITheme.colors.text;

	return (
		<textlabel
			Size={Size}
			LayoutOrder={LayoutOrder}
			BackgroundTransparency={1}
			Font={Enum.Font.Unknown}
			FontFace={UITheme.fonts[Weight]}
			Text={Text}
			TextColor3={textColor}
			TextSize={TEXT_SIZES[Variant]}
			TextTransparency={TextTransparency}
			TextXAlignment={TextXAlignment}
			TextYAlignment={TextYAlignment}
			TextWrapped={TextWrapped}
			TextTruncate={
				TextWrapped ? Enum.TextTruncate.None : Enum.TextTruncate.AtEnd
			}
			AutomaticSize={AutomaticSize}
		/>
	);
}
