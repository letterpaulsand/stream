const app = document.getElementById('app');
const video = document.getElementById('video')
const input = document.getElementById('streamId')
const btn = document.getElementById('btn')
const container = document.getElementById('container')
var peer = new Peer();
const video1 = document.getElementById('video1')
const url = new URL(location.href);
const v = url.searchParams.get('v');


peer.on('open', function (id) {
    app.innerText = `My id is : ${id}`
});

async function getCameraAndSendStream() {
    let constructor = {
        video: true,
        audio: true
    }

    try {
        let stream = await navigator.mediaDevices.getUserMedia(constructor)
        video.srcObject = stream
        peer.on('call', async data => {
            data.answer(stream)
            data.on('stream', remoteStream=>{
                let videoNew = document.createElement('video')
                newVideo(data.peer, videoNew, remoteStream)
                checkOnline(videoNew)
            })
            
        })
        btn.addEventListener('click', () => {
            callStream(input.value, stream)
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
    console.log('I call someone', input.value);
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



