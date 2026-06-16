local Vendor = script:FindFirstAncestorWhichIsA("Folder");
local Roact = require(Vendor.Roact);

local StudioComponents = require(Vendor.StudioComponents);

local Page = Roact.Component:extend("Page");

function Page:init()
	self:setState({
		Collapsed = self.props.Collapsed;
	});
end

function Page:render()
	return StudioComponents.withTheme(function(theme)
		return Roact.createElement(StudioComponents.VerticalCollapsibleSection, {
			Size = UDim2.fromScale(1, 1);
			BorderSizePixel = 0;
			Font = self.props.Font;
			TextSize = StudioComponents.Constants.TextSize;
			Visible = self.props.Visible;
			LayoutOrder = self.props.LayoutOrder;
			HeaderText = self.props.HeaderText;
			Collapsed = self.state.Collapsed;
			
			searchFilter = self.state.searchFilter;
			
			OnToggled = function()
				self:setState({
					Collapsed = not self.state.Collapsed;
				});
			end,
		}, Roact.createFragment(self.props[Roact.Children], {
			arcAngle = self.props.arcAngle;
			updateAngle = self.props.updateAngle;
		}));
	end)
end

return Page;