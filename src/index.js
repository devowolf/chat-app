const express = require("express");
const http = require("http");
const path = require("path");
const socketio = require("socket.io");
const { generateMessage, generateLocationMessage } = require("./utils/messages");
const { addUser, removeUser, getUser, getUsersInRoom } = require("./utils/users");

// Create variables and server
const app = express();
const server = http.createServer(app);
const io = socketio(server);
const publicDirectory = path.join(__dirname, "../public/");


// Initiate the socket connection
io.on("connection", (socket) => {

    // When user joins
    socket.on("join", ({ username, room }, callback) => {
        const { error, user } = addUser({id: socket.id, username, room});

        if (error) {
            return callback(error);
        }

        socket.join(user.room);

        io.to(user.room).emit("roomData",{
            room: user.room,
            users: getUsersInRoom(user.room)
        });


        socket.emit("message", generateMessage("Admin", "Welcome!"));
        socket.broadcast.to(user.room).emit("message", generateMessage("Admin", `${user.username} has joined`));
    });

    // When user sends a message
    socket.on("sendMessage", (message, callback) => {
        const user = getUser(socket.id);

        io.to(user.room).emit("message", generateMessage(user.username, message));

        callback("Delivered!");
    });

    // When user shares their location
    socket.on("sendLocation", (location, callback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit("locationMessage", generateLocationMessage(user.username, `https://google.com/maps?q=${location.latitude},${location.longitude}`));
        callback();
    });

    // When user disconnects
    socket.on("disconnect", () => {
        const user = removeUser(socket.id);
        if (user) {
            io.to(user.room).emit("message",  generateMessage("Admin", `${user.username} has left!`));
            io.to(user.room).emit("roomData", {
                room: user.room,
                users: getUsersInRoom(user.room)
            });
        }
    });

});

// Serve the static files and start the server
app.use(express.static(publicDirectory));
const port = process.env.PORT || 3000;

server.listen(port, () => {
    console.log(`Server started and listening on port ${port}`);
});