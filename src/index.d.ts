/// <reference types="@rbxts/types/plugin" />
/// <reference types="@rbxts/services/plugin" />

declare module '@rbxts/types/plugin' {
	export interface Selection {
		SelectionChanged: RBXScriptSignal;
	}
}

export {};
