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

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);

// Nickname

const nickDiv = document.getElementById("info");
const nickBtn = nickDiv.querySelector("button");
const modal = document.getElementById("nickForm");
const closeDiv = document.getElementById("close");
const closeBtn = closeDiv.querySelector("span");
const container = document.getElementById("container");
const nickInputBtn = container.querySelector("button");
const mySection = document.getElementById("myStream");


function handleNickClick(event){
    modal.style.display='block'
    if (event.target === modal) {
        modal.style.display = "none";
    };
}

function handleCloseClick(){
    modal.style.display = "none";
}

function handleNickSave(event){
    event.preventDefault();
    const input = container.querySelector("input");
    const value = input.value;
    socket.emit("nickname", value, roomName);
    const shownick = mySection.querySelector("h3");
    shownick.innerText = `👽 ${input.value}`;
    modal.style.display = "none";
}

function handleShowNick(nick){
    const recievedNick = nick;
    const peerStream = document.getElementById("peerStream");
    const peersNick = peerStream.querySelector("h3");
    peersNick.innerText = `👽 ${recievedNick}`;
}


nickInputBtn.addEventListener("click", handleNickSave);
closeBtn.addEventListener("click", handleCloseClick);
nickBtn.addEventListener("click", handleNickClick);

// Chat

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

const scrollDiv = document.getElementById('scroll');

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
    scrollDiv.scrollTop = scrollDiv.scrollHeight;
    myDataChannel.send(value);
    input.value = "";
}

function recieveMsg(message){
    const recievedMsg = message.data;
    const msgContainer = chatWindow.querySelector("div");
    const msgdiv = document.createElement("div");
    const msgSpan = document.createElement("span");
    const msg = document.createElement("p");
    msgdiv.className = "yourmsg";
    msg.innerText = recievedMsg;
    msgdiv.appendChild(msgSpan);
    msgdiv.appendChild(msg);
    msgContainer.appendChild(msgdiv);
    scrollDiv.scrollTop = scrollDiv.scrollHeight;
}

function addMessage(message){
    const msgContainer = chatWindow.querySelector("div");
    const msgdiv = document.createElement("div");
    const msgSpan = document.createElement("span");
    const msg = document.createElement("p");
    msgdiv.className = "announce";
    msg.innerText = message;
    msgdiv.appendChild(msgSpan);
    msgdiv.appendChild(msg);
    msgContainer.appendChild(msgdiv);
    scrollDiv.scrollTop = scrollDiv.scrollHeight;
}


addMsgBtn.addEventListener("click", handleAddMsgBtn);




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
    paintRoomName.innerText = `🍒 Room ${roomName} 🍒`;
    input.value = "";
};


welcomeForm.addEventListener("submit", handleWelcomeSubmit);

async function clickRoomName(event){
    event.preventDefault();
    const value = event.target.innerText;
    await initCall();
    socket.emit("join_room", value);
    const paintRoomName = call.querySelector("h3");
    roomName = value;
    paintRoomName.innerText = `🍒 Room ${roomName} 🍒`;
}

// Socket Code

socket.on("welcome", async ()=>{
    myDataChannel = myPeerConnection.createDataChannel("chat");
    msgForm.addEventListener("submit", handleMsgSubmit);
    myDataChannel.addEventListener("message", recieveMsg);
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

socket.on("nickname", handleShowNick);

socket.on("bye", (leftuser) => {
    addMessage(`👻 ${leftuser} lefted 👻`);
});

socket.on("room_change", (rooms) => {
    const roomList = cntRooms.querySelector("ul");
    roomList.innerHTML = "";
    if(rooms.length === 0){
        return;
    }
    rooms.forEach((room) => {
        const li = document.createElement("li");
        const span = document.createElement("span");
        span.innerText= `${room}`;
        li.appendChild(span);
        roomList.appendChild(li);
        span.addEventListener("click", clickRoomName);
    });
});



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