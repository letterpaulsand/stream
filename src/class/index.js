import "../global/global.css"
import "./index.css"
import { db } from "../global/firebase.js"
import { set, ref, push, get, child, onDisconnect, onValue } from "firebase/database";
import { uniqueNamesGenerator, adjectives, colors, animals } from "unique-names-generator"
import { RandomPicture } from "random-picture"

const video = document.getElementById('video')
const container = document.getElementById('container')
const come = document.getElementById('come')
const leave = document.getElementById('leave')
const muteBtn = document.getElementById('audio-btn')
const closeCamera = document.getElementById('video-btn')
const shortName = uniqueNamesGenerator({
    dictionaries: [adjectives, animals, colors],
    length: 3,
    separator: '-'
});
let firstTime = false;

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
            let dataArr = Object.values(data).map(item => [item.id, item.audio, item.camera, item.userName, item.imageURL]);
            dataArr.map(item => {
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
        let image = await RandomPicture()
        let postListRef = ref(db, v + '/user');
        let newPostRef = push(postListRef);
        let postKey = newPostRef.key;
        disconnect(postKey, id)
        dealClosingCamera(postKey, id)
        set(newPostRef, {
            id: id,
            camera: false,
            audio: false,
            userName: shortName,
            imageURL: image.url
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

function disconnect(key, id) {
    console.log(key);
    let presenceRef = ref(db, v + '/user/' + key);
    onDisconnect(presenceRef).set(null);
    let addMeToDel = ref(db, v + '/del');
    onDisconnect(addMeToDel).set(id);
}

function checkSomeoneDisconnect() {
    const starCountRef = ref(db, v + '/del');
    onValue(starCountRef, snapshot => {
        const data = snapshot.val();
        if (!firstTime) {
            firstTime = true
            return
        } else {
            closeTheOtherWindow(data)
        }
    });
}

function changeSomeOneVideoToImage(id, toWhat){
    if(toWhat){
        let changeWindow = document.querySelector(`[data-code='${id}']`)
        changeWindow.style.display = 'none'
    }
}

function checkSomeOneChangeTheStatus(){
    const starCountRef = ref(db, v + '/status');
    onValue(starCountRef, snapshot => {
        const data = snapshot.val()
        let changeVideoWindow = document.querySelector(`[data-code='${data.id}']`)
        changeVideoWindow.muted = data.audio
        
    })
}

function closeTheOtherWindow(id) {
    let closeWindow = document.querySelector(`[data-code='${id}']`)
    leave.play()
    closeWindow.remove()
}

function callStream(remoteId, mediaStream) {
    if (video.dataset.id === remoteId[0]) return
    console.log('I call ' + remoteId[0]);
    let callStream = peer.call(remoteId[0], mediaStream)
    callStream.on('stream', remoteStream => {
        come.play()
        let videoNew = document.createElement('video')
        newVideo(remoteId, videoNew, remoteStream)
    })
}

function newVideo(remoteId, video, remoteStream) {
    let checkVideoElement = document.querySelector(`[data-code='${remoteId}']`)
    if (checkVideoElement) return
    video.dataset.code = remoteId[0]
    video.classList.add('video')
    video.classList.add('border')
    video.classList.add('border-white')
    video.classList.add('border-4')
    video.srcObject = remoteStream
    video.autoplay = true
    if(!remoteId[1]){
        video.muted = false
    }
    if(!remoteId[2]){
        video.muted = false
    }
    container.appendChild(video)
}

function dealClosingCamera(key, id) {
    closeCamera.addEventListener('click', () => {
        let status = closeCamera.dataset.status == 'true' ? false : true;
        set(ref(db, `${v}/user/${key}/camera`), status)
        set(ref(db, `${v}/status`), {
            id: id,
            camera: status,
            audio: muteBtn.dataset.status,
            userName: true,
            imageURL: true
        })
        muteBtn.dataset.status = status
    })
    muteBtn.addEventListener('click', () => {
        let status = muteBtn.dataset.status == 'true' ? false : true;
        set(ref(db, `${v}/user/${key}/audio`), status)
        set(ref(db, `${v}/status`), {
            id: id,
            camera: closeCamera.dataset.status,
            audio: status,
            userName: true,
            imageURL: true
        })
        muteBtn.dataset.status = status
    })
}



getCameraAndSendStream()
checkTheRoom()
checkSomeoneDisconnect()
