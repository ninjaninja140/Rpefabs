import React from '@rbxts/react';
import ReactRoblox from '@rbxts/react-roblox';
import { PlacementSystem } from 'PlacementSystem';
import { PrefabService } from 'PrefabService';
import { PrefabsApp } from 'PrefabsApp';
import { UITheme } from 'components/theme';

const toolbar = plugin.CreateToolbar('Prefabs');
const button = toolbar.CreateButton('Prefabs Library', 'Open the prefabs library', 'rbxassetid://100658531007628');
const refreshButton = toolbar.CreateButton(
	'Refresh Library',
	'Refresh the prefabs library',
	'rbxassetid://114103761761113'
);

let dockWidget: DockWidgetPluginGui | undefined;
let root: ReactRoblox.Root | undefined;

function cleanup() {
	if (root) {
		root.unmount();
		root = undefined;
	}
	PlacementSystem.cancelPlacement();
	if (dockWidget) {
		dockWidget.Destroy();
		dockWidget = undefined;
	}
}

function open() {
	if (dockWidget) return;

	dockWidget = plugin.CreateDockWidgetPluginGuiAsync(
		'Prefabs Window',
		new DockWidgetPluginGuiInfo(Enum.InitialDockState.Left, true, false, 300, 400, 300, 400)
	);
	(dockWidget as unknown as { Title: string }).Title = 'Prefabs Window';

	const container = new Instance('Frame');
	container.Size = UDim2.fromScale(1, 1);
	container.BackgroundTransparency = 0;
	container.BackgroundColor3 = UITheme.colors.surface;
	container.BorderSizePixel = 0;
	container.Parent = dockWidget;

	const mouse = plugin.GetMouse();
	root = ReactRoblox.createRoot(container);
	root.render(React.createElement(PrefabsApp, { mouse }));

	dockWidget.GetPropertyChangedSignal('Enabled').Connect(() => {
		if (dockWidget && !dockWidget.Enabled) cleanup();
	});

	dockWidget.Enabled = true;
}

refreshButton.Click.Connect(() => {
	if (!dockWidget) return;
	return PrefabService.scanPrefabs();
});

button.Click.Connect(() => {
	if (dockWidget) cleanup();
	else {
		open();
		task.wait(0.5);
		PrefabService.scanPrefabs();
	}
});

plugin.Unloading.Connect(cleanup);
