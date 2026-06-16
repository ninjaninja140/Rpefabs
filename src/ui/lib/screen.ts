import { Workspace } from '@rbxts/services';

const BASE_RESOLUTION = new Vector2(1920, 1080);

export function getScale() {
	const viewport = Workspace.CurrentCamera!.ViewportSize;

	const scaleX = viewport.X / BASE_RESOLUTION.X;
	const scaleY = viewport.Y / BASE_RESOLUTION.Y;

	// Keep proportions consistent
	return math.min(scaleX, scaleY);
}
