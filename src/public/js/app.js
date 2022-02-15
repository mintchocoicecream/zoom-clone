const messageList = document.querySelector("ul");
const messageForm = document.querySelector("#message");
const nickForm = document.querySelector("#nick");
const nickModForm = document.querySelector("#modnick");
const socket = new WebSocket(`ws://${window.location.host}`);

function makeMessage(type, payload){
    const msg = {type, payload}
    return JSON.stringify(msg);
}

socket.addEventListener("open", () => {
    nickModForm.style.display="none";
    console.log("Connected to Server ✅");
});

socket.addEventListener("message", (message) => {
    const li = document.createElement("li");
    li.innerText = message.data;
    messageList.append(li);
});

socket.addEventListener("close", () => {
    console.log("Disconnected to Server ❌");
});


function handleSubmit(event){
    event.preventDefault();
    const input = messageForm.querySelector("input");
    socket.send(makeMessage("new_message", input.value));
    const li = document.createElement("li");
    li.innerText = `You: ${input.value}`;
    messageList.append(li);
    input.value="";
}

function handleNickSubmit(event){
    event.preventDefault();
    const input = nickForm.querySelector("input");
    const paintNick = nickModForm.querySelector("h3");
    const modBtn = nickModForm.querySelector("button");
    if(input.value !== ""){
        socket.send(makeMessage("nickname", input.value));
        nickForm.style.display="none";
        nickModForm.style.display="block";  
        paintNick.innerText = `💜 ${input.value} 💜`  
        modBtn.addEventListener("click", handleNickModify);
    }else{
        socket.send(makeMessage("nickname", input.value));
        input.value="";
    }

};

function handleNickModify(event){
    event.preventDefault();
    nickModForm.style.display="none";
    nickForm.style.display="block";
}


messageForm.addEventListener("submit", handleSubmit);
nickForm.addEventListener("submit", handleNickSubmit);