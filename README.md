# Task Management — Frontend

## Linting (ESLint)

- **Run:** `npm run lint`
- **Auto-fix safe issues:** `npm run lint:fix`
- **On production build:** `npm run build` runs `lint` first (`prebuild`). **Errors fail the build**; warnings are reported but do not fail.

Config: `eslint.config.mjs` (flat config). Rules include **`no-undef: error`** (undefined variables), React recommended, React Hooks, and React Refresh.

### Editor (VS Code / Cursor)

With the [ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) installed, the repo `.vscode/settings.json` points ESLint at the `frontend` folder. Use **“ESLint: Fix all auto-fixable Problems”** or enable format-on-save with `source.fixAll.eslint` if you prefer.

To treat warnings as build failures later, change `prebuild` to:

`"prebuild": "eslint src --max-warnings 0"`

## Scripts

| Command        | Description        |
|----------------|--------------------|
| `npm run dev`  | Vite dev server    |
| `npm run build`| Lint then build    |
| `npm run lint` | ESLint `src`       |
