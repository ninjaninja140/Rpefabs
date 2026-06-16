local Vendor = script:FindFirstAncestorWhichIsA("Folder");
local Roact = require(Vendor.Roact);

local StudioComponents = require(Vendor.StudioComponents);

local RoundButton = Roact.Component:extend("RoundButton");

RoundButton.defaultProps = {
	Size = UDim2.new(1, 0, 0, 45);
	LayoutOrder = 0;
};

function RoundButton:render()
	return StudioComponents.withTheme(function(theme)
		return Roact.createElement("Frame", {
			Size = self.props.Size;
			BackgroundTransparency = 1;
			ZIndex = 0;
			LayoutOrder = self.props.LayoutOrder;
		}, {
			Roact.createElement("UIPadding", {
				PaddingTop = UDim.new(0, 5);
				PaddingBottom = UDim.new(0, 5);
				PaddingLeft = UDim.new(0, 5);
				PaddingRight = UDim.new(0, 5);
			});

			Roact.createElement(StudioComponents.BaseButton, {
				Text = self.props.Text;
				Font = StudioComponents.Constants.FontBold;
				AnchorPoint = Vector2.new(0.5, 0.5);
				Position = UDim2.fromScale(0.5, 0.5);
				Size = self.props.ButtonSize or UDim2.fromScale(.75, 1);
				
				TextColorStyle = self.props.TextColorStyle or Enum.StudioStyleGuideColor.DialogMainButtonText;
				BackgroundColorStyle = self.props.BackgroundColorStyle or Enum.StudioStyleGuideColor.DialogMainButton;

				OnActivated = self.props.OnActivated;
			}, {
				Roact.createElement("UICorner", {
					CornerRadius = UDim.new(0, 5);
				});
				
				Roact.createElement("UIStroke", {
					ApplyStrokeMode = Enum.ApplyStrokeMode.Border;
					Color = theme:GetColor(self.props.BorderColorStyle or Enum.StudioStyleGuideColor.DialogButtonBorder);
				});
			});
		});
	end)
end

return RoundButton;