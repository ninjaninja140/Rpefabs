local Vendor = script:FindFirstAncestorWhichIsA("Folder");
local Roact = require(Vendor.Roact);

local Util = require(Vendor.Util);

local StudioComponents = require(Vendor.StudioComponents);

local Property = Roact.Component:extend("Property");

function Property:init()
	local onMouseEnter = self.props.OnMouseEnter;
	local onMouseLeave = self.props.OnMouseLeave;
	
	self.onInputBegan = function(_, inputObject)
		if inputObject.UserInputType == Enum.UserInputType.MouseMovement then
			self:setState({
				Hover = true;
			});
			
			if onMouseEnter then
				onMouseEnter();
			end
		end
	end

	self.onInputEnded = function(_, inputObject)
		if inputObject.UserInputType == Enum.UserInputType.MouseMovement then
			self:setState({
				Hover = false;
			});
			
			if onMouseLeave then
				onMouseLeave();
			end
		end
	end
end

function Property:render()
	local paddingEnabled = self.props.PaddingEnabled~=false;
	
	return StudioComponents.withTheme(function(theme)
		local backgroundColor = Enum.StudioStyleGuideColor.Item;
		
		if self.props.Selected then
			backgroundColor = Enum.StudioStyleGuideColor.MainButton;
		elseif self.state.Hover then
			backgroundColor = Enum.StudioStyleGuideColor.Button;
		end
		
		backgroundColor = theme:GetColor(backgroundColor);
		
		return Roact.createElement("Frame", {
			Size = UDim2.new(1, 0, 0, 24);
			LayoutOrder = self.props.LayoutOrder;
			
			Visible = self.props.searchFilter and self.props.searchFilter:map(function(text)
				return Util.matchString(text, self.props.HeaderText);
			end);
			
			BackgroundTransparency = 1;
		}, {
			Roact.createElement("Frame", {
				Size = UDim2.fromScale(1, 1);
				BackgroundTransparency = 1;
				ZIndex = 15;
				
				[Roact.Event.InputBegan] = self.onInputBegan;
				[Roact.Event.InputEnded] = self.onInputEnded;
			});
			
			Roact.createElement("Frame", {
				Size = UDim2.fromScale(.5, 1);
				BackgroundColor3 = backgroundColor;
				BorderColor3 = theme:GetColor(Enum.StudioStyleGuideColor.Border);
			}, {
				Roact.createElement(StudioComponents.Label, {
					BackgroundTransparency = 1;
					Size = UDim2.fromScale(1, 1);
					Text = self.props.HeaderText;
					TextXAlignment = Enum.TextXAlignment.Left;
				});
				
				Roact.createElement("UIPadding", {
					PaddingLeft = UDim.new(0, 24);
				});
			});
			
			Roact.createElement("Frame", {
				Position = UDim2.fromScale(0.5, 0);
				Size = UDim2.fromScale(.5, 1);
				BackgroundColor3 = backgroundColor;
				BorderColor3 = theme:GetColor(Enum.StudioStyleGuideColor.Border);
			}, {
				paddingEnabled and Roact.createElement("UIPadding", {
					PaddingTop = UDim.new(0, 4);
					PaddingBottom = UDim.new(0, 4);
					PaddingLeft = UDim.new(0, 4);
					PaddingRight = UDim.new(0, 4);
				});
				
				Roact.createFragment(self.props[Roact.Children], {
					Selected = self.props.Selected;
				});
			});
		});
	end)
end

return Property;