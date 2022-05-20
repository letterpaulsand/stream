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
const myName = document.getElementById('myName')
const myImage = document.getElementById('myImage')
const audioList = document.getElementById('audioList')
const videoList = document.getElementById('videoList')
const chatContainer = document.getElementById('chat-container')
const chat = document.getElementById('chat')
const closeChat = document.getElementById('closeChat')
const chatContent = document.getElementById('content')
const chatInput = document.getElementById('chat-input')
const peopleBtn = document.getElementById('peopleBtn')
const closeMember = document.getElementById('closeMember')
const memberContainer = document.getElementById('member-container')
const member = document.getElementById('member')
const shortName = uniqueNamesGenerator({
    dictionaries: [adjectives, animals, colors],
    length: 3,
    separator: '-'
});
let firstTime = false;
let firstTime1 = false;
let firstTime2 = false;
let firstTime3 = false;
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
    get(child(dbRef, v + '/user')).then(snapshot => {
        if (snapshot.exists()) {
            let data = snapshot.val()
            let dataArr = Object.values(data).map(item => [item.id, item.audio, item.camera, item.userName, item.imageURL]);
            dataArr.map(item => {
                callStream(item, stream)
                newTheMember(item[3], item[4], item[0])
            })
            console.log(dataArr);
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
        changeUserProfile(postKey, id)
        set(newPostRef, {
            id: id,
            camera: false,
            audio: true,
            userName: shortName,
            imageURL: `url(${image.url})`
        });
        set(ref(db, `${v}/new`), {
            id: id,
            camera: false,
            audio: true,
            userName: shortName,
            imageURL: `url(${image.url})`
        })
    } catch (e) {
        alert(id)
        location.href = './start'
    }
}
peer.on('open', function (id) {
    // When the peer open start searching the member in the database
    video.dataset.code = id
    myVideoContainer.dataset.codename = id
    doFunction(id)
});

function newTheMember(name, url, id){
    let checkMember = document.querySelector(`[data-member='${id}']`)
    if(checkMember) return
    let newMemberContent = document.createElement('div')
    let newMemberContentName = document.createElement('p')
    let newMemberContentImage = document.createElement('div')
    let newMemberPill = document.createElement('i')
    newMemberPill.classList.add('bi')
    newMemberPill.classList.add('bi-arrows-fullscreen')
    newMemberContent.classList.add('member-content')
    newMemberContent.dataset.member = id
    newMemberContentImage.classList.add('member-image')
    newMemberContentName.classList.add('member-name')
    newMemberContentName.innerText = name
    newMemberContentImage.style.backgroundImage = url
    newMemberContent.appendChild(newMemberContentImage)
    newMemberContent.appendChild(newMemberContentName)
    newMemberContent.appendChild(newMemberPill)
    member.appendChild(newMemberContent)
}

function changeUserProfile(postKey, id) {
    myName.addEventListener('keyup', e => {
        if (e.keyCode != 13) return
        if(e.target.value == '')return
        changeMyName(postKey, e.target.value, id)
        myName.value = ''
    })
    myImage.addEventListener('keyup', e => {
        if (e.keyCode != 13) return
        if(e.target.value == '')return
        changeMyImg(postKey, e.target.value, id)
        myImage.value = ''
    })
}


function getCallEvent(stream) {
    peer.on('call', data => {
        data.answer(stream)
        let theOtherVideo = document.querySelector(`[data-code='${data.peer}']`)
        if(!theOtherVideo) return
        data.on('stream', stream => {
            theOtherVideo.srcObject = stream
        })
    })
}



async function putTheNameIntoTheOption() {
    function getTheCameraAndAudioLabel() {
        return navigator.mediaDevices.enumerateDevices();
    }
    let deviceInfos = await getTheCameraAndAudioLabel()
    window.deviceInfos = deviceInfos
    for (let deviceInfo of deviceInfos) {
        let newDeviceVideo = document.createElement('option')
        newDeviceVideo.value = deviceInfo.deviceId
        if (deviceInfo.kind === 'audioinput') {
            newDeviceVideo.text = deviceInfo.label || `Microphone ${audioSelect.length + 1}`;
            audioList.appendChild(newDeviceVideo);
        } else if (deviceInfo.kind === 'videoinput') {
            newDeviceVideo.text = deviceInfo.label || `Camera ${videoSelect.length + 1}`;
            videoList.appendChild(newDeviceVideo);
        }
    }
}

async function getCameraAndSendStream(id) {
    if (window.stream) {
        window.stream.getTracks().forEach(track => {
            track.stop();
        });
    }
    let cameraStatusProp = closeCamera.dataset.status
    let audioStatusProp = muteBtn.dataset.status
    let cameraStatus = cameraStatusProp == 'true' ? true : false
    let audioStatus = audioStatusProp == 'true' ? false : true
    let constructor = {
        video: videoList.value ? { deviceId: videoList.value } : cameraStatus,
        audio: audioList.value ? { deviceId: audioList.value } : audioStatus
    }
    try {
        if (location.hash.substring(1) == 'share') {
            let stream = await navigator.mediaDevices.getDisplayMedia(constructor)
            video.srcObject = stream
            getCallEvent(stream)
        } else {
            let stream = await navigator.mediaDevices.getUserMedia(constructor)
            window.stream = stream
            video.srcObject = stream
            getCallEvent(stream)
            if(videoList.value || audioList.value){
                startGetPeer(video.srcObject)
            }
            let myAllTrack = stream.getTracks()
            let myStatusRef = ref(db, v + '/status');
            myAllTrack.forEach(track => {
                track.enabled = false
                console.log('ended');
            })
            onValue(myStatusRef, snapshot => {
                const data = snapshot.val();
                if (data.id != id) return
                if (data.audio && !data.camera) {
                    myAllTrack.forEach(track => {
                        track.enabled = false
                        console.log(data);
                    })
                } else {
                    myAllTrack.forEach(track => {
                        track.enabled = true
                        console.log('live');
                    })
                }
            });
        }

    } catch (e) {
        alert('Please allow your computer open the camera');
        if(!cameraStatus){
            closeCamera.click()
        }
        if(audioStatus){
            muteBtn.click()
        }
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
        if (!firstTime2) {
            firstTime2 = true
            return
        }
        let data = snapshot.val()
        if (!data) return
        let sendArr = [data.id, data.audio, data.camera, data.userName, data.imageURL]
        callStream(sendArr, video.srcObject)
        newTheMember(data.userName, data.imageURL, data.id)
    })
}

function newVideo(remoteId, remoteStream) {
    let checkVideoElement = document.querySelector(`[data-code='${remoteId[0]}']`)
    if (checkVideoElement) return
    console.log(remoteId);
    let video = document.createElement('video')
    let videoContainer = document.createElement('div')
    let videoText = document.createElement('p')
    videoText.innerText = remoteId[3]
    videoContainer.classList.add('videoContainer')
    videoContainer.style.backgroundImage = remoteId[4]
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
    setTimeout(() => {
        video.play()
    }, 0)
}

function dealClosingCamera(key, id) {
    closeCamera.addEventListener('click', () => {
        let theOtherContainer = document.querySelector(`[data-codename='${id}']`)
        let status = closeCamera.dataset.status == 'true' ? false : true;
        set(ref(db, `${v}/status`), {
            id: id,
            camera: status,
            audio: muteBtn.dataset.status == 'true' ? true : false,
            userName: theOtherContainer.querySelector('p').innerText,
            imageURL: theOtherContainer.style.backgroundImage
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
        let userContainer = document.querySelector(`[data-codename='${id}']`)
        let userImage = userContainer.style.backgroundImage
        let userNameNode = userContainer.querySelector('p').innerText
        set(ref(db, `${v}/status`), {
            id: id,
            camera: closeCamera.dataset.status == 'true' ? true : false,
            audio: status,
            userName: userNameNode,
            imageURL: userImage
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
    audioList.addEventListener('change', () => {
        getCameraAndSendStream(id)
    })
    videoList.addEventListener('change', () => {
        getCameraAndSendStream(id)
    })
}

function changeSomeOneVideoToImage(id, toWhat) {
    let changeWindow = document.querySelector(`[data-code='${id}']`)
    console.log(changeWindow);
    changeWindow.style.display = 'none'
    setTimeout(() => {
        if (!toWhat) {
            changeWindow.style.display = 'none'
            changeWindow.autoplay = true
        } else {
            changeWindow.style.display = 'inline'
            changeWindow.autoplay = true
        }
    }, 10)
}

function changeMyName(postKey, name, id) {
    let backgroundImage = document.querySelector(`[data-codename='${id}']`)
    set(ref(db, `${v}/user/${postKey}/userName`), name)
    set(ref(db, `${v}/status`), {
        id: id,
        userName: name,
        imageURL: backgroundImage.style.backgroundImage,
        camera: closeCamera.dataset.status == 'true' ? true : false,
        audio: muteBtn.dataset.status == 'true' ? true : false
    })
}

function changeMyImg(postKey, url, id) {
    let textNode = document.querySelector(`[data-codename='${id}']`).querySelector('p')
    set(ref(db, `${v}/user/${postKey}/imageURL`), url)
    set(ref(db, `${v}/status`), {
        id: id,
        userName: textNode.innerText,
        imageURL: url,
        camera: closeCamera.dataset.status == 'true' ? true : false,
        audio: muteBtn.dataset.status == 'true' ? true : false
    })
}


function checkSomeOneChangeTheStatus(id) {
    const starCountRef = ref(db, v + '/status');
    onValue(starCountRef, snapshot => {
        if (!firstTime1) {
            firstTime1 = true
            return
        }
        const data = snapshot.val()
        let changeVideoWindow = document.querySelector(`[data-code='${data.id}']`)
        let changeVideoWindowContainer = document.querySelector(`[data-codename='${data.id}']`)
        if (id != data.id) {
            changeVideoWindow.muted = data.audio
        }
        let userName = changeVideoWindowContainer.querySelector('p')
        changeVideoWindow.autoplay = true
        userName.innerText = data.userName
        changeVideoWindowContainer.style.backgroundImage = `url(${data.imageURL})`
        changeSomeOneVideoToImage(data.id, data.camera)
    })
}

function someButton() {
    close.addEventListener('click', () => {
        configBlock.style.display = 'none'
    })
    dropList.addEventListener('click', () => {
        configBlock.style.display = 'flex'
    })
    closeChat.addEventListener('click', () => {
        chatContainer.style.display = 'none'
    })
    chat.addEventListener('click', () => {
        console.log(1);
        chatContainer.style.display = 'flex'
    })
    chatInput.addEventListener('keyup', e => {
        if (e.keyCode != 13) return
        console.log('hihihihih');
        if(e.target.value == '') return
        sendChatToDataBase(e.target.value)
        chatInput.value = ''
    })
    async function sendChatToDataBase(text) {
        await set(ref(db, `${v}/chat`), {
            name: container.getElementsByTagName('p')[0].innerText,
            message: text
        })
        set(ref(db, `${v}/chat`), {
            name: container.getElementsByTagName('p')[0].innerText,
            message: ''
        })
    }
    closeMember.addEventListener('click', ()=>{
        memberContainer.style.display = 'none'
    })
    peopleBtn.addEventListener('click', ()=>{
        memberContainer.style.display = 'flex'
    })
}

function listenNewChat() {
    let chatRef = ref(db, v + '/chat');
    onValue(chatRef, snapshot => {
        if (!firstTime3) {
            firstTime3 = true
            return
        }
        const data = snapshot.val()
        if(data.message == '') return
        let newTextElement = document.createElement('p')
        let newTextNode = document.createTextNode(`${data.name}: ${data.message}`)
        newTextElement.appendChild(newTextNode)
        chatContent.appendChild(newTextElement)
        chatContent.scrollTop = chatContent.scrollHeight
    })
}

async function doFunction(id) {
    checkTheRoom()
    putTheNameIntoTheOption()
    checkSomeoneDisconnect()
    listenNewChat()
    await getCameraAndSendStream(id)
    startGetPeer(video.srcObject)
    addMeToDatabase(id)
    checkSomeOneChangeTheStatus(id)
    listenNewPersonAdd()
}

someButton()
