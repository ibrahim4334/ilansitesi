# Windows Development Fix & Recovery Guide

This project requires a clean build environment on Windows. If you experience build errors, missing chunks, or "next command not found", follow these steps carefully.

## ⚠️ Important: Windows File Locking
Windows often locks files in `node_modules` or `.next`. You must ensure no valid node processes are running before cleaning.

## 🚀 One-Step Fix (PowerShell)

Run these commands in your terminal (PowerShell):

```powershell
# 1. Stop any running dev servers (Ctrl + C)

# 2. Force remove artifacts (Fixes file locking & corruption)
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# 3. Reinstall with proper dependencies
npm install --legacy-peer-deps

# 4. Start Development Server
npm run dev
```

## 🛠 Manual Troubleshooting

1. **'next' is not recognized**:
   - This happens when `node_modules` is corrupted. Run the cleanup commands above.

2. **Turbopack Errors**:
   - We have disabled specific Turbopack flags. Ensure your `package.json` script is strictly `"dev": "next dev"`.

3. **Login Loops**:
   - If you are stuck in a redirect loop, clear your browser cookies (specifically `authjs.session-token`).

## ✅ Verified Status
- Login Logic: Enforced via Middleware
- Role Selection: Required on first login
- Windows Support: Fully Standardized
