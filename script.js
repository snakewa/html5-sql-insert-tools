document.addEventListener('DOMContentLoaded', function() {
    const sqlInput = document.getElementById('sqlInput');
    const convertBtn = document.getElementById('convertBtn');
    const jsonOutput = document.getElementById('jsonOutput');
    const tableOutput = document.getElementById('tableOutput');
    const outputDiv = document.getElementById('output');
    const messagesDiv = document.getElementById('messages');
    const outputModeSel = document.getElementById('outputMode');
    const downloadJsonBtn = document.getElementById('downloadJsonBtn');
    const downloadCsvBtn = document.getElementById('downloadCsvBtn');
    const expandJsonToggle = document.getElementById('expandJsonToggle');
    const copyJsonBtn = document.getElementById('copyJsonBtn');
    const viewJsonBtn = document.getElementById('viewJsonBtn');
    const jsonModalEl = document.getElementById('jsonModal');
    const jsonModalBody = document.getElementById('jsonModalBody');
    const actionModalEl = document.getElementById('actionModal');
    const actionModalBody = document.getElementById('actionModalBody');
    const actionCopyBtn = document.getElementById('actionCopyBtn');
    const compareBtn = document.getElementById('compareBtn');
    const generateUpdateBtn = document.getElementById('generateUpdateBtn');

    // state for downloads
    let lastFlatRows = [];
    let lastGrouped = {};
    let lastItems = [];

    convertBtn.addEventListener('click', function() {
        clearMessages();
        const sql = sqlInput.value.trim();
        if (!sql) {
            addMessage('warning', 'Please enter SQL input.');
            return;
        }

        try {
            const { items, warnings } = parseSQLInsert(sql);
            lastItems = items;
            displayResults(items, warnings);
        } catch (error) {
            addMessage('danger', 'Error parsing SQL: ' + error.message);
            console.error(error);
        }
    });

    outputModeSel.addEventListener('change', () => {
        // re-render if we have data
        if (lastItems.length) {
            displayResults(lastItems, []);
        }
    });

    downloadJsonBtn.addEventListener('click', () => {
        if (!lastFlatRows.length && !Object.keys(lastGrouped).length) {
            addMessage('warning', 'Nothing to download yet. Convert some SQL first.');
            return;
        }
        const isGrouped = outputModeSel.value === 'grouped';
        const data = isGrouped ? lastGrouped : lastFlatRows;
        const content = JSON.stringify(data, null, 2);
        downloadBlob(content, 'application/json', isGrouped ? 'data_grouped.json' : 'data_flat.json');
    });

    downloadCsvBtn.addEventListener('click', () => {
        if (!lastFlatRows.length && !Object.keys(lastGrouped).length) {
            addMessage('warning', 'Nothing to download yet. Convert some SQL first.');
            return;
        }
        // Always CSV from flat rows; include __table column
        const flatRows = lastFlatRows.length ? lastFlatRows : lastFlatFromGrouped(lastGrouped);
        const csv = toCSV(flatRows);
        downloadBlob(csv, 'text/csv', 'data.csv');
    });

    expandJsonToggle?.addEventListener('change', () => {
        if (lastItems.length) displayResults(lastItems, []);
    });

    copyJsonBtn?.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(jsonOutput.textContent || '');
            addMessage('success', 'JSON copied to clipboard.');
        } catch (e) {
            addMessage('danger', 'Failed to copy JSON: ' + (e?.message || e));
        }
    });

    viewJsonBtn?.addEventListener('click', () => {
        const content = jsonOutput.textContent || '';
        if (!content) {
            addMessage('warning', 'Nothing to view yet. Convert some SQL first.');
            return;
        }
        jsonModalBody.textContent = content;
        try {
            const modal = new bootstrap.Modal(jsonModalEl);
            modal.show();
        } catch (e) {
            // Fallback: show in action modal if bootstrap namespace isn't available yet
            actionModalBody.textContent = content;
            try { new bootstrap.Modal(actionModalEl).show(); } catch (_) {}
        }
    });

    actionCopyBtn?.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(actionModalBody.textContent || '');
            addMessage('success', 'Content copied to clipboard.');
        } catch (e) {
            addMessage('danger', 'Failed to copy: ' + (e?.message || e));
        }
    });

    function lastFlatFromGrouped(grouped) {
        const rows = [];
        Object.entries(grouped || {}).forEach(([table, arr]) => {
            arr.forEach(obj => rows.push({ __table: table, ...(obj || {}) }));
        });
        return rows;
    }

    function addMessage(type, text) {
        const div = document.createElement('div');
        div.className = `alert alert-${type} py-2 mb-2`;
        div.textContent = text;
        messagesDiv.appendChild(div);
    }

    function clearMessages() {
        messagesDiv.innerHTML = '';
    }

    function downloadBlob(content, mime, filename) {
        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    function toCSV(rows) {
        if (!rows || rows.length === 0) return '';
        const headers = Array.from(rows.reduce((set, r) => {
            Object.keys(r).forEach(k => set.add(k));
            return set;
        }, new Set()));
        const escape = v => {
            if (v === null || v === undefined) return '';
            const s = String(v);
            if (/[,"\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
            return s;
        };
        const lines = [headers.join(',')];
        rows.forEach(r => {
            lines.push(headers.map(h => escape(r[h])).join(','));
        });
        return lines.join('\n');
    }

    function tryParseJSONLike(str) {
        if (typeof str !== 'string') return { ok: false };
        const s = str.trim();
        if (!(s.startsWith('{') && s.endsWith('}')) && !(s.startsWith('[') && s.endsWith(']'))) {
            return { ok: false };
        }
        try {
            const obj = JSON.parse(s);
            return { ok: true, value: obj };
        } catch (e) {
            return { ok: false };
        }
    }

    function renderCellContent(value) {
        const expand = !!(expandJsonToggle && expandJsonToggle.checked);
        const jp = tryParseJSONLike(value);
        if (jp.ok) {
            const pretty = JSON.stringify(jp.value, null, 2);
            if (expand) {
                const escaped = pretty.replace(/&/g, '&amp;').replace(/</g, '&lt;');
                return `<div class="json-inline"><pre class="mb-0">${escaped}</pre><button type="button" class="btn btn-link btn-sm p-0 mt-1 json-view-btn">View</button></div>`;
            } else {
                const preview = pretty.length > 80 ? pretty.slice(0, 77) + '...' : pretty;
                const escapedPrev = preview.replace(/&/g, '&amp;').replace(/</g, '&lt;');
                return `<span class="json-preview">${escapedPrev}</span> <button type="button" class="btn btn-link btn-sm p-0 json-view-btn">View</button>`;
            }
        }
        return value === null || value === undefined ? '' : String(value);
    }

    function attachJsonViewHandlers(scopeEl) {
        scopeEl.querySelectorAll('.json-view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Find the nearest parent cell and reconstruct JSON text from sibling pre or preview
                const cell = e.target.closest('td');
                if (!cell) return;
                // Try to find JSON text: prefer inline <pre>, else text of .json-preview (without 'View')
                let jsonText = '';
                const pre = cell.querySelector('pre');
                if (pre) {
                    jsonText = pre.textContent || '';
                } else {
                    const prev = cell.querySelector('.json-preview');
                    if (prev) {
                        // The preview is truncated, but we can try to read the underlying original value from a data attribute
                        // Fallback: just use textContent
                        jsonText = prev.textContent || '';
                    }
                }
                // If truncated, better to get original from title attribute if present
                const raw = cell.getAttribute('data-raw-json');
                if (raw) jsonText = raw;

                if (!jsonText) return;
                jsonModalBody.textContent = jsonText;
                const modal = bootstrap.Modal ? new bootstrap.Modal(jsonModalEl) : null;
                modal && modal.show();
            });
        });
    }

    // ---- Parsing helpers (robust and reusable) ----
    function cleanIdent(name) {
        return name.trim().replace(/^[`\[\"]|[`\]\"]$/g, '');
    }

    function unquote(str) {
        const s = str.trim();
        if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) {
            let inner = s.slice(1, -1);
            // SQL single quote escaping: '' -> '
            inner = inner.replace(/''/g, "'");
            return inner;
        }
        return s;
    }

    function normalizeValue(raw) {
        if (raw == null) return null;
        const s = raw.trim();
        if (s.length === 0) return '';

        // NULL
        if (/^null$/i.test(s)) return null;
        // Booleans
        if (/^true$/i.test(s)) return true;
        if (/^false$/i.test(s)) return false;

        // Quoted string
        if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) {
            return unquote(s);
        }

        // Numeric (integer or float)
        if (/^[+-]?\d+(?:\.\d+)?$/.test(s)) {
            const n = Number(s);
            return Number.isNaN(n) ? s : n;
        }

        // Fallback: return as-is (could be function call like NOW())
        return s;
    }

    function getBalancedSegment(text, startIdx, open = '(', close = ')') {
        // Returns [segmentWithoutOuter, endIndexAfterClose]
        let depth = 0;
        let i = startIdx;
        const len = text.length;
        if (text[i] !== open) throw new Error('Expected ' + open + ' at position ' + i);
        i++; // skip first open
        let inSingle = false, inDouble = false;
        let seg = '';
        while (i < len) {
            const ch = text[i];
            const next = i + 1 < len ? text[i + 1] : '';

            if (!inSingle && !inDouble) {
                if (ch === open) { depth++; seg += ch; i++; continue; }
                if (ch === close) {
                    if (depth === 0) { return [seg, i + 1]; }
                    depth--; seg += ch; i++; continue;
                }
                if (ch === "'") { inSingle = true; seg += ch; i++; continue; }
                if (ch === '"') { inDouble = true; seg += ch; i++; continue; }
                seg += ch; i++; continue;
            }

            // Inside quotes
            if (inSingle) {
                if (ch === "'" && next === "'") { seg += "''"; i += 2; continue; }
                if (ch === "'") { inSingle = false; seg += ch; i++; continue; }
                seg += ch; i++; continue;
            }
            if (inDouble) {
                if (ch === '"') { inDouble = false; seg += ch; i++; continue; }
                seg += ch; i++; continue;
            }
        }
        throw new Error('Unbalanced parentheses starting at ' + startIdx);
    }

    function splitCSV(text) {
        // Splits by commas not inside quotes or parentheses
        const parts = [];
        let buf = '';
        let inSingle = false, inDouble = false, depth = 0;
        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            const next = i + 1 < text.length ? text[i + 1] : '';

            if (!inSingle && !inDouble) {
                if (ch === '(') { depth++; buf += ch; continue; }
                if (ch === ')') { depth = Math.max(0, depth - 1); buf += ch; continue; }
                if (depth === 0 && ch === ',') { parts.push(buf.trim()); buf = ''; continue; }
                if (ch === "'") { inSingle = true; buf += ch; continue; }
                if (ch === '"') { inDouble = true; buf += ch; continue; }
                buf += ch; continue;
            }
            // Inside quotes
            if (inSingle) {
                if (ch === "'" && next === "'") { buf += "''"; i++; continue; }
                if (ch === "'") { inSingle = false; buf += ch; continue; }
                buf += ch; continue;
            }
            if (inDouble) {
                if (ch === '"') { inDouble = false; buf += ch; continue; }
                buf += ch; continue;
            }
        }
        if (buf.trim().length > 0) parts.push(buf.trim());
        return parts;
    }

    function parseCreateTableSchemas(sql) {
        // Returns a map: tableName -> [col1, col2, ...]
        const text = sql;
        const lower = text.toLowerCase();
        const schemas = {};
        let i = 0;
        while (i < text.length) {
            const idx = lower.indexOf('create table', i);
            if (idx === -1) break;
            i = idx + 'create table'.length;
            // Skip optional IF NOT EXISTS
            const after = lower.slice(i);
            const ifIdx = after.indexOf('if not exists');
            if (ifIdx === 0) i += 'if not exists'.length;
            // Parse table name
            while (i < text.length && /\s/.test(text[i])) i++;
            let tableName = '';
            while (i < text.length && !/[\s(]/.test(text[i])) { tableName += text[i]; i++; }
            tableName = cleanIdent(tableName);
            while (i < text.length && /\s/.test(text[i])) i++;
            if (text[i] !== '(') { continue; }
            const [colsSeg, afterCols] = getBalancedSegment(text, i, '(', ')');
            i = afterCols;
            const items = splitCSV(colsSeg);
            const cols = [];
            for (const it of items) {
                const trimmed = it.trim();
                if (!trimmed) continue;
                const firstTokenMatch = trimmed.match(/^([`\"\[]?[^\s`\"\]]+[`\"\]]?)/);
                if (!firstTokenMatch) continue;
                const rawFirst = firstTokenMatch[1];
                const nameLower = rawFirst.replace(/^[`\"\[]|[`\"\]]$/g, '').toLowerCase();
                // Skip constraints/table-level definitions
                if ([
                    'constraint','primary','unique','foreign','check','index','key'
                ].includes(nameLower)) {
                    continue;
                }
                cols.push(cleanIdent(rawFirst));
            }
            if (cols.length) schemas[tableName] = cols;
        }
        return schemas;
    }

    function parseSQLInsert(sql) {
        const text = sql.trim();
        const lower = text.toLowerCase();
        let i = 0;
        const results = [];
        const schemas = parseCreateTableSchemas(text);
        const warnings = [];

        while (i < text.length) {
            const idxInsert = lower.indexOf('insert into', i);
            if (idxInsert === -1) break;
            i = idxInsert + 'insert into'.length;

            // Parse table name
            while (i < text.length && /\s/.test(text[i])) i++;
            let tableName = '';
            while (i < text.length && !/[\s(]/.test(text[i])) { tableName += text[i]; i++; }
            tableName = cleanIdent(tableName);

            // Optional column list
            while (i < text.length && /\s/.test(text[i])) i++;
            let columns = null;
            if (text[i] === '(') {
                const [columnsSeg, afterCols] = getBalancedSegment(text, i, '(', ')');
                i = afterCols;
                columns = splitCSV(columnsSeg).map(c => cleanIdent(c));
            }

            // Find VALUES keyword
            const idxValuesRel = text.slice(i).toLowerCase().indexOf('values');
            if (idxValuesRel === -1) throw new Error('VALUES keyword not found for table ' + tableName);
            i = i + idxValuesRel + 'values'.length;

            // Read one or more tuples: ( ... ), ( ... ), ...
            const tuples = [];
            while (i < text.length) {
                // Skip spaces and commas
                while (i < text.length && /[\s,]/.test(text[i])) i++;
                if (i >= text.length) break;
                if (text[i] !== '(') break;
                const [tupleSeg, afterTuple] = getBalancedSegment(text, i, '(', ')');
                i = afterTuple;
                tuples.push(tupleSeg);

                // Stop if we hit a semicolon or another statement
                let j = i;
                while (j < text.length && /\s/.test(text[j])) j++;
                if (text[j] === ';') { i = j + 1; break; }
                const nextIns = text.slice(j).toLowerCase();
                if (nextIns.startsWith('insert into')) { i = j; break; }
            }

            // If columns not provided, take from schema if available; otherwise infer
            if (!columns) {
                const schemaCols = schemas[tableName];
                if (schemaCols && schemaCols.length) {
                    columns = schemaCols.slice();
                } else {
                    const firstVals = tuples.length > 0 ? splitCSV(tuples[0]) : [];
                    const n = firstVals.length;
                    columns = Array.from({ length: n }, (_, k) => `col${k + 1}`);
                }
            }

            for (let tupleIdx = 0; tupleIdx < tuples.length; tupleIdx++) {
                const t = tuples[tupleIdx];
                const values = splitCSV(t).map(v => normalizeValue(v));
                const mismatch = columns.length !== values.length;
                if (mismatch) {
                    warnings.push(`Table "${tableName}", row ${tupleIdx + 1}: values count (${values.length}) does not match columns count (${columns.length}). Extra values will be ignored; missing values set to null.`);
                }
                const row = {};
                for (let idxCol = 0; idxCol < columns.length; idxCol++) {
                    row[columns[idxCol]] = values[idxCol] !== undefined ? values[idxCol] : null;
                }
                results.push({ table: tableName, data: row, mismatch });
            }
        }

        if (results.length === 0) {
            throw new Error('No valid INSERT statements found');
        }
        return { items: results, warnings };
    }

    function displayResults(items, warnings = []) {
        // Show the output section
        outputDiv.classList.remove('d-none');

        // Show messages
        (warnings || []).forEach(w => addMessage('warning', w));

        // Group rows by table
        const byTable = items.reduce((acc, it) => {
            acc[it.table] = acc[it.table] || [];
            acc[it.table].push(it.data);
            return acc;
        }, {});

        // Persist for downloads
        lastGrouped = byTable;
        lastFlatRows = items.map(it => ({ __table: it.table, ...(it.data || {}) }));
        lastItems = items;

        // Display JSON based on output mode
        const mode = outputModeSel.value;
        if (mode === 'grouped') {
            jsonOutput.textContent = JSON.stringify(byTable, null, 2);
        } else {
            jsonOutput.textContent = JSON.stringify(lastFlatRows, null, 2);
        }

        // Render an HTML table per SQL table
        tableOutput.innerHTML = '';
        // Recreate items grouped alongside mismatch flags
        const groupedItems = items.reduce((acc, it) => {
            acc[it.table] = acc[it.table] || [];
            acc[it.table].push(it);
            return acc;
        }, {});

        Object.entries(byTable).forEach(([tableName, rows]) => {
            const container = document.createElement('div');
            container.className = 'mb-4';

            const title = document.createElement('h5');
            title.textContent = `Table: ${tableName}`;
            container.appendChild(title);

            const table = document.createElement('table');
            table.className = 'table table-striped table-bordered';

            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');

            // Collect all columns across rows
            const allCols = Array.from(rows.reduce((set, r) => {
                Object.keys(r || {}).forEach(k => set.add(k));
                return set;
            }, new Set()));

            headerRow.innerHTML = `<th style="width:36px;"><input type="checkbox" class="form-check-input" data-select-all="${tableName}"></th><th>#</th>${allCols.map(c => `<th>${c}</th>`).join('')}`;
            thead.appendChild(headerRow);
            table.appendChild(thead);

            const tbody = document.createElement('tbody');
            rows.forEach((r, idx) => {
                const tr = document.createElement('tr');
                const item = groupedItems[tableName][idx];
                const mismatchBadge = item && item.mismatch ? ' <span class="badge bg-warning text-dark">mismatch</span>' : '';
                let html = `<td><input type="checkbox" class="form-check-input row-select" data-table="${tableName}" data-index="${idx}"></td>`;
                html += `<td>${idx + 1}${mismatchBadge}</td>`;
                allCols.forEach(c => {
                    const v = r && r[c] !== undefined && r[c] !== null ? r[c] : '';
                    const jp = tryParseJSONLike(v);
                    if (jp.ok) {
                        const pretty = JSON.stringify(jp.value, null, 2);
                        const content = renderCellContent(v);
                        const escapedRaw = pretty.replace(/&/g, '&amp;').replace(/</g, '&lt;');
                        html += `<td data-raw-json='${escapedRaw}'>${content}</td>`;
                    } else {
                        html += `<td>${renderCellContent(v)}</td>`;
                    }
                });
                tr.innerHTML = html;
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);
            container.appendChild(table);
            tableOutput.appendChild(container);

            // Attach view handlers within this table container
            attachJsonViewHandlers(container);

            // Select-all handler
            const selectAll = container.querySelector(`input[data-select-all="${tableName}"]`);
            if (selectAll) {
                selectAll.addEventListener('change', (e) => {
                    container.querySelectorAll('.row-select').forEach(cb => { cb.checked = selectAll.checked; });
                });
            }
        });

        // Wire table action buttons
        wireTableActions(items);
    }

    function wireTableActions(items) {
        const groupedItems = items.reduce((acc, it) => {
            acc[it.table] = acc[it.table] || [];
            acc[it.table].push(it);
            return acc;
        }, {});

        compareBtn?.addEventListener('click', () => {
            const selected = getSelected(groupedItems);
            if (selected.length !== 2) {
                addMessage('warning', 'Select exactly two rows to compare.');
                return;
            }
            const [a, b] = selected;
            if (a.table !== b.table) {
                addMessage('warning', 'Please select rows from the same table to compare.');
                return;
            }
            const diffText = diffRecords(a.data, b.data, a.table);
            actionModalBody.textContent = diffText;
            try { new bootstrap.Modal(actionModalEl).show(); } catch (_) {}
        });

        generateUpdateBtn?.addEventListener('click', () => {
            const selected = getSelected(groupedItems);
            if (selected.length === 0) {
                addMessage('warning', 'Select one or more rows to generate UPDATE statements.');
                return;
            }
            const sqls = selected.map(it => buildUpdateSQL(it.table, it.data));
            actionModalBody.textContent = sqls.join('\n\n');
            try { new bootstrap.Modal(actionModalEl).show(); } catch (_) {}
        });
    }

    function getSelected(groupedItems) {
        const sels = [];
        document.querySelectorAll('.row-select:checked').forEach(cb => {
            const table = cb.getAttribute('data-table');
            const idx = Number(cb.getAttribute('data-index'));
            const item = (groupedItems[table] || [])[idx];
            if (item) sels.push(item);
        });
        return sels;
    }

    function diffRecords(a, b, tableName) {
        const keys = Array.from(new Set([...Object.keys(a || {}), ...Object.keys(b || {})]));
        const lines = [`# Diff for table ${tableName}`];
        keys.forEach(k => {
            const va = a[k];
            const vb = b[k];
            const sa = JSON.stringify(va);
            const sb = JSON.stringify(vb);
            if (sa !== sb) {
                lines.push(`- ${k}: ${sa}`);
                lines.push(`+ ${k}: ${sb}`);
            } else {
                lines.push(`  ${k}: ${sa}`);
            }
        });
        return lines.join('\n');
    }

    function buildUpdateSQL(table, data) {
        // Choose primary key: prefer 'id' (case-insensitive), else first key
        const keys = Object.keys(data || {});
        if (keys.length === 0) return `-- No data for table ${table}`;
        let pk = keys.find(k => k.toLowerCase() === 'id') || keys[0];
        const sets = [];
        keys.forEach(k => {
            if (k === pk) return;
            sets.push(`${quoteIdent(k)} = ${sqlLiteral(data[k])}`);
        });
        const where = `${quoteIdent(pk)} = ${sqlLiteral(data[pk])}`;
        return `UPDATE ${quoteIdent(table)}\nSET ${sets.join(', ')}\nWHERE ${where};`;
    }

    function quoteIdent(name) {
        // use double quotes for identifiers; escape internal quotes
        return '"' + String(name).replace(/"/g, '""') + '"';
    }

    function sqlLiteral(v) {
        if (v === null || v === undefined) return 'NULL';
        if (typeof v === 'number') return String(v);
        if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
        // strings
        const s = String(v);
        return '\'' + s.replace(/'/g, "''") + '\'';
    }
});
