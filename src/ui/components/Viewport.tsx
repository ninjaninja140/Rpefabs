import React from '@rbxts/react';

function ContainerViewport(props: Omit<React.InstanceProps<Frame>, 'Size' | 'Position'> & { isInset?: boolean }) {
	const {
		children,
		BackgroundColor3 = Color3.fromRGB(255, 255, 255),
		BackgroundTransparency = 0,
		Visible = true,
	} = props;

	return (
		<frame
			BackgroundColor3={BackgroundColor3}
			BackgroundTransparency={BackgroundTransparency}
			Visible={Visible}
			Size={new UDim2(1, 0, 1, 0)}
			ClipsDescendants
		>
			<uipadding
				PaddingTop={new UDim(0, props.isInset ? 70 : 12)}
				PaddingBottom={new UDim(0, 12)}
				PaddingLeft={new UDim(0, 12)}
				PaddingRight={new UDim(0, 12)}
			/>

			{children}
		</frame>
	);
}

export function Viewport(
	props: Omit<React.InstanceProps<Frame>, 'Size' | 'Position'> & { FrameOnly?: boolean; Inset?: boolean }
) {
	const {
		children,
		BackgroundColor3 = Color3.fromRGB(255, 255, 255),
		BackgroundTransparency = 0,
		Visible = true,
		ZIndex = 1,
		FrameOnly = false,
		Inset = true,
	} = props;

	if (FrameOnly)
		return (
			<ContainerViewport
				isInset={false}
				Visible={Visible}
				BackgroundTransparency={BackgroundTransparency}
				BackgroundColor3={BackgroundColor3}
			>
				{children}
			</ContainerViewport>
		);

	return (
		<screengui
			ResetOnSpawn={false}
			ZIndexBehavior={Enum.ZIndexBehavior.Sibling}
			IgnoreGuiInset={Inset}
			ClipToDeviceSafeArea={false}
			DisplayOrder={ZIndex}
		>
			<ContainerViewport
				isInset={Inset}
				Visible={Visible}
				BackgroundTransparency={BackgroundTransparency}
				BackgroundColor3={BackgroundColor3}
			>
				{children}
			</ContainerViewport>
		</screengui>
	);
}
