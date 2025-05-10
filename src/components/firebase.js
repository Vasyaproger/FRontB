import { initializeApp, setLogLevel } from 'firebase/app';
import { getAuth, GoogleAuthProvider, RecaptchaVerifier } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Включить отладку Firebase
setLogLevel('debug');

const firebaseConfig = {
  apiKey: 'AIzaSyDEB9KTr5dIuYypZy93LZWbsSKcC8m_Z0M',
  authDomain: 'boodai-pizza.firebaseapp.com',
  projectId: 'boodai-pizza',
  storageBucket: 'boodai-pizza.firebasestorage.app',
  messagingSenderId: '692171527443',
  appId: '1:692171527443:web:4dfbfeb1dfaedaa7b0b6e6',
  measurementId: 'G-0ZSKHFCX41',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, googleProvider, db, storage, RecaptchaVerifier };