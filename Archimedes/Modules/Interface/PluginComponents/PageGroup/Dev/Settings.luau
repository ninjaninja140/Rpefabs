local Vendor = script:FindFirstAncestorWhichIsA("Folder");
local Roact = require(Vendor.Roact);
local Util = require(Vendor.Util);

local StudioComponents = require(Vendor.StudioComponents);
local Page = require(Vendor.PluginComponents.Page);
local Property = require(Vendor.PluginComponents.Property);

local ArcService = require(Vendor.Parent.ArcService);

local thisPage = Roact.Component:extend(script.Name);

local properties = {
	{Name = "Sound", Content = {
		Type = "Checkbox";
		Value = true;
	}};
	
	{Name = "SelectionBox", Content = {
		Type = "Checkbox";
		Value = true;
	}};
};

function thisPage:init()
	local states = {};
	
	for _,v in ipairs(properties) do
		if v.Content then
			states[v.State or v.Name] = v.Content.Value;
			--ArcService[v.State or v.Name] = v.Content.Value;
		end
	end
	
	self:setState(states);
end

function thisPage:render()
	local checkboxProperties = {};
	for _,v in ipairs(properties) do
		if v.Content and v.Content.Type == "Checkbox" then
			local state = v.State or v.Name;
			
			local property = Roact.createElement(Property, {
				HeaderText = v.Name;
				searchFilter = self.props.searchFilter;
			}, {
				Roact.createElement(StudioComponents.Checkbox, {
					Value = self.state[state];
					
					OnActivated = function()
						local newState = not self.state[state];
						
						self:setState({
							[state] = newState;
						});
					end,
				});
			});
			
			table.insert(checkboxProperties, property);
		end
	end
	
	return StudioComponents.withTheme(function(theme)
		return Roact.createElement(Page, {
			Font = StudioComponents.Constants.FontBold;
			HeaderText = "Plugin Settings";
			Collapsed = true;
			LayoutOrder = 3;
			
			Visible = self.props.searchFilter:map(function(text)
				if text=='' then
					return true;
				end
				
				for _,v in ipairs(properties) do
					if Util.matchString(text, v.Name) then
						return true;
					end
				end
				
				return false;
			end)
		}, {
			Roact.createFragment(checkboxProperties);
			
			Roact.createElement(Property, {
				HeaderText = "BoxColor";
			}, {
				Roact.createElement("TextButton", {
					Text = '';
					Size = UDim2.fromOffset(15, 15);
					BackgroundColor3 = Color3.fromRGB(13, 105, 172);
				});
				
				Roact.createElement(StudioComponents.Label, {
					Position = UDim2.fromOffset(15+10, 0);
					Size = UDim2.new(1, -15-10, 1, 0);
					TextTruncate = Enum.TextTruncate.AtEnd;
					Text = BrickColor.new(Color3.fromRGB(13, 105, 172)).Name;
					TextXAlignment = Enum.TextXAlignment.Left;
				});
			})
		});
	end)
end

return thisPage;