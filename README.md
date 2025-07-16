# YT+ Chrome Extension

A Chrome extension that enhances your YouTube viewing experience with custom playback speeds for both regular videos and Shorts, auto fullscreen functionality, and automatic Shorts scrolling.

## Features

- **Separate Speed Controls**: Different default speeds for regular videos and Shorts
- **Auto Fullscreen**: Automatically activates fullscreen mode when watching videos
- **Auto Scroll Shorts**: Automatically scrolls to the next Short when one ends
- **Speed Control**: Quick keyboard shortcuts to increase/decrease playback speed
- **Modern Dark UI**: Clean and modern interface that matches YouTube's dark theme

## Installation

### Development Mode Installation

1. Download or clone this repository to your computer
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" using the toggle in the top-right corner
4. Click "Load unpacked" and select the folder containing the extension files
5. The extension should now appear in your extensions list and be active

### From Chrome Web Store (When Published)

1. Visit the [Chrome Web Store listing](https://chrome.google.com/webstore/detail/yt+/EXTENSION_ID)
2. Click "Add to Chrome"
3. Confirm the installation when prompted

## Usage

1. Once installed, the extension will automatically apply your chosen settings to YouTube videos
2. Click the extension icon in your toolbar to open the settings popup
3. Set different playback speeds for regular videos and Shorts
4. Toggle features on/off according to your preferences
5. Changes are saved automatically and applied immediately

### Settings Explained

- **Regular Videos Speed**: Default playback speed for normal YouTube videos
- **Shorts Speed**: Default playback speed for YouTube Shorts
- **Speed Control**: Enable/disable playback speed control
- **Auto Fullscreen**: Automatically enter fullscreen mode when watching videos
- **Auto Scroll Shorts**: Automatically move to the next Short when one finishes

## Development

### Project Structure

- `manifest.json`: Extension configuration
- `popup.html`: UI for the extension popup
- `js/content.js`: Content script injected into YouTube pages
- `js/injected.js`: Script injected directly into page context
- `js/popup.js`: Handles the popup UI functionality
- `css/content.css`: Styles for YouTube page modifications

### Building From Source

1. Make any desired code changes
2. Test the extension in development mode
3. For production, zip the entire folder for distribution

## Privacy

This extension:
- Does not collect or transmit any user data
- Only requires permissions necessary for its functionality
- Does not track browsing history or viewing habits
- All settings are stored locally in your browser

## License

MIT License - See LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any issues or have feature requests, please open an issue on the GitHub repository. 