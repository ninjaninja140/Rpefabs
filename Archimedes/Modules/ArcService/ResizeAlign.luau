local Util = require(script.Parent.Util);

--local debugFolder = workspace.CurrentCamera:FindFirstChild("Archimedes");

--if not debugFolder then
--	debugFolder = Instance.new("Folder");
--	debugFolder.Name = "Archimedes";
--	debugFolder.Archivable = false;
--	debugFolder.Parent = workspace.CurrentCamera;
--else
--	debugFolder:ClearAllChildren();
--end

local ResizeAlign = {};
--ResizeAlign.DebugFolder = debugFolder;

function ResizeAlign:clearFolder()
	--debugFolder:ClearAllChildren();
end

function ResizeAlign:getNormal(target: PVInstance, normalId: Enum.NormalId)
	local cframe, size = Util:getBoundingBox(target);
	return (cframe * (Vector3.FromNormalId(normalId) * size/2));
end

function ResizeAlign:isIntersecting(point, part)
	return table.find(workspace:GetPartBoundsInBox(CFrame.new(point), Vector3.new(1, .1, 1)), part);
end

function ResizeAlign:getClosestFace(part: BasePart, position: Vector3)
	local closest = -math.huge;
	local closestNormalId;

	for _, normalId in ipairs(Enum.NormalId:GetEnumItems()) do
		local normal = Vector3.FromNormalId(normalId);

		local offset = part.CFrame:VectorToWorldSpace(normal);
		local point = part.CFrame:PointToWorldSpace(normal);

		local dot = (position-point):Dot(offset);

		if dot>closest then
			closest = dot;
			closestNormalId = normalId;
		end
	end

	return closestNormalId, closest;
end

function ResizeAlign:isOverlappingPart(a: BasePart, b:BasePart)
	return table.find(workspace:GetPartBoundsInBox(a.CFrame, a.Size), b);
end

local function createSurface(data)
	local SurfaceSelection = Instance.new("SurfaceSelection");
	SurfaceSelection.Adornee = data.Part;
	SurfaceSelection.Color3 = data.Color;
	SurfaceSelection.TargetSurface = data.Face;
	SurfaceSelection.Parent = debugFolder;
end

function ResizeAlign:getOppositeNormalId(normalId: Enum.NormalId)
	local vector = Vector3.FromNormalId(normalId) * -1;

	for _,v in ipairs(Enum.NormalId:GetEnumItems()) do
		if Vector3.FromNormalId(v)==vector then
			return v;
		end
	end
end

local thickness = 1;

function ResizeAlign:getIntersectingParts(instance: PVInstance, instance2: PVInstance, normalId: Enum.NormalId, getAll: boolean)
	if instance and instance2 then
		if instance:IsA("BasePart") and instance2:IsA("BasePart") then
			local list = {};
			
			list[instance] = {
				TargetPart = instance2;
				TargetFace = self:getOppositeNormalId(normalId);
				FromFace = normalId;
			};
			
			return list;
		end
		
		local edgeA = self:getNormal(instance, normalId);
		local edgeB = self:getNormal(instance2, self:getOppositeNormalId(normalId));

		thickness = math.clamp((edgeA-edgeB).Magnitude*2, 1, math.huge);
	end

	local normal = Vector3.FromNormalId(normalId);
	local positive = if normal.X<0 or normal.Y<0 or normal.Z<0 then normal*-1 else normal;

	local cframe, size = Util:getBoundingBox(instance);
	local offset = normal * size * 0.5;

	--cframe = cframe:ToWorldSpace(CFrame.new(offset)-(normal*thickness/2.25));
	cframe = cframe:ToWorldSpace(CFrame.new(offset));
	size = (positive*thickness)+(size*-positive+size);

	local parts = workspace:GetPartBoundsInBox(cframe, size);

	--local p = Instance.new("Part");
	--p.CFrame = cframe;
	--p.Size = size;
	--p.Transparency = 1;

	--local sb = Instance.new("SelectionBox");
	--sb.Adornee = p;
	--sb.LineThickness = 0.025;
	--sb.Color3 = Color3.new(1, 0, 0);
	--sb.SurfaceColor3 = Color3.new(1, 0, 0);
	--sb.SurfaceTransparency = .8;
	--sb.Parent = debugFolder;

	--p.Parent = debugFolder;

	local mappedList = {};
	local count = 0;

	if getAll then
		for _,v in ipairs(parts) do
			if not v:IsDescendantOf(instance) then
				table.insert(mappedList, v);
			end
		end

		return mappedList;
	end

	for _,v in ipairs(parts) do
		if v:IsDescendantOf(instance) then
			local vId = v:GetAttribute("ArchimedesID");

			for _,p in ipairs(parts) do
				local closestFace = self:getClosestFace(v, p.Position);
				local overlapPos = self:getNormal(v, closestFace);

				local matchingId = vId and v~=p and p:GetAttribute("ArchimedesID")==vId;
				local isDesc = if instance2 then p:IsDescendantOf(instance2) else not p:IsDescendantOf(instance);

				if v~=p and (not mappedList[p] or matchingId) and isDesc then

					--if v~=p and not mappedList[p] and isDesc then
					local intersects = self:isIntersecting(overlapPos, p);

					if intersects then
						local cf = self:getClosestFace(p, overlapPos);

						if cf then
							count += 1;

							mappedList[p] = {
								TargetPart = v;
								TargetFace = closestFace;
								FromFace = cf;
							};
						end
					end
				end
			end
		end
	end

	return mappedList, count;
end

function ResizeAlign:mapSurfaces(a: PVInstance, b: PVInstance, face: Enum.NormalId, showSurfaces: boolean)
	local list, total = self:getIntersectingParts(a, b, face);
	
	if showSurfaces then
		local count = 0;

		for i,v in pairs(list) do
			local color = nil;

			createSurface({
				Part = i;
				Color = color or Color3.new(0, 1, 0);
				Face = v.FromFace;
			});

			createSurface({
				Part = v.TargetPart;
				Color = color or Color3.new(1, 0, 0);
				Face = v.TargetFace;
			});

			count+=1;
		end
	end

	return list;
end

function resizePart(part, normal, delta)
	local axis = Vector3.FromNormalId(normal)
	local cf = part.CFrame
	local targetSize = part.Size + Vector3.new(math.abs(axis.X), math.abs(axis.Y), math.abs(axis.Z))*delta
	if not part:IsA('FormFactorPart') then
		-- Nothing to do, can't modify formfactor anyways
	elseif part.FormFactor == Enum.FormFactor.Brick then
		if targetSize.X % 1 ~= 0 or targetSize.Y % 1.2 ~= 0 or targetSize.Z % 1 ~= 0 then
			part.FormFactor = 'Custom'
		end
	elseif part.FormFactor == Enum.FormFactor.Symmetric then
		if targetSize.X % 1 ~= 0 or targetSize.Y % 1 ~= 0 or targetSize.Z % 1 ~= 0 then
			part.FormFactor = 'Custom'
		end
	elseif part.FormFactor == Enum.FormFactor.Plate then
		if targetSize.X % 1 ~= 0 or targetSize.Y % 0.4 ~= 0 or targetSize.Z % 1 ~= 0 then
			part.FormFactor = 'Custom'
		end
	else
		-- nothing to do, is custom
	end
	part:BreakJoints()
	part.Size = targetSize
	part:BreakJoints()
	part.CFrame = cf * CFrame.new(axis * (delta/2))
end

function getPositivePointToFace(face, points)
	local hsize = face.Object.Size / 2
	local faceDir = Vector3.FromNormalId(face.Normal)
	local faceNormal = face.Object.CFrame:vectorToWorldSpace(faceDir)
	local facePoint = face.Object.CFrame:pointToWorldSpace(faceDir * hsize)
	--
	local maxDist = -math.huge
	local maxPoint = nil
	for _, point in pairs(points) do
		local dist = (point - facePoint):Dot(faceNormal)
		if dist > maxDist then
			maxDist = dist
			maxPoint = point
		end
	end
	return maxPoint
end

function getNegativePointToFace(face, points)
	local hsize = face.Object.Size / 2
	local faceDir = Vector3.FromNormalId(face.Normal)
	local faceNormal = face.Object.CFrame:vectorToWorldSpace(faceDir)
	local facePoint = face.Object.CFrame:pointToWorldSpace(faceDir * hsize)
	--
	local minDist = math.huge
	local minPoint = nil
	for _, point in pairs(points) do
		local dist = (point - facePoint):Dot(faceNormal)
		if dist < minDist then
			minDist = dist
			minPoint = point
		end
	end
	return minPoint
end

local function otherNormals(dir)
	if math.abs(dir.X) > 0 then
		return Vector3.new(0, 1, 0), Vector3.new(0, 0, 1)
	elseif math.abs(dir.Y) > 0 then
		return Vector3.new(1, 0, 0), Vector3.new(0, 0, 1)
	else
		return Vector3.new(1, 0, 0), Vector3.new(0, 1, 0)
	end
end

local function getFacePoints(face)
	local hsize = face.Object.Size / 2
	local faceDir = Vector3.FromNormalId(face.Normal)
	local faceA, faceB = otherNormals(faceDir)
	faceDir, faceA, faceB = faceDir*hsize, faceA*hsize, faceB*hsize
	--
	local function sp(offset)
		return (face.Object.CFrame * CFrame.new(offset)).p
	end
	--
	return {
		sp(faceDir + faceA + faceB);
		sp(faceDir + faceA - faceB);
		sp(faceDir - faceA - faceB);
		sp(faceDir - faceA + faceB);
	}
end


local function getDimension(face)
	local dir = Vector3.FromNormalId(face.Normal)
	return Vector3.new(math.abs(dir.X), math.abs(dir.Y), math.abs(dir.Z))
end

local function getNormal(face)
	return face.Object.CFrame:vectorToWorldSpace(Vector3.FromNormalId(face.Normal))
end

local function getPoints(part)
	local hsize = part.Size / 2
	local cf = part.CFrame
	local points = {}
	for i = -1, 1, 2 do
		for j = -1, 1, 2 do
			for k = -1, 1, 2 do
				table.insert(points, cf:pointToWorldSpace(Vector3.new(i, j, k) * hsize))
			end
		end
	end
	return points
end

function ResizeAlign:doExtend(faceA, faceB, mode)
	--
	local pointsA = getFacePoints(faceA)
	local pointsB = getFacePoints(faceB)
	--
	local extendPointA, extendPointB;
	if mode == 'ExtendInto' or mode == 'OuterTouch' or mode == 'ButtJoint' then
		extendPointA = getPositivePointToFace(faceB, pointsA)
		extendPointB = getPositivePointToFace(faceA, pointsB)
	elseif mode == 'ExtendUpto' or mode == 'InnerTouch' then
		extendPointA = getNegativePointToFace(faceB, pointsA)
		extendPointB = getNegativePointToFace(faceA, pointsB)
	else
		assert(false, "unreachable")		
	end
	local startSep = extendPointB - extendPointA
	--
	local localDimensionA = getDimension(faceA)
	local localDimensionB = getDimension(faceB)
	local dirA = getNormal(faceA)
	local dirB = getNormal(faceB)
	--
	-- Find the closest distance between the rays (extendPointA, dirA) and (extendPointB, dirB):
	-- See: http://geomalgorithms.com/a07-_distance.html#dist3D_Segment_to_Segment
	local a, b, c, d, e = dirA:Dot(dirA), dirA:Dot(dirB), dirB:Dot(dirB), dirA:Dot(startSep), dirB:Dot(startSep)
	local denom = a*c - b*b

	-- Is this a degenerate case?
	if math.abs(denom) < 0.001 then
		-- Parts are parallel, extend faceA to faceB
		local lenA = (extendPointA - extendPointB):Dot(getNormal(faceB))
		local extendableA = (localDimensionA * faceA.Object.Size).magnitude
		if getNormal(faceA):Dot(getNormal(faceB)) > 0 then
			lenA = -lenA
		end
		if lenA < -extendableA then
			return
		end
		resizePart(faceA.Object, faceA.Normal, lenA)
		return
	end

	-- Get the distances to extend by
	local lenA = -(b*e - c*d) / denom
	local lenB = -(a*e - b*d) / denom

	if mode == 'ExtendInto' or mode == 'ExtendUpto' then
		-- We need to find a different lenA, which is the intersection of
		-- extendPointA to the plane faceB:
		-- dist to plane (point, normal) = - (ray_dir . normal) / ((ray_origin - point) . normal)
		local denom2 = dirA:Dot(dirB)
		--if math.abs(denom2) > 0.0001 then
		--	lenA = - (extendPointA - extendPointB):Dot(dirB) / denom2
		--	lenB = 0
		--else
			-- Perpendicular
			-- Project all points of faceB onto faceA and extend by that much
			local points = getPoints(faceB.Object)
			if mode == 'ExtendUpto' then
				local smallestLen = math.huge
				for _, v in pairs(points) do
					local dist = (v - extendPointA):Dot(getNormal(faceA))
					if dist < smallestLen then
						smallestLen = dist
					end
				end
				lenA = smallestLen
			elseif mode == 'ExtendInto' then
				local largestLen = -math.huge
				for _, v in pairs(points) do
					local dist = (v - extendPointA):Dot(getNormal(faceA))
					if dist > largestLen then
						largestLen = dist
					end
				end
				lenA = largestLen
			end
			lenB = 0
		--end
	end

	-- Are both extents doable?
	-- Note: Negative amounts to extend by *are* allowed, but only
	-- up to the size of the part on the dimension being extended on.
	local extendableA = (localDimensionA * faceA.Object.Size).magnitude
	local extendableB = (localDimensionB * faceB.Object.Size).magnitude
	if lenA < -extendableA then
		return
	end
	if lenB < -extendableB then
		return
	end

	-- Both are doable, execute:
	resizePart(faceA.Object, faceA.Normal, lenA)
	resizePart(faceB.Object, faceB.Normal, lenB)

	-- For a butt joint, we want to resize back one of the parts by the thickness 
	-- of the other part on that axis. Renize the first part (A), such that it
	-- "butts up against" the second part (B).
	if mode == 'ButtJoint' then
		-- Find the width of B on the axis A, which is the amount to resize by
		local points = getPoints(faceB.Object)
		local minV =  math.huge
		local maxV = -math.huge
		for _, v in pairs(points) do
			local proj = (v - extendPointA):Dot(dirA)
			if proj < minV then minV = proj end
			if proj > maxV then maxV = proj end
		end
		resizePart(faceA.Object, faceA.Normal, -(maxV - minV))
	end
end

return ResizeAlign;