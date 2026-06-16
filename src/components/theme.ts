export const UITheme = {
	colors: {
		accent: Color3.fromRGB(49, 86, 255),
		background: Color3.fromRGB(13, 14, 18),
		surface: Color3.fromRGB(13, 14, 18),
		surfaceRaised: Color3.fromRGB(21, 22, 28),
		stroke: Color3.fromRGB(122, 122, 122),
		text: Color3.fromRGB(255, 255, 255),
		textMuted: Color3.fromRGB(188, 194, 210),
		danger: Color3.fromRGB(253, 0, 45),
		success: Color3.fromRGB(0, 254, 82),
		warning: Color3.fromRGB(255, 221, 0),
	},
	radius: {
		sm: new UDim(0, 4),
		md: new UDim(0, 5),
		lg: new UDim(0, 8),
		pill: new UDim(1, 0),
	},
	fonts: {
		regular: Font.fromName('BuilderSans', Enum.FontWeight.Regular, Enum.FontStyle.Normal),
		medium: Font.fromName('BuilderSans', Enum.FontWeight.Medium, Enum.FontStyle.Normal),
		semiBold: Font.fromName('BuilderSans', Enum.FontWeight.SemiBold, Enum.FontStyle.Normal),
		bold: Font.fromName('BuilderSans', Enum.FontWeight.Bold, Enum.FontStyle.Normal),
	},
};
