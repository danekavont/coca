// app/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAsUdeNMsCfI-XxaeFqkmYYPwBNLH5D5Uw",
  authDomain: "coca-d061f.firebaseapp.com",
  projectId: "coca-d061f",
  storageBucket: "coca-d061f.firebasestorage.app",
  messagingSenderId: "340891731131",
  appId: "1:340891731131:web:08e9a8033881469426d59e",
  measurementId: "G-6RXN852M3Y"
};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // ✅ FIXED EXPORT
export const storage = getStorage(app);
export const auth = getAuth(app);

export { db }; // ✅ This makes it accessible to medications.tsx
