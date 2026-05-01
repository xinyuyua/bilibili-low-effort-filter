[English](README.md) | [简体中文](README_CN.md)

# Bilibili Low-Effort Video Filter

A Tampermonkey script that helps you identify and visually flag low-quality reposts and AI-generated "slideshow" videos on Bilibili. 

Instead of removing the videos entirely, it replaces the cover with a **light red warning block** so you can still watch them if you choose, but won't be "tricked" into clicking generic content.

## 🚀 Key Features
- **Color Family Analysis**: Detects videos that are >80% white, black, or gray (common in low-effort reposts).
- **Center-Weighted Logic**: Ignores colorful or blurred borders designed to bypass automated filters.
- **Visual Warnings**: Turns the video cover red and adds a `[⚠️]` tag to the title.
- **Clickable Cards**: Does not break site navigation; flagged videos remain fully functional.

## 🛠️ Installation
1. Install the [Tampermonkey](https://www.tampermonkey.net/) browser extension.
2. [Click here to install the script](https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME/main/bilibili-low-effort-filter.user.js).
3. Confirm the installation in the Tampermonkey tab.

## ⚙️ How it Works
The script uses a canvas-based histogram analysis to "look" at the cover image. It ignores the outer 15% of the image (the border) and calculates the ratio of monochrome pixels in the center.

You can customize the sensitivity by editing the `CONFIG` object at the top of the script:
- `FAMILY_THRESHOLD`: How much of the image must be monochrome to trigger (Default: 0.80).
- `BORDER_INSET`: How much of the edge to ignore (Default: 0.15).

## 🐞 Debugging
If a video is incorrectly flagged or missed, open your browser's Developer Console (`F12`). The script logs the Title, Video URL, and Cover Image URL for every flagged item to help you fine-tune the settings.
