/**
 * Cross-platform haptics wrapper.
 * No-ops on web; uses Capacitor Haptics on native.
 */
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

const isNative = () => Capacitor.isNativePlatform();

export const haptics = {
  async light() {
    if (!isNative()) return;
    try { await Haptics.impact({ style: ImpactStyle.Light }); } catch {}
  },
  async medium() {
    if (!isNative()) return;
    try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch {}
  },
  async heavy() {
    if (!isNative()) return;
    try { await Haptics.impact({ style: ImpactStyle.Heavy }); } catch {}
  },
  async success() {
    if (!isNative()) return;
    try { await Haptics.notification({ type: NotificationType.Success }); } catch {}
  },
  async warning() {
    if (!isNative()) return;
    try { await Haptics.notification({ type: NotificationType.Warning }); } catch {}
  },
  async error() {
    if (!isNative()) return;
    try { await Haptics.notification({ type: NotificationType.Error }); } catch {}
  },
  async selection() {
    if (!isNative()) return;
    try { await Haptics.selectionStart(); await Haptics.selectionEnd(); } catch {}
  },
};
