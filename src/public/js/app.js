const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");
const call = document.getElementById("call");
const cntRooms = document.getElementById("cntrooms");

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;
let myDataChannel;

async function getCameras(){
    try{
        const devices = await navigator.mediaDevices.enumerateDevices()
        const cameras = devices.filter(device => device.kind === "videoinput");
        const currentCamera = myStream.getVideoTracks()[0];
        cameras.forEach(camera => {
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if(currentCamera.label === camera.label){
                option.selected = true;
            }
            camerasSelect.appendChild(option);
        })
    } catch(e){
        console.log(e);
    }
    
}

async function getMedia(deviceId){
    const initialConstrains = { 
        audio: true,
         video: { facingMode: "user" },
    };
    const cameraConstrains = { 
        audio: true, 
        video: { deviceId: { exact: deviceId } },
     };    
    try {
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId? cameraConstrains : initialConstrains
        );
        myFace.srcObject = myStream;
        if(!deviceId){
            await getCameras();
        };
    } catch(e){
        console.log(e);
    };
};

function handleMuteClick(){
    myStream.getAudioTracks().forEach(track => (
        track.enabled = !track.enabled
    ));
    if(!muted){
        muteBtn.innerText = "UnMute";
        muted = true;
    } else{
        muteBtn.innerText = "Mute";
        muted = false;
    }
}

function handleCameraClick(){
    myStream.getVideoTracks().forEach(track => (
        track.enabled = !track.enabled
    ));
    if(cameraOff){
        cameraBtn.innerText = "Turn Camera Off";
        cameraOff = false;
    } else{
        cameraBtn.innerText = "Turn Camera On";
        cameraOff = true;
    }
}

async function handleCameraChange(){
    await getMedia(camerasSelect.value);
    if(myPeerConnection){
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection
            .getSenders()
            .find((sender) => sender.track.kind === "video");
        videoSender.replaceTrack(videoTrack);
    }
}

const addMsgBtn = document.getElementById("addMsg");
const chatWindow = document.getElementById("chat");
const msgForm = chatWindow.querySelector("form");

let addmsg = false;

function handleAddMsgBtn(){
    if(addmsg === false){
        addMsgBtn.innerText = "- Hide Message";
        chatWindow.style.display = "block";
        addmsg = true;       
    } else{
        addMsgBtn.innerText = "+ Send Message";
        chatWindow.style.display = "none";
        addmsg = false;
    }
}

function handleMsgSubmit(event){
    event.preventDefault();
    const input = chatWindow.querySelector("input");
    const value = input.value;
    const msgContainer = chatWindow.querySelector("div");
    const msgdiv = document.createElement("div");
    const msg = document.createElement("p");  
    msgdiv.className = "mymsg";
    msg.innerText = value;
    msgdiv.appendChild(msg);
    msgContainer.appendChild(msgdiv);
    myDataChannel.send(value);
    input.value = "";
}


function recieveMsg(message){
    const recievedMsg = message.data;
    const msgContainer = chatWindow.querySelector("div");
    const msgdiv = document.createElement("div");
    const msg = document.createElement("p");
    msgdiv.className = "yourmsg";
    msg.innerText = recievedMsg;
    msgdiv.appendChild(msg);
    msgContainer.appendChild(msgdiv);
}


addMsgBtn.addEventListener("click", handleAddMsgBtn);

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);


// Welcome Form (join a room)

const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

async function initCall() {
    welcome.hidden = true;
    cntRooms.hidden = true;
    call.style.display = "block";
    await getMedia();
    makeConnection();
};

async function handleWelcomeSubmit(event) {
    event.preventDefault();
    const input = welcome.querySelector("input");
    await initCall();
    socket.emit("join_room", input.value);
    const paintRoomName = call.querySelector("h3");
    roomName = input.value;
    paintRoomName.innerText = `Room: ${roomName}`;
    input.value = "";
};

welcomeForm.addEventListener("submit", handleWelcomeSubmit);



// Socket Code

socket.on("welcome", async ()=>{
    myDataChannel = myPeerConnection.createDataChannel("chat");
    msgForm.addEventListener("submit", handleMsgSubmit);
    myDataChannel.addEventListener("message", recieveMsg);
    console.log("data channel here");
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    socket.emit("offer", offer, roomName);
});


socket.on("offer", async (offer) => {
    myPeerConnection.addEventListener("datachannel", (event) => {
        myDataChannel = event.channel;
        msgForm.addEventListener("submit", handleMsgSubmit);
        myDataChannel.addEventListener("message", recieveMsg);
    });
    myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer();
    myPeerConnection.setLocalDescription(answer);
    socket.emit("answer", answer, roomName);
});
  

socket.on("answer", (answer) => {
    myPeerConnection.setRemoteDescription(answer);
});
  
socket.on("ice", (ice) => {
    myPeerConnection.addIceCandidate(ice);
});

socket.on("room_change", (rooms) => {
    const roomList = cntRooms.querySelector("ul");
    roomList.innerHTML = "";
    if(rooms.length === 0){
        return;
    }
    rooms.forEach((room) => {
        const span = document.createElement("p");
        span.innerText= `🍒 ${room}`;
        roomList.appendChild(span);
    });
});

// socket.on("new_message", addMessage);

// RTC Code
function makeConnection() {
    myPeerConnection = new RTCPeerConnection({
        iceServers: [
          {
            urls: [
              "stun:stun.l.google.com:19302",
              "stun:stun1.l.google.com:19302",
              "stun:stun2.l.google.com:19302",
              "stun:stun3.l.google.com:19302",
              "stun:stun4.l.google.com:19302",
            ],
          },
        ],
      });
    myPeerConnection.addEventListener("icecandidate", handleIce)
    myPeerConnection.addEventListener("addstream", handleAddStream);
    myStream
      .getTracks()
      .forEach((track) => myPeerConnection.addTrack(track, myStream));
}

function handleIce(data){
    socket.emit("ice", data.candidate, roomName);
}

function handleAddStream(data){
    const peersStream = document.getElementById("peerFace");
    peersStream.srcObject = data.stream;
}