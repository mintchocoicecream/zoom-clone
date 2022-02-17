const socket = io();

const welcome = document.getElementById("welcome");
const showname = document.getElementById("showname");
const nickform = welcome.querySelector("#name");
const roomnameform = welcome.querySelector("#rn");
const room = document.getElementById("room");
const cntrooms = document.getElementById("cntrooms")
const editBtn = showname.querySelector("button");

room.hidden = true;
showname.hidden = true;

let roomName;

function addMessage(message){
    const ul = room.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = message;
    ul.appendChild(li);
}

function handleMessageSubmit(event){
    event.preventDefault();
    const input = room.querySelector("#msg input");
    const value = input.value;
    socket.emit("new_message", input.value, roomName, () => {
        addMessage(`You: ${value}`);
    });
    input.value = "";
}

function handleNicknameSubmit(event){
    event.preventDefault();
    const input = nickform.querySelector("input");
    socket.emit("nickname", input.value);
    nickform.hidden = true;
    showname.hidden = false;
    const shownick = showname.querySelector("h3")
    shownick.innerText = `🍒 ${input.value} 🍒`
}

function handleNickEdit(event){
    event.preventDefault();
    showname.hidden = true;
    nickform.hidden = false;
}

nickform.addEventListener("submit", handleNicknameSubmit)
editBtn.addEventListener("click", handleNickEdit);

function showRoom(){
    roomnameform.hidden = true;
    room.hidden = false;
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName}`;
    const msgForm = room.querySelector("#msg");
    msgForm.addEventListener("submit", handleMessageSubmit);
}

function handleRoomSubmit(event){
    event.preventDefault();
    const input = roomnameform.querySelector("input");
    const nickinput = nickform.querySelector("input");
    if(nickinput.value === ""){
        alert("Please add you name.")
    } else {
        socket.emit("enter_room", input.value, showRoom);
        roomName = input.value;
    }
    // socket.emit("enter_room", input.value, showRoom);
    // roomName = input.value;
    input.value="";
}

roomnameform.addEventListener("submit", handleRoomSubmit);


socket.on("entry", (user, newCount) => {
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName} (${newCount})`;
    addMessage(`🎈 ${user} joined! 🎈`);
});

socket.on("bye", (leftuser, newCount) => {
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName} (${newCount})`;
    addMessage(`👻 ${leftuser} lefted 👻`);
});

socket.on("new_message", addMessage);

socket.on("room_change", (rooms) => {
    const roomList = cntrooms.querySelector("ul");
    roomList.innerHTML = "";
    if(rooms.length === 0){
        return;
    }
    rooms.forEach((room) => {
        const li = document.createElement("li");
        li.innerText= room;
        roomList.appendChild(li);
    });
});