// mechanics.js — Throw system, vacuum, animations, game constants
// Runtime deps on chat.js (addSystemMessage), loaded later but called only at runtime

var THROW_RANGE = 80;
var INTERACT_RANGE = 80;
var THROW_FLY_DURATION = 500;
var STUN_DURATION = 1200;
var PROP_FLY_DURATION = 600;
var WOBBLE_DURATION = 500;
var BACKSLAP_RANGE = 60;
var BACKSLAP_COOLDOWN = 1000;

function getNearbyThrowables() {
  if (!localPlayer) return [];
  const result = [];
  for (const [id, p] of remotePlayers) {
    const dx = p.x - localPlayer.x, dy = p.y - localPlayer.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < THROW_RANGE && !isPlayerFlying(id) && !stunnedPlayers.has(id))
      result.push({ type: "player", id, data: p, dist });
  }
  // All furniture is throwable (skip rugs and currently flying items)
  for (let fi = 0; fi < FURNITURE.length; fi++) {
    const f = FURNITURE[fi];
    if (FURN_NO_THROW.has(f.type)) continue;
    if (flyingFurnSet.has(fi)) continue;
    const cx = f.x + f.w / 2, cy = f.y + f.h / 2;
    const dx = cx - localPlayer.x, dy = cy - localPlayer.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < INTERACT_RANGE + 30)
      result.push({ type: "furniture", id: "f" + fi, data: { x: cx, y: cy, fx: f.x, fy: f.y, w: f.w, h: f.h, ftype: f.type, idx: fi }, dist });
  }
  return result;
}

function throwPlayer(targetId, targetPlayer) {
  if (!localPlayer || !socket) return;
  if (robotVacuums.length > 0) return;
  if (Date.now() < localThrowCooldownUntil) return;
  if (localJailUntil > Date.now()) return;
  const dx = targetPlayer.x - localPlayer.x, dy = targetPlayer.y - localPlayer.y;
  const dist = Math.sqrt(dx*dx + dy*dy) || 1;
  const throwDist = 150 + Math.random() * 50;
  let toX = targetPlayer.x + (dx / dist) * throwDist;
  let toY = targetPlayer.y + (dy / dist) * throwDist;
  toX = Math.max(30, Math.min(MAP.width - 30, toX));
  toY = Math.max(30, Math.min(MAP.height - 50, toY));
  socket.emit("throw-object", { targetId, fromX: targetPlayer.x, fromY: targetPlayer.y, toX, toY });
  localThrowCooldownUntil = Date.now() + 10000;
}

function throwFurniture(fdata) {
  if (!localPlayer || !socket) return;
  if (robotVacuums.length > 0) return;
  if (Date.now() < localThrowCooldownUntil) return;
  if (localJailUntil > Date.now()) return;
  // Physical direction: furniture flies AWAY from player
  const dx = fdata.x - localPlayer.x;
  const dy = fdata.y - localPlayer.y;
  const dist = Math.sqrt(dx*dx + dy*dy) || 1;
  const throwDist = 150 + Math.random() * 80;
  let targetX = fdata.x + (dx / dist) * throwDist;
  let targetY = fdata.y + (dy / dist) * throwDist;
  targetX = Math.max(30, Math.min(MAP.width - 30, targetX));
  targetY = Math.max(30, Math.min(MAP.height - 50, targetY));
  socket.emit("throw-prop", { propType: fdata.ftype, fromX: fdata.x, fromY: fdata.y, toX: targetX, toY: targetY, furnW: fdata.w, furnH: fdata.h, furnIdx: fdata.idx });
  localThrowCooldownUntil = Date.now() + 10000;
}

function drawFlyingPlayer(ctx, obj, now) {
  const t = Math.min(1, (now - obj.startTime) / THROW_FLY_DURATION);
  const px = obj.fromX + (obj.toX - obj.fromX) * t;
  const py = obj.fromY + (obj.toY - obj.fromY) * t - Math.sin(t * Math.PI) * 80;
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(t * Math.PI * 3);
  ctx.scale(0.8, 0.8);
  drawCharacter(ctx, 0, 0, obj.charIdx, "down", "", false, 0);
  ctx.restore();
  const groundY = obj.fromY + (obj.toY - obj.fromY) * t;
  const ss = 1 - Math.sin(t * Math.PI) * 0.5;
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.beginPath(); ctx.ellipse(px, groundY + 28, 10*ss, 3*ss, 0, 0, Math.PI*2); ctx.fill();
}

function drawFlyingPropItem(ctx, obj, now) {
  const t = Math.min(1, (now - obj.startTime) / PROP_FLY_DURATION);
  const px = obj.fromX + (obj.toX - obj.fromX) * t;
  const py = obj.fromY + (obj.toY - obj.fromY) * t - Math.sin(t * Math.PI) * 80;
  const fw = obj.furnW || 40, fh = obj.furnH || 30;
  ctx.save();
  ctx.translate(px, py);
  // Slow rotation for large items, faster for small
  const maxDim = Math.max(fw, fh);
  const rotSpeed = maxDim > 80 ? 1.5 : 3;
  ctx.rotate(t * Math.PI * rotSpeed);
  // Draw at FULL SIZE — the original furniture flies
  drawFurniture(ctx, { type: obj.propType, x: -fw/2, y: -fh/2, w: fw, h: fh });
  ctx.restore();
  // Ground shadow scaled to furniture size
  const groundY = obj.fromY + (obj.toY - obj.fromY) * t;
  const ss = 1 - Math.sin(t * Math.PI) * 0.5;
  const shadowW = Math.max(16, fw * 0.5) * ss;
  const shadowH = Math.max(5, fh * 0.15) * ss;
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.beginPath(); ctx.ellipse(px, groundY + 5, shadowW, shadowH, 0, 0, Math.PI*2); ctx.fill();
}

function getStunScale(playerId) {
  const stun = stunnedPlayers.get(playerId);
  if (!stun) return { scaleX: 1, scaleY: 1, offsetY: 0 };
  const elapsed = Date.now() - stun.startTime;
  if (elapsed > STUN_DURATION) { stunnedPlayers.delete(playerId); return { scaleX: 1, scaleY: 1, offsetY: 0 }; }
  const t = elapsed / STUN_DURATION;
  let scaleX = 1, scaleY = 1, offsetY = 0;
  if (t < 0.25) { const p = t/0.25; scaleY = 1-p*0.55; scaleX = 1+p*0.3; offsetY = p*12; }
  else if (t < 0.5) { scaleY = 0.45; scaleX = 1.3; offsetY = 12; }
  else if (t < 0.8) { const p = (t-0.5)/0.3; scaleY = 0.45+p*0.65; scaleX = 1.3-p*0.35; offsetY = 12-p*14; }
  else { const p = (t-0.8)/0.2; scaleY = 1.1-p*0.1; scaleX = 0.95+p*0.05; offsetY = -2+p*2; }
  return { scaleX, scaleY, offsetY };
}

function getWobbleAngle(playerId) {
  const w = wobblePlayers.get(playerId);
  if (!w) return 0;
  const elapsed = Date.now() - w.startTime;
  if (elapsed > WOBBLE_DURATION) { wobblePlayers.delete(playerId); return 0; }
  const t = elapsed / WOBBLE_DURATION;
  return Math.sin(t * Math.PI * 6) * (1 - t) * 0.15;
}

function isPlayerFlying(playerId) { return flyingPlayers.some(f => f.playerId === playerId); }

// ═══════════════════════════════════════════
//  ROBOT VACUUM (multiple vacuums for big messes)
// ═══════════════════════════════════════════
var VACUUM_COLORS = ["#4fc3f7", "#ab47bc", "#66bb6a", "#ff7043", "#ffd54f"]; // LED colors per vacuum
var VACUUM_SPAWNS = [
  { x: 304, y: 354 },
  { x: 898, y: 354 },
  { x: 1492, y: 354 },
  { x: 304, y: 1190 },
  { x: 898, y: 1190 },
];

function startVacuum() {
  if (robotVacuums.length > 0) return;
  if (!FURNITURE_ORIG) return;
  const allTargets = [];
  for (let i = 0; i < FURNITURE.length; i++) {
    if (FURNITURE[i].noCollision) continue;
    const orig = FURNITURE_ORIG[i];
    if (Math.abs(FURNITURE[i].x - orig.x) > 2 || Math.abs(FURNITURE[i].y - orig.y) > 2) {
      allTargets.push(i);
    }
  }
  if (allTargets.length === 0) {
    addSystemMessage("Everything is already tidy! \uD83E\uDDF9");
    return;
  }
  // More mess → more vacuums (up to 5)
  let numVacuums;
  if (allTargets.length <= 2) numVacuums = 1;
  else if (allTargets.length <= 5) numVacuums = 2;
  else if (allTargets.length <= 10) numVacuums = 3;
  else if (allTargets.length <= 18) numVacuums = 4;
  else numVacuums = 5;
  // Split targets round-robin among vacuums
  const groups = [];
  for (let v = 0; v < numVacuums; v++) groups.push([]);
  for (let i = 0; i < allTargets.length; i++) groups[i % numVacuums].push(allTargets[i]);
  // Create each vacuum
  const TARGET_TIME = 15;
  for (let v = 0; v < numVacuums; v++) {
    if (groups[v].length === 0) continue;
    const targets = groups[v];
    let totalDist = 0;
    let prevX = VACUUM_SPAWNS[v].x, prevY = VACUUM_SPAWNS[v].y;
    for (const fi of targets) {
      const fx = FURNITURE[fi].x + FURNITURE[fi].w / 2;
      const fy = FURNITURE[fi].y + FURNITURE[fi].h / 2;
      totalDist += Math.sqrt((fx - prevX) * (fx - prevX) + (fy - prevY) * (fy - prevY));
      prevX = FURNITURE_ORIG[fi].x + FURNITURE[fi].w / 2;
      prevY = FURNITURE_ORIG[fi].y + FURNITURE[fi].h / 2;
    }
    const throwPause = targets.length * 0.3;
    const moveTime = Math.max(3, TARGET_TIME - throwPause);
    const speed = Math.max(80, Math.min(400, totalDist / moveTime));
    robotVacuums.push({
      active: true, targets, currentIdx: 0,
      x: VACUUM_SPAWNS[v].x, y: VACUUM_SPAWNS[v].y,
      phase: "moving", phaseStart: Date.now(),
      speed, direction: 0, colorIdx: v
    });
  }
  const msg = numVacuums > 1
    ? "\uD83E\uDD16 Robot vacuums \u00D7" + numVacuums + " dispatched!"
    : "\uD83E\uDD16 Robot vacuum activated!";
  addSystemMessage(msg);
  document.getElementById("vacuum-btn").classList.add("emoji-active");
  playVacuumSound();
}

function updateVacuum(now, frameDt) {
  if (robotVacuums.length === 0) return;
  const dt = (frameDt || 16) / 1000;
  for (const rv of robotVacuums) {
    if (!rv.active) continue;
    if (rv.phase === "moving") {
      const fi = rv.targets[rv.currentIdx];
      const tgtX = FURNITURE[fi].x + FURNITURE[fi].w / 2;
      const tgtY = FURNITURE[fi].y + FURNITURE[fi].h / 2;
      const dx = tgtX - rv.x, dy = tgtY - rv.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      rv.direction = Math.atan2(dy, dx);
      if (dist < 22) {
        rv.phase = "throwing"; rv.phaseStart = now;
        const orig = FURNITURE_ORIG[fi];
        const f = FURNITURE[fi];
        flyingFurnSet.add(fi);
        flyingProps.push({
          propId: null, propType: f.type,
          fromX: f.x + f.w / 2, fromY: f.y + f.h / 2,
          toX: orig.x + f.w / 2, toY: orig.y + f.h / 2,
          startTime: now, throwerId: "__vacuum__",
          furnW: f.w, furnH: f.h, furnIdx: fi
        });
        playThrowSound();
      } else {
        rv.x += (dx / dist) * rv.speed * dt;
        rv.y += (dy / dist) * rv.speed * dt;
      }
    } else if (rv.phase === "throwing") {
      if (now - rv.phaseStart >= 350) {
        rv.currentIdx++;
        if (rv.currentIdx >= rv.targets.length) {
          rv.phase = "finishing"; rv.phaseStart = now;
        } else {
          rv.phase = "moving"; rv.phaseStart = now;
        }
      }
    } else if (rv.phase === "finishing") {
      if (now - rv.phaseStart >= PROP_FLY_DURATION + 100) {
        rv.active = false;
      }
    }
  }
  // All vacuums done?
  if (robotVacuums.every(rv => !rv.active)) {
    robotVacuums = [];
    buildNavGrid();
    addSystemMessage("\uD83E\uDD16 취사가 완료되었습니다.");
    document.getElementById("vacuum-btn").classList.remove("emoji-active");
    stopVacuumSound();
    speakCompletion();
  }
}

function drawVacuum(ctx, now) {
  for (const rv of robotVacuums) {
    if (!rv.active) continue;
    const ledColor = VACUUM_COLORS[rv.colorIdx] || VACUUM_COLORS[0];
    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.beginPath(); ctx.ellipse(rv.x, rv.y + 10, 13, 4, 0, 0, Math.PI * 2); ctx.fill();
    // Body
    ctx.save();
    ctx.translate(rv.x, rv.y);
    ctx.rotate(rv.direction + Math.PI / 2);
    ctx.fillStyle = "#333"; ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#555"; ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
    // Spinning brush
    const spin = now / 100;
    ctx.strokeStyle = "#777"; ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      const a = spin + i * Math.PI * 2 / 3;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 8, Math.sin(a) * 8); ctx.stroke();
    }
    // LED (each vacuum has its own color)
    const blink = Math.sin(now / 200 + rv.colorIdx * 2) > 0;
    ctx.fillStyle = blink ? ledColor : "#ddd";
    ctx.beginPath(); ctx.arc(0, -5, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(0, -5, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // Dust trail
    if (rv.phase === "moving") {
      ctx.globalAlpha = 0.2;
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = "#bbb";
        ctx.beginPath(); ctx.arc(rv.x + (Math.random() - 0.5) * 14, rv.y + (Math.random() - 0.5) * 14 + 5, 1 + Math.random() * 2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    // Progress per vacuum
    const progress = Math.round((rv.currentIdx / rv.targets.length) * 100);
    ctx.font = "bold 9px 'Segoe UI', system-ui"; ctx.textAlign = "center";
    ctx.fillStyle = ledColor;
    ctx.fillText(progress + "%", rv.x, rv.y - 20);
  }
}
