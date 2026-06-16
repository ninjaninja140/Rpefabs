local plugin = script:FindFirstAncestorWhichIsA("Plugin");
local UserInputService = game:GetService("UserInputService");
local Vendor = script:FindFirstAncestorWhichIsA("Folder");
local Roact = require(Vendor.Roact);

local Util = require(Vendor.Util);

local StudioComponents = require(Vendor.StudioComponents);
local Property = require(script.Parent);

local ArcService = require(Vendor.Parent.ArcService);

local InstanceProperty = Roact.Component:extend("InstanceProperty");

local normals = Enum.NormalId:GetEnumItems();
local tolerance = 1-.001;

local function getNormalFromFace(normalId, instance)
	return instance.CFrame:VectorToWorldSpace(Vector3.FromNormalId(normalId))
end

local function normalToFace(castResult)
	local normal = castResult and castResult.Normal;
	local instance = normal and castResult.Instance;

	if not instance then
		return
	end

	for _, normalId in ipairs(normals) do
		if getNormalFromFace(normalId, instance):Dot(normal)>tolerance then
			return normalId;
		end
	end
end

local params = RaycastParams.new();

local function castMouse()
	local mouseLocation = UserInputService:GetMouseLocation();
	local ray = workspace.CurrentCamera:ScreenPointToRay(mouseLocation.X, mouseLocation.Y);
	return workspace:Raycast(ray.Origin, ray.Direction*500, params);
end

function InstanceProperty:init()
	local surfaceSelection = Instance.new("SurfaceSelection");
	surfaceSelection.Parent = game:GetService("CoreGui");

	self.surfaceSelection = surfaceSelection;
end

function InstanceProperty:render()
	return StudioComponents.withTheme(function(theme)
		return Roact.createElement(Property, {
			HeaderText = self.props.HeaderText;
			searchFilter = self.props.searchFilter;
		}, {
			Roact.createElement("TextButton", {
				Text = '';
				BackgroundTransparency = 1;
				Size = UDim2.fromScale(1, 1);

				[Roact.Event.Activated] = function()
					local mouse = plugin:GetMouse();
					local surfaceSelection = self.surfaceSelection;
					
					local inputChanged;
					inputChanged = UserInputService.InputChanged:Connect(function(input)
						if input.UserInputType==Enum.UserInputType.MouseMovement then
							local castResult = castMouse();

							local target = castResult and castResult.Instance;
							local targetSurface = castResult and normalToFace(castResult);

							if not targetSurface then
								return
							end

							local newState = {};

							if target~=self.state.Target then
								newState.Target = target;
							end

							if targetSurface~=self.state.Surface then
								newState.Surface = targetSurface;
							end

							if newState.Target or newState.Surface then
								self:setState(newState);
							end

							surfaceSelection.Adornee = target;
							surfaceSelection.TargetSurface = targetSurface;
						end
					end)

					local inputBegan;
					inputBegan = UserInputService.InputBegan:Connect(function(input)
						if input.UserInputType==Enum.UserInputType.MouseButton1 then
							inputChanged:Disconnect();
							inputBegan:Disconnect();
							
							self.inputChanged = nil;
							self.inputBegan = nil;

							surfaceSelection.Adornee = nil;

							if self.state.Target then
								self.props.OnSelected(self.state.Target, self.state.Surface);
							end
						end
					end)

					self.inputChanged = inputChanged;
					self.inputBegan = inputBegan;
				end,
			}, {
				Roact.createElement(StudioComponents.Label, {
					Text = self.props.Text;
					TextXAlignment = Enum.TextXAlignment.Left;
				});
			});
		})
	end)
end

function InstanceProperty:willUnmount()
	local inputChanged = self.inputChanged;
	if inputChanged then
		inputChanged:Disconnect();
	end

	local inputBegan = self.inputBegan;
	if inputBegan then
		inputBegan:Disconnect();
	end

	self.surfaceSelection:Destroy();
end

return InstanceProperty;