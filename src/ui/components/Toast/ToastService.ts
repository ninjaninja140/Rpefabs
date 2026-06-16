export type ToastKind = 'warning' | 'danger' | 'fatal' | 'success' | 'info';

export type ToastPosition =
	| 'bottom-left'
	| 'bottom-right'
	| 'bottom-center'
	| 'top-left'
	| 'top-right'
	| 'top-center'
	| 'middle-left'
	| 'middle-right';

export interface ToastOptions {
	position: ToastPosition;
	duration: number;
	showTimer: boolean;
	maxVisible: number;
}

export interface ToastInput {
	title: string;
	message?: string;
	kind?: ToastKind;
	duration?: number;
	showTimer?: boolean;
	onClick?: (toast: ToastRecord) => void;
	onClose?: (toast: ToastRecord) => void;
}

export interface ToastRecord extends Required<Omit<ToastInput, 'message' | 'onClick' | 'onClose'>> {
	id: string;
	message?: string;
	createdAt: number;
	closing: boolean;
	onClick?: (toast: ToastRecord) => void;
	onClose?: (toast: ToastRecord) => void;
}

export interface ToastSnapshot {
	options: ToastOptions;
	toasts: ToastRecord[];
}

type ToastListener = (snapshot: ToastSnapshot) => void;

const DEFAULT_OPTIONS: ToastOptions = {
	position: 'bottom-right',
	duration: 5,
	showTimer: false,
	maxVisible: 5,
};

let options: ToastOptions = { ...DEFAULT_OPTIONS };
let toasts: ToastRecord[] = [];
let nextToastId = 0;
const listeners = new Set<ToastListener>();

function getSnapshot(): ToastSnapshot {
	return {
		options,
		toasts,
	};
}

function emit() {
	const snapshot = getSnapshot();

	listeners.forEach((listener) => {
		listener(snapshot);
	});
}

export function subscribeToToasts(listener: ToastListener) {
	listeners.add(listener);
	listener(getSnapshot());

	return () => listeners.delete(listener);
}

export function setToastOptions(nextOptions: Partial<ToastOptions>) {
	options = {
		...options,
		...nextOptions,
	};

	emit();
}

export function resetToastOptions() {
	options = { ...DEFAULT_OPTIONS };
	emit();
}

export function showToast(input: ToastInput) {
	const toastRecord: ToastRecord = {
		id: `toast-${nextToastId++}`,
		title: input.title,
		message: input.message,
		kind: input.kind ?? 'info',
		duration: input.duration ?? options.duration,
		showTimer: input.showTimer ?? options.showTimer,
		createdAt: os.clock(),
		closing: false,
		onClick: input.onClick,
		onClose: input.onClose,
	};

	toasts = [...toasts, toastRecord];
	emit();

	if (toastRecord.duration > 0) {
		task.delay(toastRecord.duration, () => closeToast(toastRecord.id));
	}

	return toastRecord.id;
}

export function closeToast(id: string) {
	toasts = toasts.map((toastRecord) => {
		if (toastRecord.id !== id || toastRecord.closing) return toastRecord;

		toastRecord.onClose?.(toastRecord);

		return {
			...toastRecord,
			closing: true,
		};
	});

	emit();
}

export function removeToast(id: string) {
	toasts = toasts.filter((toastRecord) => toastRecord.id !== id);
	emit();
}

export function clearToasts() {
	toasts = toasts.map((toastRecord) => {
		if (toastRecord.closing) return toastRecord;

		toastRecord.onClose?.(toastRecord);

		return {
			...toastRecord,
			closing: true,
		};
	});
	emit();
}

export const toast = {
	show: showToast,
	close: closeToast,
	clear: clearToasts,
	options: setToastOptions,
	resetOptions: resetToastOptions,
	warning: (input: Omit<ToastInput, 'kind'>) => showToast({ ...input, kind: 'warning' }),
	danger: (input: Omit<ToastInput, 'kind'>) => showToast({ ...input, kind: 'danger' }),
	fatal: (input: Omit<ToastInput, 'kind'>) => showToast({ ...input, kind: 'fatal' }),
	success: (input: Omit<ToastInput, 'kind'>) => showToast({ ...input, kind: 'success' }),
	info: (input: Omit<ToastInput, 'kind'>) => showToast({ ...input, kind: 'info' }),
};
