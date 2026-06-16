-- The descendants of this module are coded terribly - not recommended to use. Made it when I was first learning Roact.

local components = {};

for _,v in ipairs(script:GetChildren()) do
	components[v.Name] = require(v);
end

return components;