import React, { useEffect, useRef } from '@rbxts/react';
import { RunService } from '@rbxts/services';
import { UITheme } from 'components/theme';
import { Tooltip } from 'components/ui/Tooltip';
import type { LoadedPrefab } from 'PrefabService';

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
	const modelRef = useRef<Model | undefined>(undefined);
	const cameraRef = useRef<Camera | undefined>(undefined);
	const rotationRef = useRef(0);

	useEffect(() => {
		if (!viewportRef.current) return;

		const viewport = viewportRef.current;

		// Setup camera once
		let camera = viewport.CurrentCamera;
		if (!camera) {
			camera = new Instance('Camera');
			camera.Parent = viewport;
			viewport.CurrentCamera = camera;
		}
		cameraRef.current = camera;

		// Clone model once
		const modelClone = prefab.model.Clone();
		modelClone.Parent = viewport;
		modelRef.current = modelClone;

		const [modelCFrame, size] = modelClone.GetBoundingBox();
		const maxDim = math.max(size.X, size.Y, size.Z);
		const distance = maxDim * 1.5;
		const center = modelCFrame.Position;

		// Orbit camera around the model
		const renderConn = RunService.RenderStepped.Connect((dt) => {
			if (!cameraRef.current || !modelRef.current?.Parent) return;

			// Smooth rotation — ~30° per second
			rotationRef.current = (rotationRef.current + dt * 0.5) % (math.pi * 2);

			const angle = rotationRef.current;
			const x = math.cos(angle) * distance;
			const z = math.sin(angle) * distance;
			const y = distance * 0.4;

			const cameraPos = new Vector3(center.X + x, center.Y + y, center.Z + z);
			cameraRef.current.CFrame = CFrame.lookAt(cameraPos, center);
		});

		return () => {
			renderConn.Disconnect();
			modelClone.Destroy();
			modelRef.current = undefined;
		};
	}, [prefab]);

	return (
		<Tooltip
			Content={prefab.tooltip}
			Side='bottom'
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

					<frame Size={new UDim2(1, 0, 0.7, 0)} BackgroundTransparency={1} BorderSizePixel={0}>
						<uicorner CornerRadius={UITheme.radius.md} />
						<viewportframe
							ref={viewportRef}
							Size={new UDim2(1, 0, 1, 0)}
							BackgroundTransparency={1}
							BorderSizePixel={0}
						/>
					</frame>

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
