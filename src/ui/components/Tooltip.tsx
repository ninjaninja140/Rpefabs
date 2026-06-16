import React, { useState } from "@rbxts/react";
import { UITheme } from "ui/theme";

export function Tooltip({
	Content,
	Children,
	Side = "top",
	DelayMs = 200,
}: {
	Content: string;
	Children: React.ReactNode;
	Side?: "top" | "bottom" | "left" | "right";
	DelayMs?: number;
}) {
	const [visible, setVisible] = useState(false);
	const [showTimer, setShowTimer] = useState<thread | undefined>(undefined);

	const handleMouseEnter = () => {
		const timer = task.delay(DelayMs / 1000, () => {
			setVisible(true);
		});
		setShowTimer(timer);
	};

	const handleMouseLeave = () => {
		if (showTimer) task.cancel(showTimer);
		setVisible(false);
	};

	const positionMap = {
		top: new UDim2(0.5, 0, 0, -4),
		bottom: new UDim2(0.5, 0, 1, 4),
		left: new UDim2(0, -4, 0.5, 0),
		right: new UDim2(1, 4, 0.5, 0),
	};

	const anchorMap = {
		top: new Vector2(0.5, 1),
		bottom: new Vector2(0.5, 0),
		left: new Vector2(1, 0.5),
		right: new Vector2(0, 0.5),
	};

	return (
		<frame
			Size={new UDim2(0, 0, 0, 0)}
			AutomaticSize={Enum.AutomaticSize.XY}
			BackgroundTransparency={1}
		>
			<textbutton
				Size={new UDim2(0, 0, 0, 0)}
				AutomaticSize={Enum.AutomaticSize.XY}
				AutoButtonColor={false}
				Text=""
				BackgroundTransparency={1}
				BorderSizePixel={0}
				Event={{
					MouseEnter: handleMouseEnter,
					MouseLeave: handleMouseLeave,
				}}
			>
				{Children}
			</textbutton>

			{visible && (
				<frame
					Position={positionMap[Side]}
					AnchorPoint={anchorMap[Side]}
					Size={new UDim2(0, 0, 0, 0)}
					AutomaticSize={Enum.AutomaticSize.XY}
					BackgroundColor3={UITheme.colors.surfaceRaised}
					BackgroundTransparency={0.08}
					BorderSizePixel={0}
					ZIndex={100}
				>
					<uicorner CornerRadius={UITheme.radius.sm} />
					<uistroke
						Color={UITheme.colors.stroke}
						Transparency={0.72}
						Thickness={1}
					/>
					<uipadding
						PaddingTop={new UDim(0, 6)}
						PaddingBottom={new UDim(0, 6)}
						PaddingLeft={new UDim(0, 8)}
						PaddingRight={new UDim(0, 8)}
					/>
					<textlabel
						Size={new UDim2(0, 0, 0, 0)}
						AutomaticSize={Enum.AutomaticSize.XY}
						BackgroundTransparency={1}
						BorderSizePixel={0}
						Font={Enum.Font.Unknown}
						FontFace={UITheme.fonts.regular}
						Text={Content}
						TextColor3={UITheme.colors.text}
						TextSize={12}
						TextXAlignment={Enum.TextXAlignment.Center}
						TextYAlignment={Enum.TextYAlignment.Center}
					/>
				</frame>
			)}
		</frame>
	);
}
