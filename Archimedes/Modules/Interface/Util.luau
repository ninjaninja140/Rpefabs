local Util = {};

function Util.matchString(query, target)
	if query=='' then
		return true;
	end

	query = string.lower(query);
	target = string.lower(target);

	return target:sub(1, query:len())==query;
end

return Util;