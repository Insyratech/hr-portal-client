# HR Portal — Employee guide (PWA)

Use HR Portal on your phone like an app — no app store download required.

**URL:** https://hr-portal-client-nine.vercel.app

---

## iPhone (Safari)

### One-time setup

1. Open **Safari** (not Chrome on iPhone).
2. Go to **https://hr-portal-client-nine.vercel.app**
3. Sign in with your company email and password.
4. Tap **Share** (square with arrow at the bottom).
5. Scroll and tap **Add to Home Screen**.
6. Tap **Add**.
7. Open **HR Portal** from your home screen going forward.

### Enable notifications

1. Open HR Portal from the **home screen icon** (required on iPhone).
2. When you see **Enable notifications?**, tap **Enable**.
3. Tap **Allow** when Safari asks.

You will get alerts for leave updates, payslips, and other HR actions — even when the app is closed.

**Requires iOS 16.4 or later** for lock-screen notifications.

---

## Android (Chrome)

### One-time setup

1. Open **Chrome**.
2. Go to **https://hr-portal-client-nine.vercel.app**
3. Sign in with your company email and password.
4. Tap the menu **(⋮)** in the top-right.
5. Tap **Add to Home screen** or **Install app**.
6. Confirm **Add** / **Install**.
7. Open **HR Portal** from your home screen going forward.

### Enable notifications

1. Open HR Portal (from home screen or Chrome).
2. When you see **Enable notifications?**, tap **Enable**.
3. Tap **Allow** when Chrome asks.

---

## Daily use

| Task | How |
|------|-----|
| Open HR Portal | Tap the home screen icon |
| Sign in | Company email + password |
| Check alerts inside app | Tap the **bell** icon |
| Lock-screen alerts | Automatic after you allow notifications |
| Sign out | Profile menu → Sign out |

---

## Troubleshooting

| Problem | What to try |
|---------|-------------|
| No “Enable notifications?” prompt | Install to home screen first (especially on iPhone) |
| Notifications not arriving | Settings → Notifications → allow for Safari/Chrome or HR Portal |
| Stuck on login | Use password (biometric unlock is not available in the web app) |
| Old icon or layout | Remove home screen shortcut and add again |

---

## For IT / admin

- **No APK or IPA** — employees use the browser PWA only.
- **No Firebase** — push uses Web Push (VAPID).
- Deploy updates via Vercel (Client) and Render (API); employees get updates on next app open.
