import React, { useRef, useState } from "@rbxts/react";
import ReactDOM from "@rbxts/react-roblox";
import { UserInputService } from "@rbxts/services";
import { LucideIcon } from "ui/components/LucideIcon";
import { UITheme } from "ui/theme";

export function Select({
	Options,
	Value,
	Placeholder = "Select an option",
	Disabled = false,
	Size = new UDim2(1, 0, 0, 44),
	LayoutOrder,
	onChange,
}: {
	Options: Array<{ value: string; label: string }>;
	Value?: string;
	Placeholder?: string;
	Disabled?: boolean;
	Size?: UDim2;
	LayoutOrder?: number;
	onChange?: (value: string) => void;
}) {
	const [open, setOpen] = useState(false);
	const [hovered, setHovered] = useState<string | undefined>(undefined);
	const [highlightedIndex, setHighlightedIndex] = useState(0);
	const [searchText, setSearchText] = useState("");
	const [dropdownPosition, setDropdownPosition] = useState(
		new UDim2(0, 0, 0, 0),
	);
	const dropdownRef = useRef<Frame>(undefined!);
	const containerRef = useRef<Frame>(undefined!);
	const viewportRef = useRef<ScreenGui>(undefined!);

	const selectedOption = Options.find((opt) => opt.value === Value);
	const displayText = selectedOption?.label ?? Placeholder;

	const filteredOptions = searchText
		? Options.filter(
				(opt) =>
					(opt.label.lower().find(searchText.lower()) !== undefined) as boolean,
			)
		: Options;

	const handleOpenDropdown = () => {
		if (!Disabled) {
			setOpen(!open);
			if (!open && containerRef.current) {
				const frame = containerRef.current;
				const absoluteSize = frame.AbsoluteSize;
				const absolutePosition = frame.AbsolutePosition;

				setDropdownPosition(
					new UDim2(
						0,
						absolutePosition.X,
						0,
						absolutePosition.Y + absoluteSize.Y + 4,
					),
				);
			}
		}
	};

	React.useEffect(() => {
		if (!open) return;

		const handleClickOutside = (input: InputObject) => {
			if (input.UserInputType === Enum.UserInputType.MouseButton1) {
				setOpen(false);
				setSearchText("");
			}
		};

		const conn = UserInputService.InputBegan.Connect(handleClickOutside);
		return () => conn.Disconnect();
	}, [open]);

	const dropdownContent = (
		<frame
			Size={
				new UDim2(
					Size.X.Scale,
					Size.X.Offset,
					0,
					math.min(filteredOptions.size() * 40 + 52, 300),
				)
			}
			Position={dropdownPosition}
			BackgroundColor3={UITheme.colors.surface}
			BackgroundTransparency={0}
			BorderSizePixel={0}
			ZIndex={9999}
			ref={dropdownRef}
		>
			<uicorner CornerRadius={UITheme.radius.md} />
			<uistroke
				Color={UITheme.colors.stroke}
				Transparency={0.72}
				Thickness={2}
			/>

			<uilistlayout
				FillDirection={Enum.FillDirection.Vertical}
				Padding={new UDim(0, 4)}
			/>

			{/* Search box */}
			<frame
				Size={new UDim2(1, 0, 0, 40)}
				BackgroundTransparency={1}
				BorderSizePixel={0}
			>
				<uipadding
					PaddingLeft={new UDim(0, 8)}
					PaddingRight={new UDim(0, 8)}
					PaddingTop={new UDim(0, 6)}
					PaddingBottom={new UDim(0, 6)}
				/>
				<frame
					Size={UDim2.fromScale(1, 1)}
					BackgroundColor3={UITheme.colors.surfaceRaised}
					BackgroundTransparency={0.08}
					BorderSizePixel={0}
				>
					<uicorner CornerRadius={UITheme.radius.sm} />
					<uipadding
						PaddingLeft={new UDim(0, 8)}
						PaddingRight={new UDim(0, 8)}
					/>
					<textlabel
						Size={UDim2.fromScale(1, 1)}
						BackgroundTransparency={1}
						BorderSizePixel={0}
						Font={Enum.Font.Unknown}
						FontFace={UITheme.fonts.regular}
						Text={searchText === "" ? "Search..." : searchText}
						TextColor3={
							searchText === "" ? UITheme.colors.textMuted : UITheme.colors.text
						}
						TextSize={14}
						TextXAlignment={Enum.TextXAlignment.Left}
						TextYAlignment={Enum.TextYAlignment.Center}
					/>
				</frame>
			</frame>

			{/* Options list */}
			<scrollingframe
				Size={new UDim2(1, 0, 1, -40)}
				CanvasSize={UDim2.fromScale(1, 0)}
				BackgroundTransparency={1}
				BorderSizePixel={0}
				ScrollBarThickness={4}
				BottomImage=""
				TopImage=""
				MidImage=""
			>
				<uilistlayout
					FillDirection={Enum.FillDirection.Vertical}
					Padding={new UDim(0, 0)}
				/>
				<uipadding
					PaddingLeft={new UDim(0, 4)}
					PaddingRight={new UDim(0, 4)}
					PaddingBottom={new UDim(0, 4)}
				/>

				{filteredOptions.map((option, index) => (
					<textbutton
						key={option.value}
						Size={new UDim2(1, 0, 0, 36)}
						AutoButtonColor={false}
						Text=""
						BackgroundColor3={
							highlightedIndex === index || hovered === option.value
								? UITheme.colors.accent
								: UITheme.colors.surface
						}
						BackgroundTransparency={
							highlightedIndex === index || hovered === option.value
								? 0.25
								: 0.8
						}
						BorderSizePixel={0}
						Event={{
							MouseEnter: () => setHovered(option.value),
							MouseLeave: () => setHovered(undefined),
							MouseButton1Click: () => {
								onChange?.(option.value);
								setOpen(false);
								setHighlightedIndex(0);
								setSearchText("");
							},
						}}
					>
						<uicorner CornerRadius={UITheme.radius.sm} />
						<uipadding
							PaddingLeft={new UDim(0, 12)}
							PaddingRight={new UDim(0, 12)}
							PaddingTop={new UDim(0, 6)}
							PaddingBottom={new UDim(0, 6)}
						/>
						<textlabel
							Size={UDim2.fromScale(1, 1)}
							BackgroundTransparency={1}
							BorderSizePixel={0}
							Font={Enum.Font.Unknown}
							FontFace={UITheme.fonts.regular}
							Text={option.label}
							TextColor3={
								Value === option.value
									? UITheme.colors.text
									: UITheme.colors.text
							}
							TextSize={14}
							TextXAlignment={Enum.TextXAlignment.Left}
							TextYAlignment={Enum.TextYAlignment.Center}
							TextTruncate={Enum.TextTruncate.AtEnd}
						/>
					</textbutton>
				))}
			</scrollingframe>
		</frame>
	);

	return (
		<>
			<frame
				Size={Size}
				LayoutOrder={LayoutOrder}
				BackgroundTransparency={1}
				BorderSizePixel={0}
				ref={containerRef}
				Event={{
					InputBegan: (_rbx: Frame, input: InputObject) => {
						if (input.UserInputType === Enum.UserInputType.Keyboard) {
							if (!open) {
								if (
									input.KeyCode === Enum.KeyCode.Return ||
									input.KeyCode === Enum.KeyCode.Space
								) {
									setOpen(true);
								}
								return;
							}

							if (input.KeyCode === Enum.KeyCode.Up) {
								setHighlightedIndex(math.max(0, highlightedIndex - 1));
							} else if (input.KeyCode === Enum.KeyCode.Down) {
								setHighlightedIndex(
									math.min(filteredOptions.size() - 1, highlightedIndex + 1),
								);
							} else if (input.KeyCode === Enum.KeyCode.Return) {
								if (filteredOptions[highlightedIndex]) {
									onChange?.(filteredOptions[highlightedIndex].value);
									setOpen(false);
									setSearchText("");
									setHighlightedIndex(0);
								}
							} else if (input.KeyCode === Enum.KeyCode.Escape) {
								setOpen(false);
								setSearchText("");
							}
						}
					},
				}}
			>
				{/* Main dropdown button */}
				<textbutton
					Size={UDim2.fromScale(1, 1)}
					AutoButtonColor={false}
					Active={!Disabled}
					Text=""
					BackgroundColor3={UITheme.colors.surface}
					BackgroundTransparency={0.1}
					BorderSizePixel={0}
					Event={{
						MouseButton1Click: handleOpenDropdown,
					}}
				>
					<uicorner CornerRadius={UITheme.radius.md} />
					<uistroke
						Color={open ? UITheme.colors.accent : UITheme.colors.stroke}
						Transparency={open ? 0.2 : 0.72}
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
						Padding={new UDim(0, 8)}
					/>

					<textlabel
						Size={new UDim2(1, -28, 1, 0)}
						AutomaticSize={Enum.AutomaticSize.None}
						BackgroundTransparency={1}
						BorderSizePixel={0}
						Font={Enum.Font.Unknown}
						FontFace={UITheme.fonts.regular}
						Text={displayText}
						TextColor3={
							selectedOption ? UITheme.colors.text : UITheme.colors.textMuted
						}
						TextSize={16}
						TextXAlignment={Enum.TextXAlignment.Left}
						TextYAlignment={Enum.TextYAlignment.Center}
						TextTruncate={Enum.TextTruncate.AtEnd}
					/>

					<frame Size={UDim2.fromOffset(20, 20)} BackgroundTransparency={1}>
						<LucideIcon
							IconName={open ? "chevron-up" : "chevron-down"}
							IconSize={16}
							ImageColor3={UITheme.colors.text}
						/>
					</frame>
				</textbutton>
			</frame>

			{/* Dropdown rendered in separate viewport portal above everything */}
			{open
				? ReactDOM.createPortal(
						<screengui
							ScreenInsets={Enum.ScreenInsets.None}
							DisplayOrder={9999}
							ZIndexBehavior={Enum.ZIndexBehavior.Sibling}
							ref={viewportRef}
						>
							{dropdownContent}
						</screengui>,
						containerRef.current?.Parent?.Parent as Instance,
						"SelectDropdown",
					)
				: undefined}
		</>
	);
}
