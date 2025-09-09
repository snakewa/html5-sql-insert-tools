document.addEventListener('DOMContentLoaded', function() {
    const sqlInput = document.getElementById('sqlInput');
    const convertBtn = document.getElementById('convertBtn');
    const jsonOutput = document.getElementById('jsonOutput');
    const tableOutput = document.getElementById('tableOutput');
    const outputDiv = document.getElementById('output');
    const messagesDiv = document.getElementById('messages');
    const outputModeSel = document.getElementById('outputMode');
    const langSelect = document.getElementById('langSelect');
    const saveInputToggle = document.getElementById('saveInputToggle');
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
    const jsonActionsSection = document.getElementById('jsonActionsSection');
    const tableSection = document.getElementById('tableSection');

    // i18n
    const I18N = {
        en: {
            langLabel: 'Language',
            title: 'SQL to JSON/Table Converter',
            inputSectionTitle: 'Input & Actions',
            sqlLabel: 'Paste your SQL here (you can include CREATE TABLE and multiple INSERT statements):',
            convert: 'Convert',
            outputModeLabel: 'Output:',
            outputGrouped: 'Grouped by Table',
            outputFlat: 'Flat Array',
            downloadJson: 'Download JSON',
            downloadCsv: 'Download CSV',
            jsonSectionTitle: 'Output: JSON Actions',
            expandJsonLabel: 'Expand JSON values',
            viewJson: 'View JSON',
            copyJson: 'Copy JSON',
            tableSectionTitle: 'Output: HTML Table',
            compareSelected: 'Compare Selected',
            generateUpdates: 'Generate UPDATEs',
            mismatch: 'mismatch',
            saveInputLabel: 'Save input in browser',
            msgEnterSql: 'Please enter SQL input.',
            msgParseError: 'Error parsing SQL: ',
            msgNothingToDownload: 'Nothing to download yet. Convert some SQL first.',
            msgJsonCopied: 'JSON copied to clipboard.',
            msgCopyFailed: 'Failed to copy JSON: ',
            msgNothingToView: 'Nothing to view yet. Convert some SQL first.',
            msgContentCopied: 'Content copied to clipboard.',
            msgCopyFailedGeneric: 'Failed to copy: ',
            msgSelectTwo: 'Select exactly two rows to compare.',
            msgSameTable: 'Please select rows from the same table to compare.',
            msgSelectRowsForUpdate: 'Select one or more rows to generate UPDATE statements.',
        },
        zh: {
            langLabel: '语言',
            title: 'SQL 插入语句 ➜ JSON 与 HTML 表格',
            inputSectionTitle: '输入与操作',
            sqlLabel: '在此粘贴 SQL（可包含 CREATE TABLE 与多条 INSERT 语句）：',
            convert: '转换',
            outputModeLabel: '输出：',
            outputGrouped: '按表分组',
            outputFlat: '扁平数组',
            downloadJson: '下载 JSON',
            downloadCsv: '下载 CSV',
            jsonSectionTitle: '输出：JSON 操作',
            expandJsonLabel: '默认展开 JSON 值',
            viewJson: '查看 JSON',
            copyJson: '复制 JSON',
            tableSectionTitle: '输出：HTML 表格',
            compareSelected: '比较所选',
            generateUpdates: '生成 UPDATE',
            mismatch: '不匹配',
            saveInputLabel: '在浏览器中保存输入',
            msgEnterSql: '请输入 SQL。',
            msgParseError: '解析错误：',
            msgNothingToDownload: '暂无可下载内容，请先转换 SQL。',
            msgJsonCopied: 'JSON 已复制到剪贴板。',
            msgCopyFailed: '复制 JSON 失败：',
            msgNothingToView: '暂无可查看内容，请先转换 SQL。',
            msgContentCopied: '内容已复制到剪贴板。',
            msgCopyFailedGeneric: '复制失败：',
            msgSelectTwo: '请精确选择两行进行比较。',
            msgSameTable: '请从同一张表中选择行进行比较。',
            msgSelectRowsForUpdate: '请选择至少一行以生成 UPDATE 语句。',
        }
    };
    let currentLang = (langSelect && langSelect.value) || 'en';

    function t(key) { return (I18N[currentLang] && I18N[currentLang][key]) || I18N.en[key] || key; }

    function applyI18n() {
        const setText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
        setText('langLabel', t('langLabel'));
        setText('title', t('title'));
        setText('inputSectionTitle', t('inputSectionTitle'));
        setText('sqlLabel', t('sqlLabel'));
        const convertBtnEl = document.getElementById('convertBtn'); if (convertBtnEl) convertBtnEl.textContent = t('convert');
        setText('outputModeLabel', t('outputModeLabel'));
        // Output mode options
        if (outputModeSel && outputModeSel.options && outputModeSel.options.length >= 2) {
            outputModeSel.options[0].textContent = t('outputGrouped');
            outputModeSel.options[1].textContent = t('outputFlat');
        }
        const dlJsonBtn = document.getElementById('downloadJsonBtn'); if (dlJsonBtn) dlJsonBtn.textContent = t('downloadJson');
        const dlCsvBtn = document.getElementById('downloadCsvBtn'); if (dlCsvBtn) dlCsvBtn.textContent = t('downloadCsv');
        setText('jsonSectionTitle', t('jsonSectionTitle'));
        setText('expandJsonLabel', t('expandJsonLabel'));
        const viewBtn = document.getElementById('viewJsonBtn'); if (viewBtn) viewBtn.textContent = t('viewJson');
        const copyBtn = document.getElementById('copyJsonBtn'); if (copyBtn) copyBtn.textContent = t('copyJson');
        setText('tableSectionTitle', t('tableSectionTitle'));
        const cmpBtn = document.getElementById('compareBtn'); if (cmpBtn) cmpBtn.textContent = t('compareSelected');
        const genBtn = document.getElementById('generateUpdateBtn'); if (genBtn) genBtn.textContent = t('generateUpdates');
        const saveLabel = document.getElementById('saveInputLabel'); if (saveLabel) saveLabel.textContent = t('saveInputLabel');
    }
    let lastFlatRows = [];
    let lastGrouped = {};
    let lastItems = [];

    function setSectionVisible(visible) {
        const method = visible ? 'remove' : 'add';
        jsonActionsSection?.classList[method]('d-none');
        tableSection?.classList[method]('d-none');
        outputDiv?.classList[method]('d-none');
    }

    // Hide sections initially
    setSectionVisible(false);

    convertBtn.addEventListener('click', function() {
        clearMessages();
        const sql = sqlInput.value.trim();
        if (!sql) {
            addMessage('warning', t('msgEnterSql'));
            setSectionVisible(false);
            return;
        }

        try {
            const { items, warnings } = parseSQLInsert(sql);
            lastItems = items;
            displayResults(items, warnings);
            setSectionVisible(true);
        } catch (error) {
            addMessage('danger', t('msgParseError') + error.message);
            console.error(error);
            setSectionVisible(false);
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
            addMessage('warning', t('msgNothingToDownload'));
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
            addMessage('success', t('msgJsonCopied'));
        } catch (e) {
            addMessage('danger', t('msgCopyFailed') + (e?.message || e));
        }
    });

    viewJsonBtn?.addEventListener('click', () => {
        const content = jsonOutput.textContent || '';
        if (!content) {
            addMessage('warning', t('msgNothingToView'));
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
            addMessage('success', t('msgContentCopied'));
        } catch (e) {
            addMessage('danger', t('msgCopyFailedGeneric') + (e?.message || e));
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
                const mismatchBadge = item && item.mismatch ? ` <span class="badge bg-warning text-dark">${t('mismatch')}</span>` : '';
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
                addMessage('warning', t('msgSelectTwo'));
                return;
            }
            const [a, b] = selected;
            if (a.table !== b.table) {
                addMessage('warning', t('msgSameTable'));
                return;
            }
            const diffText = diffRecords(a.data, b.data, a.table);
            actionModalBody.textContent = diffText;
            try { new bootstrap.Modal(actionModalEl).show(); } catch (_) {}
        });

        generateUpdateBtn?.addEventListener('click', () => {
            const selected = getSelected(groupedItems);
            if (selected.length === 0) {
                addMessage('warning', t('msgSelectRowsForUpdate'));
                return;
            }
            const sqls = selected.map(it => buildUpdateSQL(it.table, it.data));
            actionModalBody.textContent = sqls.join('\n\n');
            try { new bootstrap.Modal(actionModalEl).show(); } catch (_) {}
        });
    }

    // Persisted settings keys
    const LS_LANG = 'sql2table.lang';
    const LS_SAVE_INPUT = 'sql2table.saveInput';
    const LS_INPUT = 'sql2table.input';

    // Load persisted settings
    try {
        const savedLang = localStorage.getItem(LS_LANG);
        if (savedLang && langSelect) langSelect.value = savedLang;
        currentLang = (langSelect && langSelect.value) || currentLang;
        const saveInput = localStorage.getItem(LS_SAVE_INPUT);
        if (saveInputToggle) saveInputToggle.checked = saveInput === '1';
        if (saveInputToggle && saveInputToggle.checked) {
            const savedInput = localStorage.getItem(LS_INPUT);
            if (savedInput && sqlInput) sqlInput.value = savedInput;
        }
    } catch (_) {}

    // language switching
    langSelect?.addEventListener('change', () => {
        currentLang = langSelect.value || 'en';
        try { localStorage.setItem(LS_LANG, currentLang); } catch (_) {}
        applyI18n();
        if (lastItems.length) displayResults(lastItems, []);
    });

    // input persistence toggle
    saveInputToggle?.addEventListener('change', () => {
        const on = !!saveInputToggle.checked;
        try { localStorage.setItem(LS_SAVE_INPUT, on ? '1' : '0'); } catch (_) {}
        if (!on) {
            try { localStorage.removeItem(LS_INPUT); } catch (_) {}
        } else if (on && sqlInput) {
            try { localStorage.setItem(LS_INPUT, sqlInput.value || ''); } catch (_) {}
        }
    });

    // save input on typing when enabled
    sqlInput?.addEventListener('input', () => {
        if (saveInputToggle && saveInputToggle.checked) {
            try { localStorage.setItem(LS_INPUT, sqlInput.value || ''); } catch (_) {}
        }
    });

    // initial i18n on load
    applyI18n();

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
