local Vendor = script:FindFirstAncestorWhichIsA("Folder");
local Roact = require(Vendor.Roact);

local Util = require(Vendor.Util);

local StudioComponents = require(Vendor.StudioComponents);
local Property = require(script.Parent);

local ArcService = require(Vendor.Parent.ArcService);

local VectorProperty = Roact.Component:extend("VectorProperty");

function filterNumber(text, focusLost, useSetting, axis)
	local currentValue = ArcService.Settings[useSetting][axis] or 0
	
	local len = text:len();
	
	if not focusLost then
		if text:sub(len, len)=="-" or text:sub(len,len)=="." or (text:find("%.") and text:sub(len,len)=="0") then
			return false;
		end
	end
	
	if text~='' then
		local number = tonumber(text);
		return number or currentValue;
	else
		if focusLost then
			return currentValue;
		end
	end
	
	return text;
end

local function round(number)
	return string.format("%.4f", number):gsub("%.?0+$", "")
end

local function getVectorString(vector)
	return round(vector.X)..", "..round(vector.Y)..", "..round(vector.Z)
end

function VectorProperty:init()
	local props = self.props
	local vector = props.Vector;
	
	self:setState({
		Collapsed = true;
		
		X = vector.X or 0;
		Y = vector.Y or 0;
		Z = vector.Z or 0;
	});
	
	local useType = props.UseType or Vector3
	
	function VectorProperty:getVector()
		return useType.new(self.state.X, self.state.Y, self.state.Z);
	end
	
	function VectorProperty:addAxisProperty(axis)
		local rounded = round(self.state[axis])
		return Roact.createElement(Property, {
			HeaderText = axis;
			PaddingEnabled = false;
		}, {
			Roact.createElement(StudioComponents.TextInput, {
				Text = rounded;
				PlaceholderText = rounded;
				Size = UDim2.fromScale(1, 1);
				BackgroundTransparency = 1;
				AutoSelect = true;
				ClearTextOnFocus = false;

				TextFilter = function(text, focusLost)
					local number = filterNumber(text, focusLost, props.HeaderText, axis);
					
					if number then
						self:setState({
							[axis] = number;
						});

						ArcService:set(props.HeaderText, self:getVector());
						
						return number;
					end

					return text;
				end,
			});
		});
	end
	
	local children = props[Roact.Children] or {}
	for i,v in ipairs(Enum.Axis:GetEnumItems()) do
		table.insert(children, i, self:addAxisProperty(v.Name))
	end
	
	self.children = children
end

function VectorProperty:render()
	local vector = getVectorString(self:getVector())
	
	return StudioComponents.withTheme(function(theme)
		return Roact.createElement(StudioComponents.VerticalCollapsibleSection, {
			Size = UDim2.fromScale(1, 1);
			HeaderText = '';
			BackgroundTransparency = 1;
			BorderSizePixel = 0;
			Collapsed = self.state.Collapsed;
			
			Visible = self.props.searchFilter:map(function(text)
				return Util.matchString(text, self.props.HeaderText);
			end);

			OnToggled = function()
				self:setState({
					Collapsed = not self.state.Collapsed;
				});
			end,

			Content = Roact.createElement(Property, {
				HeaderText = self.props.HeaderText;
			}, {
				Roact.createElement(StudioComponents.Label, {
					Text = vector;
					Size = UDim2.fromScale(1, 1);
					BackgroundTransparency = 1;
					TextXAlignment = Enum.TextXAlignment.Left;
				});
			});
		}, self.children)
	end)
end

return VectorProperty;