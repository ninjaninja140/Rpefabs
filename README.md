# Roblox Prefabs Plugin

A comprehensive prefab management plugin for Roblox rail games and other projects that need modular, reusable models with intelligent placement controls.

## Features

### 📚 Prefab Library
- **Searchable Library**: Find prefabs quickly by name
- **Visual Previews**: 3D rotating viewport of each prefab
- **Tooltips**: Hover over prefabs to see descriptions
- **Recursive Scanning**: Automatically finds prefabs in nested folders
- **Keyboard Shortcuts Help**: In-app guidance for common actions

### 🎯 Smart Placement
- **Shadow Model**: Semi-transparent blue preview follows your mouse
- **Multiple Snap Modes**:
  - **None**: Free placement anywhere
  - **Grid**: Snap to grid with configurable grid size
  - **Face**: Smart snapping to adjacent part surfaces
- **Rotation Controls**: 90° increment/decrement buttons
- **Placement Counter**: Track how many prefabs you've placed

### ⌨️ Keyboard Shortcuts
- **Click**: Place prefab at mouse position
- **ESC**: Cancel current placement
- **Ctrl+Z**: Undo last placement

### 🔧 Callbacks
Each prefab can define an `AddedCallback` function that executes when the prefab is placed, enabling custom setup logic.

## Prefab Structure

Prefabs are stored in `ServerStorage > Prefabs` as **Models** containing a **ModuleScript** named `Prefab.info`.

### Prefab.info Schema

```lua
local prefab = {}

prefab.Name = "Rail";
prefab.Tooltip = "This is a rail piece";

prefab.AddedCallback = function(previousPrefab, newPrefab)
    -- Called when this prefab is placed
    -- previousPrefab: The previously placed prefab model (or nil)
    -- newPrefab: The newly placed prefab model
end

return { prefab = prefab }
```

## Installation

1. Place this plugin folder in your `Plugins` directory
2. Restart Roblox Studio
3. The **Prefabs** toolbar button will appear
4. Click to open the prefabs library

## Usage

### Setting Up Prefabs

1. In **ServerStorage**, create a folder named `Prefabs`
2. Add Model instances containing your prefab geometry
3. In each Model, create a ModuleScript named `Prefab.info`
4. Define the prefab metadata using the schema above
5. Open the plugin and your prefabs will appear in the library

### Placing Prefabs

1. Click the **Prefabs** toolbar button
2. Search for a prefab or scroll the library
3. Click a prefab card to start placement mode
4. The shadow model will follow your mouse
5. Adjust rotation with the rotation buttons
6. Choose a snap mode (None, Grid, Face)
7. If Grid mode, customize the grid size
8. Click to place the prefab
9. Repeat or press ESC to return to library

### Undoing Placements

- **Undo Button**: Click "Undo" in the placement UI
- **Keyboard**: Press Ctrl+Z while placing

### Canceling Placement

- **Cancel Button**: Click "Cancel" to return to library
- **Keyboard**: Press ESC to return to library

## UI Components

- **PrefabsApp**: Root state management
- **PrefabLibrary**: Searchable prefab grid with hints
- **PrefabCard**: Individual prefab tile with 3D preview
- **PlacementUI**: Placement controls (rotation, snapping, undo/cancel)
- **KeyboardHints**: Keyboard shortcut reference

## Services

- **PrefabService**: Scans `ServerStorage/Prefabs` and loads prefab metadata
- **PlacementSystem**: Manages shadow models, placement logic, snapping modes, and undo history

## Configuration

### Grid Size
When using **Grid** snap mode, customize the grid spacing:
- Default: 1 stud
- Adjust in the "Grid Size" input field during placement

### Snap Modes
Toggle between three snap modes:
- **None**: Free placement
- **Grid**: Align to grid
- **Face**: Snap to part surfaces

## Technical Details

### Technology Stack
- **TypeScript** with roblox-ts compiler
- **React** for UI components
- **Roblox UI Framework** (custom components library)

### Browser-like UI
The plugin appears as a dockable window in Roblox Studio, similar to the Explorer or Output windows.

## Tips & Tricks

1. **Organizing Prefabs**: Use folders within `Prefabs` to organize by category
2. **Batch Placement**: Place multiple copies of the same prefab without re-selecting
3. **Callbacks**: Use `AddedCallback` to trigger connected track snapping or other setup
4. **Grid Alignment**: Adjust grid size based on your prefab dimensions

## Troubleshooting

- **Prefabs not showing**: Ensure ModuleScript is named exactly `Prefab.info`
- **Viewport not rendering**: Check that prefab is a valid Model with parts
- **Placement fails**: Check that `ServerStorage/Prefabs` folder exists
- **Callbacks not firing**: Verify callback function signature matches schema

## Future Enhancements

- Batch import from inventory
- Custom placement guides and grid visualization
- Prefab favorites/bookmarks
- History of placed prefabs
- Advanced snapping (corner snapping, auto-alignment)
- Prefab preview thumbnails

## Support

For issues or feature requests, check the plugin logs in Roblox Studio's Output window.
