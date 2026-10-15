# 🖥️📱 Run ElegAI on YOUR laptop + phone (light mode, 4GB Celeron friendly)

**The plan:** your laptop runs only the small backend + database. Your phone runs the actual
ElegAI app (native React Native via Expo Go). Laptop RAM usage ≈ 250 MB. ✅

**Why no MySQL install?** You already created a **TiDB Cloud** database earlier — we reuse it.
That skips the biggest, slowest install. (If you ever want it fully offline, you can install
MariaDB instead — same steps, just different credentials.)

---

## Part 1 — Install Node.js (only big install, ~5 min)

1. Go to **https://nodejs.org**
2. Click the **LTS** button (left side, e.g. "v20.x.x LTS")
3. Run the installer → keep clicking **Next** → **Install** → Finish
4. **Restart your laptop** (important — so Node is on PATH)

Verify: open **Command Prompt** (press `Win`, type `cmd`, Enter), type:
```
node --version
```
You should see `v20.x.x`. If it says "not recognized", restart again and retry.

---

## Part 2 — Unzip the project

1. Download **`elegai-app.zip`** from the chat workspace
2. Right-click → **Extract All** → to somewhere simple like `C:\elegai`
   (avoid `C:\Users\...\Downloads\elegai-app\elegai` nesting — keep it shallow: `C:\elegai`)

You should see inside: `backend`, `frontend`, `mobile`, `README.md`, `DEPLOY.md`…

---

## Part 3 — Point the backend at your TiDB database

If `C:\elegai\backend\.env` does not exist, copy `backend/.env.example` to `backend/.env`. Then open `backend/.env` in Notepad. The real `.env` is intentionally not included in the shared source ZIP.

Edit these lines with **your TiDB credentials** (the ones you saved earlier):

```
DB_HOST=gateway01.ap-southeast-1.prod.aws.tidbcloud.com   ← your TiDB host
DB_PORT=4000
DB_USER=2abc1234.user1                                    ← your TiDB username
DB_PASSWORD=your-tidb-password                            ← your TiDB password
DB_NAME=elegai
DB_SSL=true                                               ← IMPORTANT: true for TiDB
```

**Save the file (Ctrl+S).** Leave everything else alone.

---

## Part 4 — Start the backend (terminal 1)

1. Open Command Prompt, then:
```
cd C:\elegai\backend
npm install
npm start
```
2. Wait — you'll see:
   - `[db] Connected to MySQL at ...tidbcloud.com:4000/elegai`
   - `[db] Seeded catalog + demo users.`   ← first time only
   - `[boot] ElegAI API listening on http://0.0.0.0:5000`
3. **Keep this window open.**
4. **Allow it through Windows Firewall** if a popup appears (check both boxes → Allow). This is what lets your phone connect.

✅ Test on your laptop: open browser → `http://localhost:5000/api/health` → you should see `{"status":"ok"}`

---

## Part 5 — Find your laptop's Wi-Fi IP

In Command Prompt (new window):
```
ipconfig
```
Look for **"IPv4 Address"** under your Wi-Fi adapter — it looks like `192.168.1.23` (starts with 192.168 or 10.x). **Write it down** — you'll use it twice.

⚠️ **Your phone and laptop MUST be on the same Wi-Fi** for this to work.

---

## Part 6 — Point the mobile app at your backend

Open **`C:\elegai\mobile\src\config.js`** in Notepad. Change line 3 to your IP:

```js
export const API_BASE = 'http://192.168.1.23:5000';   ← your IPv4 from Part 5
```

**Save.**

---

## Part 7 — Start Expo (terminal 2)

1. Open **another** Command Prompt:
```
cd C:\elegai\mobile
npm install
npx expo start
```
2. Wait for the **QR code** to appear in the terminal.

---

## Part 8 — Install the app on your phone 📲

1. On your phone, install the free **Expo Go** app:
   - Android: **Google Play Store** → search "Expo Go"
   - iPhone: **App Store** → search "Expo Go"
2. Open **Expo Go** → **Scan QR code**
3. Point your phone's camera at the QR code in the terminal (Android) or scan from Expo Go
4. ElegAI loads **on your phone** — a real app with bottom tabs: Home · Catalog · Stylist · Cart · Account 🎉

**Sign in with:** `maria@example.com` / `Customer@123`

---

## Using it daily (the ritual)

1. Turn on laptop → open the **backend** Command Prompt → `npm start` (it's one command, don't close the window)
2. Open Expo Go on phone → tap the **ElegAI** app (recently used) → done

**To stop:** close both terminal windows.

---

## Making it feel light on 4GB (do these)

| Tip | Why |
|---|---|
| Close Chrome tabs & games before starting | frees ~1 GB |
| Keep terminal windows only, not full apps | Windows + Node + DB ≈ 2.5 GB total |
| Use **Task Manager** (Ctrl+Shift+Esc) to check | see for yourself it's under ~3 GB |
| In Windows Settings → System → Power → **Best performance** | helps the Celeron |

**If you want the web version too:** it's already built in — open `http://localhost:5000` on your
laptop or phone browser (same Wi-Fi). The PWA (Add to Home screen) is the lightweight fallback.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `npm` not recognized | Restart laptop, re-check Part 1 |
| `[db]` shows a connection error | Double-check `.env` values + `DB_SSL=true` |
| Phone can't reach `localhost:5000` | The `API_BASE` must be your **LAN IP**, not `localhost` |
| QR won't load on phone | Same Wi-Fi? Try `npx expo start --tunnel` (no LAN needed, a bit slower) |
| Port 5000 already in use | Close other Node windows, or run `set PORT=5001` then `npm start` and update `API_BASE` |
| Firewall popup | Click **Allow** (both networks) |

---

## What's where

| Folder | What it is | You run |
|---|---|---|
| `backend/` | API + database logic | `npm start` (terminal 1) |
| `mobile/` | The phone app | `npx expo start` (terminal 2) |
| `frontend/` | Web version (optional) | served automatically at `:5000` |
