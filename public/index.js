import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase.js"
const app = document.getElementById('app');
const video = document.getElementById('video')
const container = document.getElementById('container')
var peer = new Peer();
const url = new URL(location.href);
const v = url.searchParams.get('v');


async function startGetPeer(stream){
    const docRef = doc(db, "room", v);
    const docSnap = await getDoc(docRef);
    let data = docSnap.data().user
    console.log(data);
    data.map(item=>{
        console.log('ji');
        callStream(item, stream)
    })
}


peer.on('open', async function (id) {
    app.innerText = `My id is : ${id} My room is ${v}`
    const docRef = doc(db, "room", v);
    const docSnap = await getDoc(docRef);
    let data = docSnap.data().user
    await setDoc(doc(db, 'room', v), {
        user: [
            ...data,
            id
        ]
    });
});

async function getCameraAndSendStream() {
    let constructor = {
        video: true,
        audio: true
    }

    try {
        let stream = await navigator.mediaDevices.getUserMedia(constructor)
        video.srcObject = stream
        startGetPeer(stream)
        peer.on('call', async data => {
            console.log('some one call me');
            data.answer(stream)
            data.on('stream', remoteStream => {
                let videoNew = document.createElement('video')
                newVideo(data.peer, videoNew, remoteStream)
                checkOnline(videoNew)
            })
        })
    } catch (e) {
        console.error(e);
    }

}

function checkOnline(video) {
    let videoCurrent = video.currentTime;
    let leaveState = false
    setInterval(async () => {
        if (leaveState) {
            return
        }
        let videoCheck = video.currentTime
        if (videoCurrent == videoCheck) {
            console.log('left');
            video.style.display = 'none'
            leaveState = true
        } else {
            videoCurrent = video.currentTime
        }
    }, 3000)
}


async function callStream(remoteId, mediaStream) {
    console.log('I call ' + remoteId);
    let callStream = peer.call(remoteId, mediaStream)
    callStream.on('stream', remoteStream => {
        console.log('hi');
        let videoNew = document.createElement('video')
        newVideo(remoteId, videoNew, remoteStream)
        checkOnline(videoNew)
    })


}

function newVideo(remoteId, video, remoteStream) {
    let checkVideoElement = document.querySelector(`[data-code='${remoteId}']`)
    if (checkVideoElement) return
    video.dataset.code = remoteId
    video.classList.add('video')
    video.srcObject = remoteStream
    video.dataset.code = remoteId
    video.autoplay = true
    container.appendChild(video)
}


getCameraAndSendStream()



