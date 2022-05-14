import "../global/global.css"
import "./index.css"
import { db } from "../global/firebase.js"
import { set, ref, push, get, child, onDisconnect } from "firebase/database";
const video = document.getElementById('video')
const container = document.getElementById('container')
const come = document.getElementById('come')
const leave = document.getElementById('leave')
const muteBtn = document.getElementById('audio-btn')
const closeCamera = document.getElementById('video-btn')

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
    const dbRef = ref(db);

    get(child(dbRef, v + '/user')).then(snapshot => {
        if (snapshot.exists()) {
            let data = snapshot.val()
            let dataArr = Object.values(data).map(item => item.id);
            dataArr.map(item=>{
                callStream(item, stream)
            })
            console.log(dataArr, data);
        } else {
            console.log("No data available");
        }
    }).catch((error) => {
        console.error(error);
    });
}


async function addMeToDatabase(id) {
    try {
        let postListRef = ref(db, v + '/user');
        let newPostRef = push(postListRef);
        let postKey = newPostRef.key;
        disconnect(postKey)
        set(newPostRef, {
            id: id,
            camera: true,
            audio: true
        });
        console.log('ok');
    } catch (e) {
        alert('The room id is incorrect!')
        location.href = './start'
    }
}

peer.on('open', async function (id) {
    // When the peer open start searching the member in the database
    video.dataset.id = id
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
        })
        data.on('error', () => {
            console.log('someone disconnect');
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
        closeCamera.addEventListener('click', async () => {
            constructor = {
                video: false,
                audio: true
            }
            stream = await navigator.mediaDevices.getUserMedia(constructor)
            getCallEvent(stream)
            video.srcObject = stream
        })
        getCallEvent(stream)
    } catch (e) {
        console.error(e);
    }

}

function disconnect(key){
    console.log(key);
    const presenceRef = ref(db, v + '/user/' + key);
    onDisconnect(presenceRef).set(null);
}




function callStream(remoteId, mediaStream) {
    if(video.dataset.id === remoteId) return
    console.log('I call ' + remoteId);
    let callStream = peer.call(remoteId, mediaStream)
    callStream.on('stream', remoteStream => {
        come.play()
        let videoNew = document.createElement('video')
        newVideo(remoteId, videoNew, remoteStream)
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
