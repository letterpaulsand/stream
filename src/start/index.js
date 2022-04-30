import "../global/global.css"
import { addDoc, collection } from "firebase/firestore"; 
import { db } from "../global/firebase.js"
const btn = document.getElementById('btn')
const input = document.getElementById('input')

input.addEventListener('keyup', e => {
  if(e.keyCode === 13){
    location.href = '../?v=' + e.target.value
  }
})

btn.addEventListener('click', async ()=>{
    try {
        const docRef = await addDoc(collection(db, "room"), {
            user: [
                
            ]
        });
        location.href = '../?v=' + docRef.id
      } catch (e) {
        console.error("Error adding document: ", e);
      }
})