import { WebSocketServer } from "ws";

const server = new WebSocketServer({ port: 8080 });

console.log("Server running on 8080");

server.on("connection", (socket) => {
    console.log("Client connected");

    let count = 1;

    const interval = setInterval(() => {
        const data = {
            id: count,
            value: Math.floor(Math.random() * 100),
            time: new Date().toLocaleTimeString(),
        };

        socket.send(JSON.stringify(data));
        count++;
    }, 1000);

    socket.on("close", () => {
        clearInterval(interval);
        console.log("Client disconnected");
    });
});