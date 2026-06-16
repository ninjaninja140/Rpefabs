import React, { useEffect, useState } from "@rbxts/react";
import { Workspace } from "@rbxts/services";
import { getScale } from "ui/lib/screen";

export function Scale() {
	const [scale, setScale] = useState(getScale());

	useEffect(() => {
		const camera = Workspace.CurrentCamera!;

		const conn = camera
			.GetPropertyChangedSignal("ViewportSize")
			.Connect(() => setScale(getScale()));

		return () => conn.Disconnect();
	}, []);

	return <uiscale Scale={scale} />;
}
