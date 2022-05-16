import "../global/global.css"
import "./index.css"
import { db } from "../global/firebase.js"
import { set, ref, push, get, child, onDisconnect, onValue } from "firebase/database";
import { uniqueNamesGenerator, adjectives, colors, animals } from "unique-names-generator"
import { RandomPicture } from "random-picture"

const video = document.getElementById('video')
const container = document.getElementById('container')
const myVideoContainer = document.getElementById('myVideoContainer')
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

function setMyBackgroundAndName(background, name){
    let textContent = myVideoContainer.getElementsByTagName('p')[0]
    textContent.innerText = name
    myVideoContainer.style.backgroundImage = `url(${background})`
}


async function addMeToDatabase(id) {
    try {
        let image = await RandomPicture()
        let postListRef = ref(db, v + '/user');
        let newPostRef = push(postListRef);
        let postKey = newPostRef.key;
        setMyBackgroundAndName(image.url, shortName)
        disconnect(postKey, id)
        dealClosingCamera(postKey, id)
        set(newPostRef, {
            id: id,
            camera: false,
            audio: true,
            userName: shortName,
            imageURL: image.url
        });
        set(ref(db, `${v}/new`), {
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

function closeTheOtherWindow(id) {
    let closeWindow = document.querySelector(`[data-codename='${id}']`)
    leave.play()
    console.log(id);
    closeWindow.remove()
}

function callStream(remoteId, mediaStream) {
    if (video.dataset.code === remoteId[0]) return
    console.log('I call ' + remoteId[0]);
    let callStream = peer.call(remoteId[0], mediaStream)
    callStream.on('stream', remoteStream => {
        come.play()
        newVideo(remoteId, remoteStream)
    })
}

function listenNewPersonAdd(){
    let newPerson = ref(db, v + '/new')
    onValue(newPerson, snapshot => {
        let data = snapshot.val()
        let sendArr = [data.id, data.audio, data.camera, data.userName, data.imageURL]
        callStream(sendArr, video.srcObject)
    })
}

function newVideo(remoteId, remoteStream) {
    let checkVideoElement = document.querySelector(`[data-code='${remoteId[0]}']`)
    if (checkVideoElement) return
    let video = document.createElement('video')
    let videoContainer = document.createElement('div')
    let videoText = document.createElement('p')
    videoText.innerText = remoteId[3]
    videoContainer.classList.add('videoContainer')
    videoContainer.style.backgroundImage = `url(${remoteId[4]})`
    video.dataset.code = remoteId[0]
    videoContainer.dataset.codename = remoteId[0] 
    video.srcObject = remoteStream
    video.autoplay = true
    videoContainer.appendChild(video)
    videoContainer.appendChild(videoText)
    container.appendChild(videoContainer)
    video.muted = remoteId[1]
    changeSomeOneVideoToImage(remoteId[0], remoteId[2])
    

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
        if(status){
            closeCamera.classList.remove('bi-camera-video-off-fill')
            closeCamera.classList.add('bi-camera-video-fill')
        }else{
            closeCamera.classList.remove('bi-camera-video-fill')
            closeCamera.classList.add('bi-camera-video-off-fill')
        }     
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
        if(status){
            muteBtn.classList.remove('bi-mic-fill')
            muteBtn.classList.add('bi-mic-mute-fill')
        }else{
            muteBtn.classList.remove('bi-mic-mute-fill')
            muteBtn.classList.add('bi-mic-fill')
        }  
        muteBtn.dataset.status = status.toString()
    })
}

function changeSomeOneVideoToImage(id, toWhat){
    let changeWindow = document.querySelector(`[data-code='${id}']`)
    console.log(changeWindow);
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
        console.log(data);
        let changeVideoWindow = document.querySelector(`[data-code='${data.id}']`)
        if(id != data.id){
            changeVideoWindow.muted = data.audio
            console.log('I change');
        }else{
            console.log(id, data.id);
        }
        changeSomeOneVideoToImage(data.id, data.camera)
    })
}



getCameraAndSendStream()
checkTheRoom()
checkSomeoneDisconnect()
listenNewPersonAdd()
