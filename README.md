<div align="center" id="top">
    <img src="https://github.com/nn140/Branding/blob/main/LogoWhite-Full.png?raw=true" alt="NN140.UK logo" width="800"/>
    <img src="https://github.com/nn140/Branding/blob/main/LogoBlack-Full.png?raw=true" alt="NN140.UK logo" width="800"/>
    <br />
    <br />
    <img src="https://img.shields.io/badge/Stripe-Donate%20to%20support%20NN140.UK-1b1b1b?style=for-the-badge&labelColor=6860ff&logo=stripe&logoColor=ffffff&logoSize=auto&link=https%3A%2F%2Fdonate.stripe.com%2F9B6eVdbTd4n1a6H1yXa3u04&link=https%3A%2F%2Fdonate.stripe.com%2F9B6eVdbTd4n1a6H1yXa3u04" alt="Badge">
    <img src="https://img.shields.io/badge/Stripe-Donate%20to%20Support%20NN140.UK%20(RECCURING)-1b1b1b?style=for-the-badge&labelColor=6860ff&logo=stripe&logoColor=ffffff&logoSize=auto&link=https%3A%2F%2Fdonate.stripe.com%2FdRm9ATe1laLpgv5b9xa3u05&link=https%3A%2F%2Fdonate.stripe.com%2FdRm9ATe1laLpgv5b9xa3u05" alt="Badge">
</div>

<hr />

## Rpefabs

> A Roblox prefabs plugin with a intentionally misspelled name.

**Rpefabs** is a Roblox Studio plugin that lets you quickly insert, manage, and share prefabs — reusable collections of instances — directly inside the Studio editor. Yes, the name is misspelled on purpose. No, I'm not fixing it.

Built with **roblox-ts**, **React**, and **Lucide** icons.

---

## Installation

### Option 1: Pre-built Plugin

1. Download the latest Rpefabs.rbxmx from [Releases](https://github.com/your-org/roblox-prefabs-plugin/releases).
2. Open Roblox Studio.
3. Right-click the **Plugins** folder in the Explorer and select **Insert from File**.
4. Choose the downloaded Rpefabs.rbxmx file.
5. The plugin will appear under the **Plugins** tab on next load.

### Option 2: Manual Plugin Folder

1. Download Rpefabs.rbxmx from [Releases](https://github.com/your-org/roblox-prefabs-plugin/releases).
2. Copy it to your Roblox Studio **Plugins** folder:
   - **Windows:** %LocalAppData%\Roblox\Plugins\
   - **macOS:** ~/Documents/Roblox/Plugins/
3. Restart Roblox Studio.

### Option 3: Build from Source

`ash

# Install dependencies (requires Yarn 4)

yarn install

# Compile TypeScript to Luau

yarn build

# Build the .rbxmx plugin file

yarn out
`

Then install the resulting Rpefabs.rbxmx using Option 1 or 2.

### Option 4: Development (Rojo Serve)

`ash
yarn install
yarn serve
`

Then connect Rojo in Roblox Studio to sync files live.

---

## Usage

1. Open Roblox Studio and navigate to the **Plugins** tab.
2. Click the **Rpefabs** button to open the prefab browser.
3. Browse, search, and select prefabs from the library.
4. Click a prefab card to begin placing it in the viewport.
5. Use the Arc Panel to rotate and position before confirming placement.
6. Right-click any instance in the Explorer and choose **Save as Prefab** to create a new prefab from your selection.

---

## Scripts

| Command | Description |
|---------|-------------|
| yarn build | Compile TypeScript → Luau via
bxtsc |
| yarn watch | Watch mode for development |
| yarn out | Build Rpefabs.rbxmx via Rojo |
| yarn serve | Start Rojo dev server |

---

## Contributing

Pull requests are welcome. Please open an issue first to discuss what you'd like to change.

Run yarn biome format --write . before committing to keep formatting consistent.

---

## License

[MIT](./LICENSE)

---

**"Rpefabs"** — We're too lazy to rename it.

<hr />

<div align="center" id="top">
    <img src="https://img.shields.io/badge/Stripe-Donate%20to%20support%20NN140.UK-1b1b1b?style=for-the-badge&labelColor=6860ff&logo=stripe&logoColor=ffffff&logoSize=auto&link=https%3A%2F%2Fdonate.stripe.com%2F9B6eVdbTd4n1a6H1yXa3u04&link=https%3A%2F%2Fdonate.stripe.com%2F9B6eVdbTd4n1a6H1yXa3u04" alt="Badge">
    <img src="https://img.shields.io/badge/Stripe-Donate%20to%20Support%20NN140.UK%20(RECCURING)-1b1b1b?style=for-the-badge&labelColor=6860ff&logo=stripe&logoColor=ffffff&logoSize=auto&link=https%3A%2F%2Fdonate.stripe.com%2FdRm9ATe1laLpgv5b9xa3u05&link=https%3A%2F%2Fdonate.stripe.com%2FdRm9ATe1laLpgv5b9xa3u05" alt="Badge">
    <br />
    <br />
    <img src="https://github.com/nn140/Branding/blob/main/LogoBlack-Full.png?raw=true" alt="NN140.UK logo" width="800"/>
    <img src="https://github.com/nn140/Branding/blob/main/LogoWhite-Full.png?raw=true" alt="NN140.UK logo" width="800"/>
</div>
