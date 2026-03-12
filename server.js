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
const MAX_MOVE_PER_TICK = 50;
const MAP_W = 2400, MAP_H = 1600;
const THROW_COOLDOWN = 10000;

// Jail zone bounds (fully sealed, no doorway)
const JAIL = { x: 1796, y: 794, w: 590, h: 792 };
const JAIL_CENTER = { x: JAIL.x + JAIL.w / 2, y: JAIL.y + JAIL.h / 2 };

// Spawn points in the corridor
const SPAWN_POINTS = [
  { x: 200, y: 744 }, { x: 400, y: 744 }, { x: 600, y: 744 },
  { x: 800, y: 744 }, { x: 1000, y: 744 }, { x: 1200, y: 744 },
  { x: 1400, y: 744 }, { x: 1600, y: 744 }, { x: 1800, y: 744 },
  { x: 2000, y: 744 },
];

// Valid furniture types for throw-prop whitelist
const VALID_PROPS = new Set([
  "modern_desk","standing_desk","office_chair","conf_table","tv_wall",
  "whiteboard","phone_booth","counter_long","coffee_machine","fridge","vending","microwave",
  "dining_table","stool","sofa","coffee_table","tv_stand","pingpong","arcade","beanbag",
  "bookshelf","bed","nightstand","plant_big","plant_small",
  "hot_spring_pool","rock","towel_rack","wooden_fence",
  "bar_counter","karaoke_booth","pool_table","dart_board","disco_ball",
  "tree","bush","bench_park","jail_bench",
]);

// --- Rate limiter ---
function makeRateLimiter() {
  const limits = new Map();
  const RATES = {
    "move": { max: 25, windowMs: 1000 },
    "throw-object": { max: 2, windowMs: 1000 },
    "throw-prop": { max: 3, windowMs: 1000 },
    "chat-message": { max: 5, windowMs: 1000 },
    "jump": { max: 5, windowMs: 1000 },
    "backslap": { max: 3, windowMs: 2000 },
  };
  return {
    check(socketId, event) {
      const rate = RATES[event];
      if (!rate) return true;
      if (!limits.has(socketId)) limits.set(socketId, {});
      const bucket = limits.get(socketId);
      if (!bucket[event]) bucket[event] = [];
      const now = Date.now();
      bucket[event] = bucket[event].filter(t => now - t < rate.windowMs);
      if (bucket[event].length >= rate.max) return false;
      bucket[event].push(now);
      return true;
    },
    cleanup(socketId) { limits.delete(socketId); },
  };
}
const rateLimiter = makeRateLimiter();

// --- Anti-bot: limit connections per IP ---
const connectionsPerIp = new Map();
const MAX_CONNECTIONS_PER_IP = 3;

io.on("connection", (socket) => {
  const ip = socket.handshake.address;
  const count = (connectionsPerIp.get(ip) || 0) + 1;
  if (count > MAX_CONNECTIONS_PER_IP) {
    socket.emit("connection-rejected", { reason: "Too many connections" });
    socket.disconnect(true);
    return;
  }
  connectionsPerIp.set(ip, count);

  let currentRoom = null;
  let currentPlayer = null;

  socket.on("join-room", ({ roomCode, name, character }) => {
    if (!roomCode || !name) return;
    if (currentPlayer) return;
    if (!rooms.has(roomCode)) rooms.set(roomCode, { players: new Map() });
    const room = rooms.get(roomCode);
    if (room.players.size >= MAX_PLAYERS) { socket.emit("room-full"); return; }

    currentPlayer = {
      id: socket.id,
      name: String(name).substring(0, 20),
      character: Math.max(0, Math.min(9, Number(character) || 0)),
      x: SPAWN_POINTS[room.players.size % SPAWN_POINTS.length].x,
      y: SPAWN_POINTS[room.players.size % SPAWN_POINTS.length].y,
      direction: "down",
      activeEmoji: null,
      activeStatus: null,
      throwCount: 0,
      jailedUntil: 0,
      lastThrowTime: 0,
    };
    room.players.set(socket.id, currentPlayer);
    currentRoom = roomCode;
    socket.join(roomCode);
    socket.emit("room-state", { roomCode, players: Array.from(room.players.values()), selfId: socket.id });
    socket.to(roomCode).emit("player-joined", currentPlayer);
  });

  socket.on("move", ({ x, y, direction }) => {
    if (!currentRoom || !currentPlayer) return;
    if (!rateLimiter.check(socket.id, "move")) return;
    const nx = Number(x) || 0, ny = Number(y) || 0;
    const cx = Math.max(0, Math.min(MAP_W, nx));
    const cy = Math.max(0, Math.min(MAP_H, ny));
    const now = Date.now();
    // Jail movement restriction
    if (currentPlayer.jailedUntil > now) {
      if (cx < JAIL.x + 14 || cx > JAIL.x + JAIL.w - 14 || cy < JAIL.y + 14 || cy > JAIL.y + JAIL.h - 14) return;
    }
    const dx = cx - currentPlayer.x, dy = cy - currentPlayer.y;
    if (Math.sqrt(dx * dx + dy * dy) > MAX_MOVE_PER_TICK) return;
    currentPlayer.x = cx;
    currentPlayer.y = cy;
    currentPlayer.direction = ["up","down","left","right"].includes(direction) ? direction : "down";
    socket.to(currentRoom).emit("player-moved", { id: socket.id, x: cx, y: cy, direction: currentPlayer.direction });
    // Jail expiry check
    if (currentPlayer.jailedUntil > 0 && now >= currentPlayer.jailedUntil) {
      currentPlayer.jailedUntil = 0;
      currentPlayer.throwCount = 0;
      io.to(currentRoom).emit("player-unjailed", { id: socket.id });
      io.to(currentRoom).emit("throw-count-update", { id: socket.id, count: 0 });
    }
  });

  socket.on("jump", ({ fromX, fromY, toX, toY, direction }) => {
    if (!currentRoom || !currentPlayer) return;
    if (!rateLimiter.check(socket.id, "jump")) return;
    const fx = Number(fromX) || 0, fy = Number(fromY) || 0;
    const tx = Number(toX) || 0, ty = Number(toY) || 0;
    const fdx = fx - currentPlayer.x, fdy = fy - currentPlayer.y;
    if (Math.sqrt(fdx * fdx + fdy * fdy) > 30) return;
    const jdx = tx - fx, jdy = ty - fy;
    if (Math.sqrt(jdx * jdx + jdy * jdy) > 120) return;
    currentPlayer.x = Math.max(0, Math.min(MAP_W, tx));
    currentPlayer.y = Math.max(0, Math.min(MAP_H, ty));
    currentPlayer.direction = ["up","down","left","right"].includes(direction) ? direction : "down";
    socket.to(currentRoom).emit("player-jumped", {
      id: socket.id, fromX: fx, fromY: fy, toX: currentPlayer.x, toY: currentPlayer.y, direction: currentPlayer.direction,
    });
  });

  socket.on("chat-message", ({ text }) => {
    if (!currentRoom || !currentPlayer) return;
    if (!rateLimiter.check(socket.id, "chat-message")) return;
    const sanitized = String(text).substring(0, 500).trim();
    if (!sanitized) return;
    io.to(currentRoom).emit("chat-message", { id: socket.id, name: currentPlayer.name, text: sanitized, timestamp: Date.now() });
  });

  socket.on("emoji-toggle", ({ emoji }) => {
    if (!currentRoom || !currentPlayer) return;
    const allowed = ["\u{1F600}", "\u{1F525}", "\u{2764}\u{FE0F}", "\u{1F622}", "\u{26A1}"];
    if (!allowed.includes(emoji)) return;
    currentPlayer.activeEmoji = currentPlayer.activeEmoji === emoji ? null : emoji;
    io.to(currentRoom).emit("emoji-toggle", { id: socket.id, emoji: currentPlayer.activeEmoji });
  });

  socket.on("status-change", ({ status }) => {
    if (!currentRoom || !currentPlayer) return;
    const allowed = ["working", "afk", "oncall", "gaming", "lunch"];
    if (status !== null && !allowed.includes(status)) return;
    currentPlayer.activeStatus = currentPlayer.activeStatus === status ? null : status;
    io.to(currentRoom).emit("status-change", { id: socket.id, status: currentPlayer.activeStatus });
  });

  socket.on("backslap", ({ targetId }) => {
    if (!currentRoom || !currentPlayer) return;
    if (!rateLimiter.check(socket.id, "backslap")) return;
    const room = rooms.get(currentRoom);
    if (!room || !room.players.has(targetId)) return;
    const target = room.players.get(targetId);
    const dx = currentPlayer.x - target.x, dy = currentPlayer.y - target.y;
    if (Math.sqrt(dx * dx + dy * dy) > 80) return;
    io.to(currentRoom).emit("backslap-animate", { fromId: socket.id, toId: targetId });
  });

  function handleThrowCount(now) {
    currentPlayer.lastThrowTime = now;
    currentPlayer.throwCount++;
    io.to(currentRoom).emit("throw-count-update", { id: socket.id, count: currentPlayer.throwCount });
    if (currentPlayer.throwCount >= 10) {
      currentPlayer.jailedUntil = now + 30000;
      currentPlayer.x = JAIL_CENTER.x;
      currentPlayer.y = JAIL_CENTER.y;
      io.to(currentRoom).emit("player-jailed", { id: socket.id, x: JAIL_CENTER.x, y: JAIL_CENTER.y, duration: 30000 });
    }
  }

  socket.on("throw-object", ({ targetId, toX, toY }) => {
    if (!currentRoom || !currentPlayer) return;
    if (!rateLimiter.check(socket.id, "throw-object")) return;
    const now = Date.now();
    if (now - currentPlayer.lastThrowTime < THROW_COOLDOWN) {
      socket.emit("throw-cooldown", { remaining: THROW_COOLDOWN - (now - currentPlayer.lastThrowTime) });
      return;
    }
    if (currentPlayer.jailedUntil > now) return;
    const room = rooms.get(currentRoom);
    if (!room) return;
    const target = room.players.get(targetId);
    if (!target) return;
    const dx = currentPlayer.x - target.x, dy = currentPlayer.y - target.y;
    if (Math.sqrt(dx * dx + dy * dy) > 120) return;
    const clampedToX = Math.max(30, Math.min(MAP_W - 30, Number(toX) || 0));
    const clampedToY = Math.max(30, Math.min(MAP_H - 50, Number(toY) || 0));
    handleThrowCount(now);
    io.to(currentRoom).emit("throw-object", {
      id: socket.id, targetId: String(targetId),
      fromX: target.x, fromY: target.y, toX: clampedToX, toY: clampedToY,
    });
  });

  socket.on("throw-prop", ({ propType, fromX, fromY, toX, toY, furnW, furnH, furnIdx }) => {
    if (!currentRoom || !currentPlayer) return;
    if (!rateLimiter.check(socket.id, "throw-prop")) return;
    const now = Date.now();
    if (now - currentPlayer.lastThrowTime < THROW_COOLDOWN) {
      socket.emit("throw-cooldown", { remaining: THROW_COOLDOWN - (now - currentPlayer.lastThrowTime) });
      return;
    }
    if (currentPlayer.jailedUntil > now) return;
    const pt = String(propType || "office_chair");
    if (!VALID_PROPS.has(pt)) return;
    const fi = furnIdx != null ? Number(furnIdx) : -1;
    if (fi < -1 || fi > 500) return;
    const fw = Math.max(10, Math.min(300, Number(furnW) || 40));
    const fh = Math.max(10, Math.min(300, Number(furnH) || 30));
    const cx = Math.max(0, Math.min(MAP_W, Number(fromX) || 0));
    const cy = Math.max(0, Math.min(MAP_H, Number(fromY) || 0));
    const dx = currentPlayer.x - cx, dy = currentPlayer.y - cy;
    if (Math.sqrt(dx * dx + dy * dy) > 150) return;
    const tx = Math.max(30, Math.min(MAP_W - 30, Number(toX) || 0));
    const ty = Math.max(30, Math.min(MAP_H - 50, Number(toY) || 0));
    handleThrowCount(now);
    io.to(currentRoom).emit("throw-prop", {
      id: socket.id, propId: null, propType: pt,
      fromX: cx, fromY: cy, toX: tx, toY: ty, furnW: fw, furnH: fh, furnIdx: fi,
    });
  });

  socket.on("prop-hit", ({ targetId, knockX, knockY }) => {
    if (!currentRoom || !currentPlayer) return;
    const room = rooms.get(currentRoom);
    if (!room || !room.players.has(targetId)) return;
    const kx = Math.max(30, Math.min(MAP_W - 30, Number(knockX) || 0));
    const ky = Math.max(30, Math.min(MAP_H - 50, Number(knockY) || 0));
    io.to(currentRoom).emit("prop-hit-confirmed", { targetId, knockX: kx, knockY: ky, hitterId: socket.id });
  });

  socket.on("disconnect", () => {
    const remaining = (connectionsPerIp.get(ip) || 1) - 1;
    if (remaining <= 0) connectionsPerIp.delete(ip); else connectionsPerIp.set(ip, remaining);
    rateLimiter.cleanup(socket.id);
    if (currentRoom && rooms.has(currentRoom)) {
      const room = rooms.get(currentRoom);
      room.players.delete(socket.id);
      socket.to(currentRoom).emit("player-left", { id: socket.id });
      if (room.players.size === 0) rooms.delete(currentRoom);
    }
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => console.log(`Pact server running on http://localhost:${PORT}`));
