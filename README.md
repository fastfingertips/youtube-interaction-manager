# YouTube Auto Like

Automatic like and channel management extension for YouTube. Improve your viewing experience by automating interactions with your favorite channels.

## Screenshots

| Settings | Whitelist | Blacklist |
|:--------:|:---------:|:---------:|
| ![Settings](docs/screenshots/settings.png) | ![Whitelist](docs/screenshots/whitelist.png) | ![Blacklist](docs/screenshots/blacklist.png) |

| Activity | About |
|:--------:|:-----:|
| ![Activity](docs/screenshots/activity.png) | ![About](docs/screenshots/about.png) |

## How it Works

When you open a YouTube video, the extension checks if the channel is in your whitelist or blacklist. If it's in the whitelist, it clicks the like button for you. If it's in the blacklist, it clicks dislike. Simple as that.

You can also set when this happens - right away, after watching some percentage of the video, or after a specific number of seconds. The "Humanize" option adds a random delay so it looks more natural.

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top right corner)
4. Click "Load unpacked"
5. Select the downloaded folder of this project

## Features

### Smart Actions
- **Whitelist**: Automatically LIKE videos from channels you trust
- **Blacklist**: Automatically DISLIKE videos from channels you don't enjoy
- **Unlisted Channels**: Flexible options for channels not in any list:
  - Do Nothing (Default)
  - Like Everything
  - Dislike Everything

### Flexible Timing
- **Instant**: Trigger the action immediately when the video starts
- **At Percentage**: Trigger after watching a specific percentage of the video
- **Specific Second**: Trigger after a specific number of seconds
- **Humanize**: Adds random delay to mimic natural human interaction (only with Specific Second)

### Activity & Management
- **Activity Log**: View a history of recent actions with channel info
- **Import/Export**: Backup your settings and channel lists to JSON

## Usage

### Settings Tab
- Configure how Whitelisted, Blacklisted, and Unlisted channels are treated
- Set your preferred timing (Instant, Percent, or Time)
- Enable "Humanize" for random delays
- Use Export/Import to save your configuration

### Whitelist / Blacklist Tabs
- **Add Current Channel**: Click while watching a video to add the channel
- Manage your lists by removing channels
- Status banner shows when list action is disabled

### Activity Tab
- View recent auto-like/dislike activity
- Click on entries to open the video

## License

MIT