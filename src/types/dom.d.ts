/**
 * Global DOM type augmentations for Web APIs not fully covered
 * by TypeScript's default lib definitions.
 *
 * This file uses ambient module augmentation so every file in
 * the project picks up the types automatically — no triple-slash
 * references or per-file `declare global` blocks required.
 */

/* ---------- Push API ---------- */

interface PushSubscriptionOptionsInit {
  userVisibleOnly?: boolean;
  applicationServerKey?: BufferSource | string | null;
}

interface PushManager {
  getSubscription(): Promise<PushSubscription | null>;
  subscribe(options?: PushSubscriptionOptionsInit): Promise<PushSubscription>;
  permissionState(options?: PushSubscriptionOptionsInit): Promise<PushPermissionState>;
}

type PushPermissionState = 'denied' | 'granted' | 'prompt';

interface ServiceWorkerRegistration {
  readonly pushManager: PushManager;
}
