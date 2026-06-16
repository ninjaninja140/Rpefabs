# Plugin Testing Guide

This guide walks through testing the complete prefab plugin workflow.

## Test Setup

1. **Create a test place** in Roblox Studio
2. **Install the plugin** by dragging this folder to `Plugins/` directory
3. **Restart Roblox Studio** or reload the plugin

## Test 1: Basic Library Display

**Goal**: Verify the plugin UI appears and loads prefabs

### Steps
1. Click the "Prefabs" toolbar button
2. Verify a dock widget appears on the left side
3. Verify keyboard shortcuts appear at the top of the library
4. If no prefabs exist, you should see "No prefabs found" message

### Expected Result
✅ Dock widget opens with empty library

---

## Test 2: Create and Load Prefabs

**Goal**: Create test prefabs and verify they appear in library

### Steps

1. In Roblox Studio, select **ServerStorage**
2. Insert a **Folder** and name it `Prefabs`
3. Inside Prefabs, create a **Model** named `TestRail`
4. Inside TestRail, insert a **Part** (the geometry)
5. Configure the part:
   - Size: (4, 1, 1)
   - Color: Red
6. Select TestRail model, insert a **ModuleScript** named `Prefab.info`
7. Replace the script with:
   ```lua
   local prefab = {}
   prefab.Name = "Test Rail"
   prefab.Tooltip = "A test rail segment"
   return { prefab = prefab }
   ```
8. In the plugin, search for "test"

### Expected Result
✅ "Test Rail" prefab card appears in library with red 3D preview and tooltip

---

## Test 3: Placement Mode

**Goal**: Verify placement UI and controls work

### Steps

1. Click the "Test Rail" prefab card
2. Verify:
   - Library closes
   - Placement UI appears
   - Header shows "Placing: Test Rail"
   - Placed count shows "0"
   - Rotation shows "0°"
   - Snap mode buttons appear
   - Shadow model follows mouse in viewport

### Expected Result
✅ Placement UI is responsive and shadow model tracks mouse

---

## Test 4: Rotation Controls

**Goal**: Test rotation increment/decrement

### Steps

1. In placement mode, click the rotate-right button
2. Verify rotation changes to 90°
3. Click rotate-right again → 180°
4. Click rotate-left twice → back to 0°

### Expected Result
✅ Rotation updates correctly with 90° increments

---

## Test 5: Snap Modes

**Goal**: Test all three snap modes

### Steps

1. **Test Grid Mode**:
   - Click "Grid" button
   - Grid Size input appears
   - Change to 2
   - Place a prefab → should snap to 2-stud grid
   
2. **Test Face Mode**:
   - Click "Face" button
   - Place another prefab near existing one
   - Should snap to adjacent surface
   
3. **Test None Mode**:
   - Click "None" button
   - Place prefab → free placement

### Expected Result
✅ Each snap mode places prefabs at different positions

---

## Test 6: Placement and Undo

**Goal**: Verify placement logic and undo functionality

### Steps

1. In placement mode with "None" snap:
   - Click in viewport to place first prefab
   - Verify placed count increases to 1
   - Click again to place second prefab → count = 2
   - Click "Undo" button → count = 1
   - Press Ctrl+Z → count = 0

### Expected Result
✅ Prefabs place in workspace and undo removes them

---

## Test 7: Cancel Placement

**Goal**: Test exit from placement mode

### Steps

1. Click a prefab to enter placement mode
2. Press ESC key
3. Verify library reappears

### Expected Result
✅ Shadow model disappears and library UI shows

---

## Test 8: Search Functionality

**Goal**: Test prefab search filtering

### Steps

1. Create 2-3 test prefabs (e.g., "Rail A", "Rail B", "Post")
2. In library, type "Rail" in search box
3. Verify only Rail prefabs appear
4. Clear search → all prefabs return

### Expected Result
✅ Search filters prefab list correctly

---

## Test 9: Callback Execution

**Goal**: Verify AddedCallback is called

### Steps

1. Modify Prefab.info to include callback:
   ```lua
   prefab.AddedCallback = function(prev, new)
       new.Name = "Placed_" .. tick()
   end
   ```
2. Place the prefab twice
3. Check the workspace — both should have names starting with "Placed_"

### Expected Result
✅ Callback executes and modifies placed model

---

## Test 10: Multiple Prefabs

**Goal**: Test library with many prefabs

### Steps

1. Create 10+ test prefabs with various names
2. Open library
3. Verify all appear in grid layout
4. Scroll through list
5. Search to filter

### Expected Result
✅ Library handles many prefabs smoothly

---

## Checklist

- [ ] Plugin installs and opens
- [ ] Prefabs load from ServerStorage
- [ ] Library displays prefab cards with previews
- [ ] Search filters prefabs
- [ ] Placement mode enters/exits correctly
- [ ] Shadow model follows mouse
- [ ] Rotation controls work
- [ ] Snap modes all function
- [ ] Grid size customization works
- [ ] Placement places models in workspace
- [ ] Undo removes placed models
- [ ] Callbacks execute on placement
- [ ] Cancel returns to library
- [ ] Keyboard shortcuts work (ESC, Ctrl+Z)

---

## Known Limitations

- Viewport 3D rendering requires proper lighting setup
- Face snapping is basic (doesn't prioritize closest face perfectly)
- SelectionBox adornment may not be highly visible on all models
- Very large prefabs may not render well in viewport

---

## Debug Info

If things aren't working:

1. Check **Output window** for errors
2. Verify `ServerStorage/Prefabs` folder exists
3. Verify ModuleScript is named exactly `Prefab.info`
4. Ensure prefab module returns `{ prefab = prefab }`
5. Check that parts have proper Transparency/CanCollide values

