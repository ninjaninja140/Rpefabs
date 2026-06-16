local plugin = script:FindFirstAncestorWhichIsA("Plugin");
local Vendor = script:FindFirstAncestorWhichIsA("Folder");

local Roact = require(Vendor.Roact);
local ArcService = require(Vendor.Parent.ArcService);
local StudioComponents = require(Vendor.StudioComponents);

local Prompt = Roact.Component:extend("Prompt");

function Prompt:render()
	return Roact.createElement(StudioComponents.Widget, {
		Id = "ArchimedesWarning4";
		Title = "Archimedes";

		InitialDockState = Enum.InitialDockState.Float;
		MinimumWindowSize = Vector2.new(220, 100);
		FloatingWindowSize = Vector2.new(220, 100);

		OnClosed = self.props.OnClosed;
	}, self.props[Roact.Children]);
end

return Prompt;