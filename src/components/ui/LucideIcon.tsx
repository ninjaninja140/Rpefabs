import { type Asset, GetAsset } from '@rbxts/lucide';
import React, { useMemo } from '@rbxts/react';

interface ILucideIconProps {
	IconName: string;
	IconResolution?: 48 | 256;
	IconSize: number;
	ImageColor3?: Color3;
	Scale?: number;
	ImageTransparency?: number;
	Visible?: boolean;
	Rotation?: number | React.Binding<number>;
}

const empty_asset: Asset = {
	IconName: '',
	Id: 0,
	Url: '',
	ImageRectSize: Vector2.zero,
	ImageRectOffset: Vector2.zero,
};

const cached_icons_map = new Map<string, Asset>();
function GetAssetSafe(icon_name: string, icon_resolution: 48 | 256 = 256): Asset {
	const key = `${icon_name}_${icon_resolution}`;

	if (cached_icons_map.has(icon_name)) return cached_icons_map.get(icon_name)!;

	const [succ, res] = pcall(() => GetAsset(icon_name, icon_resolution));
	if (!succ) {
		warn(`Failed to get Lucide icon ("${icon_name}"): ${res}`);
		cached_icons_map.set(key, empty_asset);
		return empty_asset;
	}
	cached_icons_map.set(key, res);
	return res;
}

/**
 * Use only in container like frame or smth else
 * Lucide Icons by https://lucide.dev/ v0.292.0
 */
export function LucideIcon(props: ILucideIconProps) {
	const icon_data = useMemo(
		() => GetAssetSafe(props.IconName, props.IconResolution ?? 48),
		[props.IconName, props.IconResolution]
	);

	return (
		<imagelabel
			BackgroundTransparency={1}
			BorderSizePixel={0}
			Size={new UDim2(0, props.IconSize * (props.Scale ?? 1), 0, props.IconSize * (props.Scale ?? 1))}
			Position={UDim2.fromScale(0.5, 0.5)}
			AnchorPoint={new Vector2(0.5, 0.5)}
			Image={icon_data.Url}
			ImageRectSize={icon_data.ImageRectSize}
			ImageRectOffset={icon_data.ImageRectOffset}
			Visible={props.Visible}
			ImageColor3={props.ImageColor3}
			ImageTransparency={props.ImageTransparency}
			Rotation={props.Rotation}
		/>
	);
}
