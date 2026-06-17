import { HttpService, ServerStorage } from '@rbxts/services';

export interface PrefabInfo {
	Name: string;
	Tooltip: string;
	AddedCallback?: (previousPrefab: Model | undefined, newPrefab: Model) => void;
}

export interface LoadedPrefab {
	name: string;
	tooltip: string;
	model: Model;
	info: PrefabInfo;
}

type PrefabChangeListener = (prefabs: LoadedPrefab[]) => void;

class PrefabServiceClass {
	private prefabs: Map<string, LoadedPrefab> = new Map();
	private prefabsFolder: Folder | undefined;
	private changeListeners: PrefabChangeListener[] = [];
	private folderConnection: RBXScriptConnection | undefined;
	private folderRemovingConnection: RBXScriptConnection | undefined;
	private refreshScheduled: boolean = false;

	scanPrefabs(): LoadedPrefab[] {
		let prefabsFolder = ServerStorage.FindFirstChild('Prefabs') as Folder | undefined;
		if (!prefabsFolder) {
			prefabsFolder = new Instance('Folder');
			prefabsFolder.Name = 'Prefabs';
			prefabsFolder.Parent = ServerStorage;
		}

		if (!this.prefabsFolder) {
			this.prefabsFolder = prefabsFolder;
			this.setupFolderWatch();
		}

		this.prefabs.clear();
		this.scanFolder(prefabsFolder);

		const result: LoadedPrefab[] = [];
		this.prefabs.forEach((prefab) => {
			result.push(prefab);
		});

		this.changeListeners.forEach((listener) => {
			listener(result);
		});

		return result;
	}

	private setupFolderWatch() {
		if (!this.prefabsFolder) return;

		if (this.folderConnection) this.folderConnection.Disconnect();
		if (this.folderRemovingConnection) this.folderRemovingConnection.Disconnect();

		this.folderConnection = this.prefabsFolder.DescendantAdded.Connect(() => {
			if (!this.refreshScheduled) {
				this.refreshScheduled = true;
				task.delay(0.1, () => {
					this.refreshPrefabs();
					this.refreshScheduled = false;
				});
			}
		});

		this.folderRemovingConnection = this.prefabsFolder.DescendantRemoving.Connect(() => {
			if (!this.refreshScheduled) {
				this.refreshScheduled = true;
				task.delay(0.1, () => {
					this.refreshPrefabs();
					this.refreshScheduled = false;
				});
			}
		});
	}

	private refreshPrefabs() {
		if (!this.prefabsFolder) return;

		this.prefabs.clear();
		this.scanFolder(this.prefabsFolder);

		const updated: LoadedPrefab[] = [];
		this.prefabs.forEach((prefab) => {
			updated.push(prefab);
		});
		this.changeListeners.forEach((listener) => {
			listener(updated);
		});
	}

	onPrefabsChanged(listener: PrefabChangeListener): () => void {
		this.changeListeners.push(listener);
		return () => {
			const index = this.changeListeners.indexOf(listener);
			if (index > -1) this.changeListeners.remove(index);
		};
	}

	private scanFolder(folder: Folder) {
		for (const child of folder.GetChildren())
			if (child.IsA('Model')) {
				if (!child.GetAttribute('PrefabID')) child.SetAttribute('PrefabID', HttpService.GenerateGUID(false));
				this.loadPrefab(child);
			} else if (child.IsA('Folder')) this.scanFolder(child);
	}

	private loadPrefab(model: Model) {
		const infoModule = model.FindFirstChild('Prefab.info');
		if (!infoModule?.IsA('ModuleScript')) return;

		try {
			const moduleResult = require(infoModule) as { prefab?: PrefabInfo };
			const prefabInfo = moduleResult.prefab;

			if (prefabInfo?.Name) {
				const loadedPrefab: LoadedPrefab = {
					name: prefabInfo.Name,
					tooltip: prefabInfo.Tooltip || '',
					model,
					info: prefabInfo,
				};

				this.prefabs.set(prefabInfo.Name, loadedPrefab);
			}
		} catch (error) {
			warn(`Failed to load prefab from ${model.Name}:`, error);
		}
	}

	getPrefabs(): LoadedPrefab[] {
		const result: LoadedPrefab[] = [];
		this.prefabs.forEach((prefab) => {
			result.push(prefab);
		});
		return result;
	}

	getPrefabByName(name: string): LoadedPrefab | undefined {
		return this.prefabs.get(name);
	}

	createPrefabInstance(name: string): Model | undefined {
		const prefab = this.prefabs.get(name);
		if (!prefab) return undefined;

		const clone = prefab.model.Clone();
		return clone;
	}

	async createPrefabFromModel(model: Model, prefabName: string): Promise<ModuleScript | undefined> {
		if (!this.prefabsFolder) return undefined;

		try {
			const prefabClone = model.Clone();
			prefabClone.Name = prefabName;
			prefabClone.Parent = this.prefabsFolder;

			const prefabId = HttpService.GenerateGUID(false);
			prefabClone.SetAttribute('PrefabID', prefabId);

			const infoModule = new Instance('ModuleScript');
			infoModule.Name = 'Prefab.info';
			infoModule.Parent = prefabClone;

			const template = `local prefab = {}

prefab.Name = "${prefabName}"
prefab.Tooltip = "Edit this tooltip"
prefab.PrefabID = "${prefabId}"

prefab.AddedCallback = function(previousPrefab, newPrefab)
	-- Called when this prefab is placed
	-- previousPrefab: The previously placed prefab of this type (or nil)
	-- newPrefab: The newly placed prefab
end

return { prefab = prefab }
`;
			infoModule.Source = template;

			return infoModule;
		} catch (error) {
			warn(`Failed to create prefab: ${error}`);
			return undefined;
		}
	}
}

export const PrefabService = new PrefabServiceClass();
