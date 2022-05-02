import "../global/global.css"
import "./index.css"
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../global/firebase.js"
const video = document.getElementById('video')
const container = document.getElementById('container')
const come = document.getElementById('come')
const leave = document.getElementById('leave')
var peer = new Peer({
    debug: 3,
    config: {
        iceServers: [{
            urls: 'stun:stun.l.google.com:19302',
        }],
        iceTransportPolicy: 'all'
    },
    secure: true
});
const url = new URL(location.href);
const v = url.searchParams.get('v');


function checkTheRoom() {
    if (!v) {
        alert('You don\'t have a room number')
        location.href = './start'
    }
}


async function startGetPeer(stream) {
    const docRef = doc(db, "room", v);
    const docSnap = await getDoc(docRef);
    let data = docSnap.data().user
    console.log(data);
    data.map(item => {
        console.log('ji');
        callStream(item, stream)
    })
}

async function delThePeople(userId){
    const docRef = doc(db, "room", v);
    const docSnap = await getDoc(docRef);
    let data = docSnap.data().user
    let sendArr = data
    data.map(async(item, i) => {
        if(item !== userId) return
        sendArr.splice(i, 1)
        await setDoc(doc(db, 'room', v), {
            user: [
                ...sendArr
            ]
        });
    })
}

async function addMeToDatabase(id) {
    try {
        let docRef = doc(db, "room", v);
        let docSnap = await getDoc(docRef);
        let data = docSnap.data().user
        await setDoc(doc(db, 'room', v), {
            user: [
                ...data,
                id
            ]
        });
    } catch (e) {
        alert('The room id is incorrect!')
        location.href = './start'
    }
}

peer.on('open', async function (id) {
    // When the peer open start searching the member in the database
    startGetPeer(video.srcObject)
    addMeToDatabase(id)
});

function getCallEvent(stream) {
    peer.on('call', data => {
        data.answer(stream)
        data.on('stream', remoteStream => {
            come.play()
            let videoNew = document.createElement('video')
            newVideo(data.peer, videoNew, remoteStream)
            checkOnline(videoNew)
        })
    })
}

async function getCameraAndSendStream() {
    let constructor = {
        video: true,
        audio: true
    }
    try {
        let stream = await navigator.mediaDevices.getUserMedia(constructor)
        video.srcObject = stream
        getCallEvent(stream)
    } catch (e) {
        console.error(e);
    }

}

function checkOnline(video) {
    // if the video tag doesn't play for 3 second it will be disappear
    let videoCurrent = video.currentTime;
    let leaveState = false
    setInterval(async () => {
        if (leaveState) {
            return
        }
        let videoCheck = video.currentTime
        if (videoCurrent == videoCheck) {
            delThePeople(video.dataset.code)
            video.style.display = 'none'
            leaveState = true
            leave.play()
        } else {
            videoCurrent = video.currentTime
        }
    }, 3000)
}


function callStream(remoteId, mediaStream) {
    console.log('I call ' + remoteId);
    let callStream = peer.call(remoteId, mediaStream)
    callStream.on('stream', remoteStream => {
        come.play()
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
    video.classList.add('border')
    video.classList.add('border-white')
    video.classList.add('border-4')
    video.srcObject = remoteStream
    video.dataset.code = remoteId
    video.autoplay = true
    container.appendChild(video)
}


getCameraAndSendStream()
checkTheRoom()
