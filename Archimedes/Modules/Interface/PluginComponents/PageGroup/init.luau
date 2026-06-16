local Vendor = script:FindFirstAncestorWhichIsA("Folder");
local Roact = require(Vendor.Roact);

local StudioComponents = require(Vendor.StudioComponents);

local PageGroup = Roact.Component:extend("PageGroup");

local Pages = {};
for _,v in ipairs(script:GetChildren()) do
	if v:IsA("ModuleScript") then
		table.insert(Pages, require(v));
	end
end

function PageGroup:render()
	local pages = {};
	
	for _,v in ipairs(Pages) do
		table.insert(pages, Roact.createElement(v, self.props));
	end
	
	return Roact.createFragment(pages);
end

return PageGroup;