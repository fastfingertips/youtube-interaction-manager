# YouTube Auto Like

Automatic like and channel management extension for YouTube. Improve your viewing experience by automating interactions with your favorite channels.

## Features
**Smart Actions**
- Whitelist: Automatically LIKE videos from channels you trust.
- Blacklist: Automatically DISLIKE videos from channels you don't enjoy.
- Unlisted Channels: Flexible options for channels not in any list:
    - Do Nothing (Default)
    - Like Everything
    - Dislike Everything

**Flexible Timing**
- Instant: Trigger the action immediately when the video starts.
- Percentage: Trigger after watching a specific percentage (e.g., 50%) of the video.
- Time: Trigger after a specific number of seconds (e.g., 30s).

Human-like Behavior
- Humanize: Adds a random delay (3-15 seconds) to the trigger time to mimic natural human interaction and avoid detection.

**Activity & Management**
- Activity Log: View a history of the last actions taken (Likes/Dislikes) with reasons.
- Import/Export: Easily backup your settings and channel lists to a JSON file and restore them later.

## Installation
- Download or clone this repository.
- Open Chrome and navigate to chrome://extensions/.Enable "Developer mode" (toggle in the top right corner).
- Click "Load unpacked".
- Select the downloaded folder of this project.

## Usage
**Settings Tab:**
- Configure how Whitelisted, Blacklisted, and Unlisted channels are treated.
- Set your preferred timing (Instant, Percent, or Time).
- Enable "Humanize" for random delays.
- Use Export/Import to save your configuration.

**Whitelist / Blacklist Tabs:**
- Add Current Channel: Click this button while watching a video to quickly add the channel to the respective list.
- Manage your lists by removing channels you no longer want to track.

**Activity Tab:**
- Check the "Activity Logs" to see what the extension has been doing in the background.

## License
MIT