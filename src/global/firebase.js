// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAGDA8cVYc4m-p6rRLmd1YMQHTxV1p7SQ0",
  authDomain: "stream-ae76e.firebaseapp.com",
  projectId: "stream-ae76e",
  storageBucket: "stream-ae76e.appspot.com",
  messagingSenderId: "814806442143",
  appId: "1:814806442143:web:3f1afad83bf4fd2c4502aa",
  databaseURL: "https://stream-ae76e-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app)
