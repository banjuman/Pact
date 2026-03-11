const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.use(express.static(path.join(__dirname, "public")));

app.get("/room/:roomCode", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const rooms = new Map();
const MAX_PLAYERS = 10;
const MAX_MOVE_PER_TICK = 50; // max pixels per position update (anti-teleport, allows jumps)
const MAP_W = 1600, MAP_H = 1000;

const SPAWN_POINTS = [
  { x: 500, y: 490 },
  { x: 560, y: 490 },
  { x: 620, y: 490 },
  { x: 680, y: 490 },
  { x: 740, y: 490 },
  { x: 800, y: 490 },
  { x: 860, y: 490 },
  { x: 920, y: 490 },
];

io.on("connection", (socket) => {
  let currentRoom = null;
  let currentPlayer = null;

  socket.on("join-room", ({ roomCode, name, character }) => {
    if (!roomCode || !name) return;
    // Prevent duplicate join — 1 character per connection
    if (currentPlayer) return;
    if (!rooms.has(roomCode)) rooms.set(roomCode, { players: new Map() });
    const room = rooms.get(roomCode);
    // Room player limit
    if (room.players.size >= MAX_PLAYERS) {
      socket.emit("room-full");
      return;
    }

    currentPlayer = {
      id: socket.id,
      name: String(name).substring(0, 20),
      character: Math.max(0, Math.min(9, Number(character) || 0)),
      x: SPAWN_POINTS[room.players.size % SPAWN_POINTS.length].x,
      y: SPAWN_POINTS[room.players.size % SPAWN_POINTS.length].y,
      direction: "down",
      activeEmoji: null,
    };

    room.players.set(socket.id, currentPlayer);
    currentRoom = roomCode;
    socket.join(roomCode);

    socket.emit("room-state", {
      roomCode,
      players: Array.from(room.players.values()),
      selfId: socket.id,
    });
    socket.to(roomCode).emit("player-joined", currentPlayer);
  });

  socket.on("move", ({ x, y, direction }) => {
    if (!currentRoom || !currentPlayer) return;
    const nx = Number(x) || 0, ny = Number(y) || 0;
    // Clamp to map bounds
    const cx = Math.max(0, Math.min(MAP_W, nx));
    const cy = Math.max(0, Math.min(MAP_H, ny));
    // Anti-teleport: reject if moved too far in one tick
    const dx = cx - currentPlayer.x, dy = cy - currentPlayer.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > MAX_MOVE_PER_TICK) return; // ignore suspicious movement
    currentPlayer.x = cx;
    currentPlayer.y = cy;
    currentPlayer.direction = ["up","down","left","right"].includes(direction) ? direction : "down";
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

  socket.on("emoji-toggle", ({ emoji }) => {
    if (!currentRoom || !currentPlayer) return;
    const allowed = ["😀", "🔥", "❤️", "😢", "⚡"];
    if (!allowed.includes(emoji)) return;
    currentPlayer.activeEmoji =
      currentPlayer.activeEmoji === emoji ? null : emoji;
    io.to(currentRoom).emit("emoji-toggle", {
      id: socket.id,
      emoji: currentPlayer.activeEmoji,
    });
  });

  socket.on("throw-object", ({ targetId, fromX, fromY, toX, toY }) => {
    if (!currentRoom || !currentPlayer) return;
    io.to(currentRoom).emit("throw-object", {
      id: socket.id,
      targetId: String(targetId || ""),
      fromX: Number(fromX) || 0,
      fromY: Number(fromY) || 0,
      toX: Number(toX) || 0,
      toY: Number(toY) || 0,
    });
  });

  socket.on("throw-prop", ({ propId, propType, fromX, fromY, toX, toY, furnW, furnH, furnIdx }) => {
    if (!currentRoom || !currentPlayer) return;
    io.to(currentRoom).emit("throw-prop", {
      id: socket.id,
      propId: propId ? String(propId) : null,
      propType: String(propType || "office_chair"),
      fromX: Number(fromX) || 0,
      fromY: Number(fromY) || 0,
      toX: Number(toX) || 0,
      toY: Number(toY) || 0,
      furnW: Number(furnW) || 40,
      furnH: Number(furnH) || 30,
      furnIdx: furnIdx != null ? Number(furnIdx) : -1,
    });
  });

  socket.on("disconnect", () => {
    if (currentRoom && rooms.has(currentRoom)) {
      const room = rooms.get(currentRoom);
      room.players.delete(socket.id);
      socket.to(currentRoom).emit("player-left", { id: socket.id });
      if (room.players.size === 0) rooms.delete(currentRoom);
    }
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Pact server running on http://localhost:${PORT}`);
});
