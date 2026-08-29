import { clientEnv, isVapidConfigured } from '@/lib/env';
import { isIosDevice, isStandaloneDisplayMode } from '@/lib/pwa';

export { isIosDevice };

export const PUSH_ENDPOINT_STORAGE_KEY = 'hrportal-push-endpoint';
export const PUSH_PROMPT_DISMISS_KEY = 'hrportal-push-prompt-dismissed';

export function isPushApiSupported(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}
export function canSubscribeToWebPush(): boolean {
  if (!isPushApiSupported() || !isVapidConfigured()) {
    return false;
  }
  if (isIosDevice() && !isStandaloneDisplayMode()) {
    return false;
  }
  return true;
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.register('/sw.js', { scope: '/' });
}

export async function getPushSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export async function subscribeToWebPush(): Promise<PushSubscription> {
  const registration = await registerServiceWorker();
  await navigator.serviceWorker.ready;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted.');
  }

  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    return existing;
  }

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(clientEnv.vapidPublicKey) as BufferSource,
  });
}

export async function unsubscribeFromWebPush(): Promise<string | null> {
  const subscription = await getPushSubscription();
  if (!subscription) {
    return null;
  }

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  window.localStorage.removeItem(PUSH_ENDPOINT_STORAGE_KEY);
  return endpoint;
}

export function subscriptionToPayload(subscription: PushSubscription): {
  endpoint: string;
  keys: { p256dh: string; auth: string };
} {
  const json = subscription.toJSON();
  const endpoint = json.endpoint ?? subscription.endpoint;
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;
  if (!endpoint || !p256dh || !auth) {
    throw new Error('Push subscription is missing required keys.');
  }
  return { endpoint, keys: { p256dh, auth } };
}

export function readStoredPushEndpoint(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage.getItem(PUSH_ENDPOINT_STORAGE_KEY);
}

export function storePushEndpoint(endpoint: string): void {
  window.localStorage.setItem(PUSH_ENDPOINT_STORAGE_KEY, endpoint);
}
