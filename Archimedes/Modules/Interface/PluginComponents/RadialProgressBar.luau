local Vendor = script:FindFirstAncestorWhichIsA("Folder");
local Roact = require(Vendor.Roact);

local StudioComponents = require(Vendor.StudioComponents);

local RadialProgressBar = Roact.Component:extend("RadialProgressBar");

function RadialProgressBar:init()
	self.frameRef = Roact.createRef();
	
	self:setState({
		Dragging = false;
	});
	
	local threshold, lastAngle = 5, 0;

	local function progressToInputPosition(button, input)
		local v1, v2 = button.AbsolutePosition + (button.AbsoluteSize/2), input.Position;
		local angle = math.ceil(math.atan2((v1.Y-v2.Y), v1.X-v2.X)/math.pi*50);

		local maxProgress = 100;
		if angle < 0 then 
			angle += maxProgress;
		end

		if (lastAngle==maxProgress-1 or lastAngle==maxProgress) and angle<threshold then
			angle = maxProgress;
		elseif lastAngle==0 and angle>(maxProgress-threshold) then
			angle = 0;
		end

		lastAngle = angle;
		return angle;
	end
	
	self.onInputBegan = function(_, inputObject)
		if inputObject.UserInputType==Enum.UserInputType.MouseButton1 then
			self:setState({
				Dragging = true;
			});
		end
	end
	
	self.onInputEnded = function(_, inputObject)
		if inputObject.UserInputType == Enum.UserInputType.MouseButton1 then
			self:setState({
				Dragging = false;
			});
		end
	end
	
	local onDragged = self.props.OnDragged;
	
	self.onInputChanged = function(_, inputObject)
		if onDragged and inputObject.UserInputType == Enum.UserInputType.MouseMovement then
			if self.state.Dragging then
				onDragged(progressToInputPosition(self.frameRef:getValue(), inputObject));
			end
		end
	end
end

function RadialProgressBar:render()
	local segments = {};
	
	local percentage = math.clamp(math.abs(self.props.Percentage), .05, 100);
	local quarter = percentage/25;

	local slice = math.floor(quarter);
	local excess = math.ceil(quarter);
	local remainder = (quarter%1)*100;
	
	return StudioComponents.withTheme(function(theme)
		for i = 0,3 do
			local percentage = (i<slice and 100 or i==slice and remainder or 0)/100;
			local value = (percentage == 0 or percentage == 1) and (percentage*-1)+1;
			
			local isTop = i==1 or i==2;
			
			local image = Roact.createElement("ImageLabel", {
				BackgroundTransparency = 1;
				Size = UDim2.fromScale(0.5, 0.5);
				ImageRectSize = Vector2.new(60, 60);
				Position = UDim2.fromScale(isTop and 0.5 or 0, i>1 and 0.5 or 0);
				ImageRectOffset = Vector2.new(isTop and 60 or 0, i>1 and 60 or 0);
				Image = "rbxassetid://8059116589";
				ZIndex = 2;
			}, {
				Roact.createElement("UIGradient", {
					Color = ColorSequence.new(theme:GetColor(Enum.StudioStyleGuideColor.DialogMainButton, Enum.StudioStyleGuideModifier.Default));
					Rotation = math.ceil((i*90)+(-90*(1-percentage)) + (1+(percentage/10))) + 1;
					
					Transparency = value and NumberSequence.new(value, value) or NumberSequence.new{
						NumberSequenceKeypoint.new(0, 0);
						NumberSequenceKeypoint.new(percentage-.001, 0);
						NumberSequenceKeypoint.new(percentage, 1);
						NumberSequenceKeypoint.new(1, 1);
					};
				});
			});
			
			local background = Roact.createElement("ImageLabel", {
				BackgroundTransparency = 1;
				Position = UDim2.fromScale(isTop and 0.5 or 0, i>1 and 0.5 or 0);
				Size = UDim2.fromScale(0.5, 0.5);
				ImageRectSize = Vector2.new(60, 60);
				ImageRectOffset = Vector2.new(isTop and 60 or 0, i>1 and 60 or 0);
				Image = "rbxassetid://8059116589";
				ImageColor3 = theme:GetColor(Enum.StudioStyleGuideColor.Mid);
				ZIndex = 1;
			});

			table.insert(segments, image);
			table.insert(segments, background);
		end
		
		return Roact.createElement("TextButton", {
			Text = '';
			Size = UDim2.fromScale(1, 1);
			BackgroundTransparency = 1;
			
			[Roact.Event.InputBegan] = self.onInputBegan;
			[Roact.Event.InputEnded] = self.onInputEnded;
			[Roact.Event.InputChanged] = self.onInputChanged;
		}, {
			Roact.createElement("UIPadding", {
				PaddingTop = UDim.new(0, 8);
				PaddingBottom = UDim.new(0, 8);
			});
			
			Roact.createElement("Frame", {
				AnchorPoint = Vector2.new(0.5, 0.5);
				Position = UDim2.fromScale(.5, .5);
				Size = UDim2.fromScale(1, 1);
				BackgroundTransparency = 1;
				
				[Roact.Ref] = self.frameRef;
			}, {
				Roact.createElement("UIAspectRatioConstraint");
				Roact.createFragment(segments);

				unpack(self.props[Roact.Children]);
			});
		});
	end)
end

return RadialProgressBar;