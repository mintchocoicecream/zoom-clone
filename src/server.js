import express from "express";
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";
import http from "http";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));


const server = http.createServer(app);
const io = new Server(server)

function publicRooms(){
    const {sockets: {adapter: {sids, rooms}}} = io;
    const publicRooms = [];
    rooms.forEach((_,key) => {
        if(sids.get(key) === undefined){
            publicRooms.push(key);
        }
    })
    return publicRooms;
}

function countRoom(roomName){
    return io.sockets.adapter.rooms.get(roomName)?.size;
}

io.on("connection", socket => {
    socket["nickname"] = "Anon";
    socket.on("join_room", (roomName) => {
        socket.join(roomName);
        socket.to(roomName).emit("welcome", countRoom(roomName));
        io.sockets.emit("room_change", publicRooms());
    });
    socket.on("offer", (offer, roomName) => {
        socket.to(roomName).emit("offer", offer);
    });
    socket.on("answer", (answer, roomName) => {
        socket.to(roomName).emit("answer", answer);
    });
    socket.on("ice", (ice, roomName) => {
        socket.to(roomName).emit("ice", ice);
    });

    socket.on("nickname", (nickname, roomName) => {
        socket["nickname"] = nickname;
        socket.to(roomName).emit("nickname", nickname);
    });

    socket.on("disconnecting", () => {
        socket.rooms.forEach(room => 
            socket.to(room).emit("bye", socket.nickname));
    });

    socket.on("disconnect", () => {
        io.sockets.emit("room_change", publicRooms());
    })
});

const handleListen = () => console.log(`Listening on http://localhost:3000`);
server.listen(3000, handleListen);