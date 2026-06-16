import React from "@rbxts/react";
import { LucideIcon } from "ui/components/LucideIcon";
import { UITheme } from "ui/theme";

export function Alert({
	Title,
	Description,
	Type = "info",
	Icon,
	Size = new UDim2(1, 0, 0, 0),
	LayoutOrder,
	Dismissible = false,
	onDismiss,
}: {
	Title: string;
	Description?: string;
	Type?: "info" | "success" | "warning" | "danger";
	Icon?: string;
	Size?: UDim2;
	LayoutOrder?: number;
	Dismissible?: boolean;
	onDismiss?: () => void;
}) {
	const typeColors = {
		info: UITheme.colors.accent,
		success: UITheme.colors.success,
		warning: UITheme.colors.warning,
		danger: UITheme.colors.danger,
	};

	const typeIcons = {
		info: "info",
		success: "check-circle",
		warning: "alert-circle",
		danger: "x-circle",
	};

	const iconColor = typeColors[Type];
	const displayIcon = Icon ?? typeIcons[Type];

	return (
		<frame
			Size={Size}
			AutomaticSize={Enum.AutomaticSize.Y}
			LayoutOrder={LayoutOrder}
			BackgroundColor3={UITheme.colors.surface}
			BackgroundTransparency={0.2}
			BorderSizePixel={0}
		>
			<uicorner CornerRadius={UITheme.radius.md} />
			<uistroke Color={iconColor} Transparency={0.6} Thickness={1} />
			<uipadding
				PaddingTop={new UDim(0, 20)}
				PaddingBottom={new UDim(0, 20)}
				PaddingLeft={new UDim(0, 20)}
				PaddingRight={new UDim(0, 20)}
			/>
			<uilistlayout
				FillDirection={Enum.FillDirection.Horizontal}
				Padding={new UDim(0, 16)}
			/>

			{/* Icon */}
			<frame Size={UDim2.fromOffset(20, 20)} BackgroundTransparency={1}>
				<LucideIcon
					IconName={displayIcon}
					IconSize={18}
					ImageColor3={iconColor}
				/>
			</frame>

			{/* Content */}
			<frame
				Size={new UDim2(1, -52, 0, 0)}
				AutomaticSize={Enum.AutomaticSize.Y}
				BackgroundTransparency={1}
			>
				<uilistlayout
					FillDirection={Enum.FillDirection.Vertical}
					Padding={new UDim(0, 6)}
				/>
				{Title !== "" && (
					<textlabel
						Size={new UDim2(1, 0, 0, 0)}
						AutomaticSize={Enum.AutomaticSize.Y}
						BackgroundTransparency={1}
						BorderSizePixel={0}
						Font={Enum.Font.Unknown}
						FontFace={UITheme.fonts.semiBold}
						Text={Title}
						TextColor3={UITheme.colors.text}
						TextSize={14}
						TextXAlignment={Enum.TextXAlignment.Left}
						TextYAlignment={Enum.TextYAlignment.Top}
						TextWrapped={true}
					/>
				)}

				{/* Description */}
				{Description ? (
					<textlabel
						Size={new UDim2(1, 0, 0, 0)}
						AutomaticSize={Enum.AutomaticSize.Y}
						BackgroundTransparency={1}
						BorderSizePixel={0}
						Font={Enum.Font.Unknown}
						FontFace={UITheme.fonts.regular}
						Text={Description}
						TextColor3={UITheme.colors.textMuted}
						TextSize={12}
						TextXAlignment={Enum.TextXAlignment.Left}
						TextYAlignment={Enum.TextYAlignment.Top}
						TextWrapped={true}
					/>
				) : undefined}
			</frame>

			{/* Dismiss button */}
			{Dismissible && (
				<textbutton
					Size={UDim2.fromOffset(20, 20)}
					AutoButtonColor={false}
					Text=""
					BackgroundTransparency={1}
					BorderSizePixel={0}
					Event={{
						MouseButton1Click: onDismiss,
					}}
				>
					<LucideIcon
						IconName="x"
						IconSize={16}
						ImageColor3={UITheme.colors.textMuted}
					/>
				</textbutton>
			)}
		</frame>
	);
}
