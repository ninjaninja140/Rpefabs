local ChangeHistoryService = game:GetService("ChangeHistoryService");

local Util = {};

function Util:getBoundingBox(object: PVInstance)
	if object:IsA("Model") then
		return object:GetBoundingBox();
	end
	
	return object.CFrame, object.Size;
end

return Util;