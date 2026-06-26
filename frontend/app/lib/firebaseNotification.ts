import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { authApi } from './api';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export const requestAndRegisterNotificationPermission = async () => {
  if (typeof window === 'undefined') return;

  // Check if firebase variables are set
  if (!firebaseConfig.apiKey || !VAPID_KEY) {
    console.warn("FCM push keys are not fully configured in environment variables.");
    return;
  }

  try {
    // 1. Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn("Notification permission was denied.");
      return;
    }

    // 2. Initialize Firebase App
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    
    // Messaging only works in secure context / supported browser
    let messaging;
    try {
      messaging = getMessaging(app);
    } catch (err) {
      console.warn("FCM messaging is not supported in this browser context:", err);
      return;
    }

    // 3. Get FCM Token
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (token) {
      console.log("FCM Device Token retrieved:", token);
      
      const savedToken = localStorage.getItem('fcm_device_token');
      if (savedToken !== token) {
        // 4. Send token to backend API
        await authApi.registerDeviceToken(token);
        localStorage.setItem('fcm_device_token', token);
        console.log("Device token registered successfully to backend.");
      }
    } else {
      console.warn("No registration token available. Request permission to generate one.");
    }
  } catch (error) {
    console.error("An error occurred while registering for push notifications:", error);
  }
};

// Singleton để tránh đăng ký listener nhiều lần
let foregroundListenerRegistered = false;

/**
 * Lắng nghe FCM messages khi app đang ở foreground.
 * Khi nhận được message:
 * - Gọi onMessageCallback để cập nhật notification count trong AppContext
 * - Dispatch custom event 'fcm-foreground-message' để trang notifications có thể tự refresh
 * - Hiển thị browser Notification nếu user cho phép
 */
export const setupFCMForegroundListener = (onMessageCallback: (payload: any) => void): (() => void) | undefined => {
  if (typeof window === 'undefined') return;
  if (foregroundListenerRegistered) return;

  if (!firebaseConfig.apiKey) {
    console.warn("FCM push keys are not configured. Skipping foreground listener.");
    return;
  }

  try {
    const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    
    let messaging: Messaging;
    try {
      messaging = getMessaging(app);
    } catch (err) {
      console.warn("FCM messaging is not supported in this browser context:", err);
      return;
    }

    foregroundListenerRegistered = true;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('[FCM Foreground] Message received:', payload);

      // 1. Gọi callback để AppContext cập nhật notification count
      onMessageCallback(payload);

      // 2. Dispatch custom event để trang /notifications tự động refresh danh sách
      window.dispatchEvent(new CustomEvent('fcm-foreground-message', { detail: payload }));

      // 3. Hiển thị browser notification (vì foreground FCM không tự hiện banner)
      if (Notification.permission === 'granted') {
        const title = payload.notification?.title || payload.data?.title || 'Thông báo mới';
        const body = payload.notification?.body || payload.data?.body || 'Bạn có thông báo mới từ EM.';
        
        try {
          new Notification(title, {
            body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'fcm-foreground-' + Date.now(), // Unique tag để không bị gộp
          });
        } catch (e) {
          // Fallback: dùng Service Worker nếu new Notification không hoạt động
          if (navigator.serviceWorker?.ready) {
            navigator.serviceWorker.ready.then(registration => {
              registration.showNotification(title, {
                body,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
              });
            });
          }
        }
      }
    });

    return () => {
      unsubscribe();
      foregroundListenerRegistered = false;
    };
  } catch (error) {
    console.error("Error setting up FCM foreground listener:", error);
  }
};
