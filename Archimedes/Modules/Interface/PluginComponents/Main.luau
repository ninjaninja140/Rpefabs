local UserInputService = game:GetService("UserInputService");
local plugin = script:FindFirstAncestorWhichIsA("Plugin");

local MarketplaceService = game:GetService("MarketplaceService");
local Selection = game:GetService("Selection");
local CoreGui = game:GetService("CoreGui");

local Vendor = script:FindFirstAncestorWhichIsA("Folder");
local Roact = require(Vendor.Roact);

local ArcService = require(Vendor.Parent.ArcService);
local UIController = require(Vendor.Parent.UIController);

local StudioComponents = require(Vendor.StudioComponents);
local PageGroup = require(script.Parent.PageGroup);

local Main = Roact.Component:extend("Main");

local unmounted = false;
local currentVersion = Vendor.Parent.Parent.Version.Value;

local function onUpdate(method)
	local success, result = pcall(function()
		return MarketplaceService:GetProductInfo(144938633);
	end)

	if success then
		local name = result.Name;

		local _, version = name:match("(%(([^%)]+)%))");
		version = version and version:sub(2);

		if version~=currentVersion then
			if unmounted then
				unmounted = false;
				return
			end

			method();
		end
	end
end

local function resetSettings()
	local settings = ArcService.Settings;
	settings.AutoResize = false;
	settings.Pivot = false;
	settings.Offset = Vector3.new(0, 0, 0);
end

local function getSelectionTitle()
	local selected = Selection:Get();
	local numSelected = #selected;
	if numSelected==0 then
		return
	end

	local title;

	if numSelected==1 then
		local object = selected[1];
		if not ArcService:canRotate(object) then
			return
		end

		title = selected[1].ClassName..' "'..selected[1].Name..'"';
	else
		local appendCount = numSelected.." items";

		local selectedClass;
		for _,v in ipairs(selected) do
			if selectedClass and v.ClassName~=selectedClass then
				return appendCount;
			end

			selectedClass = v.ClassName;
		end

		title = selectedClass..' - '..appendCount;
	end

	return title;
end

local sizes = {};

function Main:init()
	local function getTitle()
		local title = getSelectionTitle();
		return (title and ' - '..title) or '';
	end

	self.selectionChangedSignal = Selection.SelectionChanged:Connect(function()
		self:setState({
			appendTitle = getTitle();
		});

		ArcService:preview();
	end)

	self.searchFilter, self.updateFilter = Roact.createBinding('');
	self.toolTip, self.updateTooltip = Roact.createBinding('');
	
	self.arcAngle, self.updateAngle = Roact.createBinding(ArcService.Settings.Angle);

	self:setState({
		appendTitle = getTitle();
		hasUpdate = false;

		WindowMode = ArcService.Settings.WindowMode;
		WindowPosition = UDim2.new(0, 5, 0.5, 0);
		WindowSize = Vector2.new(190, 460);
	});
end

function Main:render()
	local windowMode = self.state.WindowMode;
	local uiSize = self.state.WindowSize;
	
	return StudioComponents.withTheme(function(theme)
		local expandButton = Roact.createElement("TextButton", {
			Text ='';
			ZIndex = 2;
			BackgroundTransparency = 1;
			Size = UDim2.fromOffset(20, 20);
			Position = windowMode=="Widget" and UDim2.new(1, -21, 0, 0) or UDim2.new(1, -21-20+5, 0, 0);
			
			[Roact.Event.Activated] = function()
				local newState = if self.state.WindowMode=="Widget" then "ScreenGui" else "Widget";
				ArcService:set("WindowMode", newState, true);

				if newState~="Widget" then
					resetSettings();
				end

				self:setState({
					WindowMode = newState;
				});
				
				if self.searchFilter:getValue()~='' then
					self.updateFilter('');
				end
			end,
		}, {
			Roact.createElement("ImageLabel", {
				AnchorPoint = Vector2.new(0.5, 0.5);
				Position = UDim2.fromScale(0.5, 0.5);
				Size = UDim2.fromScale(.5, .5);
				BackgroundTransparency = 1;
				ImageTransparency = 0;
				ImageColor3 = theme:GetColor(Enum.StudioStyleGuideColor.TitlebarText);
				Image = "rbxassetid://"..(self.state.WindowMode=="Widget" and 8455698104 or 8455698807);
				ScaleType = Enum.ScaleType.Fit;
			});
		});
		
		local components = {
			SearchBar = windowMode=="Widget" and Roact.createElement(StudioComponents.TextInput, {
				PlaceholderText = "Filter Archimedes";
				PaddingBottom = UDim.new(0, 2);

				OnChanged = function(text)
					if text==":settings" then
						return
					end

					self.updateFilter(text);
				end,
			});
			
			windowMode=="Widget" and expandButton;

			Container = Roact.createElement(StudioComponents.ScrollFrame, {
				Size = UDim2.new(1, 0, 1, (windowMode=="Widget" and -21-5 or 0)-(windowMode=="Widget" and self.state.hasUpdate and 48+5 or 0));
				Position = UDim2.fromOffset(0, (windowMode=="Widget" and 21+5) or 0);
				Padding = UDim.new(0, 1);
			}, {
				Roact.createElement(PageGroup, {
					searchFilter = self.searchFilter;
					arcAngle = self.arcAngle;
					updateAngle = self.updateAngle;
				});
			});

			UpdateNotification = self.state.hasUpdate and Roact.createElement(StudioComponents.Button, {
				Position = UDim2.new(0, windowMode~="Widget" and 1, 1,-48-1);
				Size = UDim2.new(1, -1-(windowMode~="Widget" and 1 or 0), 0, 48);
				TextWrapped = true;
				Text = "An update for Archimedes\nis available!";
				BackgroundColorStyle = Enum.StudioStyleGuideColor.RibbonButton;
				BorderColorStyle = Enum.StudioStyleGuideColor.Separator;
				Font = StudioComponents.Constants.FontBold;

				OnActivated = function()
					self:setState({
						hasUpdate = false;
					});
				end,
			}, {
				Roact.createElement("Frame", {
					Visible = true;
					Size = UDim2.new(0, 5, 1, 0);
					BorderSizePixel = 0;
					BackgroundColor3 = theme:GetColor(Enum.StudioStyleGuideColor.RibbonTabTopBar, Enum.StudioStyleGuideModifier.Default);
				});
			});
		};

		if self.state.WindowMode=="Widget" then
			return Roact.createElement(StudioComponents.Widget, {
				Id = "Archimedes";
				Title = "Archimedes"..self.state.appendTitle;

				InitialDockState = Enum.InitialDockState.Left;
				MinimumWindowSize = Vector2.new(220, 0);

				OnClosed = self.props.OnClosed;
			}, components);
		else
			local mainWindowSize = self.state.MainWindowSize;
			
			return Roact.createElement("ScreenGui", {
				ZIndexBehavior = Enum.ZIndexBehavior.Sibling;
			}, {
				Roact.createElement("Frame", {
					AnchorPoint = Vector2.new(0, 0.5);
					Size = UDim2.new(0, uiSize.X, 0, uiSize.Y);
					Position = self.state.WindowPosition;
					BackgroundTransparency = 1;
				}, {
					Shadow = Roact.createElement("ImageLabel", {
						AnchorPoint = Vector2.new(0.5, 0);
						Position = UDim2.new(0.5, 0, 0, -15/2);
						Size = mainWindowSize and UDim2.new(0, mainWindowSize.X+15, 0, mainWindowSize.Y+15) or UDim2.new(1, 15, 1, 15);
						Image = "rbxassetid://932334513";
						ImageTransparency = 0.5;
						BackgroundTransparency = 1;
						ImageColor3 = Color3.new(0, 0, 0);
					});
					
					Roact.createElement("TextButton", {
						AutoButtonColor = false;
						BorderSizePixel = 0;
						ZIndex = 2;
						Size = UDim2.fromScale(1, 0);
						AutomaticSize = Enum.AutomaticSize.Y;
						BackgroundColor3 = theme:GetColor(Enum.StudioStyleGuideColor.MainBackground);
						--BorderColor3 = theme:GetColor(Enum.StudioStyleGuideColor.DialogMainButton);
						
						[Roact.Change.AbsoluteSize] = function(object)
							self:setState({
								MainWindowSize = object.AbsoluteSize;
							});
						end,
					}, {
						Titlebar = Roact.createElement("TextButton", {
							BorderSizePixel = 0;
							Size = UDim2.new(1, 0, 0, 20);
							Text = "Archimedes ".."v"..currentVersion;
							Font = Enum.Font.SourceSansBold,
							TextSize = 14;
							TextColor3 = theme:GetColor(Enum.StudioStyleGuideColor.TitlebarText);
							BackgroundColor3 = theme:GetColor(Enum.StudioStyleGuideColor.Titlebar);

							[Roact.Event.InputBegan] = function(_, input)
								if input.UserInputType==Enum.UserInputType.MouseButton1 then
									if not self.state.Dragging then
										self:setState({
											Dragging = true;
										});
									end
								end
							end,

							[Roact.Event.InputEnded] = function(_, input)
								if input.UserInputType==Enum.UserInputType.MouseButton1 then
									if self.state.Dragging then
										self:setState({
											Dragging = false;
										});
									end
								end
							end,
						}, {
							expandButton;
							
							Roact.createElement("TextButton", {
								BackgroundTransparency = 1;
								Size = UDim2.fromOffset(20, 20);
								AnchorPoint = Vector2.new(1, 0.5);
								Position = UDim2.fromScale(1, 0.5);
								TextColor3 = theme:GetColor(Enum.StudioStyleGuideColor.TitlebarText);
								Font = Enum.Font.Arial,
								Text = "X";
								TextSize = 14;
								
								[Roact.Event.Activated] = function()
									UIController:toggleButton(true);
								end,
							});
						});

						Roact.createElement("Frame", {
							Position = UDim2.fromOffset(0, 20);
							Size = UDim2.new(1, 0, 1, -20);
							BackgroundTransparency = 1;
						}, components)
					});
				});
			});
		end
	end)
end

function Main:didMount()
	onUpdate(function()
		self:setState({
			hasUpdate = true;
		});
	end)

	self.inputChangedSignal = UserInputService.InputChanged:Connect(function(input)
		if input.UserInputType==Enum.UserInputType.MouseMovement then
			if self.state.Dragging then
				local position = input.Position;
				position = Vector2.new(position.X, position.Y);
				
				local viewportSize = workspace.CurrentCamera.ViewportSize;
				local windowSize = self.state.WindowSize;
				
				local newPosition = Vector2.new(math.clamp(position.X-(self.state.WindowSize.X/2), 5, viewportSize.X-windowSize.X-5), math.clamp(position.Y+(windowSize.Y/2)-5, (windowSize.Y/2)+5, viewportSize.Y-(windowSize.Y/2)-5));

				self:setState({
					WindowPosition = UDim2.new(0, newPosition.X, 0, newPosition.Y);
				});
			end
		end
	end)
end

function Main:willUnmount()
	unmounted = true;

	local selectionSignal = self.selectionChangedSignal;
	if selectionSignal then
		selectionSignal:Disconnect();
	end

	local inputChangedSignal = self.inputChangedSignal;
	if inputChangedSignal then
		inputChangedSignal:Disconnect();
	end
end

return Main;