local Vendor = script:FindFirstAncestorWhichIsA("Folder");
local Roact = require(Vendor.Roact);
local Util = require(Vendor.Util);

local StudioComponents = require(Vendor.StudioComponents);

local Page = require(Vendor.PluginComponents.Page);
local Property = require(Vendor.PluginComponents.Property);
local Prompt = require(Vendor.PluginComponents.Prompt);
local VectorProperty = require(Vendor.PluginComponents.Property.VectorProperty);
local RoundButton = require(Vendor.PluginComponents.RoundButton);

local ArcService = require(Vendor.Parent.ArcService);

local thisPage = Roact.Component:extend(script.Name);

local properties = {
	{Name = "Flip Axis", State = "FlipAxis", Content = "Checkbox"};
	{Name = "Swap Sides", State="SwapSides", Content = "Checkbox"};
	--{Name = "Multidirectional", Content = "Checkbox"};
	--{Name = "Handles", Content = "Checkbox"};
	{Name = "Auto-Resize", State="AutoResize", Content = "Checkbox", WindowMode = "Widget"};
	--{Name = "Use Pivot", State="Pivot", Content = "Checkbox", WindowMode = "Widget", Opposes = "UsePrimaryPart"};
	--{Name = "Use PrimaryPart", State="UsePrimaryPart", Content = "Checkbox", WindowMode = "Widget", Opposes = "Pivot"};
	--{Name = "Alternate", State = "Alternate", Content = "Checkbox"};
	{Name = "Enabled", Content = "Checkbox"};
	
	{Name = "Alignment"};
	{Name = "Offset"};
	{Name = "Orientation"};
	{Name = "Amount", State="RenderAmount"};
	
	{Name = "ResizeMethod"};
	{Name = "FixNeighbors"};
	{Name = "ShowOverlap"};
};

function thisPage:init()
	local states = {
		MaxRenderAmount = 10;
		AutoResizeCollapsed = true;
		RenderAmountCollapsed = true;
	};
	
	for _,v in ipairs(properties) do
		states[v.State or v.Name] = ArcService.Settings[v.State or v.Name];
	end
	
	self:setState(states);
end

function thisPage:render()
	local alignments = {"Inside", "Middle", "Outside"};
	table.remove(alignments, table.find(alignments, self.state.Alignment));
	
	local resizeMethods = {"OuterTouch", "InnerTouch", "ExtendUpto", "ExtendInto"};
	table.remove(resizeMethods, table.find(resizeMethods, self.state.ResizeMethod));
	
	local checkboxProperties = {};
	local custom = {};
	
	local windowMode = ArcService.Settings.WindowMode;
	
	if windowMode == "Widget" then
		custom.AutoResize = Roact.createElement(StudioComponents.VerticalCollapsibleSection, {
			Size = UDim2.fromScale(1, 1);
			HeaderText = '';
			BackgroundTransparency = 1;
			BorderSizePixel = 0;
			Collapsed = self.state.AutoResizeCollapsed;

			Visible = self.props.searchFilter:map(function(text)
				return Util.matchString(text, "Auto-Resize");
			end);

			OnToggled = function()
				self:setState({
					AutoResizeCollapsed = not self.state.AutoResizeCollapsed;
				});
			end,

			Content = Roact.createElement(Property, {
				HeaderText = "Auto-Resize";
			}, {
				Roact.createElement(StudioComponents.Checkbox, {
					Value = self.state.AutoResize;

					OnActivated = function()
						local newState = not self.state.AutoResize;

						if newState and not ArcService.Settings.ResizeWarningPromptOpened then
							ArcService.Settings.ResizeWarningPromptOpened = true;

							Roact.mount(Roact.createElement(Prompt, {}, {
								Roact.createElement(StudioComponents.Label, {
									TextWrapped = true;
									Text = "Warning\nAuto-Resize is an unstable beta feature. It shouldn't be left on when it isn't needed.";
								});
							}), game:GetService("CoreGui"));
						end

						self:setState({
							AutoResize = newState;
						});

						ArcService:set("AutoResize", newState);
					end,
				});
			});
		}, {

			--Roact.createElement(Property, {
			--	HeaderText = "Method";
			--	PaddingEnabled = false;
			--}, {
			--	Roact.createElement(StudioComponents.Dropdown, {
			--		Item = self.state.ResizeMethod;
			--		Items = resizeMethods;
			--		Size = UDim2.fromScale(1, 1);

			--		OnSelected = function(option)
			--			self:setState({
			--				ResizeMethod = option;
			--			});

			--			ArcService:set("ResizeMethod", option);
			--		end,
			--	});
			--});

			Roact.createElement(Property, {
				HeaderText = "Fix Neighbors";
			}, {
				Roact.createElement(StudioComponents.Checkbox, {
					Value = self.state.FixNeighbors;

					OnActivated = function()
						local newState = not self.state.FixNeighbors;

						self:setState({
							FixNeighbors = newState
						});

						ArcService:set("FixNeighbors", newState);
					end,
				});
			});

			Roact.createElement(Property, {
				HeaderText = "Show Overlap";
			}, {
				Roact.createElement(StudioComponents.Checkbox, {
					Value = self.state.ShowOverlap;

					OnActivated = function()
						local newState = not self.state.ShowOverlap;

						self:setState({
							ShowOverlap = newState
						});

						ArcService:set("ShowOverlap", newState);
					end,
				})
			});

			Roact.createElement(RoundButton, {
				Text = "Reset Sizes";
				--BackgroundColorStyle = Enum.StudioStyleGuideColor.Button;
				--TextColorStyle = Enum.StudioStyleGuideColor.ButtonText;

				OnActivated = function()
					ArcService:resetModels();
				end,
			});

			Roact.createElement(RoundButton, {
				Text = "Clear Attributes";
				--BackgroundColorStyle = Enum.StudioStyleGuideColor.Button;
				--TextColorStyle = Enum.StudioStyleGuideColor.ButtonText;

				OnActivated = function()
					ArcService:clearAttributes();
				end,
			});
		});
	end
	
	for _,v in ipairs(properties) do
		local state = v.State or v.Name;
		local property = custom[state];
		
		if (v.WindowMode==windowMode or not v.WindowMode) and (property or v.Content == "Checkbox") then
			if not property then
				property = Roact.createElement(Property, {
					HeaderText = v.Name;
					searchFilter = self.props.searchFilter;
				}, {
					Roact.createElement(StudioComponents.Checkbox, {
						Value = self.state[state];

						OnActivated = function()
							local newState = {};
							local value = not self.state[state];
							
							newState[state] = value;
							
							local opposes = v.Opposes;
							if opposes then
								if ArcService.Settings[opposes] then
									newState[opposes] = false;
									ArcService.Settings[opposes] = false;
								end
							end

							self:setState(newState);
							ArcService:set(state, value);
						end,
					});
				});
			end
			
			table.insert(checkboxProperties, property);
		end
	end
	
	return StudioComponents.withTheme(function(theme)
		return Roact.createElement(Page, {
			Font = StudioComponents.Constants.FontBold;
			HeaderText = script.Name;
			LayoutOrder = 4;
			
			Visible = self.props.searchFilter:map(function(text)
				if text=='' then
					return true;
				end
				
				for _,v in ipairs(properties) do
					if Util.matchString(text, v.Name) then
						return true;
					end
				end
				
				return false;
			end)
		}, {
			Roact.createFragment(checkboxProperties);
			
			Roact.createElement(Property, {
				HeaderText = "Alignment";
				PaddingEnabled = false;
				searchFilter = self.props.searchFilter;
			}, {
				Roact.createElement(StudioComponents.Dropdown, {
					Item = self.state.Alignment;
					Items = alignments;
					Size = UDim2.fromScale(1, 1);

					OnSelected = function(option)
						self:setState({
							Alignment = option;
						});
						
						ArcService:set("Alignment", option);
					end,
				});
			});
			
			windowMode=="Widget" and Roact.createElement(VectorProperty, {
				HeaderText = "Offset";
				Vector = ArcService.Settings.Offset;
				searchFilter = self.props.searchFilter;
			});
			
			windowMode=="Widget" and Roact.createElement(VectorProperty, {
				HeaderText = "Orientation";
				Vector = ArcService.Settings.Orientation;
				searchFilter = self.props.searchFilter;
			});	
			
			Roact.createElement(StudioComponents.VerticalCollapsibleSection, {
				Size = UDim2.fromScale(1, 1);
				HeaderText = '';
				BackgroundTransparency = 1;
				BorderSizePixel = 0;
				Collapsed = self.state.RenderAmountCollapsed;
				Visible = self.props.searchFilter:map(function(text)
					return Util.matchString(text, "Amount");
				end);
				
				OnToggled = function()
					self:setState({
						RenderAmountCollapsed = not self.state.RenderAmountCollapsed;
					});
				end,
				
				Content = Roact.createElement(Property, {
					HeaderText = "Amount";
					PaddingEnabled = false;
				}, {
					Roact.createElement(StudioComponents.TextInput, {
						Text = tostring(self.state.RenderAmount);
						Size = UDim2.fromScale(1, 1);
						BackgroundTransparency = 1;
						
						TextFilter = function(text)
							return text=='' and text or tonumber(text) or '';
						end,
						
						OnChanged = function(text)
							local number = tonumber(text);
							if not number then
								return
							end
							
							number = math.clamp(number, 1, self.state.MaxRenderAmount);
							
							if number==self.state.RenderAmount then
								return
							end
							
							self:setState({
								RenderAmount = number;
							});
							
							ArcService:set("RenderAmount", number);
						end,
					});
				});
			}, {
				Roact.createElement(Property, {
					HeaderText = "Max";
					PaddingEnabled = false;
				}, {
					Roact.createElement(StudioComponents.TextInput, {
						Size = UDim2.fromScale(1, 1);
						BackgroundTransparency = 1;
						Disabled = true;
						
						Text = self.state.MaxRenderAmount;
					});
				});
				
				Roact.createElement("Frame", {
					Size = UDim2.new(1, 0, 0, 21+5);
					BackgroundTransparency = 1;
				}, {
					Roact.createElement("UIPadding", {
						PaddingTop = UDim.new(0, 5);
					});
					
					Roact.createElement(StudioComponents.Slider, {
						AnchorPoint = Vector2.new(0.5, 0.5);
						Size = UDim2.fromScale(.75, 1);
						Position = UDim2.fromScale(.5, .5);
						BackgroundTransparency = 1;
						
						Min = 1;
						Step = 1;
						
						Max = self.state.MaxRenderAmount;
						Value = math.clamp(self.state.RenderAmount, 1, self.state.MaxRenderAmount);
						
						OnChange = function(value)
							self:setState({
								RenderAmount = value;
							});
							
							ArcService:set("RenderAmount", value);
						end,
					});
				});
			});
			
			Roact.createElement("Frame", {
				Size = UDim2.new(1, 0, 0, 45);
				BackgroundTransparency = 1;
			}, {
				Roact.createElement("UIListLayout", {
					HorizontalAlignment = Enum.HorizontalAlignment.Center;
					FillDirection = Enum.FillDirection.Horizontal;
					SortOrder = Enum.SortOrder.LayoutOrder;
				});
				
				RenderCircle = Roact.createElement(RoundButton, {
					LayoutOrder = 1;
					Size = UDim2.new(0.5, 0, 1, 0);
					ButtonSize = UDim2.fromScale(1, 1);
					--Text = "Render All\n["..self.state.MaxRenderAmount.."]";
					
					Text = self.props.arcAngle:map(function(value)
						local max = math.abs(math.floor((360/value)-1));
						if max==math.huge then
							max = 100;
						end

						if self.state.MaxRenderAmount~=max then
							self:setState({
								RenderAmount = math.clamp(self.state.RenderAmount, 1, max);
								MaxRenderAmount = max;
							});
						end
						
						return "Render All ["..max.."]";
					end);
					
					OnActivated = function()
						ArcService:renderMultiple(self.state.MaxRenderAmount);
					end,
				});
				
				Render = Roact.createElement(RoundButton, {
					LayoutOrder = 2;
					Size = UDim2.new(0.5, 0, 1, 0);
					ButtonSize = UDim2.fromScale(1, 1);
					Text = "Render"..(self.state.RenderAmount<=1 and "" or " ["..self.state.RenderAmount.."]");
					
					OnActivated = function()
						if self.state.RenderAmount>1 then
							ArcService:renderMultiple(self.state.RenderAmount);
						else
							ArcService:render();
						end
					end,
				});
			})
		});
	end)
end

return thisPage;