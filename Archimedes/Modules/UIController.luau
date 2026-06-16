local RunService = game:GetService("RunService");
local CoreGui = game:GetService("CoreGui");

local oldPlugin = CoreGui:FindFirstChild("arcGui") or CoreGui:FindFirstChild("Archimedes");
if oldPlugin then
	-- The old plugin ScreenGui stays up after updating. This is a fix for it.
	oldPlugin:Destroy();
end

local UIController = {};

local plugin = script:FindFirstAncestorWhichIsA("Plugin");

local Vendor = script.Parent.Parent;
local Interface = Vendor.Modules.Interface;

local Roact, PluginComponents;

local ArcService = require(Vendor.Modules.ArcService);

local toolbar = plugin:CreateToolbar("Archimedes");
local button = toolbar:CreateButton("Launch Archimedes", "A building plugin created by Scriptos", "rbxassetid://8428151510");

function UIController:init()
	Roact = require(Interface.Roact);
	PluginComponents = require(Interface.PluginComponents);
	
	-- This section has been commented out due to many complaints about Archimedes auto-launching sometimes
	
	--if ArcService.Settings.WidgetOpened and ArcService.Settings.WindowMode=="Widget" and not RunService:IsRunning() then
	--	UIController:toggleButton();
	--end
end

local function closePlugin()
	Roact.unmount(UIController.Handle);
	UIController.Handle = nil;

	ArcService:saveSettings();
	ArcService:unload();
end

function UIController:toggleButton(clicked)
	UIController.Loading = true;
	
	if UIController.Handle then
		ArcService.Settings.Enabled = false;

		if clicked then
			ArcService.Settings.WidgetOpened = false;
		end

		closePlugin();
		UIController.Loading = false;
		return
	end

	if clicked then
		ArcService.Settings.Enabled = true;
		ArcService.Settings.WidgetOpened = true;
	end
	
	ArcService:load();
	
	UIController.Handle = Roact.mount(Roact.createElement(PluginComponents.Main, {
		OnClosed = function()
			closePlugin();
		end,
	}), game:GetService("CoreGui"), "Archimedes");

	if clicked then
		ArcService:preview();
	end
	
	UIController.Loading = false;
end

button.Click:Connect(function()
	if UIController.Loading then
		return
	end
	
	UIController:toggleButton(true);
end)

plugin.Unloading:Connect(function()
	if UIController.Handle then
		closePlugin();
	end
end)

return UIController;