# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
 
## [1.3.27] - 2026-04-29

### Fixed
- **Storage Migration**: Switched from `chrome.storage.sync` (8KB limit) to `chrome.storage.local` (10MB limit) to resolve the whitelist capacity issue (Fixes #3).
- **Auto-Migration**: Implemented background logic to safely migrate existing user data from sync to local storage on update.

### Changed
- **Data Export**: Reordered backup JSON structure for better readability (settings first, large data arrays last).
- **Maintenance**: Updated OAuth credentials and publishing pipeline for 2026 stability.

+## [1.3.26] - 2026-03-08
+
+### Added
+- Automated publishing to Chrome Web Store via GitHub Actions
+- New custom domain tracking: `ytmanager.bugra.co`
+- `short_name` support in manifest for better UI display
+- `offline_enabled` support for settings management without internet
+
+### Changed
+- Refined action policy descriptions in README for better clarity
+- Set `YouTube Interaction Manager` as the default toolkit title
+
+## [1.3.25] - 2026-03-08
+
+### Added
+- **Metadata Sync**: Enhanced verification system for playlist navigation stability
+- **Robust Detection**: Intelligent channel detection for collaborative videos
+
+### Changed
+- Completed migration to modern branding and updated store descriptors
+

## [1.3.2] - 2026-01-01

### Changed
- Rebranded project to **YouTube Interaction Manager** to better reflect its capabilities
- Updated all documentation, privacy policies, and UI elements with new branding
- Updated all repository references and URLs to `youtube-interaction-manager`

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
