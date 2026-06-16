local Vendor = script:FindFirstAncestorWhichIsA("Folder");
local Roact = require(Vendor.Roact);
local Util = require(Vendor.Util);

local StudioComponents = require(Vendor.StudioComponents);
local Page = require(Vendor.PluginComponents.Page);
local Property = require(Vendor.PluginComponents.Property);
local InstanceProperty = require(Vendor.PluginComponents.Property.InstanceProperty);

local ArcService = require(Vendor.Parent.ArcService);

local thisPage = Roact.Component:extend(script.Name);

local defaults = {
	{Axis = "X", Rotation = {Yaw = false, Pitch = false}, Alts = {Yaw = "X²", Pitch = "X"}};
	{Axis = "Y", Rotation = {Roll = false, Pitch = false}, Alts = {Roll = "Y²", Pitch = "Y"}};
	{Axis = "Z", Rotation = {Yaw = false, Pitch = false}, Alts = {Yaw = "Z²", Pitch = "Z"}};
};

function thisPage:init()
	local state = {
		SelectedAxis = ArcService.Settings.Axis;
		SelectedAngle = ArcService.Settings.RotationType;
		Surface = ArcService:getFace(ArcService.Settings.Axis) or Enum.NormalId.Top;
	};

	for _,v in ipairs(defaults) do
		local axis = v.Axis;
		local rotation = v.Rotation;

		if axis==ArcService.Settings.Axis then
			v.Rotation[ArcService.Settings.RotationType] = true;
		end

		state[axis] = rotation;
	end

	self:setState(state);

	local getAxisStates = function(list, exceptionAxis, exceptionAngle)
		for _,v in ipairs(defaults) do
			local axis = v.Axis;
			for j, _ in pairs(v.Rotation) do
				if (axis~=exceptionAxis or j~=exceptionAngle) and self.state[axis][j] then
					if not list[axis] then
						list[axis] = self.state[axis];
					end

					list[axis][j] = false;
				end
			end
		end
	end

	self.updateAxisState = function(axis, angle, surface, swapped)
		local multidirectional = ArcService.Settings.Multidirectional;
		local newState = {};

		local axisState = self.state[axis];
		axisState[angle] = surface and true or not axisState[angle];

		if not multidirectional then
			getAxisStates(newState, axis, angle);
		end

		newState[axis] = axisState;

		if surface then
			newState.Surface = surface;
		else
			local newSurface = ArcService:getFace(axis);
			if self.state.Surface ~= newSurface then
				newState.Surface = newSurface;
			end
		end

		self:setState(newState);
		
		ArcService:set({
			Axis = axis;
			RotationType = angle;
			Surface = surface;
			SwapSides = if swapped~=nil then swapped else ArcService.Settings.SwapSides;
		});
	end
end

-- this is set up stupidly, don't do what I did here
function thisPage:render()
	local directionProperties = {};
	local windowMode = ArcService.Settings.WindowMode;

	return StudioComponents.withTheme(function(theme)
		if windowMode=="Widget" then
			table.insert(directionProperties, Roact.createElement(InstanceProperty, {
				HeaderText = "Face";
				Text = self.state.Surface.Name;
				searchFilter = self.props.searchFilter;

				OnSelected = function(target, surface)
					local axis, swapped = ArcService:getAxisFromNormalId(surface);
					self.updateAxisState(axis, "Pitch", surface, swapped);
				end,
			}));

			local count = 0;

			for _,data in ipairs(defaults) do
				local list = {};

				for angle, state in pairs(data.Rotation) do
					count +=1;

					local order = windowMode=="Widget" and angle=="Pitch" and 1 or 2;
					local altText = data.Alts[angle];

					if windowMode~="Widget" then
						order = count + altText:len();
					end

					local property = Roact.createElement(Property, {
						HeaderText = windowMode=="Widget" and angle or altText;
						LayoutOrder = order;
						searchFilter = self.props.searchFilter;

						OnMouseEnter = function()
							self:setState({
								AxisHover = data.Axis;
								AngleHover = angle;
							});

							ArcService:addSelectionFaces(data.Axis);
						end;

						OnMouseLeave = function()
							if self.state.AxisHover==data.Axis and self.state.AngleHover==angle then
								self:setState({
									AxisHover = nil;
									AngleHover = nil;
								});

								ArcService:removeSelectionFaces();
							end
						end,
					}, {
						Roact.createElement(StudioComponents.Checkbox, {
							--Value = ArcService.Settings.Axis==data.Axis and ArcService.Settings.RotationType == angle;
							Value = self.state[data.Axis][angle];
							
							OnActivated = function()
								self.updateAxisState(data.Axis, angle);
							end,
						});
					});

					table.insert(list, property);
				end

				local page;

				if windowMode=="Widget" then
					page = Roact.createElement(Page, {
						HeaderText = data.Axis;
						Size = UDim2.fromScale(0, 0);
					}, list);
				else
					page = Roact.createFragment(list);
				end

				table.insert(directionProperties, page);
			end
		else
			local buttons = {};

			for _,data in ipairs(defaults) do
				local list = {};

				for angle, state in pairs(data.Rotation) do
					local altText = data.Alts[angle];
					local order = altText:len()>1 and 4 or 1;
					
					local isSelected = ArcService.Settings.Axis==data.Axis and ArcService.Settings.RotationType==angle;

					local button = Roact.createElement(StudioComponents.Button, {
						Text = altText;
						LayoutOrder = order;
						BackgroundTransparency = 0;
						Font = StudioComponents.Constants.FontBold;
						TextSize = StudioComponents.Constants.TextSize + 2;
						
						TextColorStyle = (theme.Name=="Dark" and Enum.StudioStyleGuideColor.ButtonText) or (isSelected and Enum.StudioStyleGuideColor.MainBackground) or Enum.StudioStyleGuideColor.ButtonText;
						BackgroundColorStyle = isSelected and Enum.StudioStyleGuideColor.DialogMainButton or Enum.StudioStyleGuideColor.Button;

						Visible = self.props.searchFilter:map(function(text)
							return Util.matchString(text, altText);
						end);

						OnInputBegan = function(_, input)
							if input.UserInputType == Enum.UserInputType.MouseMovement then
								self:setState({
									AxisHover = data.Axis;
									AngleHover = angle;
								});

								ArcService:addSelectionFaces(data.Axis);
							end
						end,

						OnInputEnded = function(_, input)
							if input.UserInputType == Enum.UserInputType.MouseMovement then
								if self.state.AxisHover==data.Axis and self.state.AngleHover==angle then
									self:setState({
										AxisHover = nil;
										AngleHover = nil;
									});

									ArcService:removeSelectionFaces();
								end
							end
						end,

						OnActivated = function()
							self.updateAxisState(data.Axis, angle);
						end,
					}, {
						Roact.createElement("UICorner", {
							CornerRadius = UDim.new(0, 5);
						});
					});

					table.insert(buttons, button);
				end
			end

			local frame = Roact.createElement("Frame", {
				Size = UDim2.new(1, 0, 0, 80);
				BackgroundTransparency = 1;
			}, {
				Roact.createElement("UIGridLayout", {
					CellSize = UDim2.new(1/3, -5, 0.5, -5);
					HorizontalAlignment = Enum.HorizontalAlignment.Center;
					VerticalAlignment = Enum.VerticalAlignment.Center;
					SortOrder = Enum.SortOrder.LayoutOrder;
				});

				Roact.createFragment(buttons);
			});

			table.insert(directionProperties, frame);
		end

		return Roact.createElement(Page, {
			HeaderText = script.Name;
			Font = StudioComponents.Constants.FontBold;
			LayoutOrder = 1;
		}, directionProperties);
	end)
end

return thisPage;