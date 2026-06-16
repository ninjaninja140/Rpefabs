import { ServerStorage } from '@rbxts/services';

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
	AddedCallback?: (previousPrefab: Model | undefined, newPrefab: Model) => void;
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
		// Ensure Prefabs folder exists
		let prefabsFolder = ServerStorage.FindFirstChild('Prefabs') as Folder | undefined;
		if (!prefabsFolder) {
			prefabsFolder = new Instance('Folder');
			prefabsFolder.Name = 'Prefabs';
			prefabsFolder.Parent = ServerStorage;
		}

		// Only setup watch if we haven't already
		if (!this.prefabsFolder) {
			this.prefabsFolder = prefabsFolder;
			this.setupFolderWatch();
		}

		// Clear existing prefabs
		this.prefabs.clear();

		// Scan for prefabs
		this.scanFolder(prefabsFolder);

		const result: LoadedPrefab[] = [];
		this.prefabs.forEach((prefab) => {
			result.push(prefab);
		});
		return result;
	}

	private setupFolderWatch() {
		if (!this.prefabsFolder) return;

		// Disconnect old watchers
		if (this.folderConnection) {
			this.folderConnection.Disconnect();
		}
		if (this.folderRemovingConnection) {
			this.folderRemovingConnection.Disconnect();
		}

		// Watch for descendant changes - use non-blocking scheduled refresh
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

		// Rescan prefabs
		this.prefabs.clear();
		this.scanFolder(this.prefabsFolder);

		// Notify all listeners
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
		// Return unsubscribe function
		return () => {
			const index = this.changeListeners.indexOf(listener);
			if (index > -1) {
				this.changeListeners.remove(index);
			}
		};
	}

	private scanFolder(folder: Folder) {
		for (const child of folder.GetChildren()) {
			if (child.IsA('Model')) {
				this.loadPrefab(child as Model);
			} else if (child.IsA('Folder')) {
				this.scanFolder(child as Folder);
			}
		}
	}

	private loadPrefab(model: Model) {
		const infoModule = model.FindFirstChild('Prefab.info');
		if (!infoModule?.IsA('ModuleScript')) {
			return;
		}

		try {
			const moduleResult = require(infoModule) as { prefab?: PrefabInfo };
			const prefabInfo = moduleResult.prefab;

			if (prefabInfo?.Name) {
				const loadedPrefab: LoadedPrefab = {
					name: prefabInfo.Name,
					tooltip: prefabInfo.Tooltip || '',
					model,
					info: prefabInfo,
					// We don't store the callback from require anymore
					AddedCallback: undefined,
				};

				print(`Loaded prefab: ${prefabInfo.Name}`);
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
			// Clone the model to Prefabs folder
			const prefabClone = model.Clone();
			prefabClone.Name = prefabName;
			prefabClone.Parent = this.prefabsFolder;

			// Create Prefab.info ModuleScript
			const infoModule = new Instance('ModuleScript');
			infoModule.Name = 'Prefab.info';
			infoModule.Parent = prefabClone;

			// Create template code
			const template = `local prefab = {}

prefab.Name = "${prefabName}"
prefab.Tooltip = "Edit this tooltip"

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
