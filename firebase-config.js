// js/firebase-config.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyBfkl_aCIE35eZQKDYfVqe5Wu8XJrqMNYM",
  authDomain: "nagibrokerai.firebaseapp.com",
  projectId: "nagibrokerai",
  storageBucket: "nagibrokerai.firebasestorage.app",
  messagingSenderId: "682836610499",
  appId: "1:682836610499:web:6d909603e36159df404176",
  measurementId: "G-5KQMSN8FZV"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);