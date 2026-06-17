// Service Worker for Firebase Cloud Messaging
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDCtsxXLcO_2P9yBPuULgIkHRCPmHOb8oU",
  authDomain: "expense-managment-7f73f.firebaseapp.com",
  projectId: "expense-managment-7f73f",
  storageBucket: "expense-managment-7f73f.firebasestorage.app",
  messagingSenderId: "930877244924",
  appId: "1:930877244924:web:bf06343340f1322381de79"
};

// Initialize Firebase in the Service Worker
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Customize background notification handling here if needed
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification?.title || "Thông báo EM";
  const notificationOptions = {
    body: payload.notification?.body || "Bạn có thông báo mới.",
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
