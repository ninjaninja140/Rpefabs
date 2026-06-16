import { lerp, useMotion } from "@rbxts/pretty-react-hooks";
import React, { useEffect, useState } from "@rbxts/react";
import { RunService } from "@rbxts/services";
import { LucideIcon } from "ui/components/LucideIcon";
import {
	closeToast,
	removeToast,
	subscribeToToasts,
	type ToastKind,
	type ToastOptions,
	type ToastPosition,
	type ToastRecord,
	type ToastSnapshot,
} from "ui/components/Toast/ToastService";
import { UITheme } from "ui/theme";

const TOAST_WIDTH = 340;
const TOAST_BASE_HEIGHT = 84;
const STACK_GAP = 10;
const COLLAPSED_STACK_GAP = 8;
const EDGE_PADDING = 24;
const ANIMATION_TIME = 0.24;
const SWIPE_THRESHOLD = 52;
const AXIS_LOCK_THRESHOLD = 8;
const TEXT_LINE_HEIGHT = 18;
const MESSAGE_CHARS_PER_LINE = 46;

interface ToastPalette {
	color: Color3;
	accent: Color3;
	icon: string;
}

const PALETTE: Record<ToastKind, ToastPalette> = {
	warning: {
		color: UITheme.colors.warning,
		accent: UITheme.colors.warning,
		icon: "triangle-alert",
	},
	danger: {
		color: UITheme.colors.danger,
		accent: UITheme.colors.danger,
		icon: "circle-x",
	},
	fatal: {
		color: Color3.fromRGB(143, 20, 38),
		accent: Color3.fromRGB(224, 48, 64),
		icon: "octagon-alert",
	},
	success: {
		color: UITheme.colors.success,
		accent: UITheme.colors.success,
		icon: "circle-check",
	},
	info: {
		color: UITheme.colors.accent,
		accent: UITheme.colors.accent,
		icon: "info",
	},
};

const DEFAULT_SNAPSHOT: ToastSnapshot = {
	options: {
		position: "bottom-right",
		duration: 5,
		showTimer: false,
		maxVisible: 5,
	},
	toasts: [],
};

function getPosition(position: ToastPosition) {
	const isTop = position.find("top")[0] !== undefined;
	const isBottom = position.find("bottom")[0] !== undefined;
	const isMiddle = position.find("middle")[0] !== undefined;
	const isLeft = position.find("left")[0] !== undefined;
	const isRight = position.find("right")[0] !== undefined;

	return {
		anchorPoint: new Vector2(
			isLeft ? 0 : isRight ? 1 : 0.5,
			isTop ? 0 : isBottom ? 1 : 0.5,
		),
		position: new UDim2(
			isLeft ? 0 : isRight ? 1 : 0.5,
			isLeft ? EDGE_PADDING : isRight ? -EDGE_PADDING : 0,
			isTop ? 0 : isBottom ? 1 : 0.5,
			isTop ? EDGE_PADDING : isBottom ? -EDGE_PADDING : 0,
		),
		horizontalAlignment: isLeft
			? Enum.HorizontalAlignment.Left
			: isRight
				? Enum.HorizontalAlignment.Right
				: Enum.HorizontalAlignment.Center,
		verticalAlignment: isTop
			? Enum.VerticalAlignment.Top
			: isBottom
				? Enum.VerticalAlignment.Bottom
				: Enum.VerticalAlignment.Center,
		expandsUp: isBottom || isMiddle,
	};
}

function getToastHeight(toastRecord: ToastRecord) {
	const messageLines = toastRecord.message
		? math.clamp(
				math.ceil(toastRecord.message.size() / MESSAGE_CHARS_PER_LINE),
				1,
				4,
			)
		: 0;

	return (
		TOAST_BASE_HEIGHT +
		messageLines * TEXT_LINE_HEIGHT +
		(toastRecord.showTimer ? 18 : 0)
	);
}

function ToastCountdown({
	toastRecord,
	palette,
}: {
	toastRecord: ToastRecord;
	palette: ToastPalette;
}) {
	const [remaining, setRemaining] = useState(math.max(0, toastRecord.duration));
	const [barProgress, setBarProgress] = useMotion(1);

	useEffect(() => {
		let mounted = true;

		const connection = RunService.Heartbeat.Connect(() => {
			if (mounted && !toastRecord.closing) {
				const elapsed = os.clock() - toastRecord.createdAt;
				setRemaining(math.max(0, toastRecord.duration - elapsed));
			}
		});

		return () => {
			mounted = false;
			connection.Disconnect();
		};
	}, [toastRecord.id, toastRecord.closing]);

	const progress =
		toastRecord.duration > 0
			? math.clamp(remaining / toastRecord.duration, 0, 1)
			: 0;

	useEffect(() => {
		setBarProgress.linear(progress, { speed: 10 });
	}, [progress]);

	return (
		<frame
			Size={new UDim2(1, 0, 0, 18)}
			BackgroundTransparency={1}
			LayoutOrder={3}
			ClipsDescendants={false}
		>
			<textlabel
				BackgroundTransparency={1}
				Font={Enum.Font.Unknown}
				FontFace={Font.fromName(
					"BuilderSans",
					Enum.FontWeight.SemiBold,
					Enum.FontStyle.Normal,
				)}
				Text={`${math.ceil(remaining)}s`}
				TextColor3={Color3.fromRGB(255, 255, 255)}
				TextSize={12}
				TextTransparency={0.18}
				TextXAlignment={Enum.TextXAlignment.Right}
				Size={new UDim2(1, 0, 0, 12)}
			/>
			<frame
				AnchorPoint={new Vector2(0, 1)}
				Position={UDim2.fromScale(0, 1)}
				Size={new UDim2(1, 0, 0, 4)}
				BackgroundColor3={Color3.fromRGB(255, 255, 255)}
				BackgroundTransparency={0.82}
				BorderSizePixel={0}
			>
				<uicorner CornerRadius={new UDim(1, 0)} />
				<frame
					Size={barProgress.map((amount) => new UDim2(amount, 0, 1, 0))}
					BackgroundColor3={palette.accent}
					BorderSizePixel={0}
				>
					<uicorner CornerRadius={new UDim(1, 0)} />
				</frame>
			</frame>
		</frame>
	);
}

function ToastCard({
	toastRecord,
	options,
	stackIndex,
	stackOffset,
	stackDepth,
	isExpanded,
	onSettled,
}: {
	toastRecord: ToastRecord;
	options: ToastOptions;
	stackIndex: number;
	stackOffset: number;
	stackDepth: number;
	isExpanded: boolean;
	onSettled: (id: string) => void;
}) {
	const palette = PALETTE[toastRecord.kind];
	const [hovered, setHovered] = useState(false);
	const [dragOrigin, setDragOrigin] = useState<Vector2 | undefined>(undefined);
	const [dragAxis, setDragAxis] = useState<
		"horizontal" | "vertical" | undefined
	>(undefined);
	const [dragOffset, setDragOffset] = useState(Vector2.zero);
	const [dismissOffset, setDismissOffset] = useState(Vector2.zero);
	const [dismissProgress, setDismissProgress] = useMotion(0);
	const [progress, setProgress] = useMotion(0);
	const [scale, setScale] = useMotion(1);
	const [stackMotion, setStackMotion] = useMotion(stackOffset);
	const listPosition = getPosition(options.position);
	const toastHeight = getToastHeight(toastRecord);
	const collapsedScale = math.max(0.88, 1 - stackDepth * 0.04);
	const targetScale =
		hovered && isExpanded ? 1.035 : isExpanded ? 1 : collapsedScale;

	useEffect(() => {
		setStackMotion.spring(stackOffset, { tension: 170, friction: 22 });
		setScale.spring(targetScale, { tension: 180, friction: 20 });
	}, [stackOffset, targetScale]);

	useEffect(() => {
		if (toastRecord.closing) {
			const fallbackOffset = new Vector2(
				listPosition.horizontalAlignment === Enum.HorizontalAlignment.Left
					? -420
					: 420,
				0,
			);
			const exitOffset =
				dismissOffset.Magnitude > 0 ? dismissOffset : fallbackOffset;

			setDismissOffset(exitOffset);
			setDismissProgress.spring(1, { tension: 165, friction: 22 });
			setProgress.linear(0, { speed: 1 / ANIMATION_TIME });
			setScale.spring(0.92, { tension: 180, friction: 22 });
			task.delay(ANIMATION_TIME, () => onSettled(toastRecord.id));
			return;
		}

		setProgress.spring(1, { tension: 180, friction: 20 });
	}, [toastRecord.closing]);

	const activateToast = () => {
		if (toastRecord.closing || dragOffset.Magnitude > 6) return;
		toastRecord.onClick?.(toastRecord);
	};

	const dismissToast = (exitOffset?: Vector2) => {
		if (toastRecord.closing) return;
		setDismissOffset(
			exitOffset ??
				new Vector2(
					listPosition.horizontalAlignment === Enum.HorizontalAlignment.Left
						? -420
						: 420,
					0,
				),
		);
		closeToast(toastRecord.id);
	};

	const inputMoved = (input: InputObject) => {
		if (
			!dragOrigin ||
			(input.UserInputType !== Enum.UserInputType.MouseMovement &&
				input.UserInputType !== Enum.UserInputType.Touch)
		)
			return;

		const rawOffset = new Vector2(input.Position.X, input.Position.Y).sub(
			dragOrigin,
		);
		let lockedAxis = dragAxis;

		if (!lockedAxis && rawOffset.Magnitude >= AXIS_LOCK_THRESHOLD) {
			lockedAxis =
				math.abs(rawOffset.X) >= math.abs(rawOffset.Y)
					? "horizontal"
					: "vertical";
			setDragAxis(lockedAxis);
		}

		setDragOffset(
			lockedAxis === "horizontal"
				? new Vector2(rawOffset.X, 0)
				: lockedAxis === "vertical"
					? new Vector2(0, rawOffset.Y)
					: Vector2.zero,
		);
	};

	const inputEnded = (input: InputObject) => {
		if (
			!dragOrigin ||
			(input.UserInputType !== Enum.UserInputType.MouseButton1 &&
				input.UserInputType !== Enum.UserInputType.Touch)
		)
			return;

		const rawOffset = new Vector2(input.Position.X, input.Position.Y).sub(
			dragOrigin,
		);
		const lockedAxis =
			dragAxis ??
			(math.abs(rawOffset.X) >= math.abs(rawOffset.Y)
				? "horizontal"
				: "vertical");
		const offset =
			lockedAxis === "horizontal"
				? new Vector2(rawOffset.X, 0)
				: new Vector2(0, rawOffset.Y);
		setDragOrigin(undefined);
		setDragAxis(undefined);

		if (
			math.abs(offset.X) > SWIPE_THRESHOLD ||
			math.abs(offset.Y) > SWIPE_THRESHOLD
		) {
			dismissToast(
				new Vector2(
					offset.X !== 0 ? math.sign(offset.X) * 480 : 0,
					offset.Y !== 0 ? math.sign(offset.Y) * 220 : 0,
				),
			);
		} else {
			setDragOffset(Vector2.zero);
		}
	};

	return (
		<frame
			AnchorPoint={new Vector2(0, listPosition.expandsUp ? 1 : 0)}
			Position={stackMotion.map(
				(offset) =>
					new UDim2(
						0,
						0,
						listPosition.expandsUp ? 1 : 0,
						listPosition.expandsUp ? -offset : offset,
					),
			)}
			Size={new UDim2(0, TOAST_WIDTH, 0, toastHeight)}
			BackgroundTransparency={1}
			ClipsDescendants={false}
			ZIndex={100 + (isExpanded ? stackIndex : 20 - stackIndex)}
		>
			<uiscale Scale={scale} />
			<frame
				Size={UDim2.fromScale(1, 1)}
				Position={dismissProgress.map(
					(amount) =>
						new UDim2(
							0,
							lerp(dragOffset.X, dismissOffset.X, amount),
							0,
							lerp(dragOffset.Y, dismissOffset.Y, amount),
						),
				)}
				BackgroundColor3={Color3.fromRGB(0, 0, 0)}
				BackgroundTransparency={progress.map((amount) => lerp(1, 0.22, amount))}
				ClipsDescendants={false}
			>
				<uicorner CornerRadius={new UDim(0, 5)} />
				<uistroke
					Color={progress.map((amount) =>
						Color3.fromRGB(122, 122, 122).Lerp(UITheme.colors.accent, amount),
					)}
					Transparency={progress.map((amount) =>
						lerp(1, hovered ? 0 : 0.7, amount),
					)}
					Thickness={3}
				/>
				<frame
					Size={UDim2.fromScale(1, 1)}
					BackgroundTransparency={1}
					ClipsDescendants={true}
					ZIndex={1}
				>
					<uicorner CornerRadius={new UDim(0, 5)} />
					<uigradient
						Color={new ColorSequence(UITheme.colors.accent)}
						Transparency={progress.map(
							(amount) =>
								new NumberSequence(lerp(1, hovered ? 0 : 1, amount), 1),
						)}
						Rotation={-35}
					/>
				</frame>
				<textbutton
					Size={UDim2.fromScale(1, 1)}
					BackgroundTransparency={1}
					Text=""
					ZIndex={5}
					Event={{
						MouseEnter: () => setHovered(true),
						MouseLeave: () => setHovered(false),
						MouseButton1Click: activateToast,
						InputBegan: (_rbx, input) => {
							if (
								input.UserInputType === Enum.UserInputType.MouseButton1 ||
								input.UserInputType === Enum.UserInputType.Touch
							) {
								setDragOrigin(new Vector2(input.Position.X, input.Position.Y));
							}
						},
						InputChanged: (_rbx, input) => inputMoved(input),
						InputEnded: (_rbx, input) => inputEnded(input),
					}}
				/>
				<frame
					Size={UDim2.fromScale(1, 1)}
					BackgroundTransparency={1}
					ClipsDescendants={true}
					ZIndex={6}
				>
					<uipadding
						PaddingTop={new UDim(0, 14)}
						PaddingBottom={new UDim(0, 12)}
						PaddingLeft={new UDim(0, 14)}
						PaddingRight={new UDim(0, 14)}
					/>
					<uilistlayout
						FillDirection={Enum.FillDirection.Vertical}
						Padding={new UDim(0, 5)}
					/>
					<frame
						Size={new UDim2(1, 0, 0, 28)}
						BackgroundTransparency={1}
						LayoutOrder={1}
					>
						<frame Size={new UDim2(1, -34, 1, 0)} BackgroundTransparency={1}>
							<uilistlayout
								FillDirection={Enum.FillDirection.Horizontal}
								Padding={new UDim(0, 10)}
							/>
							<frame
								Size={UDim2.fromOffset(28, 28)}
								BackgroundColor3={palette.color}
								BackgroundTransparency={0.12}
							>
								<uicorner CornerRadius={new UDim(0, 5)} />
								<LucideIcon
									IconName={palette.icon}
									IconSize={17}
									ImageColor3={Color3.fromRGB(255, 255, 255)}
								/>
							</frame>
							<textlabel
								Size={new UDim2(1, -38, 1, 0)}
								BackgroundTransparency={1}
								Font={Enum.Font.Unknown}
								FontFace={Font.fromName(
									"BuilderSans",
									Enum.FontWeight.Bold,
									Enum.FontStyle.Normal,
								)}
								Text={toastRecord.title}
								TextColor3={Color3.fromRGB(255, 255, 255)}
								TextSize={17}
								TextTruncate={Enum.TextTruncate.AtEnd}
								TextXAlignment={Enum.TextXAlignment.Left}
							/>
						</frame>
						<textbutton
							AnchorPoint={new Vector2(1, 0)}
							Position={UDim2.fromScale(1, 0)}
							Size={UDim2.fromOffset(28, 28)}
							BackgroundColor3={Color3.fromRGB(0, 0, 0)}
							BackgroundTransparency={0.35}
							Text=""
							ZIndex={10}
							Event={{
								MouseButton1Click: () => dismissToast(),
							}}
						>
							<uicorner CornerRadius={new UDim(0, 5)} />
							<LucideIcon
								IconName="x"
								IconSize={16}
								ImageColor3={Color3.fromRGB(255, 255, 255)}
							/>
						</textbutton>
					</frame>
					{toastRecord.message ? (
						<textlabel
							Size={new UDim2(1, 0, 0, 0)}
							AutomaticSize={Enum.AutomaticSize.Y}
							BackgroundTransparency={1}
							Font={Enum.Font.Unknown}
							FontFace={Font.fromName(
								"BuilderSans",
								Enum.FontWeight.Medium,
								Enum.FontStyle.Normal,
							)}
							Text={toastRecord.message}
							TextColor3={Color3.fromRGB(255, 255, 255)}
							TextSize={14}
							TextTransparency={0.1}
							TextWrapped={true}
							TextTruncate={Enum.TextTruncate.None}
							TextXAlignment={Enum.TextXAlignment.Left}
							TextYAlignment={Enum.TextYAlignment.Top}
							LayoutOrder={2}
						/>
					) : undefined}
					{toastRecord.showTimer ? (
						<ToastCountdown toastRecord={toastRecord} palette={palette} />
					) : undefined}
				</frame>
			</frame>
		</frame>
	);
}

function ToastGroup({ snapshot }: { snapshot: ToastSnapshot }) {
	const [hovered, setHovered] = useState(false);
	const position = getPosition(snapshot.options.position);
	const activeToasts = snapshot.toasts;
	const cappedToasts = activeToasts.filter(
		(_toastRecord, index) =>
			index >= math.max(0, activeToasts.size() - snapshot.options.maxVisible),
	);
	const orderedToasts = position.expandsUp
		? cappedToasts.map(
				(_toastRecord, index) => cappedToasts[cappedToasts.size() - index - 1],
			)
		: cappedToasts;
	const isExpanded = hovered || orderedToasts.size() <= 1;

	function getStackOffset(index: number) {
		if (!isExpanded) return index * COLLAPSED_STACK_GAP;

		let offset = 0;
		for (let i = 0; i < index; i++) {
			offset += getToastHeight(orderedToasts[i]) + STACK_GAP;
		}

		return offset;
	}

	if (activeToasts.isEmpty()) return React.createElement(React.Fragment);

	return (
		<frame
			AnchorPoint={position.anchorPoint}
			Position={position.position}
			Size={new UDim2(0, TOAST_WIDTH, 1, -EDGE_PADDING * 2)}
			BackgroundTransparency={1}
			ClipsDescendants={false}
			Event={{
				MouseEnter: () => setHovered(true),
				MouseLeave: () => setHovered(false),
			}}
		>
			{orderedToasts.map((toastRecord, index) => (
				<ToastCard
					key={toastRecord.id}
					toastRecord={toastRecord}
					options={snapshot.options}
					stackIndex={index}
					stackOffset={getStackOffset(index)}
					stackDepth={isExpanded ? 0 : index}
					isExpanded={isExpanded}
					onSettled={removeToast}
				/>
			))}
		</frame>
	);
}

export function ToastProvider() {
	const [snapshot, setSnapshot] = useState<ToastSnapshot>(DEFAULT_SNAPSHOT);

	useEffect(() => {
		const unsubscribe = subscribeToToasts(setSnapshot);

		return () => {
			unsubscribe();
		};
	}, []);

	return (
		<frame
			Size={UDim2.fromScale(1, 1)}
			BackgroundTransparency={1}
			ZIndex={1000}
		>
			<ToastGroup snapshot={snapshot} />
		</frame>
	);
}
