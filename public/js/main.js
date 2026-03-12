// main.js — Game state, socket connection, game loop, input handling

// ═══════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════
var socket;
var currentRoomCode = "";
var localPlayer = null;
var remotePlayers = new Map();
var chatBubbles = new Map();
var keys = {};
var gameRunning = false;
var lastTime = 0;
var lastPositionSend = 0;
var movePath = null;
var movePathIdx = 0;
var moveTarget = null;
var currentCamX = 0, currentCamY = 0;
var hoverTarget = null;
var flyingPlayers = [];
var stunnedPlayers = new Map();
var flyingProps = [];
var flyingFurnSet = new Set();
var wobblePlayers = new Map();
var auraParticles = new Map();
// Jump state
var isJumping = false;
var jumpStartTime = 0;
var jumpFromX = 0, jumpFromY = 0;
var jumpToX = 0, jumpToY = 0;
var jumpDirX = 0, jumpDirY = 0;
// Original furniture positions for robot vacuum
var FURNITURE_ORIG = null;
var robotVacuums = [];

var footstepTimer = 0;
const FOOTSTEP_INTERVAL = 250;

// Backslap state (replaces highfive)
var lastBackslapTime = 0;
var backslapEffects = []; // { x, y, startTime }

// Throw count + jail state
var playerThrowCounts = new Map();
var localJailUntil = 0;
var localThrowCooldownUntil = 0;

const SPEED = 150;
const POSITION_SEND_INTERVAL = 50;
const BUBBLE_DURATION = 5000;
const JUMP_DURATION = 350;
const JUMP_DIST_MOVING = 80;
const JUMP_HEIGHT = 30;

// ═══════════════════════════════════════════
//  ROOM CODE
// ═══════════════════════════════════════════
function getRoomCode() { return "office"; }

function joinRoom() {
  const nameInput = document.getElementById("name-input");
  const name = nameInput.value.trim();
  if (!name) { nameInput.focus(); nameInput.style.borderColor = "#e74c3c"; setTimeout(() => nameInput.style.borderColor = "", 1000); return; }

  currentRoomCode = getRoomCode();
  socket = io();

  socket.on("connect", () => {
    socket.emit("join-room", { roomCode: currentRoomCode, name, character: selectedCharacter });
  });

  socket.on("room-state", ({ players, selfId, roomCode }) => {
    currentRoomCode = roomCode;
    remotePlayers.clear();
    for (const p of players) {
      if (p.id === selfId) localPlayer = { ...p, isMoving: false };
      else remotePlayers.set(p.id, { ...p, targetX: p.x, targetY: p.y, isMoving: false });
    }
    document.getElementById("entry-screen").style.display = "none";
    document.getElementById("top-bar").style.display = "flex";
    document.getElementById("game-area").style.display = "block";
    document.getElementById("chat-panel").style.display = "flex";
    document.getElementById("overlay").style.display = "none";
    updateHUD(); resizeCanvas(); buildNavGrid();
    // Save original furniture positions for robot vacuum
    if (!FURNITURE_ORIG) FURNITURE_ORIG = FURNITURE.map(f => ({ x: f.x, y: f.y }));
    if (!gameRunning) { gameRunning = true; requestAnimationFrame(gameLoop); }
  });

  socket.on("player-joined", (player) => {
    remotePlayers.set(player.id, { ...player, targetX: player.x, targetY: player.y, isMoving: false });
    addSystemMessage(player.name + " joined"); updateHUD(); playJoinSound();
  });

  socket.on("player-moved", ({ id, x, y, direction }) => {
    const p = remotePlayers.get(id);
    if (p) { p.targetX = x; p.targetY = y; p.direction = direction; }
  });

  socket.on("player-left", ({ id }) => {
    const p = remotePlayers.get(id);
    if (p) {
      addSystemMessage(p.name + " left");
      remotePlayers.delete(id); chatBubbles.delete(id); auraParticles.delete(id);
      stunnedPlayers.delete(id); wobblePlayers.delete(id); playerColorMap.delete(id);
      playerThrowCounts.delete(id);
      updateHUD();
    }
  });

  socket.on("chat-message", ({ id, name: sn, text }) => {
    addChatMessage(id, sn, text, id === socket.id);
    chatBubbles.set(id, { text, startTime: Date.now() });
    if (id !== socket.id) playNotificationSound();
  });

  socket.on("emoji-toggle", ({ id, emoji }) => {
    const target = id === socket.id ? localPlayer : remotePlayers.get(id);
    if (target) target.activeEmoji = emoji;
    if (!emoji) auraParticles.delete(id);
    if (id === socket.id) updateEmojiButtons();
  });

  socket.on("status-change", ({ id, status }) => {
    const target = id === socket.id ? localPlayer : remotePlayers.get(id);
    if (target) target.activeStatus = status;
    if (id === socket.id) updateStatusButtons();
  });

  // Backslap
  socket.on("backslap-animate", ({ fromId, toId }) => {
    const target = toId === socket.id ? localPlayer : remotePlayers.get(toId);
    if (target) {
      wobblePlayers.set(toId, { startTime: Date.now() });
      backslapEffects.push({ x: target.x, y: target.y - 30, startTime: Date.now() });
      playSlapSound();
    }
  });

  // Jump visualization for remote players
  socket.on("player-jumped", ({ id, fromX, fromY, toX, toY, direction }) => {
    const p = remotePlayers.get(id);
    if (p) {
      p.jumpFrom = { x: fromX, y: fromY };
      p.jumpTo = { x: toX, y: toY };
      p.jumpStart = Date.now();
      p.x = fromX; p.y = fromY;
      p.targetX = toX; p.targetY = toY;
      p.direction = direction;
    }
  });

  // Throw count + jail
  socket.on("throw-count-update", ({ id, count }) => {
    playerThrowCounts.set(id, count);
  });
  socket.on("player-jailed", ({ id, x, y, duration }) => {
    if (id === socket.id && localPlayer) {
      localPlayer.x = x; localPlayer.y = y;
      localJailUntil = Date.now() + duration;
      movePath = null; moveTarget = null;
      addSystemMessage("\uAC10\uC625\uC5D0 \uAC07\uD600\uC2B5\uB2C8\uB2E4! " + Math.round(duration/1000) + "\uCD08 \uD6C4 \uC11D\uBC29\uB429\uB2C8\uB2E4.");
    } else {
      const p = remotePlayers.get(id);
      if (p) { p.x = x; p.y = y; p.targetX = x; p.targetY = y; p.jailUntil = Date.now() + duration; }
      const name = p ? p.name : "???";
      addSystemMessage(name + " \uAC10\uC625\uC5D0 \uAC07\uD600\uC2B5\uB2C8\uB2E4!");
    }
  });
  socket.on("player-unjailed", ({ id }) => {
    if (id === socket.id) {
      localJailUntil = 0;
      addSystemMessage("\uC11D\uBC29\uB418\uC5C8\uC2B5\uB2C8\uB2E4!");
    } else {
      const p = remotePlayers.get(id);
      if (p) p.jailUntil = 0;
    }
    playerThrowCounts.set(id, 0);
  });
  socket.on("throw-cooldown", ({ remaining }) => {
    localThrowCooldownUntil = Date.now() + remaining;
  });
  // Prop hit confirmation from server
  socket.on("prop-hit-confirmed", ({ targetId, knockX, knockY, hitterId }) => {
    const isMe = targetId === socket.id;
    const target = isMe ? localPlayer : remotePlayers.get(targetId);
    if (!target) return;
    stunnedPlayers.set(targetId, { startTime: Date.now() });
    flyingPlayers.push({ playerId: targetId, charIdx: target.character, name: target.name,
      fromX: target.x, fromY: target.y, toX: knockX, toY: knockY, startTime: Date.now() });
    setTimeout(() => {
      if (isMe && localPlayer) { localPlayer.x = knockX; localPlayer.y = knockY; movePath = null; moveTarget = null; }
      else { const rp = remotePlayers.get(targetId); if (rp) { rp.x = knockX; rp.y = knockY; rp.targetX = knockX; rp.targetY = knockY; } }
    }, THROW_FLY_DURATION);
    playHitSound();
  });
  // Connection rejected (anti-bot)
  socket.on("connection-rejected", ({ reason }) => {
    document.getElementById("overlay").style.display = "flex";
    document.getElementById("overlay-text").textContent = reason;
  });

  socket.on("throw-object", ({ id, targetId, fromX, fromY, toX, toY }) => {
    const isMe = targetId === socket.id;
    const target = isMe ? localPlayer : remotePlayers.get(targetId);
    if (!target) return;
    flyingPlayers.push({ playerId: targetId, charIdx: target.character, name: target.name, fromX, fromY, toX, toY, startTime: Date.now() });
    playThrowSound();
    setTimeout(() => {
      stunnedPlayers.set(targetId, { startTime: Date.now() });
      playLandSound();
      if (isMe && localPlayer) { localPlayer.x = toX; localPlayer.y = toY; movePath = null; moveTarget = null; }
      else { const p = remotePlayers.get(targetId); if (p) { p.x = toX; p.y = toY; p.targetX = toX; p.targetY = toY; } }
    }, THROW_FLY_DURATION);
  });

  socket.on("throw-prop", ({ id, propId, propType, fromX, fromY, toX, toY, furnW, furnH, furnIdx }) => {
    const fi = (furnIdx != null && furnIdx >= 0) ? furnIdx : -1;
    if (fi >= 0) flyingFurnSet.add(fi);
    flyingProps.push({ propId, propType, fromX, fromY, toX, toY, startTime: Date.now(), throwerId: id, furnW: furnW || 40, furnH: furnH || 30, furnIdx: fi });
    playThrowSound();
  });

  socket.on("room-full", () => {
    document.getElementById("overlay").style.display = "flex";
    document.getElementById("overlay-text").textContent = "Room is full (max 10 players)";
  });

  socket.on("disconnect", () => {
    document.getElementById("overlay").style.display = "flex";
    document.getElementById("overlay-text").textContent = "Reconnecting...";
  });

  socket.io.on("reconnect", () => {
    socket.emit("join-room", { roomCode: currentRoomCode, name, character: selectedCharacter });
  });

  document.getElementById("overlay").style.display = "flex";
  document.getElementById("overlay-text").textContent = "Joining...";
}

// ═══════════════════════════════════════════
//  INPUT
// ═══════════════════════════════════════════
window.addEventListener("keydown", (e) => {
  if (document.activeElement === document.getElementById("chat-input")) return;
  keys[e.code] = true;
  if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","KeyW","KeyA","KeyS","KeyD"].includes(e.code)) {
    movePath = null; moveTarget = null;
  }
  if (e.code === "Enter" && gameRunning) { document.getElementById("chat-input").focus(); e.preventDefault(); }
  if (e.code === "Space" && gameRunning && !isJumping && localPlayer) {
    e.preventDefault();
    isJumping = true; jumpStartTime = Date.now();
    jumpFromX = localPlayer.x; jumpFromY = localPlayer.y;
    // Diagonal jump support — compute direction from pressed keys
    let jdx = 0, jdy = 0;
    if (keys["ArrowUp"] || keys["KeyW"]) jdy = -1;
    if (keys["ArrowDown"] || keys["KeyS"]) jdy = 1;
    if (keys["ArrowLeft"] || keys["KeyA"]) jdx = -1;
    if (keys["ArrowRight"] || keys["KeyD"]) jdx = 1;
    if (jdx === 0 && jdy === 0 && localPlayer.isMoving) {
      const dir = localPlayer.direction;
      jdx = dir === "left" ? -1 : dir === "right" ? 1 : 0;
      jdy = dir === "up" ? -1 : dir === "down" ? 1 : 0;
    }
    if (jdx !== 0 && jdy !== 0) { jdx *= 0.707; jdy *= 0.707; }
    jumpDirX = jdx; jumpDirY = jdy;
    let rawToX = jumpFromX + jdx * JUMP_DIST_MOVING;
    let rawToY = jumpFromY + jdy * JUMP_DIST_MOVING;
    rawToX = Math.max(24, Math.min(MAP.width - 24, rawToX));
    rawToY = Math.max(24, Math.min(MAP.height - 40, rawToY));
    // Collision sampling along jump path (8px steps)
    const landing = findJumpLanding(jumpFromX, jumpFromY, rawToX, rawToY);
    jumpToX = landing.x; jumpToY = landing.y;
    // Compute direction string for server
    let dirStr = localPlayer.direction;
    if (Math.abs(jdx) > Math.abs(jdy)) dirStr = jdx < 0 ? "left" : "right";
    else if (jdy !== 0) dirStr = jdy < 0 ? "up" : "down";
    localPlayer.direction = dirStr;
    // Send jump event to server
    if (socket) socket.emit("jump", { fromX: jumpFromX, fromY: jumpFromY, toX: jumpToX, toY: jumpToY, direction: dirStr });
  }
  if (e.code === "KeyT" && gameRunning) {
    if (robotVacuums.length > 0) return;
    if (hoverTarget) {
      if (hoverTarget.type === "player") throwPlayer(hoverTarget.id, hoverTarget.data);
      else if (hoverTarget.type === "furniture") throwFurniture(hoverTarget.data);
      hoverTarget = null;
    }
  }
  if (e.code === "KeyH" && gameRunning && localPlayer) {
    if (document.activeElement === document.getElementById("chat-input")) return;
    const now = Date.now();
    if (now - lastBackslapTime < BACKSLAP_COOLDOWN) return;
    let nearest = null, nearestDist = BACKSLAP_RANGE;
    for (const [id, p] of remotePlayers) {
      const dx = p.x - localPlayer.x, dy = p.y - localPlayer.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestDist && !isPlayerFlying(id) && !stunnedPlayers.has(id)) {
        nearest = { id, player: p }; nearestDist = dist;
      }
    }
    if (nearest) {
      socket.emit("backslap", { targetId: nearest.id });
      lastBackslapTime = now;
    }
  }
});
window.addEventListener("keyup", (e) => { keys[e.code] = false; });

// Mouse move for throw hover (always active — no throwMode needed)
document.getElementById("game-canvas").addEventListener("mousemove", (e) => {
  if (!localPlayer || !gameRunning) { hoverTarget = null; return; }
  if (robotVacuums.length > 0) { hoverTarget = null; document.getElementById("game-area").style.cursor = "default"; return; }
  const canvas = e.target, rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const sx = canvas.width / dpr / rect.width, sy = canvas.height / dpr / rect.height;
  const worldX = (e.clientX - rect.left) * sx - currentCamX;
  const worldY = (e.clientY - rect.top) * sy - currentCamY;
  hoverTarget = null;
  const nearby = getNearbyThrowables();
  for (const item of nearby) {
    if (item.type === "player") {
      const dx = item.data.x - worldX, dy = item.data.y - worldY;
      if (Math.sqrt(dx*dx + dy*dy) < 25) { hoverTarget = item; break; }
    } else if (item.type === "furniture") {
      const m = 6;
      if (worldX >= item.data.fx - m && worldX <= item.data.fx + item.data.w + m &&
          worldY >= item.data.fy - m && worldY <= item.data.fy + item.data.h + m) {
        hoverTarget = item; break;
      }
    }
  }
  document.getElementById("game-area").style.cursor = hoverTarget ? "grab" : "default";
});

// Click: move or throw
document.getElementById("game-canvas").addEventListener("click", (e) => {
  if (!localPlayer || !gameRunning) return;
  if (document.activeElement === document.getElementById("chat-input")) return;
  const canvas = e.target, rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const sx = canvas.width / dpr / rect.width, sy = canvas.height / dpr / rect.height;
  const worldX = (e.clientX - rect.left) * sx - currentCamX;
  const worldY = (e.clientY - rect.top) * sy - currentCamY;

  // Ignore clicks outside map bounds
  if (worldX < 0 || worldX > MAP.width || worldY < 0 || worldY > MAP.height) return;
  // Jail movement restriction
  if (localJailUntil > Date.now()) {
    if (worldX < JAIL.x + 20 || worldX > JAIL.x + JAIL.w - 20 || worldY < JAIL.y + 20 || worldY > JAIL.y + JAIL.h - 20) return;
  }
  // Pathfinding click-to-move
  const path = findPath(localPlayer.x, localPlayer.y, worldX, worldY);
  if (path && path.length > 0) {
    movePath = path;
    movePathIdx = 0;
    moveTarget = { x: path[path.length-1].x, y: path[path.length-1].y, time: Date.now() };
  } else if (!checkCollision(worldX, worldY)) {
    // Fallback: direct move if path not found but target is walkable
    movePath = [{ x: worldX, y: worldY }];
    movePathIdx = 0;
    moveTarget = { x: worldX, y: worldY, time: Date.now() };
  }
});

function handleInput(dt) {
  if (!localPlayer) return;
  // Jump physics — override normal movement, skip collision (can hop over furniture)
  if (isJumping) {
    footstepTimer = 0;
    const elapsed = Date.now() - jumpStartTime;
    const t = Math.min(1, elapsed / JUMP_DURATION);
    localPlayer.x = jumpFromX + (jumpToX - jumpFromX) * t;
    localPlayer.y = jumpFromY + (jumpToY - jumpFromY) * t;
    localPlayer.jumpOffset = -Math.sin(t * Math.PI) * JUMP_HEIGHT;
    if (t >= 1) {
      isJumping = false; localPlayer.jumpOffset = 0;
      localPlayer.x = jumpToX; localPlayer.y = jumpToY;
      sendPosition();
    }
    return;
  }
  localPlayer.jumpOffset = 0;

  if (document.activeElement === document.getElementById("chat-input")) { localPlayer.isMoving = false; return; }

  let dx = 0, dy = 0;
  const dist = SPEED * (dt / 1000);

  if (keys["ArrowUp"] || keys["KeyW"]) dy -= dist;
  if (keys["ArrowDown"] || keys["KeyS"]) dy += dist;
  if (keys["ArrowLeft"] || keys["KeyA"]) dx -= dist;
  if (keys["ArrowRight"] || keys["KeyD"]) dx += dist;

  if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

  // Follow path waypoints
  if (dx === 0 && dy === 0 && movePath && movePathIdx < movePath.length) {
    const wp = movePath[movePathIdx];
    const tdx = wp.x - localPlayer.x, tdy = wp.y - localPlayer.y;
    const tdist = Math.sqrt(tdx * tdx + tdy * tdy);
    if (tdist < 5) {
      movePathIdx++;
      if (movePathIdx >= movePath.length) {
        movePath = null; moveTarget = null;
        localPlayer.isMoving = false;
        sendPosition();
        return;
      }
      return;
    }
    dx = (tdx / tdist) * dist;
    dy = (tdy / tdist) * dist;
  }

  if (dx === 0 && dy === 0) { localPlayer.isMoving = false; footstepTimer = 0; return; }

  if (Math.abs(dy) > Math.abs(dx)) localPlayer.direction = dy < 0 ? "up" : "down";
  else localPlayer.direction = dx < 0 ? "left" : "right";
  localPlayer.isMoving = true;

  // Footstep sounds
  footstepTimer += dt;
  if (footstepTimer >= FOOTSTEP_INTERVAL) {
    footstepTimer = 0;
    playFootstep();
  }

  const newX = localPlayer.x + dx;
  if (!checkCollision(newX, localPlayer.y)) localPlayer.x = newX;
  else if (movePath) { movePath = null; moveTarget = null; }

  const newY = localPlayer.y + dy;
  if (!checkCollision(localPlayer.x, newY)) localPlayer.y = newY;
  else if (movePath) { movePath = null; moveTarget = null; }

  localPlayer.x = Math.max(24, Math.min(MAP.width - 24, localPlayer.x));
  localPlayer.y = Math.max(24, Math.min(MAP.height - 40, localPlayer.y));
  // Jail movement restriction
  if (localJailUntil > Date.now()) {
    localPlayer.x = Math.max(JAIL.x + 20, Math.min(JAIL.x + JAIL.w - 20, localPlayer.x));
    localPlayer.y = Math.max(JAIL.y + 20, Math.min(JAIL.y + JAIL.h - 20, localPlayer.y));
  }
  sendPosition();
}

function sendPosition() {
  const now = Date.now();
  if (now - lastPositionSend < POSITION_SEND_INTERVAL) return;
  lastPositionSend = now;
  socket.emit("move", { x: localPlayer.x, y: localPlayer.y, direction: localPlayer.direction });
}

// ═══════════════════════════════════════════
//  UPDATE
// ═══════════════════════════════════════════
function update(dt) {
  const now = Date.now();
  // Remote player interpolation + jump animation
  for (const [id, p] of remotePlayers) {
    // Remote jump arc
    if (p.jumpStart) {
      const elapsed = now - p.jumpStart;
      const t = Math.min(1, elapsed / JUMP_DURATION);
      p.x = p.jumpFrom.x + (p.jumpTo.x - p.jumpFrom.x) * t;
      p.y = p.jumpFrom.y + (p.jumpTo.y - p.jumpFrom.y) * t;
      p.jumpOffset = -Math.sin(t * Math.PI) * JUMP_HEIGHT;
      p.isMoving = false;
      if (t >= 1) {
        p.jumpStart = null; p.jumpOffset = 0;
        p.x = p.jumpTo.x; p.y = p.jumpTo.y;
        p.targetX = p.jumpTo.x; p.targetY = p.jumpTo.y;
      }
    } else if (p.targetX !== undefined) {
      const ox = p.x, oy = p.y;
      p.x += (p.targetX - p.x) * 0.18;
      p.y += (p.targetY - p.y) * 0.18;
      if (Math.abs(p.targetX - p.x) < 0.5) p.x = p.targetX;
      if (Math.abs(p.targetY - p.y) < 0.5) p.y = p.targetY;
      p.isMoving = Math.abs(p.x - ox) > 0.1 || Math.abs(p.y - oy) > 0.1;
      p.jumpOffset = 0;
    }
  }

  // Update aura particles for all players with active emoji
  if (localPlayer && localPlayer.activeEmoji) updateAura(socket.id, localPlayer.activeEmoji, localPlayer.x, localPlayer.y, dt);
  for (const [id, p] of remotePlayers) {
    if (p.activeEmoji) updateAura(id, p.activeEmoji, p.x, p.y, dt);
  }
  // Clean up aura for players without emoji
  for (const [pid] of auraParticles) {
    const isLocal = socket && pid === socket.id;
    const player = isLocal ? localPlayer : remotePlayers.get(pid);
    if (!player || !player.activeEmoji) {
      const parts = auraParticles.get(pid);
      if (parts) {
        const dts = dt / 1000;
        for (let i = parts.length - 1; i >= 0; i--) { parts[i].life -= dts; if (parts[i].life <= 0) parts.splice(i, 1); }
        if (parts.length === 0) auraParticles.delete(pid);
      }
    }
  }

  // Check furniture hits on landing — move original to new position
  let needNavRebuild = false;
  for (let i = flyingProps.length - 1; i >= 0; i--) {
    const fp = flyingProps[i];
    if (now - fp.startTime >= PROP_FLY_DURATION) {
      // Move the original furniture to landing position
      const fi = fp.furnIdx;
      if (fi >= 0 && fi < FURNITURE.length) {
        const fw = FURNITURE[fi].w, fh = FURNITURE[fi].h;
        FURNITURE[fi].x = Math.round(fp.toX - fw / 2);
        FURNITURE[fi].y = Math.round(fp.toY - fh / 2);
        // Clamp to map bounds
        FURNITURE[fi].x = Math.max(14, Math.min(MAP.width - 14 - fw, FURNITURE[fi].x));
        FURNITURE[fi].y = Math.max(14, Math.min(MAP.height - 14 - fh, FURNITURE[fi].y));
        flyingFurnSet.delete(fi);
        needNavRebuild = true;
      }
      // Hit detection — only the thrower performs it, sends prop-hit to server
      if (socket && fp.throwerId === socket.id) {
        const throwDx = fp.toX - fp.fromX, throwDy = fp.toY - fp.fromY;
        const throwDist = Math.sqrt(throwDx*throwDx + throwDy*throwDy) || 1;
        const knockDirX = throwDx / throwDist, knockDirY = throwDy / throwDist;
        const knockDist = 60 + Math.random() * 40;
        const hitCheck = (px, py, pid) => {
          const dx = px - fp.toX, dy = py - fp.toY;
          return Math.sqrt(dx*dx + dy*dy) < 35 && pid !== fp.throwerId;
        };
        let hitId = null;
        for (const [id, p] of remotePlayers) {
          if (hitCheck(p.x, p.y, id)) { hitId = id; break; }
        }
        if (!hitId && localPlayer && hitCheck(localPlayer.x, localPlayer.y, socket.id)) {
          hitId = socket.id;
        }
        if (hitId) {
          const target = hitId === socket.id ? localPlayer : remotePlayers.get(hitId);
          if (target) {
            const kx = Math.max(30, Math.min(MAP.width-30, target.x + knockDirX * knockDist));
            const ky = Math.max(30, Math.min(MAP.height-50, target.y + knockDirY * knockDist));
            socket.emit("prop-hit", { targetId: hitId, knockX: kx, knockY: ky });
          }
        }
      }
      playLandSound();
      flyingProps.splice(i, 1);
    }
  }
  if (needNavRebuild) buildNavGrid();

  // Update robot vacuum (pass real dt)
  updateVacuum(now, dt);

  // Update throw button state (always-on hover system)
  const vacuumActive = robotVacuums.length > 0;
  const nearby = vacuumActive ? [] : getNearbyThrowables();
  const throwBtn = document.getElementById("throw-btn");
  if (nearby.length > 0) {
    throwBtn.classList.remove("throw-disabled");
    throwBtn.disabled = false;
  } else {
    throwBtn.classList.add("throw-disabled");
    throwBtn.disabled = true;
    hoverTarget = null;
  }

}

// ═══════════════════════════════════════════
//  RENDER
// ═══════════════════════════════════════════
function render() {
  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const lw = canvas.width / dpr, lh = canvas.height / dpr;
  ctx.clearRect(0, 0, lw, lh);
  if (!localPlayer) return;

  let camX = lw / 2 - localPlayer.x;
  let camY = lh / 2 - localPlayer.y;
  camX = Math.min(0, Math.max(lw - MAP.width, camX));
  camY = Math.min(0, Math.max(lh - MAP.height, camY));
  currentCamX = camX; currentCamY = camY;

  ctx.save();
  ctx.translate(Math.floor(camX), Math.floor(camY));

  // Viewport for culling
  const vpX = -camX, vpY = -camY, vpW = lw, vpH = lh;
  drawFloor(ctx, vpX, vpY, vpW, vpH);
  for (let fi = 0; fi < FURNITURE.length; fi++) { const f = FURNITURE[fi]; if (f.type === "rug" && !flyingFurnSet.has(fi)) drawFurniture(ctx, f); }
  drawWalls(ctx);

  // Click target indicator
  if (moveTarget) {
    const age = (Date.now() - moveTarget.time) / 1000;
    const alpha = Math.max(0, 0.5 - age * 0.15);
    const pulse = 1 + Math.sin(Date.now() / 200) * 0.15;
    ctx.strokeStyle = `rgba(226,183,20,${alpha})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(moveTarget.x, moveTarget.y, 8 * pulse, 0, Math.PI * 2); ctx.stroke();
    // Draw path dots
    if (movePath && alpha > 0.1) {
      ctx.fillStyle = `rgba(226,183,20,${alpha * 0.5})`;
      for (let i = movePathIdx; i < movePath.length; i++) {
        ctx.beginPath(); ctx.arc(movePath[i].x, movePath[i].y, 2, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  // Y-sorted drawables
  const drawables = [];
  for (let fi = 0; fi < FURNITURE.length; fi++) { const f = FURNITURE[fi]; if (f.type === "rug" || flyingFurnSet.has(fi)) continue; drawables.push({ type: "f", data: f, sortY: f.y + f.h }); }
  drawables.push({ type: "p", data: localPlayer, isSelf: true, id: socket ? socket.id : "local", sortY: localPlayer.y + 28 });
  for (const [id, p] of remotePlayers) drawables.push({ type: "p", data: p, isSelf: false, id, sortY: p.y + 28 });
  drawables.sort((a, b) => a.sortY - b.sortY);

  const now = Date.now();
  const nearbyThrowables = getNearbyThrowables();

  for (const d of drawables) {
    if (d.type === "f") {
      drawFurniture(ctx, d.data);
    } else {
      if (isPlayerFlying(d.id)) continue;

      const jOff = d.data.jumpOffset || 0;
      const bob = d.data.isMoving ? Math.sin(now / 120) * 2 : 0;
      const stun = getStunScale(d.id);
      const wobble = getWobbleAngle(d.id);

      if (stun.scaleX !== 1 || stun.scaleY !== 1) {
        ctx.save();
        ctx.translate(d.data.x, d.data.y + 28 + jOff);
        ctx.scale(stun.scaleX, stun.scaleY);
        ctx.translate(-d.data.x, -(d.data.y + 28 + jOff));
        drawCharacter(ctx, d.data.x, d.data.y + stun.offsetY + jOff, d.data.character, d.data.direction, d.data.name, d.isSelf, 0);
        if (stun.scaleY < 0.8) {
          const sp = now / 200;
          ctx.font = "10px serif"; ctx.textAlign = "center";
          for (let s = 0; s < 3; s++) {
            ctx.fillText("\u2B50", d.data.x + Math.cos(sp + s*2.1)*16, d.data.y + jOff - 26 + Math.sin(sp*1.3 + s*1.5)*4);
          }
        }
        ctx.restore();
      } else if (wobble !== 0) {
        ctx.save();
        ctx.translate(d.data.x, d.data.y + 28 + jOff);
        ctx.rotate(wobble);
        ctx.translate(-d.data.x, -(d.data.y + 28 + jOff));
        drawCharacter(ctx, d.data.x, d.data.y + jOff, d.data.character, d.data.direction, d.data.name, d.isSelf, bob);
        ctx.restore();
      } else {
        drawCharacter(ctx, d.data.x, d.data.y + jOff, d.data.character, d.data.direction, d.data.name, d.isSelf, bob);
      }
      // Jump shadow
      if (jOff < -2) {
        const shadowScale = 1 + jOff / 60;
        ctx.fillStyle = "rgba(0,0,0,0.15)";
        ctx.beginPath(); ctx.ellipse(d.data.x, d.data.y + 28, 11 * shadowScale, 4 * shadowScale, 0, 0, Math.PI * 2); ctx.fill();
      }

      // Aura effect
      if (d.data.activeEmoji) drawAura(ctx, d.id, d.data.activeEmoji, d.data.x, d.data.y);

      // Status badge
      if (d.data.activeStatus) {
        const si = STATUS_OPTIONS.find(s => s.key === d.data.activeStatus);
        if (si) {
          const badgeY = d.data.y + (bob || 0) + jOff - 30;
          ctx.save();
          ctx.font = "bold 8px 'Segoe UI', system-ui, sans-serif";
          const tw = ctx.measureText(si.label).width;
          const bw = tw + 20, bh = 15;
          const bx = d.data.x - bw / 2, by = badgeY - bh / 2;
          ctx.fillStyle = "rgba(0,0,0,0.55)";
          roundRect(ctx, bx, by, bw, bh, 7); ctx.fill();
          ctx.font = "10px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(si.emoji, bx + 9, badgeY + 0.5);
          ctx.font = "bold 8px 'Segoe UI', system-ui, sans-serif"; ctx.fillStyle = "#fff";
          ctx.fillText(si.label, d.data.x + 5, badgeY + 0.5);
          ctx.restore();
        }
      }

      // Speech bubble
      const bubble = chatBubbles.get(d.id);
      if (bubble && now - bubble.startTime < BUBBLE_DURATION) {
        const alpha = Math.min(1, 1 - (now - bubble.startTime - BUBBLE_DURATION + 1000) / 1000);
        ctx.save(); ctx.globalAlpha = Math.max(0, alpha);
        drawChatBubble(ctx, d.data.x, d.data.y + (bob || 0), bubble.text);
        ctx.restore();
      }

      // Nearby player highlight (always-on throw system)
      if (!d.isSelf && localPlayer) {
        const dx = d.data.x - localPlayer.x, dy = d.data.y - localPlayer.y;
        if (Math.sqrt(dx*dx + dy*dy) < THROW_RANGE && !isPlayerFlying(d.id) && !stunnedPlayers.has(d.id)) {
          const isHov = hoverTarget && hoverTarget.type === "player" && hoverTarget.id === d.id;
          const pulse = isHov ? 0.6 + Math.sin(now / 150) * 0.2 : 0.15 + Math.sin(now / 400) * 0.08;
          ctx.strokeStyle = `rgba(226,183,20,${pulse})`; ctx.lineWidth = isHov ? 2.5 : 1.5;
          ctx.beginPath(); ctx.arc(d.data.x, d.data.y + 5, 22, 0, Math.PI * 2); ctx.stroke();
          if (isHov) {
            ctx.font = "9px 'Segoe UI', system-ui, sans-serif"; ctx.textAlign = "center";
            ctx.fillStyle = `rgba(226,183,20,${0.6 + Math.sin(now / 200) * 0.3})`;
            ctx.fillText("T", d.data.x, d.data.y - 32);
          }
        }
      }

      // Backslap hint (near players)
      if (!d.isSelf && localPlayer && !isPlayerFlying(d.id) && !stunnedPlayers.has(d.id)) {
        const dx = d.data.x - localPlayer.x, dy = d.data.y - localPlayer.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < BACKSLAP_RANGE) {
          const hintAlpha = 0.2 + Math.sin(now / 500) * 0.1;
          ctx.save(); ctx.globalAlpha = hintAlpha;
          ctx.font = "10px serif"; ctx.textAlign = "center";
          ctx.fillText("\uD83D\uDC4B", d.data.x + 16, d.data.y - 24);
          ctx.font = "bold 7px 'Segoe UI', system-ui, sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.6)";
          ctx.fillText("H", d.data.x + 16, d.data.y - 14);
          ctx.restore();
        }
      }

      // Throw count badge
      const throwCount = playerThrowCounts.get(d.id) || 0;
      if (throwCount > 0) {
        const badgeColor = throwCount >= 8 ? "#e53935" : throwCount >= 5 ? "#ff9800" : "#888";
        ctx.save();
        ctx.font = "bold 9px 'Segoe UI', system-ui";
        const tx = ctx.measureText(d.data.name).width / 2;
        ctx.fillStyle = badgeColor;
        ctx.beginPath(); ctx.arc(d.data.x + tx + 10, d.data.y + (d.data.jumpOffset || 0) - 18, 7, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(throwCount, d.data.x + tx + 10, d.data.y + (d.data.jumpOffset || 0) - 17.5);
        ctx.restore();
      }

      // Jail countdown timer
      const jailUntil = d.isSelf ? localJailUntil : (d.data.jailUntil || 0);
      if (jailUntil > now) {
        const remaining = Math.ceil((jailUntil - now) / 1000);
        ctx.save();
        ctx.font = "bold 12px 'Segoe UI', system-ui"; ctx.textAlign = "center";
        ctx.fillStyle = "#e53935";
        ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 2;
        const timerText = "\uD83D\uDD12 " + remaining + "s";
        ctx.strokeText(timerText, d.data.x, d.data.y + (d.data.jumpOffset || 0) - 36);
        ctx.fillText(timerText, d.data.x, d.data.y + (d.data.jumpOffset || 0) - 36);
        ctx.restore();
      }
    }
  }

  // Highlight nearby throwable furniture (always-on)
  for (const item of nearbyThrowables) {
    if (item.type !== "furniture") continue;
    const isHov = hoverTarget && hoverTarget.type === "furniture" && hoverTarget.id === item.id;
    const pulse = isHov ? 0.6 + Math.sin(now / 150) * 0.2 : 0.12 + Math.sin(now / 400) * 0.06;
    ctx.strokeStyle = `rgba(226,183,20,${pulse})`; ctx.lineWidth = isHov ? 2.5 : 1;
    roundRect(ctx, item.data.fx - 3, item.data.fy - 3, item.data.w + 6, item.data.h + 6, 4); ctx.stroke();
    if (isHov) {
      ctx.font = "9px 'Segoe UI', system-ui, sans-serif"; ctx.textAlign = "center";
      ctx.fillStyle = `rgba(226,183,20,${0.6 + Math.sin(now / 200) * 0.3})`;
      ctx.fillText("T", item.data.x, item.data.fy - 8);
    }
  }

  // Flying players
  for (let i = flyingPlayers.length - 1; i >= 0; i--) {
    const obj = flyingPlayers[i];
    if (now - obj.startTime > THROW_FLY_DURATION) { flyingPlayers.splice(i, 1); continue; }
    drawFlyingPlayer(ctx, obj, now);
  }

  // Flying props
  for (const fp of flyingProps) {
    if (now - fp.startTime <= PROP_FLY_DURATION) drawFlyingPropItem(ctx, fp, now);
  }

  // Backslap "찰싹!" effects
  for (let i = backslapEffects.length - 1; i >= 0; i--) {
    const ef = backslapEffects[i];
    const elapsed = now - ef.startTime;
    if (elapsed > 800) { backslapEffects.splice(i, 1); continue; }
    const t = elapsed / 800;
    ctx.save();
    ctx.globalAlpha = 1 - t;
    ctx.font = "bold 14px 'Segoe UI', system-ui"; ctx.textAlign = "center";
    ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 2;
    ctx.fillStyle = "#ff4444";
    ctx.strokeText("\uCC30\uC2F9!", ef.x, ef.y - t * 30);
    ctx.fillText("\uCC30\uC2F9!", ef.x, ef.y - t * 30);
    ctx.restore();
  }

  // Robot vacuum
  drawVacuum(ctx, now);

  ctx.restore();
}

// ═══════════════════════════════════════════
//  GAME LOOP
// ═══════════════════════════════════════════
function gameLoop(ts) {
  if (!gameRunning) return; // stop loop on exit
  const dt = ts - lastTime; lastTime = ts;
  if (dt < 200) { handleInput(dt); update(dt); }
  render();
  requestAnimationFrame(gameLoop);
}

// ═══════════════════════════════════════════
//  THROW BUTTON
// ═══════════════════════════════════════════
document.getElementById("throw-btn").addEventListener("click", () => {
  // Throw via hover + T — button is informational only
  if (hoverTarget) {
    if (hoverTarget.type === "player") throwPlayer(hoverTarget.id, hoverTarget.data);
    else if (hoverTarget.type === "furniture") throwFurniture(hoverTarget.data);
    hoverTarget = null;
  }
});

// ═══════════════════════════════════════════
//  VACUUM BUTTON + V KEY
// ═══════════════════════════════════════════
document.getElementById("vacuum-btn").addEventListener("click", startVacuum);

// V key shortcut for vacuum
window.addEventListener("keydown", (e) => {
  if (document.activeElement === document.getElementById("chat-input")) return;
  if (e.code === "KeyV" && gameRunning) startVacuum();
});

// ═══════════════════════════════════════════
//  EXIT BUTTON
// ═══════════════════════════════════════════
document.getElementById("exit-btn").addEventListener("click", () => {
  gameRunning = false; // stop game loop FIRST
  if (socket) { socket.disconnect(); socket = null; }
  localPlayer = null; remotePlayers.clear(); chatBubbles.clear(); auraParticles.clear();
  flyingPlayers = []; flyingProps = []; flyingFurnSet.clear(); stunnedPlayers.clear(); wobblePlayers.clear();
  playerColorMap.clear(); usedColorIdx = 0;
  hoverTarget = null; movePath = null; moveTarget = null;
  backslapEffects = []; lastBackslapTime = 0; playerThrowCounts.clear(); localJailUntil = 0; localThrowCooldownUntil = 0;
  isJumping = false; if (robotVacuums.length > 0) stopVacuumSound(); robotVacuums = [];
  keys = {};
  // Reset furniture positions to originals
  if (FURNITURE_ORIG) {
    for (let i = 0; i < FURNITURE.length; i++) {
      FURNITURE[i].x = FURNITURE_ORIG[i].x;
      FURNITURE[i].y = FURNITURE_ORIG[i].y;
    }
  }
  document.getElementById("top-bar").style.display = "none";
  document.getElementById("game-area").style.display = "none";
  document.getElementById("chat-panel").style.display = "none";
  document.getElementById("overlay").style.display = "none";
  document.getElementById("entry-screen").style.display = "flex";
  document.getElementById("chat-messages").innerHTML = "";
  if (chatPopupWindow && !chatPopupWindow.closed) chatPopupWindow.close();
  chatPopupWindow = null;
});

// ═══════════════════════════════════════════
//  CHAT POPUP BUTTON
// ═══════════════════════════════════════════
document.getElementById("chat-popup-btn").addEventListener("click", openChatPopup);

// ═══════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════
setupEntryScreen();
