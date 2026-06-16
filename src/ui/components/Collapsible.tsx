import { useMotion } from "@rbxts/pretty-react-hooks";
import React, { useEffect, useState } from "@rbxts/react";
import { LucideIcon } from "ui/components/LucideIcon";
import { UITheme } from "ui/theme";

export function Collapsible({
	Title,
	Content,
	DefaultOpen = false,
	Disabled = false,
	LayoutOrder,
	onOpenChange,
}: {
	Title: string;
	Content: React.ReactNode;
	DefaultOpen?: boolean;
	Disabled?: boolean;
	LayoutOrder?: number;
	onOpenChange?: (open: boolean) => void;
}) {
	const [open, setOpen] = useState(DefaultOpen);

	// Motion value for chevron rotation
	const [rotation, motion] = useMotion(DefaultOpen ? -90 : 0);

	const handleToggle = () => {
		if (Disabled) return;

		const newState = !open;
		setOpen(newState);
		onOpenChange?.(newState);

		motion.spring(newState ? -90 : 0);
	};

	// keep in sync if DefaultOpen ever changes externally
	useEffect(() => {
		setOpen(DefaultOpen);
		motion.immediate(DefaultOpen ? -90 : 0);
	}, [DefaultOpen]);

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
				Padding={new UDim(0, 8)}
			/>

			{/* Header */}
			<textbutton
				Size={new UDim2(1, 0, 0, 44)}
				AutoButtonColor={false}
				Active={!Disabled}
				Text=""
				BackgroundColor3={UITheme.colors.surface}
				BackgroundTransparency={0.16}
				BorderSizePixel={0}
				Event={{
					MouseButton1Click: handleToggle,
				}}
			>
				<uicorner CornerRadius={UITheme.radius.md} />
				<uistroke
					Color={UITheme.colors.stroke}
					Transparency={0.72}
					Thickness={2}
				/>

				<uipadding
					PaddingLeft={new UDim(0, 12)}
					PaddingRight={new UDim(0, 12)}
					PaddingTop={new UDim(0, 8)}
					PaddingBottom={new UDim(0, 8)}
				/>

				<uilistlayout
					FillDirection={Enum.FillDirection.Horizontal}
					Padding={new UDim(0, 12)}
				/>

				<textlabel
					Size={new UDim2(1, -32, 1, 0)}
					BackgroundTransparency={1}
					FontFace={UITheme.fonts.semiBold}
					Text={Title}
					TextColor3={UITheme.colors.text}
					TextSize={16}
					TextXAlignment={Enum.TextXAlignment.Left}
					TextYAlignment={Enum.TextYAlignment.Center}
					TextTruncate={Enum.TextTruncate.AtEnd}
				/>

				{/* Chevron */}
				<frame Size={UDim2.fromOffset(20, 20)} BackgroundTransparency={1}>
					<LucideIcon
						IconName="chevron-left"
						IconSize={16}
						ImageColor3={UITheme.colors.text}
						Rotation={rotation}
					/>
				</frame>
			</textbutton>

			{/* Content */}
			{open ? (
				<frame
					Size={new UDim2(1, 0, 0, 0)}
					AutomaticSize={Enum.AutomaticSize.Y}
					BackgroundColor3={UITheme.colors.surface}
					BackgroundTransparency={0}
					BorderSizePixel={0}
					ZIndex={9999}
				>
					<uicorner CornerRadius={UITheme.radius.md} />
					<uipadding
						PaddingLeft={new UDim(0, 12)}
						PaddingRight={new UDim(0, 12)}
						PaddingTop={new UDim(0, 12)}
						PaddingBottom={new UDim(0, 12)}
					/>
					<uilistlayout FillDirection={Enum.FillDirection.Vertical} />

					{Content}
				</frame>
			) : undefined}
		</frame>
	);
}
