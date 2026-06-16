local Vendor = script.Parent.Parent
local Roact = require(Vendor.Roact)

local joinDictionaries = require(script.Parent.joinDictionaries)
local withTheme = require(script.Parent.withTheme)

local Constants = require(script.Parent.Constants)
local TextInput = Roact.Component:extend("TextInput")

local PLACEHOLDER_TEXT_COLOR = Color3.fromRGB(120, 120, 120) -- works for both themes

local noop = function() end

TextInput.defaultProps = {
	BorderMode = Enum.BorderMode.Inset,
	Size = UDim2.new(1, 0, 0, 21),
	LayoutOrder = 0,
	SelectionStart = -1,
	Disabled = false,
	Text = "",
	PlaceholderText = "",
	ClearTextOnFocus = true,
	OnFocused = noop,
	OnFocusLost = noop,
	OnChanged = noop,
}

function TextInput:init()
	local textBoxRef = Roact.createRef();
	self.textBoxRef = textBoxRef;
	
	self:setState({
		Hover = false,
		Focused = false,
	})
	
	local autoSelect = self.props.AutoSelect
	
	self.onInputBegan = function(_, inputObject)
		if self.props.Disabled then
			return
		elseif inputObject.UserInputType == Enum.UserInputType.MouseMovement then
			self:setState({ Hover = true })
		end
	end
	
	self.onInputEnded = function(_, inputObject)
		if self.props.Disabled then
			return
		elseif inputObject.UserInputType == Enum.UserInputType.MouseMovement then
			self:setState({ Hover = false })
		end
	end
	
	self.onFocused = function()
		local textBox = autoSelect and textBoxRef:getValue()
		if textBox then
			textBox.CursorPosition = textBox.Text:len()+1
			textBox.SelectionStart = 1
		end
		
		self:setState({ Focused = true })
		self.props.OnFocused()
	end
	
	self.onFocusLost = function(_, enterPressed, inputObject)
		self:setState({ Focused = false })
		self.props.OnFocusLost(enterPressed, inputObject)
		
		local textFilter = self.props.TextFilter;
		
		if textFilter then
			local textBox = textBoxRef:getValue();
			local filteredText = textFilter(textBox.Text, true);
			if filteredText==false then
				return
			end
			
			textBox.Text = filteredText or '';
		end
	end
	
	self.onChanged = function(rbx)
		self.props.OnChanged(rbx.Text)
	end
end

function TextInput:render()
	local padding = Roact.createElement("UIPadding", {
		PaddingBottom = self.props.PaddingBottom;
		PaddingLeft = self.props.PaddingLeft or UDim.new(0, 5);
		PaddingRight = self.props.PaddingRight or UDim.new(0, 5);
		PaddingTop = self.props.PaddingTop;
	})
	
	local mainModifier = Enum.StudioStyleGuideModifier.Default
	local borderModifier = Enum.StudioStyleGuideModifier.Default
	if self.props.Disabled then
		mainModifier = Enum.StudioStyleGuideModifier.Disabled
		borderModifier = Enum.StudioStyleGuideModifier.Disabled
	elseif self.state.Focused then
		borderModifier = Enum.StudioStyleGuideModifier.Selected
	elseif self.state.Hover then
		borderModifier = Enum.StudioStyleGuideModifier.Hover
	end
	return withTheme(function(theme)
		local textFieldProps = {
			AnchorPoint = self.props.AnchorPoint;
			Position = self.props.Position;
			Size = self.props.Size;
			BackgroundColor3 = theme:GetColor(self.props.BackgroundColorStyle or Enum.StudioStyleGuideColor.InputFieldBackground, mainModifier),
			BorderColor3 = theme:GetColor(Enum.StudioStyleGuideColor.InputFieldBorder, borderModifier),
			BorderMode = self.props.BorderMode,
			BorderSizePixel = self.props.BorderSizePixel,
			BackgroundTransparency = self.props.BackgroundTransparency;
			LayoutOrder = self.props.LayoutOrder,
			Font = Constants.Font,
			Text = self.props.Text,
			TextTruncate = Enum.TextTruncate.AtEnd,
			TextSize = Constants.TextSize,
			TextScaled = self.props.TextScaled,
			TextColor3 = theme:GetColor(Enum.StudioStyleGuideColor.MainText, mainModifier),
			TextXAlignment = self.props.TextXAlignment or Enum.TextXAlignment.Left,
		}
		
		return self.props.Disabled and Roact.createElement("TextLabel", textFieldProps, { Padding = padding })
			or Roact.createElement(
				"TextBox",
				joinDictionaries(textFieldProps, {
					[Roact.Ref] = self.textBoxRef,
					PlaceholderText = self.props.PlaceholderText,
					PlaceholderColor3 = PLACEHOLDER_TEXT_COLOR,
					ClearTextOnFocus = self.props.ClearTextOnFocus,
					[Roact.Event.Focused] = self.onFocused,
					[Roact.Event.FocusLost] = self.onFocusLost,
					[Roact.Event.InputBegan] = self.onInputBegan,
					[Roact.Event.InputEnded] = self.onInputEnded,
					[Roact.Change.Text] = self.onChanged,
				}),
				{
					Padding = padding,
				});
	end)
end

function TextInput:didMount()
	local textFilter = self.props.TextFilter;

	if textFilter then
		local textBox = self.textBoxRef:getValue()
		
		textBox:GetPropertyChangedSignal("Text"):Connect(function()
			local filteredText = textFilter(textBox.Text);
			if filteredText==false then
				return
			end
			
			textBox.Text = filteredText or '';
			
			if self.state.Focused then
				textBox.CursorPosition = textBox.Text:len()+1;
			end
		end)
	end
end

function TextInput:willUnmount()
	if self.textFilterConnection then
		self.textFilterConnection:Disconnect();
		self.textFilterConnection = nil;
	end
end

return TextInput
