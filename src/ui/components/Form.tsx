import React, { useState } from "@rbxts/react";
import { UITheme } from "ui/theme";

export type FormField = {
	id: string;
	label: string;
	value: string;
	error?: string;
	required?: boolean;
	placeholder?: string;
	type?: "text" | "email" | "password" | "number";
};

export function Form({
	Fields,
	Title,
	Description,
	SubmitLabel = "Submit",
	CancelLabel = "Cancel",
	Size = new UDim2(1, 0, 0, 0),
	LayoutOrder,
	onSubmit,
	onCancel,
	onChange,
}: {
	Fields: FormField[];
	Title?: string;
	Description?: string;
	SubmitLabel?: string;
	CancelLabel?: string;
	Size?: UDim2;
	LayoutOrder?: number;
	onSubmit?: (values: Record<string, string>) => void;
	onCancel?: () => void;
	onChange?: (fieldId: string, value: string) => void;
}) {
	const [values, setValues] = useState<Record<string, string>>(
		Fields.reduce((acc, field) => ({ ...acc, [field.id]: field.value }), {}),
	);

	const handleFieldChange = (fieldId: string, value: string) => {
		setValues({ ...values, [fieldId]: value });
		onChange?.(fieldId, value);
	};

	const handleSubmit = () => {
		onSubmit?.(values);
	};

	return (
		<frame
			Size={Size}
			AutomaticSize={
				Size.Y.Scale === 0 ? Enum.AutomaticSize.Y : Enum.AutomaticSize.None
			}
			LayoutOrder={LayoutOrder}
			BackgroundTransparency={1}
			BorderSizePixel={0}
		>
			<uilistlayout
				FillDirection={Enum.FillDirection.Vertical}
				Padding={new UDim(0, 16)}
			/>

			{Title ? (
				<textlabel
					Size={new UDim2(1, 0, 0, 0)}
					AutomaticSize={Enum.AutomaticSize.Y}
					BackgroundTransparency={1}
					BorderSizePixel={0}
					Font={Enum.Font.Unknown}
					FontFace={UITheme.fonts.semiBold}
					Text={Title}
					TextColor3={UITheme.colors.text}
					TextSize={20}
					TextXAlignment={Enum.TextXAlignment.Left}
					TextYAlignment={Enum.TextYAlignment.Top}
					TextWrapped={true}
				/>
			) : undefined}

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
					TextSize={14}
					TextXAlignment={Enum.TextXAlignment.Left}
					TextYAlignment={Enum.TextYAlignment.Top}
					TextWrapped={true}
				/>
			) : undefined}

			{/* Form Fields */}
			<frame
				Size={new UDim2(1, 0, 0, 0)}
				AutomaticSize={Enum.AutomaticSize.Y}
				BackgroundTransparency={1}
			>
				<uilistlayout
					FillDirection={Enum.FillDirection.Vertical}
					Padding={new UDim(0, 12)}
				/>

				{Fields.map((field) => (
					<frame
						key={field.id}
						Size={new UDim2(1, 0, 0, 0)}
						AutomaticSize={Enum.AutomaticSize.Y}
						BackgroundTransparency={1}
					>
						<uilistlayout
							FillDirection={Enum.FillDirection.Vertical}
							Padding={new UDim(0, 4)}
						/>

						{/* Label */}
						<frame
							Size={new UDim2(1, 0, 0, 0)}
							AutomaticSize={Enum.AutomaticSize.Y}
							BackgroundTransparency={1}
						>
							<uilistlayout
								FillDirection={Enum.FillDirection.Horizontal}
								Padding={new UDim(0, 4)}
							/>
							<textlabel
								Size={new UDim2(0, 0, 0, 18)}
								AutomaticSize={Enum.AutomaticSize.X}
								BackgroundTransparency={1}
								BorderSizePixel={0}
								Font={Enum.Font.Unknown}
								FontFace={UITheme.fonts.medium}
								Text={field.label}
								TextColor3={UITheme.colors.text}
								TextSize={14}
								TextXAlignment={Enum.TextXAlignment.Left}
								TextYAlignment={Enum.TextYAlignment.Center}
							/>
							{field.required ? (
								<textlabel
									Size={new UDim2(0, 12, 0, 18)}
									BackgroundTransparency={1}
									BorderSizePixel={0}
									Font={Enum.Font.Unknown}
									FontFace={UITheme.fonts.medium}
									Text="*"
									TextColor3={UITheme.colors.danger}
									TextSize={14}
									TextXAlignment={Enum.TextXAlignment.Center}
									TextYAlignment={Enum.TextYAlignment.Center}
								/>
							) : undefined}
						</frame>

						{/* Input field */}
						<textbox
							Size={new UDim2(1, 0, 0, 40)}
							BackgroundColor3={UITheme.colors.surface}
							BackgroundTransparency={0.1}
							BorderSizePixel={0}
							Font={Enum.Font.Unknown}
							FontFace={UITheme.fonts.regular}
							Text={values[field.id] ?? field.value}
							PlaceholderText={field.placeholder ?? ""}
							PlaceholderColor3={UITheme.colors.textMuted}
							TextColor3={UITheme.colors.text}
							TextSize={14}
							TextXAlignment={Enum.TextXAlignment.Left}
							TextYAlignment={Enum.TextYAlignment.Center}
							Event={{
								InputChanged: (rbx: TextBox) => {
									handleFieldChange(field.id, rbx.Text);
								},
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
						</textbox>

						{/* Error message */}
						{field.error ? (
							<textlabel
								Size={new UDim2(1, 0, 0, 0)}
								AutomaticSize={Enum.AutomaticSize.Y}
								BackgroundTransparency={1}
								BorderSizePixel={0}
								Font={Enum.Font.Unknown}
								FontFace={UITheme.fonts.regular}
								Text={field.error}
								TextColor3={UITheme.colors.danger}
								TextSize={12}
								TextXAlignment={Enum.TextXAlignment.Left}
								TextYAlignment={Enum.TextYAlignment.Top}
								TextWrapped={true}
							/>
						) : undefined}
					</frame>
				))}
			</frame>

			{/* Action buttons */}
			<frame Size={new UDim2(1, 0, 0, 44)} BackgroundTransparency={1}>
				<uilistlayout
					FillDirection={Enum.FillDirection.Horizontal}
					Padding={new UDim(0, 12)}
				/>

				{onCancel ? (
					<textbutton
						Size={new UDim2(0.5, -6, 1, 0)}
						AutoButtonColor={false}
						Text={CancelLabel}
						BackgroundColor3={UITheme.colors.surface}
						BackgroundTransparency={0.16}
						BorderSizePixel={0}
						Font={Enum.Font.Unknown}
						FontFace={UITheme.fonts.medium}
						TextColor3={UITheme.colors.text}
						TextSize={14}
						Event={{
							MouseButton1Click: onCancel,
						}}
					>
						<uicorner CornerRadius={UITheme.radius.md} />
						<uistroke
							Color={UITheme.colors.stroke}
							Transparency={0.72}
							Thickness={2}
						/>
					</textbutton>
				) : undefined}

				{onSubmit ? (
					<textbutton
						Size={onCancel ? new UDim2(0.5, -6, 1, 0) : new UDim2(1, 0, 1, 0)}
						AutoButtonColor={false}
						Text={SubmitLabel}
						BackgroundColor3={UITheme.colors.accent}
						BackgroundTransparency={0.1}
						BorderSizePixel={0}
						Font={Enum.Font.Unknown}
						FontFace={UITheme.fonts.medium}
						TextColor3={UITheme.colors.text}
						TextSize={14}
						Event={{
							MouseButton1Click: handleSubmit,
						}}
					>
						<uicorner CornerRadius={UITheme.radius.md} />
						<uistroke
							Color={UITheme.colors.accent}
							Transparency={0.4}
							Thickness={2}
						/>
					</textbutton>
				) : undefined}
			</frame>
		</frame>
	);
}
