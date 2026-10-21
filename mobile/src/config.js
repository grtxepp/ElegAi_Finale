import { Platform } from 'react-native';

/**
 * ── API base URL ──────────────────────────────────────────────────────────
 * The mobile app talks to the SAME Express backend as the web app.
 * Point this at wherever your backend is running:
 *
 *   • Android emulator  → http://10.0.2.2:5000   (emulator's alias for your PC)
 *   • Physical phone    → http://<YOUR-PC-LAN-IP>:5000  (phone + PC on same Wi-Fi)
 *   • Cloud / deployed  → https://your-api-host
 *
 * Find your PC's LAN IP: Windows `ipconfig` → "IPv4 Address",
 *                        Mac/Linux `ipconfig getifaddr en0` / `hostname -I`
 */
export const API_BASE = 'http://192.168.254.105:5000';

/** Show a hint on screen when the backend is unreachable. */
export const API_BASE_HINT = 'Edit mobile/src/config.js → API_BASE';

export const isAndroid = Platform.OS === 'android';
