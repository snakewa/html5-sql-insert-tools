# SQL INSERT ➜ JSON 与 HTML 表格

[English README](README.md) | 中文说明

免费在线 SQL 转 JSON/表格 转换器 —— 粘贴 SQL，立即得到 JSON 或 HTML。

一个轻量级 Web 工具，用于将 SQL INSERT 语句转换为 JSON 与可视化 HTML 表格。支持多语句、从 CREATE TABLE 推断列名、内联校验、JSON 预览、下载等功能。

说明：本项目为 100% 纯前端（纯 HTML/JS），无需后端，适合 GitHub Pages 静态托管。

[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-2ea44f?logo=github)](https://snakewa.github.io/html5-sql-insert-tools/)
![Static](https://img.shields.io/badge/Client--side-Static-blue)
![Language](https://img.shields.io/badge/i18n-EN%2FZH-informational)
![Theme](https://img.shields.io/badge/Theme-Light%20%7C%20Dark%20%7C%20System-7952B3)
![License](https://img.shields.io/badge/License-MIT-green)
![Last Commit](https://img.shields.io/github/last-commit/snakewa/html5-sql-insert-tools)

## 在线演示

- 网址：<https://snakewa.github.io/html5-sql-insert-tools/>

## 为什么

- 零配置：直接在浏览器粘贴 SQL 并转换，无需数据库服务器。
- 多种输出：面向 API 的 JSON，或用于报表/看板的 HTML 表格。
- 快速更新：从所选行生成 UPDATE 语句，便于小范围修正数据。
- 适合教学：直观展示 SQL 如何映射为 JSON/HTML。
- 离线可用：纯 HTML5/JavaScript，适合 GitHub Pages，本地也能运行。

## 支持（Buy Me a Coffee）

我做这个免费工具是为了更快地把 SQL 转成 JSON 或 HTML 表格。如果它帮你节省了时间，欢迎请我喝杯咖啡，你的支持能帮助我继续改进与开发新功能！

<a href="https://www.buymeacoffee.com/snakewa" target="_blank">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="48" width="173">
</a>

## 功能特点

- 可靠解析 `INSERT INTO ... VALUES (...), (...);`，支持多表多语句
- 可选列清单：支持 `INSERT INTO table VALUES (...)` 并自动推断列名
- 读取表结构：可从 `CREATE TABLE` 提取列名（自动跳过约束）
- 类型归一化：数字、布尔、`NULL`、引号字符串
- 多种输出：JSON（按表分组或扁平数组）与 HTML 表格
- 内联消息：错误与警告在页面内显示
- 行级不匹配标记：当值数量 ≠ 列数量时在表格行旁显示“mismatch”徽标
- JSON 单元格处理：
  - 识别 JSON 字符串并展示预览或展开
  - 点击“View”在弹窗中显示格式化 JSON
  - 提供“默认展开 JSON 值”开关
- 复制/下载：
  - 一键复制当前 JSON
  - 下载 JSON（与当前输出模式一致：分组/扁平）
  - 下载 CSV（始终为扁平数据，含 `__table` 列）

## 使用方法

1. 直接用浏览器打开 `index.html`（无需构建）。
2. 在文本框中粘贴 SQL，可包含 `CREATE TABLE` 与多个 `INSERT`。
3. 点击“Convert”。
4. 用“Output”选择器在“按表分组 / 扁平数组”之间切换。
5. 可复制/下载结果，或查看生成的表格。

## 示例

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

分组 JSON：
```json
{
  "products": [
    { "id": 1, "name": "Laptop", "price": 999.99, "stock": 5 },
    { "id": 2, "name": "Mouse",  "price": 24.99,  "stock": 10 }
  ]
}
```

## 界面说明

- Convert：解析并渲染
- Output：`Grouped by Table`（按表分组）或 `Flat Array`（扁平数组）
- Expand JSON values：开启后，JSON 字符串在表格中默认展开
- Copy JSON：复制当前 JSON（与输出模式一致）
- Download JSON：下载当前 JSON
- Download CSV：下载扁平 CSV（包含 `__table` 列）

## 校验逻辑

- 若某行的值数量与列数量不一致：
  - 在页面显示警告
  - 缺失值填充为 `null`
  - 多余的值被忽略
  - 在对应的表格行展示 `mismatch` 徽标

## 注意事项

- 当前支持：
  - `INSERT INTO ... (cols) VALUES (...), (...);`
  - `INSERT INTO ... VALUES (...), (...);`（列名来自表结构或按顺序自动命名）
  - 基础 `CREATE TABLE` 列定义（自动跳过约束）
- 暂不支持：`INSERT ... SELECT`、`ON CONFLICT/RETURNING`、复杂的方言语法、`CREATE TABLE` 中复杂类型的深度解析等。
- JSON 检测基于 `{...}`/`[...]` 外观并尝试 `JSON.parse`。

## 开发

- 逻辑在 `script.js`，界面在 `index.html`。
- 无需构建工具；样式使用 Bootstrap CDN。

## 离线使用（下载 ZIP）

无需服务器，本地即可运行：

1. 仓库地址：<https://github.com/snakewa/html5-sql-insert-tools>
2. 点击绿色 “Code” 按钮 → “Download ZIP”。
3. 解压 ZIP 到本地任意文件夹。
4. 打开该文件夹，直接双击 `index.html` 即可在浏览器中使用。
5. 粘贴 SQL，点击 Convert 开始转换。

## 许可

MIT

 
