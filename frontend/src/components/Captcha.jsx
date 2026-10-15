import { useEffect, useRef, useState } from 'react';
import api from '../api/client.js';

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let turnstileScriptPromise;

function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (turnstileScriptPromise) return turnstileScriptPromise;

  turnstileScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-elegai-turnstile]');
    const script = existing || document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.dataset.elegaiTurnstile = 'true';
    script.onload = () => resolve(window.turnstile);
    script.onerror = () => reject(new Error('Could not load the CAPTCHA service.'));
    if (!existing) document.head.appendChild(script);
  }).catch((error) => {
    turnstileScriptPromise = null;
    throw error;
  });

  return turnstileScriptPromise;
}

/** Reusable Turnstile widget; its signed token is verified by the Express API. */
export default function Captcha({ onTokenChange, onRequiredChange, resetKey = 0 }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [config, setConfig] = useState(null);
  const [error, setError] = useState('');

  // Read public widget configuration from the API so deployment keys can be
  // changed in server environment variables without rebuilding the frontend.
  useEffect(() => {
    let active = true;
    api.get('/auth/captcha-config')
      .then(({ data }) => {
        if (!active) return;
        const nextConfig = {
          enabled: Boolean(data.enabled),
          siteKey: String(data.siteKey || ''),
        };
        setConfig(nextConfig);
        onRequiredChange?.(nextConfig.enabled);
      })
      .catch(() => {
        if (!active) return;
        // Fail closed in the UI if the API's security configuration is unknown.
        setConfig({ enabled: true, siteKey: '' });
        onRequiredChange?.(true);
        setError('Could not load CAPTCHA settings from the server.');
      });
    return () => { active = false; };
  }, [onRequiredChange]);

  useEffect(() => {
    if (!config) return undefined;
    if (!config.enabled) {
      onTokenChange('');
      return undefined;
    }

    let cancelled = false;
    widgetIdRef.current = null;
    onTokenChange('');
    setError('');

    if (!config.siteKey) {
      setError('CAPTCHA is enabled, but the public site key is missing.');
      return undefined;
    }

    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !containerRef.current || !turnstile) return;
        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey: config.siteKey,
          captcha: 'challenge',
          callback: (token) => {
            onTokenChange(token);
            setError('');
          },
          'expired-callback': () => {
            onTokenChange('');
            setError('The CAPTCHA expired. Please complete it again.');
          },
          'error-callback': () => {
            onTokenChange('');
            setError('CAPTCHA could not be verified. Please try again.');
          },
          theme: 'light',
        });
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError.message || 'CAPTCHA could not be loaded.');
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };
  }, [config, onTokenChange, resetKey]);

  if (!config?.enabled) return null;

  return (
    <div className="space-y-1" aria-label="Bot verification">
      <div ref={containerRef} className="min-h-[66px]" />
      {error && <p className="text-xs text-red-700" role="alert">{error}</p>}
    </div>
  );
}
