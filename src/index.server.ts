import React from '@rbxts/react';
import ReactRoblox from '@rbxts/react-roblox';
import { PrefabsApp } from './components/PrefabsApp';
import { PrefabService } from './services/PrefabService';

const toolbar = plugin.CreateToolbar('Prefabs');
const button = toolbar.CreateButton('Open Prefabs', '', 'rbxasset://textures/ArrowCursor.png');

let dockWidget: DockWidgetPluginGui | undefined;
let root: ReactRoblox.Root | undefined;

button.Click.Connect(() => {
	if (!dockWidget) {
		dockWidget = plugin.CreateDockWidgetPluginGuiAsync(
			'Prefabs Window',
			new DockWidgetPluginGuiInfo(Enum.InitialDockState.Left, true, false, 300, 400, 300, 400)
		);
		(dockWidget as unknown as { Title: string }).Title = 'Prefabs Window';

		const container = new Instance('Frame');
		container.Size = UDim2.fromScale(1, 1);
		container.BackgroundTransparency = 0;
		container.BackgroundColor3 = Color3.fromRGB(13, 14, 18);
		container.BorderSizePixel = 0;
		container.Parent = dockWidget;

		const mouse = plugin.GetMouse();
		root = ReactRoblox.createRoot(container);
		root.render(React.createElement(PrefabsApp, { mouse }));
	}

	dockWidget.Enabled = !dockWidget.Enabled;
});

// Initialize prefab service on plugin load
task.wait(0.5);
PrefabService.scanPrefabs();
