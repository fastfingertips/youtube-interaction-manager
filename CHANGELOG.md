# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.1] - 2026-01-01

### Changed
- Rebranded project to **YouTube Interaction Manager** to better reflect its capabilities
- Updated all documentation, privacy policies, and UI elements with new branding

## [1.3.0] - 2026-01-01

### Added
- Activity history toggle to enable/disable logging in Settings
- Firefox extension support with dedicated import workaround page
- Status banners indicating when auto-actions or history logging are disabled
- Info text clarifying the 50-item local history limit

### Changed
- Major UI refinement: Expanded popup width and optimized layout for better readability
- Rebalanced "Unlisted Channels" configuration with prioritized dropdown width
- Reorganized "Data & Advanced" section into individual toggle groups
- Refactored core logic into `StorageUtils` and `BackupUtils`
- Centralized application constants and limits in `config.js`

### Fixed
- Synced count badges and status messages across all popup tabs
- Improved "Clear Activity" flow with confirmation and status feedback

## [1.2.1] - 2025-12-27

### Fixed
- Removed unused `scripting` permission for Chrome Web Store compliance

## [1.2.0] - 2025-12-26

### Added
- Privacy policy page for Chrome Web Store
- Landing page documentation

### Changed
- Redesigned popup with modern styling and improved UX
- Updated README with screenshots and reordered sections

## [1.1.1] - 2025-12-16

### Fixed
- Synced popup version display with manifest version

## [1.1.0] - 2025-12-16

### Added
- Dynamic icon badges showing extension state

## [1.0.3] - 2025-12-16

### Added
- Clickable channel links in activity log

### Removed
- Legacy fallback code

## [1.0.2] - 2025-12-15

### Added
- About tab in popup

## [1.0.1] - 2025-12-14

### Added
- Initial release
- Auto-like for whitelisted channels
- Auto-dislike for blacklisted channels
- Flexible timing options (instant, percentage, seconds)
- Humanize option for natural interaction
- Activity log tracking
- Import/Export settings
