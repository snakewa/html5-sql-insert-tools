# SQL INSERT ➜ JSON + HTML Table

A lightweight web tool to convert SQL INSERT statements into JSON and a rendered HTML table. Supports multiple statements, schema inference from CREATE TABLE, inline validation, JSON previews, downloads, and more.

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

## License

MIT
