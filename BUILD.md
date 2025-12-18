# How to Build "Smokeless" (Android APK)

We use **Capacitor** to turn the web app into an Android app, and **GitHub Actions** to build the APK in the cloud.

## 📂 Project Structure
- `www/`: **Source Code**. Edit your HTML/CSS/JS here.
- `android/`: Native Android project files (managed by Capacitor).
- `.github/workflows/`: The automation script that builds the APK.

## 🚀 How to Build (Cloud / GitHub)

1.  **Push Changes**: Commit your changes and push them to GitHub.
2.  **Wait**: Go to the **Actions** tab in your GitHub repository.
3.  **Download**: Click on the latest workflow run (e.g., "Build Android APK").
    - Scroll down to "Artifacts".
    - Download `smokeless-debug-apk.zip`.
    - Extract it to get the `.apk` file.

## 💻 How to Build (Local - Advanced)
*Requires Android Studio.*

1.  `npm install`
2.  `npx cap sync`
3.  `npx cap open android`
4.  Build using the "Play" button in Android Studio.
