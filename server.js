const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.use(express.static(path.join(__dirname, "public")));

// Any /room/:code path serves the same index.html
app.get("/room/:roomCode", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// In-memory rooms: Map<roomCode, { players: Map<socketId, player> }>
const rooms = new Map();

const SPAWN_POINTS = [
  { x: 600, y: 400 },
  { x: 650, y: 450 },
  { x: 550, y: 450 },
  { x: 700, y: 400 },
  { x: 600, y: 500 },
  { x: 550, y: 350 },
  { x: 700, y: 500 },
  { x: 500, y: 400 },
];

io.on("connection", (socket) => {
  let currentRoom = null;
  let currentPlayer = null;

  socket.on("join-room", ({ roomCode, name, character }) => {
    if (!roomCode || !name) return;

    // Create room if needed
    if (!rooms.has(roomCode)) {
      rooms.set(roomCode, { players: new Map() });
    }
    const room = rooms.get(roomCode);

    const spawn = SPAWN_POINTS[room.players.size % SPAWN_POINTS.length];

    currentPlayer = {
      id: socket.id,
      name: String(name).substring(0, 20),
      character: Math.max(0, Math.min(9, Number(character) || 0)),
      x: spawn.x,
      y: spawn.y,
      direction: "down",
    };

    room.players.set(socket.id, currentPlayer);
    currentRoom = roomCode;
    socket.join(roomCode);

    // Send full state to joiner
    socket.emit("room-state", {
      roomCode,
      players: Array.from(room.players.values()),
      selfId: socket.id,
    });

    // Notify others
    socket.to(roomCode).emit("player-joined", currentPlayer);
  });

  socket.on("move", ({ x, y, direction }) => {
    if (!currentRoom || !currentPlayer) return;
    currentPlayer.x = Number(x) || 0;
    currentPlayer.y = Number(y) || 0;
    currentPlayer.direction = direction || "down";
    socket.to(currentRoom).emit("player-moved", {
      id: socket.id,
      x: currentPlayer.x,
      y: currentPlayer.y,
      direction: currentPlayer.direction,
    });
  });

  socket.on("chat-message", ({ text }) => {
    if (!currentRoom || !currentPlayer) return;
    const sanitized = String(text).substring(0, 500).trim();
    if (!sanitized) return;
    io.to(currentRoom).emit("chat-message", {
      id: socket.id,
      name: currentPlayer.name,
      text: sanitized,
      timestamp: Date.now(),
    });
  });

  socket.on("emoji-reaction", ({ emoji }) => {
    if (!currentRoom || !currentPlayer) return;
    const allowed = ["😀", "🎉", "👍", "🔥", "❤️"];
    if (!allowed.includes(emoji)) return;
    io.to(currentRoom).emit("emoji-reaction", {
      id: socket.id,
      emoji,
    });
  });

  socket.on("throw-object", ({ fromX, fromY, toX, toY }) => {
    if (!currentRoom || !currentPlayer) return;
    socket.to(currentRoom).emit("throw-object", {
      id: socket.id,
      fromX: Number(fromX) || 0,
      fromY: Number(fromY) || 0,
      toX: Number(toX) || 0,
      toY: Number(toY) || 0,
    });
  });

  socket.on("disconnect", () => {
    if (currentRoom && rooms.has(currentRoom)) {
      const room = rooms.get(currentRoom);
      room.players.delete(socket.id);
      socket.to(currentRoom).emit("player-left", { id: socket.id });
      if (room.players.size === 0) {
        rooms.delete(currentRoom);
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Pact server running on http://localhost:${PORT}`);
});
