# SQL INSERT ➜ JSON + HTML Table

English | [中文说明](README.zh.md)

Free online SQL to JSON/Table converter – paste SQL, get JSON or HTML instantly.

A lightweight web tool to convert SQL INSERT statements into JSON and a rendered HTML table. Supports multiple statements, schema inference from CREATE TABLE, inline validation, JSON previews, downloads, and more.

Note: This is a 100% client-side web app (pure HTML/JS). It requires no backend and works perfectly on GitHub Pages.

[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-2ea44f?logo=github)](https://snakewa.github.io/html5-sql-insert-tools/)
![Static](https://img.shields.io/badge/Client--side-Static-blue)
![Language](https://img.shields.io/badge/i18n-EN%2FZH-informational)
![Theme](https://img.shields.io/badge/Theme-Light%20%7C%20Dark%20%7C%20System-7952B3)
![License](https://img.shields.io/badge/License-MIT-green)
![Last Commit](https://img.shields.io/github/last-commit/snakewa/html5-sql-insert-tools)

## Live Demo

- URL: https://snakewa.github.io/html5-sql-insert-tools/

## Why 

- Zero setup: paste SQL, convert directly in the browser. No DB server required.
- Multiple outputs: JSON for APIs, HTML tables for reports/dashboards.
- Easy updates: generate UPDATE statements from selected rows for quick fixes.
- Education-friendly: visualize how SQL maps to JSON/HTML.
- Offline-ready: pure HTML5/JavaScript, runs anywhere, ideal for GitHub Pages.

## Support (Buy Me a Coffee)

Hi! I built this free tool to quickly turn SQL into JSON or HTML tables. If it saved you time, consider buying me a coffee—your support helps me improve and add features!

<a href="https://www.buymeacoffee.com/snakewa" target="_blank">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="48" width="173">
  </a>

## Features

- Robust parsing of `INSERT INTO ... VALUES (...), (...);` across multiple tables
- Optional column list: supports `INSERT INTO table VALUES (...)` and infers columns
- Schema-aware: extracts column names from `CREATE TABLE` blocks when present
- Type normalization: numbers, booleans, `NULL`, quoted strings
- Multiple outputs: JSON (grouped by table or flat array) and HTML tables
- Inline messages: errors and warnings shown in-page
- Row-level mismatch indicators when values count ≠ columns count
- JSON cell handling:
  - Detects JSON-like strings and renders preview or expanded view
  - Click “View” to open a modal with pretty-printed JSON
  - Toggle to expand JSON values by default
- Copy/Download:
  - Copy JSON to clipboard
  - Download JSON (grouped/flat to match current mode)
  - Download CSV (always flat, includes `__table` column)

## Getting Started

1. Open `index.html` in your browser (no build step required).
2. Paste SQL in the textarea. You can include `CREATE TABLE` statements and multiple `INSERT` statements.
3. Click `Convert`.
4. Use the Output selector to switch between Grouped and Flat JSON.
5. Copy/Download results or inspect the HTML tables.

## Example

```sql
CREATE TABLE products (
  id INT PRIMARY KEY,
  name TEXT,
  price DECIMAL(10,2),
  stock INT
);

INSERT INTO products VALUES
  (1, 'Laptop', 999.99, 5),
  (2, 'Mouse', 24.99, 10);
```

Produces grouped JSON:
```json
{
  "products": [
    { "id": 1, "name": "Laptop", "price": 999.99, "stock": 5 },
    { "id": 2, "name": "Mouse",  "price": 24.99,  "stock": 10 }
  ]
}
```

## UI Controls

- Convert button: parse and render
- Output: `Grouped by Table` or `Flat Array`
- Expand JSON values: when on, JSON-like cell strings render expanded inline
- Copy JSON: copies current JSON view (grouped or flat) to clipboard
- Download JSON: downloads current JSON view
- Download CSV: downloads a flat CSV (includes `__table` column)

## Validation

- If the number of values in a tuple does not match the number of columns:
  - A warning is shown inline
  - Missing values are set to `null`
  - Extra values are ignored
  - The affected table row is marked with a `mismatch` badge

## Notes & Limitations

- Supported now:
  - `INSERT INTO ... (cols) VALUES (...), (...);`
  - `INSERT INTO ... VALUES (...), (...);` (columns inferred or from schema)
  - `CREATE TABLE` simple column lists (+ skipping constraints)
- Not supported yet: `INSERT ... SELECT`, `ON CONFLICT/RETURNING`, complex vendor-specific syntax, deep type parsing in `CREATE TABLE`.
- JSON-like detection is best-effort on strings that look like `{...}` or `[...]` and parse via `JSON.parse`.

## Development

- All logic is in `script.js`; UI is in `index.html`.
- No external build tools required. Bootstrap CDN is used for styling.

## Offline Usage (Download ZIP)

Use the app locally without any server:

1. Go to the repository page: https://github.com/snakewa/html5-sql-insert-tools
2. Click the green "Code" button → "Download ZIP".
3. Extract the ZIP to a folder on your computer.
4. Open the extracted folder and double‑click `index.html` to launch in your browser.
5. Paste your SQL and click Convert.

## License

MIT
