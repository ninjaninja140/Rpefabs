import React, { useState } from '@rbxts/react';
import { UITheme } from 'components/theme';

export function Input({
	Placeholder = '',
	Value = '',
	Disabled = false,
	Size = new UDim2(1, 0, 0, 44),
	LayoutOrder,
	onChange,
	onFocused,
	onFocusLost,
}: {
	Placeholder?: string;
	Value?: string;
	Disabled?: boolean;
	Size?: UDim2;
	LayoutOrder?: number;
	onChange?: (text: string) => void;
	onFocused?: () => void;
	onFocusLost?: () => void;
}) {
	const [focused, setFocused] = useState(false);

	return (
		<frame
			Size={Size}
			LayoutOrder={LayoutOrder}
			BackgroundColor3={UITheme.colors.surface}
			BackgroundTransparency={0.1}
			BorderSizePixel={0}
		>
			<uicorner CornerRadius={UITheme.radius.md} />
			<uistroke
				Color={focused ? UITheme.colors.accent : UITheme.colors.stroke}
				Transparency={focused ? 0.2 : 0.72}
				Thickness={2}
			/>
			<uipadding
				PaddingLeft={new UDim(0, 12)}
				PaddingRight={new UDim(0, 12)}
				PaddingTop={new UDim(0, 8)}
				PaddingBottom={new UDim(0, 8)}
			/>
			<textbox
				Size={UDim2.fromScale(1, 1)}
				AutomaticSize={Enum.AutomaticSize.None}
				BackgroundTransparency={1}
				BorderSizePixel={0}
				Font={Enum.Font.Unknown}
				FontFace={UITheme.fonts.regular}
				Text={Value}
				PlaceholderText={Placeholder}
				PlaceholderColor3={UITheme.colors.textMuted}
				TextColor3={Disabled ? UITheme.colors.textMuted : UITheme.colors.text}
				TextSize={16}
				TextXAlignment={Enum.TextXAlignment.Left}
				TextYAlignment={Enum.TextYAlignment.Center}
				TextTruncate={Enum.TextTruncate.AtEnd}
				TextEditable={!Disabled}
				ClearTextOnFocus={false}
				Event={{
					InputChanged: (rbx: TextBox) => !Disabled && onChange?.(rbx.Text),
					Focused: () => {
						if (!Disabled) {
							setFocused(true);
							onFocused?.();
						}
					},
					FocusLost: () => {
						setFocused(false);
						onFocusLost?.();
					},
				}}
			/>
		</frame>
	);
}
