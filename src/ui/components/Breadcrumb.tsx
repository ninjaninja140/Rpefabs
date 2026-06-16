import React from "@rbxts/react";
import { LucideIcon } from "ui/components/LucideIcon";
import { UITheme } from "ui/theme";

export function Breadcrumb({
	Items,
	OnNavigate,
}: {
	Items: Array<{ label: string; onClick?: () => void }>;
	OnNavigate?: (index: number) => void;
}) {
	return (
		<frame
			Size={new UDim2(0, 0, 0, 0)}
			AutomaticSize={Enum.AutomaticSize.XY}
			BackgroundTransparency={1}
		>
			<uilistlayout
				FillDirection={Enum.FillDirection.Horizontal}
				Padding={new UDim(0, 0)}
			/>

			{Items.map((item, index) => (
				<frame
					key={index}
					Size={new UDim2(0, 0, 0, 0)}
					AutomaticSize={Enum.AutomaticSize.XY}
					BackgroundTransparency={1}
				>
					<uilistlayout
						FillDirection={Enum.FillDirection.Horizontal}
						Padding={new UDim(0, 4)}
					/>

					{/* Breadcrumb item */}
					<textbutton
						Size={new UDim2(0, 0, 0, 20)}
						AutomaticSize={Enum.AutomaticSize.X}
						AutoButtonColor={false}
						Text={item.label}
						BackgroundTransparency={1}
						BorderSizePixel={0}
						Font={Enum.Font.Unknown}
						FontFace={
							index === Items.size() - 1
								? UITheme.fonts.semiBold
								: UITheme.fonts.regular
						}
						TextColor3={
							index === Items.size() - 1
								? UITheme.colors.text
								: UITheme.colors.textMuted
						}
						TextSize={14}
						TextXAlignment={Enum.TextXAlignment.Left}
						TextYAlignment={Enum.TextYAlignment.Center}
						Event={{
							MouseButton1Click: () => {
								item.onClick?.();
								OnNavigate?.(index);
							},
						}}
					/>

					{/* Separator */}
					{index < Items.size() - 1 && (
						<frame Size={UDim2.fromOffset(20, 20)} BackgroundTransparency={1}>
							<LucideIcon
								IconName="chevron-right"
								IconSize={14}
								ImageColor3={UITheme.colors.textMuted}
							/>
						</frame>
					)}
				</frame>
			))}
		</frame>
	);
}
