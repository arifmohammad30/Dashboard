import WebSocket from "ws";

const socket = new WebSocket("ws://localhost:8080");

socket.on("open", () => {
    console.log("Connected to server");
});
socket.on("message", (data) => {
    const parsed = JSON.parse(data.toString());

    console.log(
        `ID: ${parsed.id} | Value: ${parsed.value} | Time: ${parsed.time}`
    );
});