local plugin = script:FindFirstAncestorWhichIsA("Plugin");
local existing = plugin:GetSetting("Archimedes");

local defaults = {
	Axis = "X";
	RotationType = "Yaw";
	ResizeMethod = "OuterTouch";
	Alignment = "Inside";
	WindowMode = "ScreenGui";
	
	Angle = 10;
	RenderAmount = 1;
	
	FlipAxis = false;
	SwapSides = false;
	Handles = false;
	AutoResize = false;
	FixNeighbors = true;
	ShowOverlap = true;
	--Pivot = false;
	UsePrimaryPart = false;
	Enabled = true;
	Alternate = false;
	Multidirectional = false;
	
	WidgetOpened = true;
	ResizeWarningPromptOpened = false;
	
	Offset = Vector3.new();
	Orientation = Vector3.new()
};

local function join()
	local settings = {};
	
	for i,v in pairs(defaults) do
		local existingValue = existing[i];
		local objectType = typeof(v)=="Vector3" and Vector3 or typeof(v)=="CFrame" and CFrame
		
		if objectType and typeof(existingValue)=="string" then
			existingValue = objectType.new(existingValue:match("(.+), (.+), (.+)"));
		end
		
		settings[i] = if existingValue==nil then v else existingValue;
	end
	
	return settings;
end

return if existing then
	join() 
else defaults;