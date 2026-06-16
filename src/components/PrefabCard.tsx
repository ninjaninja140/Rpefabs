import React, { useEffect, useRef } from '@rbxts/react';
import type { LoadedPrefab } from 'services/PrefabService';
import { Tooltip } from 'ui/components/Tooltip';
import { UITheme } from 'ui/theme';

export function PrefabCard({
	prefab,
	onSelect,
	LayoutOrder = 0,
}: {
	prefab: LoadedPrefab;
	onSelect: () => void;
	LayoutOrder?: number;
}) {
	const viewportRef = useRef<ViewportFrame>(undefined);

	useEffect(() => {
		if (!viewportRef.current) return;

		const viewport = viewportRef.current;

		// Clear any existing children
		for (const child of viewport.GetChildren()) {
			child.Destroy();
		}

		// Clone the prefab model for the viewport
		const modelClone = prefab.model.Clone();
		modelClone.Parent = viewport;

		// Set up camera
		const camera = new Instance('Camera');
		camera.Parent = viewport;
		viewport.CurrentCamera = camera;

		// Calculate model size to fit in viewport
		const size = modelClone.GetBoundingBox()[1];
		const maxDim = math.max(size.X, size.Y, size.Z);
		const distance = maxDim * 1.5;

		// Position camera to view the model - static angle
		const modelCFrame = modelClone.GetBoundingBox()[0];
		const cameraPos = modelCFrame.mul(new CFrame(distance, distance * 0.5, distance));
		camera.CFrame = CFrame.lookAt(cameraPos.Position, modelCFrame.Position);

		return () => {
			modelClone.Destroy();
		};
	}, [prefab]);

	return (
		<Tooltip
			Content={prefab.tooltip}
			DelayMs={300}
			Children={
				<textbutton
					Size={new UDim2(0, 120, 0, 120)}
					BackgroundColor3={UITheme.colors.surfaceRaised}
					BackgroundTransparency={0.05}
					BorderSizePixel={0}
					Text=''
					AutoButtonColor={false}
					LayoutOrder={LayoutOrder}
					Event={{
						MouseButton1Click: onSelect,
					}}
				>
					<uicorner CornerRadius={UITheme.radius.md} />
					<uistroke Color={UITheme.colors.stroke} Transparency={0.3} Thickness={2} />

					{/* Viewport for 3D preview */}
					<frame Size={new UDim2(1, 0, 0.7, 0)} BackgroundTransparency={1} BorderSizePixel={0}>
						<uicorner CornerRadius={UITheme.radius.md} />
						<viewportframe
							ref={viewportRef}
							Size={new UDim2(1, 0, 1, 0)}
							BackgroundTransparency={1}
							BorderSizePixel={0}
						/>
					</frame>

					{/* Name label */}
					<textlabel
						Size={new UDim2(1, 0, 0.2, 0)}
						Position={new UDim2(0, 0, 0.7, 0)}
						BackgroundTransparency={1}
						BorderSizePixel={0}
						Font={Enum.Font.Unknown}
						FontFace={UITheme.fonts.semiBold}
						Text={prefab.name}
						TextColor3={UITheme.colors.text}
						TextSize={13}
						TextXAlignment={Enum.TextXAlignment.Center}
						TextYAlignment={Enum.TextYAlignment.Center}
						TextWrapped={true}
					/>
				</textbutton>
			}
		/>
	);
}
