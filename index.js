const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('.'));

const users = new Set();
let chatHistory = [];

io.on('connection', (socket) => {
    let currentUser = null;

    socket.on('user_join', (username) => {
        currentUser = username;
        users.add(username);
        socket.broadcast.emit('system_message', `${username} chatga qo‘shildi`);
        socket.emit('system_message', ` Salom ${username}! Xabar yozishingiz mumkin.`);
        // Tarixni yuborish
        socket.emit('chat_history', chatHistory.slice(-50));
    });

    socket.on('message_from_client', (msg, callback) => {
        if (!currentUser) {
            if (callback) callback({ error: "Avval ism kiriting" });
            return;
        }
        const messageData = {
            user: currentUser,
            text: msg,
            time: new Date().toISOString(),
            type: 'message'
        };
        chatHistory.push(messageData);
        if (chatHistory.length > 100) chatHistory.shift();
        io.emit('message_from_server', messageData);
        if (callback) callback({ success: true });
    });

    socket.on('typing', (username) => {
        socket.broadcast.emit('user_typing', username);
    });

    socket.on('stop_typing', (username) => {
        socket.broadcast.emit('user_stop_typing', username);
    });

    socket.on('disconnect', () => {
        if (currentUser) {
            users.delete(currentUser);
            io.emit('system_message', ` ${currentUser} chatni tark etdi`);
        }
    });
});

server.listen(3000, () => {
    console.log(' Server http://localhost:3000 da ishga tushdi');
});