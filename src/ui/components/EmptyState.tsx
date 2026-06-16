import React from "@rbxts/react";
import { LucideIcon } from "ui/components/LucideIcon";
import { UITheme } from "ui/theme";

export function EmptyState({
	Icon = "inbox",
	Title,
	Description,
	Action,
	Size = new UDim2(1, 0, 1, 0),
}: {
	Icon?: string;
	Title: string;
	Description: string;
	Action?: { label: string; onClick: () => void };
	Size?: UDim2;
}) {
	return (
		<frame Size={Size} BackgroundTransparency={1} BorderSizePixel={0}>
			<uilistlayout
				FillDirection={Enum.FillDirection.Vertical}
				Padding={new UDim(0, 16)}
				VerticalAlignment={Enum.VerticalAlignment.Center}
				HorizontalAlignment={Enum.HorizontalAlignment.Center}
			/>

			{/* Icon */}
			<frame Size={UDim2.fromOffset(48, 48)} BackgroundTransparency={1}>
				<LucideIcon
					IconName={Icon}
					IconSize={40}
					ImageColor3={UITheme.colors.textMuted}
				/>
			</frame>

			<textlabel
				Size={new UDim2(0, 0, 0, 0)}
				AutomaticSize={Enum.AutomaticSize.XY}
				BackgroundTransparency={1}
				BorderSizePixel={0}
				Font={Enum.Font.Unknown}
				FontFace={UITheme.fonts.semiBold}
				Text={Title}
				TextColor3={UITheme.colors.text}
				TextSize={16}
				TextXAlignment={Enum.TextXAlignment.Center}
				TextYAlignment={Enum.TextYAlignment.Center}
			/>

			{/* Description */}
			<textlabel
				Size={new UDim2(0, 300, 0, 0)}
				AutomaticSize={Enum.AutomaticSize.Y}
				BackgroundTransparency={1}
				BorderSizePixel={0}
				Font={Enum.Font.Unknown}
				FontFace={UITheme.fonts.regular}
				Text={Description}
				TextColor3={UITheme.colors.textMuted}
				TextSize={14}
				TextXAlignment={Enum.TextXAlignment.Center}
				TextYAlignment={Enum.TextYAlignment.Top}
				TextWrapped={true}
			/>

			{/* Action */}
			{Action && (
				<textbutton
					Size={new UDim2(0, 0, 0, 0)}
					AutomaticSize={Enum.AutomaticSize.XY}
					AutoButtonColor={false}
					Text={Action.label}
					BackgroundColor3={UITheme.colors.accent}
					BackgroundTransparency={0.1}
					BorderSizePixel={0}
					Font={Enum.Font.Unknown}
					FontFace={UITheme.fonts.semiBold}
					TextColor3={UITheme.colors.text}
					TextSize={14}
					Event={{
						MouseButton1Click: Action.onClick,
					}}
				>
					<uicorner CornerRadius={UITheme.radius.md} />
					<uipadding
						PaddingLeft={new UDim(0, 16)}
						PaddingRight={new UDim(0, 16)}
						PaddingTop={new UDim(0, 8)}
						PaddingBottom={new UDim(0, 8)}
					/>
					<uistroke
						Color={UITheme.colors.accent}
						Transparency={0.2}
						Thickness={2}
					/>
				</textbutton>
			)}
		</frame>
	);
}
