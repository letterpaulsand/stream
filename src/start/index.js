import "../global/global.css"
import { db } from "../global/firebase.js"
import { set, ref } from "firebase/database";
import ShortUniqueId from 'short-unique-id';
import moment from "moment";
const uid = new ShortUniqueId();
const btn = document.getElementById('btn')
const input = document.getElementById('input')

input.addEventListener('keyup', e => {
  if (e.keyCode === 13) {
    location.href = '../?v=' + e.target.value
  }
})

btn.addEventListener('click', async () => {
  try {
    let roomName = uid()
    await set(ref(db, roomName), {
      date: moment().format('YYYY-MM-DD')
    })
    location.href = '../?v=' + roomName
  } catch (e) {
    console.error("Error adding document: ", e);
  }
})