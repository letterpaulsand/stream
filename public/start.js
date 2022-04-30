import { addDoc, collection } from "firebase/firestore"; 
import { db } from "./firebase.js"
const btn = document.getElementById('btn')
btn.addEventListener('click', async ()=>{
    try {
        const docRef = await addDoc(collection(db, "room"), {
            user: [
                
            ]
        });
        location.href = './index.html?v=' + docRef.id
      } catch (e) {
        console.error("Error adding document: ", e);
      }
})