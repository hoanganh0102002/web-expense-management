import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';
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
