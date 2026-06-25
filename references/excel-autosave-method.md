# Excel Report Auto-Save — Correct Method

## The Problem
Excel `.xlsx` files are **binary** — the Filesystem MCP can only write text files,
so it cannot write `.xlsx` directly to the local machine.

## The Solution — Excel MCP + init-reports.js

### Two tools working together:

| Tool | What it does |
|------|-------------|
| `utils/init-reports.js` | Creates blank `.xlsx` files (runs automatically via `pretest` npm hook) |
| `excel:excel_write_to_sheet` MCP | Writes all data directly into the local `.xlsx` files |

### Zero manual steps — fully automatic flow:
```
npm run test:[feature]
  └── pretest hook → node utils/init-reports.js → creates blank xlsx files
  └── tests run
  └── Claude writes data via excel:excel_write_to_sheet → saved to local path directly
```

## Paths

| Report | Path |
|--------|------|
| Featurewise | `D:\Claude\QA_Projects\CustomerConnect\Featurewise Test Report\[Feature].xlsx` |
| Daily Bug   | `D:\Claude\QA_Projects\CustomerConnect\Daily Bug Report\BugReport_DD-Mon-YYYY.xlsx` |

## Adding a New Feature

Add the feature name to `FEATURES` array in `utils/init-reports.js`:
```javascript
const FEATURES = ['Login', 'Dashboard', 'CreateTicket', 'NewFeature'];
```
Filesystem MCP writes the updated script automatically.
On next `npm run test:[feature]`, the blank file is created and Claude fills it.

## Why NOT Python/openpyxl in Claude's container
- Generates file in `/tmp` inside Claude — not on your machine
- Requires download step (manual interruption)
- Excel MCP writes DIRECTLY to `D:\` — no download ever needed
