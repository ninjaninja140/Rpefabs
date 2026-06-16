local Vendor = script:FindFirstAncestorWhichIsA("Folder");
local Roact = require(Vendor.Roact);

local StudioComponents = require(Vendor.StudioComponents);
local Page = require(Vendor.PluginComponents.Page);
local Property = require(Vendor.PluginComponents.Property);
local RadialProgressBar = require(Vendor.PluginComponents.RadialProgressBar);

local ArcService = require(Vendor.Parent.ArcService);

local thisPage = Roact.Component:extend(script.Name);

function thisPage:init()
	self:setState({
		Percentage = self.props.arcAngle:getValue();
	});
end

function thisPage:render()
	return StudioComponents.withTheme(function(theme)
		return Roact.createElement(Page, {
			Font = StudioComponents.Constants.FontBold;
			HeaderText = script.Name;
			LayoutOrder = 2;
		}, {
			Roact.createElement("Frame", {
				BackgroundTransparency = 1;
				Size = UDim2.new(1, 0, 0, 90);
			}, {
				Roact.createElement(RadialProgressBar, {
					Percentage = self.state.Percentage;
					
					OnDragged = function(value)
						self:setState({
							Percentage = value;
						});
						
						self.props.updateAngle(value);
						ArcService:set("Angle", value);
					end,
				}, {
					Roact.createElement(StudioComponents.TextInput, {
						AnchorPoint = Vector2.new(0.5, 0.5);
						Position = UDim2.fromScale(0.5, 0.5);
						Size = UDim2.fromScale(.75, 0.5);
						Text = self.props.arcAngle;
						TextScaled = true;
						TextXAlignment = Enum.TextXAlignment.Center;
						BackgroundTransparency = 1;
						ZIndex = 1;
						
						TextFilter = function(text, focusLost)
							local len = text:len();
							
							if not focusLost then
								if text:sub(len, len)=="-" or text:sub(len,len)=="." or (text:find("%.") and text:sub(len,len)=="0") then
									return false;
								end
							end
							
							
							if text~='' then
								local number = tonumber(text);
								
								if number then
									number = math.clamp(number, -270, 270);
								end
								
								return number or ArcService.Settings.Angle;
							else
								if focusLost then
									return ArcService.Settings.Angle;
								end
							end
							
							return text;
						end,
						
						OnChanged = function(text)
							local len = text:len();
							if text:sub(len,len)=="." or (text:find("%.") and text:sub(len,len)=="0")then
								return false;
							end
							
							local number = tonumber(text);
							
							if number then
								self:setState({
									Percentage = number;
								});
								
								self.props.updateAngle(number);
								ArcService:set("Angle", number);
							end
						end,
					});
				});
			});
		});
	end)
end

return thisPage;