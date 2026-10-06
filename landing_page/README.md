# Media Wave Technologies - Official Landing Page & APK Download Hub

This is the standalone luxury landing page website for **Media Wave Technologies**, featuring:
- 🚀 **Direct Employee APK Download Center** (`MediaWave-Technologies-v1.0.0.apk`)
- 📱 **Interactive Smartphone Device Mockup with Live UI Preview**
- 📷 **Interactive QR Code Generator & Modal** for scanning via mobile camera
- 📋 **Step-by-Step Installation & Usage Guide** for Android devices
- ⚡ **Core App Features Breakdown** (Attendance, Daily Tasks, Leaves/OD, Payslip Vault, Chat, Enterprise Security)
- ❓ **Employee Help Desk FAQ Accordion**
- 🏛️ **Professional White & Blue Corporate Footer**

---

## 🚀 How to Run the Landing Page

### Step 1: Open Terminal in the `landing_page` folder
```powershell
cd d:\MediaWaveTech\mediawavetech-main\mediawavetech-main\landing_page
```

### Step 2: Install Dependencies
```powershell
npm install
```

### Step 3: Start the Development Server
```powershell
npm run dev
```

The landing page will automatically launch in your browser at:
👉 **http://localhost:5174**

---

## 🛠️ Build for Production

To generate the optimized production-ready HTML/CSS/JS bundle:
```powershell
npm run build
```

To preview the production build locally:
```powershell
npm run preview
```

---

## 📦 How to Update the APK File for Employees

1. When you build a new Flutter Android APK in `mobile_app/build/app/outputs/flutter-apk/app-debug.apk` (or release APK), copy the new APK file to:
   - `landing_page/public/MediaWave-v1.0.0.apk`
2. Update the version string in `landing_page/src/pages/LandingPage.jsx` if needed.
3. Employees clicking **"Download APK"** or scanning the QR code will instantly receive the updated file.
