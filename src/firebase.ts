import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import firebaseConfig from '../firebase-applet-config.json';
import { ClubPushToken } from './types';
import { savePushTokenToFirestore } from './services/firestoreService';

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Check if Notification & Service Worker are available
export function isPushNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}

// Get current browser notification permission
export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'default';
  }
  return Notification.permission;
}

/**
 * Register Service Worker for FCM Web Push
 */
export async function registerPushServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });
    return registration;
  } catch (err) {
    console.warn('Service worker registration failed:', err);
    return null;
  }
}

/**
 * Request Notification Permission and Generate/Retrieve FCM Token
 */
export async function requestPushPermissionAndGetToken(
  memberId: string,
  memberName: string,
  role: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  if (!isPushNotificationSupported()) {
    return { success: false, error: '이 브라우저는 웹 푸시 알림을 지원하지 않습니다.' };
  }

  try {
    const swReg = await registerPushServiceWorker();

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return {
        success: false,
        error: '알림 권한이 차단되었습니다. 브라우저 사이트 설정에서 알림을 허용해주세요.',
      };
    }

    let fcmToken = '';

    // Check if Firebase Messaging is supported in this browser
    const messagingSupported = await isSupported().catch(() => false);
    if (messagingSupported && firebaseConfig.apiKey) {
      try {
        const messaging = getMessaging(app);
        fcmToken = await getToken(messaging, {
          serviceWorkerRegistration: swReg || undefined,
        });
      } catch (fcmErr) {
        console.warn('FCM direct token failed, generating unique device subscription ID', fcmErr);
      }
    }

    // Fallback device token generation if FCM vapid is not configured or in sandbox
    if (!fcmToken) {
      const stored = localStorage.getItem('maks_device_push_token');
      if (stored) {
        fcmToken = stored;
      } else {
        fcmToken = `fcm_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
        localStorage.setItem('maks_device_push_token', fcmToken);
      }
    }

    const platform = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      ? 'mobile'
      : /Tablet|iPad/i.test(navigator.userAgent)
      ? 'tablet'
      : 'desktop';

    const pushRecord: ClubPushToken = {
      token: fcmToken,
      memberId,
      memberName,
      role,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      userAgent: navigator.userAgent.substring(0, 150),
      platform,
    };

    // Save to Firestore
    await savePushTokenToFirestore(pushRecord);

    // Save local active subscription state
    localStorage.setItem('maks_push_subscribed', 'true');
    localStorage.setItem('maks_push_token', fcmToken);

    return { success: true, token: fcmToken };
  } catch (err: any) {
    console.error('Failed to register push token:', err);
    return { success: false, error: err?.message || '알림 토큰 발급 중 오류가 발생했습니다.' };
  }
}

/**
 * Display native browser push notification banner
 */
export function displayLocalPushNotification(
  title: string,
  options?: { body?: string; icon?: string; tag?: string; url?: string }
) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const defaultIcon =
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=192&q=80';

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.showNotification(title, {
        body: options?.body || 'MAKS 스쿼시 클럽의 새로운 소식을 확인하세요.',
        icon: options?.icon || defaultIcon,
        badge: defaultIcon,
        tag: options?.tag || 'maks-notice',
        data: { url: options?.url || '/' },
      });
    });
  } else {
    new Notification(title, {
      body: options?.body || 'MAKS 스쿼시 클럽의 새로운 소식을 확인하세요.',
      icon: options?.icon || defaultIcon,
    });
  }
}

export default app;
