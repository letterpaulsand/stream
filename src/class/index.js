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
            audio: true,
            userName: shortName,
            imageURL: image.url
        });
        set(ref(db, `${v}/status`), {
            id: id,
            camera: false,
            audio: true,
            userName: shortName,
            imageURL: image.url
        })
        console.log('ok');
    } catch (e) {
        alert('The room id is incorrect!')
        location.href = './start'
    }
}

peer.on('open', async function (id) {
    // When the peer open start searching the member in the database
    video.dataset.code = id
    startGetPeer(video.srcObject)
    addMeToDatabase(id)
    checkSomeOneChangeTheStatus(id)
});

function getCallEvent(stream) {
    peer.on('call', data => {
        data.answer(stream)
        data.on('stream', remoteStream => {
            come.play()
            let videoNew = document.createElement('video')
            let videoContainer = document.createElement('div')
            newVideo(data.peer, videoNew, videoContainer, remoteStream, 'text')
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
    let changeWindow = document.querySelector(`[data-code='${id}']`)
    if(!toWhat){
        changeWindow.style.display = 'none'
    }else{
        changeWindow.style.display = 'inline'
    }
}

function checkSomeOneChangeTheStatus(id){
    const starCountRef = ref(db, v + '/status');
    onValue(starCountRef, snapshot => {
        const data = snapshot.val()
        console.log(data.id);
        let changeVideoWindow = document.querySelector(`[data-code='${data.id}']`)
        if(id != data.id){
            changeVideoWindow.muted = data.audio
            alert('hihihih')
        }
        changeSomeOneVideoToImage(data.id, data.camera)
    })
}

function closeTheOtherWindow(id) {
    let closeWindow = document.querySelector(`[data-code='${id}']`)
    leave.play()
    console.log(id);
    closeWindow.remove()
}

function callStream(remoteId, mediaStream) {
    if (video.dataset.id === remoteId[0]) return
    console.log('I call ' + remoteId[0]);
    let callStream = peer.call(remoteId[0], mediaStream)
    callStream.on('stream', remoteStream => {
        come.play()
        let videoNew = document.createElement('video')
        let videoContainer = document.createElement('div')
        newVideo(remoteId, videoNew, videoContainer, remoteStream, 'arr')
    })
}

function newVideo(remoteId, video, videoContainer, remoteStream, type) {
    let checkVideoElement = document.querySelector(`[data-code='${type == 'text' ? remoteId : remoteId[0]}']`)
    if (checkVideoElement) return
    video.dataset.code = type == 'text' ? remoteId : remoteId[0]
    video.classList.add('video')
    video.classList.add('border')
    video.classList.add('border-white')
    video.classList.add('border-4')
    video.srcObject = remoteStream
    video.autoplay = true
    video.appendChild(videoContainer)
    container.appendChild(video)
    if(type == 'text'){
        video.muted = true
        changeSomeOneVideoToImage(remoteId, false)
    }else{
        video.muted = remoteId[1]
        changeSomeOneVideoToImage(remoteId[0], remoteId[2])
    }
    
}

function dealClosingCamera(key, id) {
    closeCamera.addEventListener('click', () => {
        let status = closeCamera.dataset.status == 'true' ? false : true;
        set(ref(db, `${v}/status`), {
            id: id,
            camera: status,
            audio: muteBtn.dataset.status == 'true' ? true : false,
            userName: true,
            imageURL: true
        })
        set(ref(db, `${v}/user/${key}/camera`), status)
        console.log(closeCamera.dataset.status);
        closeCamera.dataset.status = status.toString()
    })
    muteBtn.addEventListener('click', () => {
        let status = muteBtn.dataset.status == 'true' ? false : true;
        set(ref(db, `${v}/status`), {
            id: id,
            camera: closeCamera.dataset.status == 'true' ? true : false,
            audio: status,
            userName: true,
            imageURL: true
        })
        set(ref(db, `${v}/user/${key}/audio`), status)
        muteBtn.dataset.status = status.toString()
    })
}



getCameraAndSendStream()
checkTheRoom()
checkSomeoneDisconnect()
