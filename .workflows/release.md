# Release Workflow

## Overview
Semantic versioning (MAJOR.MINOR.PATCH) with Keep a Changelog format.

## Content Guidelines

| Location | Style | Purpose |
|----------|-------|---------|
| CHANGELOG.md | Concise, bullet points | Quick reference for developers |
| GitHub Release | Detailed, explanatory | User-facing announcement |

### CHANGELOG.md Format
```markdown
## [X.X.X] - YYYY-MM-DD

### Fixed
- Brief description of fix

### Added
- Brief description of feature
```

### GitHub Release Format
```markdown
## Changes

### Bug Fixes
- Detailed explanation of what was fixed
- Why it was a problem
- How it was resolved

### Features
- Detailed feature description
- Usage examples if applicable

## Additional Info
- Permission changes, requirements, notes
- Links to related issues/PRs

---
**Full Changelog**: compare link
```

## Steps

### 1. Update Changelog
Ask AI: "Releasing v{VERSION}, update changelog"

AI will:
1. Run `git log --oneline $(git describe --tags --abbrev=0)..HEAD`
2. Categorize commits (Added, Changed, Fixed, Removed)
3. Update CHANGELOG.md with concise entries

### 2. Bump Version and Build
```bash
python scripts/build_release.py --bump patch
```

### 3. Commit and Tag
```bash
git add .
git commit -m "chore: release v{VERSION}"
git tag v{VERSION}
git push origin main --tags
```

### 4. Create GitHub Release
Ask AI: "Create GitHub Release notes for v{VERSION}"

AI will generate detailed release notes based on:
- CHANGELOG.md entries
- Commit messages
- Context about impact and usage

### 5. Publish
- **GitHub**: Create release with tag, paste detailed notes, attach `.zip`
- **Chrome Web Store**: Upload `-chrome.zip` to Developer Dashboard

## Commit Convention
| Prefix | Category |
|--------|----------|
| `feat:` | Added |
| `fix:` | Fixed |
| `refactor:` | Changed |
| `docs:` | Changed |
| `chore:` | (skip) |
