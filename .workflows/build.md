# Build Workflow

## Command
```bash
python scripts/build_release.py
```

## Output
```
releases/
├── {name}-v{version}-chrome.zip   → Chrome Web Store
└── {name}-v{version}.zip         → GitHub Release
```

## Options
| Flag | Description |
|------|-------------|
| `--bump patch` | Increment patch version (1.2.1 → 1.2.2) |
| `--bump minor` | Increment minor version (1.2.1 → 1.3.0) |
| `--bump major` | Increment major version (1.2.1 → 2.0.0) |
| `--no-open` | Don't open output folder after build |

## Package Contents

### Store Package (Chrome Web Store)
- manifest.json
- icons/
- src/

### GitHub Package
- Store package contents
- README.md
- PRIVACY.md
- LICENSE
- CHANGELOG.md
