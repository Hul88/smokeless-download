# How to Release Updates (for Auto-Update)

If you use **Obtainium** to keep your app updated, follows these steps when you make changes:

1.  **Make Changes**: Edit your code locally.
2.  **Build APK**: Use your "Website 2 APK" tool to generate a new `Smokeless_vX.Y.apk`.
3.  **Create a Release (No Source Needed)**:
    *   You do **NOT** need to upload your source code to GitHub if you want privacy.
    *   Just create an empty repository (e.g., `smokeless-updates`).
    *   Go to **Releases** -> **Draft a new release**.
    *   **Tag**: Create a new tag (e.g., `v1.1`).
    *   **Title**: "Version 1.1".
    *   **Attach binaries**: **Upload your .apk file here**.
    *   Click **Publish release**.

Obtainium only cares about the **APK in the Release**, not the code in the repo.


Your phone will now detect the update and prompt you to install it!
