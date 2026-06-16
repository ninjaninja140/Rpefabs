import React, { useState } from "@rbxts/react";
import { UITheme } from "ui/theme";

export function Tabs({
	Tabs: tabs,
	DefaultTab = tabs[0]?.id,
	LayoutOrder,
	onChange,
}: {
	Tabs: Array<{ id: string; label: string; content: React.ReactNode }>;
	DefaultTab?: string;
	LayoutOrder?: number;
	onChange?: (tabId: string) => void;
}) {
	const [activeTab, setActiveTab] = useState(DefaultTab);

	const handleTabChange = (tabId: string) => {
		setActiveTab(tabId);
		onChange?.(tabId);
	};

	return (
		<frame
			Size={new UDim2(1, 0, 0, 0)}
			AutomaticSize={Enum.AutomaticSize.Y}
			LayoutOrder={LayoutOrder}
			BackgroundTransparency={1}
			BorderSizePixel={0}
		>
			<uilistlayout
				FillDirection={Enum.FillDirection.Vertical}
				Padding={new UDim(0, 12)}
			/>

			{/* Tab buttons */}
			<frame
				Size={new UDim2(1, 0, 0, 44)}
				BackgroundColor3={UITheme.colors.surface}
				BackgroundTransparency={0.16}
				BorderSizePixel={0}
			>
				<uicorner CornerRadius={UITheme.radius.md} />
				<uistroke
					Color={UITheme.colors.stroke}
					Transparency={0.72}
					Thickness={2}
				/>
				<uilistlayout
					FillDirection={Enum.FillDirection.Horizontal}
					Padding={new UDim(0, 0)}
				/>

				{tabs.map((tab) => (
					<textbutton
						key={tab.id}
						Size={new UDim2(0, 0, 1, 0)}
						AutomaticSize={Enum.AutomaticSize.X}
						AutoButtonColor={false}
						Text={tab.label}
						BackgroundColor3={
							activeTab === tab.id
								? UITheme.colors.accent
								: UITheme.colors.surface
						}
						BackgroundTransparency={activeTab === tab.id ? 0.1 : 0.16}
						BorderSizePixel={0}
						Font={Enum.Font.Unknown}
						FontFace={
							activeTab === tab.id
								? UITheme.fonts.semiBold
								: UITheme.fonts.medium
						}
						TextColor3={UITheme.colors.text}
						TextSize={14}
						Event={{
							MouseButton1Click: () => handleTabChange(tab.id),
						}}
					>
						{tabs.indexOf(tab) === 0 && (
							<uicorner CornerRadius={UITheme.radius.md} />
						)}
						<uipadding
							PaddingLeft={new UDim(0, 16)}
							PaddingRight={new UDim(0, 16)}
							PaddingTop={new UDim(0, 8)}
							PaddingBottom={new UDim(0, 8)}
						/>
					</textbutton>
				))}
			</frame>

			{/* Tab content */}
			{tabs.map((tab) => {
				if (activeTab !== tab.id) return undefined;
				return (
					<frame
						key={tab.id}
						Size={new UDim2(1, 0, 0, 0)}
						AutomaticSize={Enum.AutomaticSize.Y}
						BackgroundTransparency={1}
					>
						<uilistlayout
							FillDirection={Enum.FillDirection.Vertical}
							Padding={new UDim(0, 0)}
						/>
						{tab.content}
					</frame>
				);
			})}
		</frame>
	);
}
