-- Comment from 2024: Wow, the code for this plugin is awful. Sorry you have to see this.
-- Edited by Scriptos on October 03 2024

local ChangeHistoryService = game:GetService("ChangeHistoryService");
local HttpService = game:GetService("HttpService");
local ServerStorage = game:GetService("ServerStorage");
local Selection = game:GetService("Selection");

local plugin = script:FindFirstAncestorWhichIsA("Plugin");

local ResizeAlign = require(script.ResizeAlign);
local Util = require(script.Util);
local Settings = require(script.Settings);

local ArcService = {};
ArcService.Settings = Settings;
ArcService.Previews = {};

local mappedFaces = {
	X = Enum.NormalId.Right;
	Y = Enum.NormalId.Top;
	Z = Enum.NormalId.Front;
};

local mappedSwappedFaces = {
	X = Enum.NormalId.Left;
	Y = Enum.NormalId.Bottom;
	Z = Enum.NormalId.Back;
};

local mappedSurfaces = {};
local normals = {};

for _,enum in ipairs(Enum.NormalId:GetEnumItems()) do
	normals[enum] = Vector3.FromNormalId(enum);
end

local rotations = {
	X = CFrame.fromMatrix(Vector3.new(), normals[Enum.NormalId.Back], normals[mappedFaces.X]);
	Y = CFrame.fromMatrix(Vector3.new(), normals[Enum.NormalId.Right], normals[mappedFaces.Y]);
	Z = CFrame.fromMatrix(Vector3.new(), normals[Enum.NormalId.Top], normals[mappedFaces.Z]);
};

local rotationsSwapped = {
	X = CFrame.fromMatrix(Vector3.new(), normals[Enum.NormalId.Back]*-1, normals[mappedFaces.X]*-1);
	Y = CFrame.fromMatrix(Vector3.new(), normals[Enum.NormalId.Right]*-1, normals[mappedFaces.Y]*-1);
	Z = CFrame.fromMatrix(Vector3.new(), normals[Enum.NormalId.Top]*-1, normals[mappedFaces.Z]*-1);
};

local alignmentOffsets = {
	Inside = 0.5;
	Middle = 0;
	Outside = -0.5;
};

local pluginStorage = ServerStorage:FindFirstChild("Archimedes_Storage")

function ArcService:saveSettings()
	plugin:SetSetting("Archimedes", Settings);
end

function ArcService:set(index, value, skipPreview)
	if typeof(index)=="table" then
		for i,v in pairs(index) do
			self:set(i, v, true);
		end
	else
		Settings[index] = value;
	end

	if index~="Angle" then
		mappedSurfaces = {};

		if index=="AutoResize" or index=="Enabled" and not value then
			ResizeAlign:clearFolder();
		end

		self:saveSettings();
	end

	if not skipPreview then
		self:preview();
	end
end

function ArcService:canRotate(object)
	return not object:IsA("Terrain") and not object:IsA("WorldRoot") and (object:IsA("BasePart") or object:IsA("Model"));
end

local function getPivotOffset(target)
	if target:IsA("BasePart") then
		return target.PivotOffset;
	elseif target.PrimaryPart then
		return target.PrimaryPart.PivotOffset;
	elseif target:IsA("Model") then
		local cframe = Util:getBoundingBox(target);
		return target:GetPivot():ToObjectSpace(cframe);
	else
		return CFrame.new();
	end
end

local function addToStorage(object)
	if not object:IsA("Model") then
		return
	end
	
	object:SetAttribute("ArchimedesID", HttpService:GenerateGUID(false));

	for _,v in ipairs(object:GetDescendants()) do
		if v:IsA("BasePart") then
			v:SetAttribute("ArchimedesID", HttpService:GenerateGUID(false));
		end
	end
	
	if not pluginStorage then
		pluginStorage = Instance.new("Folder");
		pluginStorage.Name = "Archimedes_Storage";
		pluginStorage.Parent = ServerStorage;
	end

	object:Clone().Parent = pluginStorage;
end

local function getOriginalModel(object)
	local id = object:GetAttribute("ArchimedesID");
	if not id then
		return
	end
	
	if pluginStorage then
		for _,v in ipairs(pluginStorage:GetChildren()) do
			if v:GetAttribute("ArchimedesID")==id then
				return v;
			end
		end		
	end

	ArcService:clearAttributes(object);
end

local function toggleJoin(object, state)
	if state then
		workspace:JoinToOutsiders({object}, plugin:GetJoinMode());
	else
		workspace:UnjoinFromOutsiders({object});
	end
end

local function clone(object)
	object = getOriginalModel(object) or object;
	return object:Clone();
end

function ArcService:transform(fromObject, toCFrame, object)
	local offset, size = Util:getBoundingBox(fromObject);
	local original = getOriginalModel(fromObject);

	if original then
		local _, originalSize = Util:getBoundingBox(original);
		offset = offset:ToWorldSpace(CFrame.new(self:getNormal()*(originalSize-size)*0.5));
	end

	self:setCFrame(object, toCFrame*offset);
end

local function getRoots(object, list)
	list = list or {};

	local rootPart = object:IsA("BasePart") and object:GetRootPart();
	if rootPart then
		list[rootPart] = true;
	end

	for _,v in ipairs(object:GetChildren()) do
		list = getRoots(v, list);
	end

	return list;
end

local function forcePrimaryPart(object)
	local primaryPart = object.PrimaryPart;
	if primaryPart then
		return
	end

	local largestSize, largestPart = -math.huge, nil;

	for _, v in ipairs(object:GetDescendants()) do
		if v:IsA("BasePart") then
			local size = v.Size.Magnitude;

			if size>largestSize then
				largestSize = size;
				largestPart = v;
			end
		end
	end

	if largestPart then
		object.PrimaryPart = largestPart;
	end
end

--local function transformModel(object, finalCF)
--	forcePrimaryPart(object);
	
--	local originalCF = object:GetModelCFrame();
	
--	for part, _ in pairs(getRoots(object)) do
--		part.CFrame = finalCF:ToWorldSpace(originalCF:ToObjectSpace(part.CFrame));
--	end
--end

function ArcService.getCustomOffset()
	local offset = Settings.Offset and CFrame.new(Settings.Offset) or CFrame.new()

	local offsetOrientation = Settings.Orientation
	if offsetOrientation then
		offset *= CFrame.fromOrientation(math.rad(offsetOrientation.X), math.rad(offsetOrientation.Y), math.rad(offsetOrientation.Z))
	end
	
	return offset
end

function ArcService:setCFrame(object, cframe, ignoreSettings)
	local objectCFrame = Util:getBoundingBox(object)
	
	if not ignoreSettings then
		local offset = ArcService.getCustomOffset()
		
		--if Settings.Pivot then
		--	offset *= getPivotOffset(object)
		--end
		
		if offset then
			cframe = cframe:ToWorldSpace(offset)
		end
	end

	if object:IsA("BasePart") then
		object.CFrame = cframe;
	elseif Settings.Pivot then
		object:PivotTo(cframe);
	else
		object:PivotTo(cframe:ToWorldSpace(objectCFrame:ToObjectSpace(object:GetPivot())))
	end
end

function ArcService:push(object)
	local preview, isNew = self:addPreview(object);
	local original = getOriginalModel(object);

	local cframe, size = Util:getBoundingBox(object);
	local offset = cframe:ToWorldSpace(CFrame.new(size*self:getNormal()));
	
	if original then
		local _, originalSize = Util:getBoundingBox(original);
		offset = offset:ToWorldSpace(CFrame.new(self:getNormal()*(originalSize-size)*0.5));
	end

	self:setCFrame(preview, offset:ToWorldSpace(ArcService.getCustomOffset()), true);
	
	if isNew then
		preview.Parent = object.Parent;
	end
	
	return preview;
end

function ArcService:filterSelection()
	local list = {};

	for _,v in ipairs(Selection:Get()) do
		if not v:GetAttribute("ArchimedesPreview") and self:canRotate(v) then
			table.insert(list, v);
		end
	end

	self.Selection = list;
	return list;
end

function ArcService:getSelection()
	if Settings.Enabled then
		return self.Selection;
	end

	return self:filterSelection();
end

function ArcService:clearAttributes(object)
	local objects = object and {object} or self:getSelection();

	for _,object in ipairs(objects) do
		local list = object:GetDescendants();
		table.insert(list, object);

		for _,v in ipairs(list) do
			if v:IsA("BasePart") or v==object then
				local attributes = v:GetAttributes();

				for index, value in pairs(attributes) do
					if string.find(string.lower(index), "archimedes") then
						v:SetAttribute(index, nil);
					end
				end
			end
		end
	end
end

local function globalTransform(faceCFrame, localTransform)
	return faceCFrame * localTransform * faceCFrame:Inverse();
end

function ArcService:getAngles(localSize, faceCFrame, size)
	local dir = alignmentOffsets[Settings.Alignment];
	local currentOffsetAngle = math.rad(math.abs(Settings.Angle));

	local halfOffset = CFrame.new(0,(0.5 * localSize.Y), 0);
	local multiplier = Settings.FlipAxis and -1 or 1;
	if Settings.Angle<0 then
		multiplier*=-1;
	end

	local x = globalTransform(faceCFrame, halfOffset * CFrame.new(multiplier*dir*localSize.X, 0, 0) * CFrame.Angles(0, 0, multiplier*currentOffsetAngle) * CFrame.new(-multiplier*dir*localSize.X, 0, 0) * halfOffset);
	local z = globalTransform(faceCFrame, halfOffset * CFrame.new(0, 0, -multiplier*dir*localSize.Z) * CFrame.Angles(multiplier*currentOffsetAngle, 0, 0) * CFrame.new(0, 0, multiplier*dir*localSize.Z) * halfOffset);

	local axis = Settings.Axis;

	return {
		Yaw = (axis=="X" or axis=="Y") and x or z;
		Pitch = (axis=="X" or axis=="Y") and z or x;
		Roll = axis=="Y" and x;
	};
end

function ArcService:getTransform(object)
	local angles = {};

	local cframe, size = Util:getBoundingBox(object);

	for axis, rot in pairs(rotations) do
		if Settings.SwapSides then
			rot = rotationsSwapped[axis];
		end
		
		local localSize = rot:VectorToObjectSpace(size);
		localSize = Vector3.new(math.abs(localSize.X), math.abs(localSize.Y), math.abs(localSize.Z));

		angles[axis] = self:getAngles(localSize, cframe*rot, size);
	end

	return angles;
end

function ArcService:getFaceFromNormal(vector)
	for face, normal in pairs(normals) do
		if normal==vector then
			return face;
		end
	end
end

function ArcService:getAxisFromNormalId(normalId)
	for axis, face in pairs(mappedFaces) do
		if face==normalId then
			return axis, false;
		end
	end

	for axis, face in pairs(mappedSwappedFaces) do
		if face==normalId then
			return axis, true;
		end
	end
end

function ArcService:getFace(axis)
	local face = mappedFaces[axis or Settings.Axis];
	return Settings.SwapSides and self:getFaceFromNormal(normals[face]*-1) or face;
end

function ArcService:getNormal(axis)
	return normals[self:getFace(axis)];
end

function ArcService:selectFace(object, axis)
	local existing = object:FindFirstChild("Archimedes_SurfaceSelection");
	if existing then
		existing.TargetSurface = self:getFace(axis);
		return
	end
	
	local objectRep

	if object:IsA("Model") then
		local camera = workspace.CurrentCamera

		local cframe, size = Util:getBoundingBox(object)

		object = Instance.new("Part")
		object.Archivable = false
		object.Anchored = true
		object.Size = size
		object.Transparency = 1
		object.CFrame = cframe
		
		objectRep = object
	end

	local surfaceSelection = Instance.new("SurfaceSelection");
	surfaceSelection.Name = "Archimedes_SurfaceSelection";
	surfaceSelection.TargetSurface = self:getFace(axis);
	surfaceSelection.Adornee = object;
	surfaceSelection.Parent = object;
	
	if objectRep then
		objectRep.Parent = workspace.CurrentCamera
	end

	return surfaceSelection, objectRep;
end

ArcService.SurfaceSelections = {};

function ArcService:addSelectionFaces(axis)
	self:removeSelectionFaces()
	
	axis = axis or Settings.Axis;

	local selected = self:filterSelection();

	for _,v in ipairs(selected) do
		local surfaceSelection, objectRep = self:selectFace(v, axis);

		if surfaceSelection then
			table.insert(self.SurfaceSelections, {SurfaceSelection = surfaceSelection, Rep = objectRep});
		end
	end
end

function ArcService:removeSelectionFaces()
	for _,v in ipairs(self.SurfaceSelections) do
		v.SurfaceSelection:Destroy()
		
		local rep = v.Rep
		if rep then
			rep:Destroy()
		end
	end

	self.SurfaceSelections = {};
end

--function ArcService:getEdge(object)
--	local cframe, size = Util:getBoundingBox(object);
--	return cframe:ToWorldSpace(CFrame.new()+normals[mappedFaces[Settings.Axis]]*size);
--end

local function lock(object, val)
	val = if val~=nil then val else true;

	if object:IsA("BasePart") then
		object.Locked = val;
	else
		for _,v in ipairs(object:GetDescendants()) do
			if v:IsA("BasePart") then
				v.Locked = val;
			end
		end
	end
end

function ArcService:resetModels(object)
	local objects = object and {object} or self:getSelection();


	for _,v in ipairs(objects) do
		local original = getOriginalModel(v);

		if original then
			local cframe = Util:getBoundingBox(v);

			local dupe = original:Clone();
			self:setCFrame(dupe, cframe, true);
			dupe.Parent = v.Parent;

			v:Destroy();
		end
	end
end

function ArcService:addPreview(object)
	local existing = self.Previews[object];
	if existing then
		if existing:IsA("BasePart") then
			if existing.PivotOffset~=object.PivotOffset then
				existing.PivotOffset = object.PivotOffset;
			end
		end

		return existing;
	end

	if object:IsA("Model") then
		if not getOriginalModel(object) and Settings.AutoResize then
			addToStorage(object);
		end
	end

	mappedSurfaces[object] = nil;

	toggleJoin(object, false);

	local dupe = clone(object);
	dupe.Archivable = false;
	self.Previews[object] = dupe;

	local selectionBox = Instance.new("SelectionBox");
	selectionBox.Name = "Archimedes_SelectionBox";
	selectionBox.Adornee = dupe;
	selectionBox.LineThickness = .01;
	selectionBox.SurfaceTransparency = .75;
	selectionBox.Parent = dupe;

	dupe:SetAttribute("ArchimedesPreview", true);
	lock(dupe);

	return dupe, true;
end

local signals = {};

local function clearSignals()
	for _,list in pairs(signals) do
		for _, signal in pairs(list) do
			signal:Disconnect();
		end
	end

	signals = {};
end

function ArcService:clearPreviews(filter)
	local previews = self.Previews
	for i,v in pairs(previews) do
		if not filter or not table.find(filter, i) then
			v:Destroy();
			
			previews[i] = nil;
			self.PreviewCount -= 1
		end
	end
	
	if self.PreviewCount < 0 then
		self.PreviewCount = 0
	end
	
	if not filter then
		self.Previews = {}
	end
end

ArcService.PreviewCount = 0;

function ArcService:getResizeMap(object)
	if not Settings.AutoResize then
		return
	end

	local existing = mappedSurfaces[object];
	if existing then
		return existing;
	end

	ResizeAlign:clearFolder();

	local map = ResizeAlign:mapSurfaces(object, self:push(object), self:getFace(), Settings.ShowOverlap);
	mappedSurfaces[object] = map;

	return map;
end

function ArcService:autoResize(object, target)
	local surfaceMap = self:getResizeMap(object);

	if surfaceMap then
		for part, data in pairs(surfaceMap) do
			ResizeAlign:doExtend({Object = data.TargetPart, Normal = data.TargetFace}, {Object = part, Normal = data.FromFace}, Settings.ResizeMethod);
		end
	end
end

function ArcService:preview()
	if not Settings.Enabled or not Settings.WidgetOpened then
		if self.PreviewCount>0 then
			self:clearPreviews();
		end

		clearSignals();
		return
	end

	local selected = self:filterSelection();
	self:clearPreviews(selected);

	local amount = self:getRenderAmount()-1;
	local showMore = amount<100;

	local currentAngle = Settings.Angle;

	if #selected==0 then
		ResizeAlign:clearFolder();
	end

	for _,v in ipairs(selected) do
		if not signals[v] then
			local list = {};
			
			local lastPivot = v:GetPivot()
			local lastPreview = tick()
			
			local changeSignal = v.Changed:Connect(function(property)
				local timeNow = tick()
				lastPreview = timeNow
				
				task.defer(function()
					if lastPreview~=timeNow then
						return
					end
					
					local newPivot = v:GetPivot()
					if newPivot~=lastPivot then
						lastPivot = newPivot
					else
						self:clearPreviews()
					end
					
					self:preview()
				end)
			end)
			
			table.insert(list, changeSignal)

			--local pivotSignal = v:GetPropertyChangedSignal(v:IsA("BasePart") and "PivotOffset" or "WorldPivot"):Connect(function()
			--	self:preview();
			--end)

			--table.insert(list, pivotSignal);
			
			--if v:IsA("BasePart") then
			--	local cframeSignal = v:GetPropertyChangedSignal("CFrame"):Connect(function()
			--		self:preview();
			--	end)

			--	local sizeSignal = v:GetPropertyChangedSignal("Size"):Connect(function()
			--		self:clearPreviews();
			--		self:preview();
			--	end)

			--	table.insert(list, cframeSignal);
			--	table.insert(list, sizeSignal);
			--end

			signals[v] = list;
		end

		self.PreviewCount += 1;

		local prev = self:addPreview(v);
		local push = currentAngle==0;
		
		prev.Parent = v.Parent;

		if push then
			self:push(v);
		end

		if Settings.AutoResize then
			self:getResizeMap(v);
		end

		if not push then
			self:transform(v, self:getTransform(v)[Settings.Axis][Settings.RotationType], prev);
		end
	end
end

function ArcService:getRenderAmount()
	return (360/math.abs(Settings.Angle));
end

function ArcService:alternate()
	if Settings.Alternate then
		Settings.RotationType = (Settings.RotationType=="Pitch" and "Yaw") or "Pitch";
	end
end

local function tag(...)
	local face = ArcService:getFace();

	for _, object in ipairs({...}) do
		object:SetAttribute("ArchimedesNormalID", face.Name);
	end
end

local function hasMatchingTags(a, b)
	local id = a:GetAttribute("ArchimedesID");
	return id and b:GetAttribute("ArchimedesID")==id and a:GetAttribute("ArchimedesNormalID")==b:GetAttribute("ArchimedesNormalID");
end

local function getFirstMatchingAncestor(object, matchId)
	if object==workspace then
		return
	end

	return (object:GetAttribute("ArchimedesID")==matchId and object) or getFirstMatchingAncestor(object.Parent, matchId);
end

function ArcService:getMatchingNeighbors(object, face)
	local id = object:GetAttribute("ArchimedesID");
	if not id then
		return
	end

	local neighbors = {};
	local numNeighbors = 0;

	local normalIds = {face, ResizeAlign:getOppositeNormalId(face)};

	for _,normalId in ipairs(normalIds) do
		local intersection = ResizeAlign:getIntersectingParts(object, nil, normalId, true);

		for _,v in pairs(intersection) do
			local firstMatch = getFirstMatchingAncestor(v, id);

			if firstMatch and hasMatchingTags(object, firstMatch) then
				neighbors[firstMatch] = normalId; --ResizeAlign:getOppositeNormalId(normalId);
				numNeighbors +=1;

				break
			end
		end
	end

	return neighbors, numNeighbors;
end

function ArcService:fixNeighbors(object)
	local face = object:GetAttribute("ArchimedesNormalID");
	face = face and Enum.NormalId[face];

	if not face then
		return
	end

	local neighbors, numNeighbors = self:getMatchingNeighbors(object, face);

	if numNeighbors==0 then
		return
	end

	local showOverlap = Settings.ShowOverlap;

	for neighbor, fromFace in pairs(neighbors) do
		local oppositeNormalId = ResizeAlign:getOppositeNormalId(fromFace);
		local intersecting, count = ResizeAlign:getIntersectingParts(neighbor, object, oppositeNormalId);

		if count==0 then
			continue
		end

		local cframe, size = Util:getBoundingBox(object);
		local faceVector = Vector3.FromNormalId(fromFace);

		local p = Instance.new("Part");
		p.Name = "NeighborPart";
		p.CFrame = cframe:ToWorldSpace(CFrame.new(faceVector*size/2))-faceVector*.5;
		p.Size = Vector3.new(1, 1, 1);

		for fromPart, data in pairs(intersecting) do
			--local ss = Instance.new("SurfaceSelection");
			--ss.TargetSurface = data.TargetFace;
			--ss.Adornee = data.TargetPart;
			--ss.Parent = ResizeAlign.DebugFolder;

			ResizeAlign:doExtend({Object = data.TargetPart, Normal = data.TargetFace}, {Object = p, Normal = Enum.NormalId.Top}, "ExtendUpto");
		end

		p:Destroy();
	end

	ChangeHistoryService:SetWaypoint("Archimedes Fix Neighbors");
end

function ArcService:render(blockWaypoint)
	if not Settings.Enabled then
		return
	end

	clearSignals();

	local targets = {};
	local autoResize = Settings.AutoResize;

	for i,v in pairs(self.Previews) do
		local box = v:FindFirstChild("Archimedes_SelectionBox");
		if box then
			box:Destroy();
		end

		v.Parent = i.Parent;
		v.Archivable = true;

		table.insert(targets, v);
		self:autoResize(i, v);

		v:SetAttribute("ArchimedesPreview", nil);
		lock(v, false);

		if autoResize then
			tag(i, v);
		end

		toggleJoin(i, true);
		toggleJoin(v, true);

		-- ugly fix for ChangeHistoryService to work properly here
		v:SetAttribute("ArchimedesIgnore", true);
		v.Parent = nil;
		v:SetAttribute("ArchimedesIgnore");
		v.Parent = i.Parent;

		if not blockWaypoint then
			ChangeHistoryService:SetWaypoint("Archimedes Render");
		end
	end

	mappedSurfaces = {};

	self.Previews = {};
	self:alternate();
	Selection:Set(targets);
end

function ArcService:renderMultiple(amount: number)
	for i = 1, amount do
		ArcService:render(true);
		task.wait();
	end

	ChangeHistoryService:SetWaypoint("Archimedes Render x"..amount);
end

function ArcService:load()
	self.descendantRemovingSignal = workspace.DescendantRemoving:Connect(function(object)
		if not Settings.AutoResize or not Settings.FixNeighbors then
			return
		end

		if object:GetAttribute("ArchimedesIgnore") then
			return
		end

		if object:IsA("Model") and object:GetAttribute("ArchimedesID") then
			if object:GetAttribute("ArchimedesPreview") then
				return
			end

			ArcService:fixNeighbors(object);
			ResizeAlign:clearFolder();
		end
	end)
end

function ArcService:unload()
	local descendantRemovingSignal = self.descendantRemovingSignal;
	if descendantRemovingSignal then
		descendantRemovingSignal:Disconnect();
		self.descendantRemovingSignal = nil;
	end

	clearSignals();
	ResizeAlign:clearFolder();
	self:clearPreviews();
end

return ArcService;