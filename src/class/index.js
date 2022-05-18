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
const configBlock = document.getElementById('hidding-block')
const close = document.getElementById('close')
const dropList = document.getElementById('list')
const shortName = uniqueNamesGenerator({
    dictionaries: [adjectives, animals, colors],
    length: 3,
    separator: '-'
});
let firstTime = false;
let firstTime1 = false;
var peer = new Peer({
    debug: 3,
    config: {
        iceServers: [
            {
                url: "stun:stun.l.google.com:19302"
            },
            {
                url: 'turn:numb.viagenie.ca',
                credential: 'muazkh',
                username: 'webrtc@live.com'
            },
            {
                url: 'turn:192.158.29.39:3478?transport=udp',
                credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
                username: '28224511:1379330808'
            },
            {
                url: 'turn:192.158.29.39:3478?transport=tcp',
                credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
                username: '28224511:1379330808'
            },
            {
                url: 'turn:turn.bistri.com:80',
                credential: 'homeo',
                username: 'homeo'
             },
             {
                url: 'turn:turn.anyfirewall.com:443?transport=tcp',
                credential: 'webrtc',
                username: 'webrtc'
            }
          ],
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
    console.log('hihihihih');
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

function setMyBackgroundAndName(background, name) {
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
        alert(id)
        location.href = './start'
    }
}
peer.on('open', function (id) {
    // When the peer open start searching the member in the database
    video.dataset.code = id
    doFunction(id)
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
        if (location.hash.substring(1) == 'share') {
            let stream = await navigator.mediaDevices.getDisplayMedia(constructor)
            video.srcObject = stream
            getCallEvent(stream)
        } else {
            let stream = await navigator.mediaDevices.getUserMedia(constructor)
            video.srcObject = stream
            getCallEvent(stream)
        }
    } catch (e) {
        alert('Please allow your computer open the camera');
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

function listenNewPersonAdd() {
    let newPerson = ref(db, v + '/new')
    onValue(newPerson, snapshot => {
        let data = snapshot.val()
        if (!data) return
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
    video.load()
    video.autoplay = true
    videoContainer.appendChild(video)
    videoContainer.appendChild(videoText)
    container.appendChild(videoContainer)
    video.muted = remoteId[1]
    changeSomeOneVideoToImage(remoteId[0], remoteId[2])
    setTimeout(()=>{
        video.play()
    }, 0)
    

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
        if (status) {
            closeCamera.classList.remove('bi-camera-video-off-fill')
            closeCamera.classList.add('bi-camera-video-fill')
        } else {
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
        if (status) {
            muteBtn.classList.remove('bi-mic-fill')
            muteBtn.classList.add('bi-mic-mute-fill')
        } else {
            muteBtn.classList.remove('bi-mic-mute-fill')
            muteBtn.classList.add('bi-mic-fill')
        }
        muteBtn.dataset.status = status.toString()
    })
}

function changeSomeOneVideoToImage(id, toWhat) {
    let changeWindow = document.querySelector(`[data-code='${id}']`)
    console.log(changeWindow);
    changeWindow.style.display = 'none'
    setTimeout(()=>{
        if (!toWhat) {
            changeWindow.style.display = 'none'
            changeWindow.autoplay = true
        } else {
            changeWindow.style.display = 'inline'
            changeWindow.autoplay = true
        }
    }, 10)
    
}

function checkSomeOneChangeTheStatus(id) {
    const starCountRef = ref(db, v + '/status');
    onValue(starCountRef, snapshot => {
        if (!firstTime1) {
            firstTime1 = true
            return
        }
        const data = snapshot.val()
        console.log(data);
        let changeVideoWindow = document.querySelector(`[data-code='${data.id}']`)
        if (id != data.id) {
            changeVideoWindow.muted = data.audio
            changeVideoWindow.autoplay = true
            console.log('I change');
        } else {
            console.log(id, data.id);
        }
        changeSomeOneVideoToImage(data.id, data.camera)
    })
}

function someButton(){
    close.addEventListener('click', ()=>{
        configBlock.style.display = 'none'
    })
    dropList.addEventListener('click', ()=>{
        configBlock.style.display = 'flex'
    })
}



async function doFunction(id) {
    checkTheRoom()
    checkSomeoneDisconnect()
    console.log('11111');
    await getCameraAndSendStream()
    console.log('22222');
    console.log(video.srcObject);
    startGetPeer(video.srcObject)
    addMeToDatabase(id)
    checkSomeOneChangeTheStatus(id)
    listenNewPersonAdd()
}

someButton()




