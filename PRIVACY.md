<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/fastfingertips/youtube-interaction-manager/main/docs/store/promo_marquee_dark.png">
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/fastfingertips/youtube-interaction-manager/main/docs/store/promo_marquee_light.png">
  <img alt="YouTube Interaction Manager" src="https://raw.githubusercontent.com/fastfingertips/youtube-interaction-manager/main/docs/store/promo_marquee_light.png">
</picture>

# Privacy Policy for YouTube Interaction Manager

**Created: December 26, 2025**
**Last updated: January 1, 2026**

## Overview

YouTube Interaction Manager is a browser extension that helps users automatically like or dislike YouTube videos based on their channel preferences. This privacy policy explains how we handle your data.

## Data Collection

**We do not collect any personal data.**

All data is stored locally on your device using Chrome's built-in storage API. No data is ever transmitted to external servers.

### Data Stored Locally

The extension stores the following information locally on your device:

- **Whitelist**: Channel names you choose to auto-like
- **Blacklist**: Channel names you choose to auto-dislike
- **Settings**: Your preferences (timing, humanize option, etc.)
- **Activity Log**: Recent actions performed by the extension (Can be disabled in Settings)

## Data Sharing

**We do not share any data with third parties.**

- No analytics or tracking
- No external API calls
- No data transmission of any kind

## Permissions Used

The extension requires the following permissions:

| Permission | Purpose |
|------------|---------|
| `storage` | To save your preferences, whitelist/blacklist channels, and activity logs locally on your device |
| `activeTab` | To detect the current YouTube channel and send messages to the content script for like/dislike actions |
| `host_permissions (youtube.com)` | To run the content script on YouTube pages and interact with video elements |

### Why These Permissions?

- **storage**: Essential for saving your settings between browser sessions. All data stays on your device.
- **activeTab**: Allows the extension popup to communicate with the active YouTube tab to add channels to lists.
- **host_permissions**: Required for the content script to run on YouTube and detect videos/channels.


## Data Security

All data remains on your local device and is never transmitted externally. Chrome's storage API provides secure local storage.

## Changes to This Policy

We may update this privacy policy from time to time. Any changes will be reflected in the "Last updated" date above.

## Contact

If you have any questions about this privacy policy, please open an issue on our GitHub repository:

https://github.com/fastfingertips/youtube-interaction-manager/issues

## Open Source

This extension is open source. You can review the complete source code at:

https://github.com/fastfingertips/youtube-interaction-manager
