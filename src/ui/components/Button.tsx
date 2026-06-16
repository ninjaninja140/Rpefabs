import React from "@rbxts/react";
import { Alignment } from "ui/components/Alignment";
import { ButtonContainer } from "ui/components/ButtonContainer";
import { LucideIcon } from "ui/components/LucideIcon";
import { UITheme } from "ui/theme";

const BUTTON_HEIGHTS = {
	sm: 36,
	md: 44,
	lg: 54,
};

export function Button({
	Text,
	Icon,
	Size,
	LayoutOrder,
	Disabled,
	Selected,
	Variant = "default",
	SizeVariant = "md",
	IconSize = 18,
	onClick,
}: {
	Text: string;
	Icon?: string;
	Size?: UDim2;
	LayoutOrder?: number;
	Disabled?: boolean;
	Selected?: boolean;
	Variant?: "primary" | "secondary" | "danger" | "ghost" | "default";
	SizeVariant?: keyof typeof BUTTON_HEIGHTS;
	IconSize?: number;
	onClick?: (rbx: TextButton) => void;
}) {
	const height = BUTTON_HEIGHTS[SizeVariant];
	const background =
		Variant === "danger"
			? UITheme.colors.danger
			: Variant === "ghost"
				? UITheme.colors.background
				: Variant === "secondary"
					? UITheme.colors.surfaceRaised
					: Variant === "primary"
						? UITheme.colors.accent
						: Variant === "default"
							? UITheme.colors.surface
							: UITheme.colors.surface;

	return (
		<ButtonContainer
			Size={Size ?? new UDim2(0, 160, 0, height)}
			LayoutOrder={LayoutOrder}
			Disabled={Disabled}
			Selected={Selected ?? Variant === "primary"}
			BackgroundColor3={background}
			Padding={SizeVariant === "sm" ? 8 : 10}
			onClick={onClick}
		>
			<Alignment
				Display="flex-row"
				Horizontal="center"
				Padding={Icon ? 8 : 0}
			/>
			{Icon ? (
				<LucideIcon
					IconName={Icon}
					IconSize={IconSize}
					ImageColor3={UITheme.colors.text}
				/>
			) : undefined}
			<textlabel
				Size={new UDim2(0, 0, 1, 0)}
				AutomaticSize={Enum.AutomaticSize.X}
				BackgroundTransparency={1}
				Font={Enum.Font.Unknown}
				FontFace={UITheme.fonts.semiBold}
				Text={Text}
				TextColor3={UITheme.colors.text}
				TextSize={SizeVariant === "sm" ? 14 : 16}
				TextXAlignment={Enum.TextXAlignment.Center}
				TextTruncate={Enum.TextTruncate.AtEnd}
			/>
		</ButtonContainer>
	);
}

export function IconButton({
	Icon,
	Size = UDim2.fromOffset(44, 44),
	LayoutOrder,
	Disabled,
	Selected,
	onClick,
}: {
	Icon: string;
	Size?: UDim2;
	LayoutOrder?: number;
	Disabled?: boolean;
	Selected?: boolean;
	onClick?: (rbx: TextButton) => void;
}) {
	return (
		<ButtonContainer
			Size={Size}
			LayoutOrder={LayoutOrder}
			Disabled={Disabled}
			Selected={Selected}
			Padding={0}
			onClick={onClick}
		>
			<LucideIcon
				IconName={Icon}
				IconSize={18}
				ImageColor3={UITheme.colors.text}
			/>
		</ButtonContainer>
	);
}
