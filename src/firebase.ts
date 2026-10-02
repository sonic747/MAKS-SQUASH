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

// Browser & Environment Detection
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function isStandalonePWA(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
}

export function isInAppBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  // KakaoTalk, Naver, Line, Instagram, Facebook in-app webviews
  return /KAKAOTALK|NAVER|Line|Instagram|FB_IAB|FBAN|FBAV/i.test(ua);
}

// Check if Notification & Service Worker are available
export function isPushNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window && 'serviceWorker' in navigator;
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
): Promise<{ success: boolean; token?: string; error?: string; reason?: 'in_app' | 'ios_standalone' | 'unsupported' | 'denied' }> {
  if (typeof window === 'undefined') {
    return { success: false, error: '브라우저 환경이 아닙니다.' };
  }

  // 1. In-App browser check (KakaoTalk, Naver, Instagram etc)
  if (isInAppBrowser()) {
    return {
      success: false,
      reason: 'in_app',
      error: '카카오톡/인앱 브라우저는 웹 푸시를 차단합니다. 우측 상단/하단 메뉴에서 [Chrome으로 열기] 또는 [Safari로 열기]를 눌러주세요.',
    };
  }

  // 2. iOS Safari check: Apple requires adding to Home Screen first
  if (isIOS() && !isStandalonePWA()) {
    // If Notification API is missing on iOS Safari web tab, instruct to Add to Home Screen
    if (!('Notification' in window)) {
      return {
        success: false,
        reason: 'ios_standalone',
        error: '아이폰 Safari는 [홈 화면에 추가] 후 실행해야 웹 푸시 알림이 지원됩니다. (사파리 하단 공유 버튼 ➔ [홈 화면에 추가])',
      };
    }
  }

  // 3. General support check
  if (!isPushNotificationSupported()) {
    return {
      success: false,
      reason: 'unsupported',
      error: '현재 브라우저 환경에서 푸시 알림이 비활성화되어 있습니다. 크롬(Chrome) 또는 삼성 인터넷 브라우저로 접속해주세요.',
    };
  }

  try {
    const swReg = await registerPushServiceWorker();

    let permission: NotificationPermission = 'default';
    try {
      permission = await Notification.requestPermission();
    } catch (permErr) {
      // Old iOS or safari callback style
      permission = await new Promise<NotificationPermission>((resolve) => {
        Notification.requestPermission((p) => resolve(p));
      });
    }

    if (permission !== 'granted') {
      return {
        success: false,
        reason: 'denied',
        error: '알림 권한이 차단되었습니다. 브라우저 사이트 설정에서 알림을 [허용]으로 변경해주세요.',
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
