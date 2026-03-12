// renderer.js — Canvas rendering, drawing functions, visual effects

function drawCharacter(ctx, x, y, charIdx, direction, name, isSelf, bobOffset) {
  const ch = CHARACTERS[charIdx] || CHARACTERS[0];
  const cx = Math.round(x);
  const cy = Math.round(y + (bobOffset || 0));
  ctx.save();

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.ellipse(cx, cy + 28, 11, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.fillStyle = "#3a3a5a";
  ctx.fillRect(cx - 6, cy + 14, 5, 14);
  ctx.fillRect(cx + 1, cy + 14, 5, 14);
  ctx.fillStyle = "#2a2a3a";
  ctx.fillRect(cx - 7, cy + 25, 6, 3);
  ctx.fillRect(cx + 1, cy + 25, 6, 3);

  // Body
  ctx.fillStyle = ch.body;
  ctx.fillRect(cx - 9, cy + 2, 18, 14);
  ctx.fillStyle = "rgba(0,0,0,0.1)";
  ctx.fillRect(cx - 9, cy + 12, 18, 4);

  // Arms
  ctx.fillStyle = ch.body;
  ctx.fillRect(cx - 13, cy + 4, 5, 10);
  ctx.fillRect(cx + 9, cy + 4, 5, 10);
  ctx.fillStyle = ch.skin;
  ctx.fillRect(cx - 13, cy + 12, 5, 3);
  ctx.fillRect(cx + 9, cy + 12, 5, 3);

  // Head
  ctx.fillStyle = ch.skin;
  ctx.beginPath();
  ctx.arc(cx, cy - 4, 10, 0, Math.PI * 2);
  ctx.fill();

  drawHair(ctx, cx, cy, ch.hair, ch.hairStyle, direction);

  // Face
  ctx.fillStyle = "#222";
  if (direction === "down") {
    ctx.fillRect(cx - 4, cy - 4, 2, 3);
    ctx.fillRect(cx + 2, cy - 4, 2, 3);
    ctx.fillStyle = "#c0755a";
    ctx.fillRect(cx - 1, cy + 1, 3, 1);
  } else if (direction === "left") {
    ctx.fillRect(cx - 5, cy - 4, 2, 3);
    ctx.fillStyle = "#c0755a";
    ctx.fillRect(cx - 3, cy + 1, 2, 1);
  } else if (direction === "right") {
    ctx.fillRect(cx + 3, cy - 4, 2, 3);
    ctx.fillStyle = "#c0755a";
    ctx.fillRect(cx + 1, cy + 1, 2, 1);
  }

  drawAccessory(ctx, cx, cy, ch.accessory, direction);

  // Name
  ctx.font = "bold 10px 'Segoe UI', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.strokeStyle = "rgba(0,0,0,0.6)";
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";
  ctx.strokeText(name, cx, cy - 18);
  ctx.fillStyle = isSelf ? "#FFD700" : "#fff";
  ctx.fillText(name, cx, cy - 18);

  ctx.restore();
}

function drawHair(ctx, cx, cy, color, style, dir) {
  ctx.fillStyle = color;
  switch (style) {
    case "short":
      ctx.beginPath(); ctx.arc(cx, cy - 7, 10, Math.PI, 0); ctx.fill();
      ctx.fillRect(cx - 10, cy - 8, 20, 4);
      break;
    case "curly":
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.arc(cx + i * 5, cy - 12, 5, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillRect(cx - 10, cy - 10, 20, 5);
      break;
    case "long":
      ctx.beginPath(); ctx.arc(cx, cy - 7, 10, Math.PI, 0); ctx.fill();
      ctx.fillRect(cx - 10, cy - 8, 20, 4);
      if (dir !== "right") ctx.fillRect(cx - 12, cy - 6, 5, 16);
      if (dir !== "left") ctx.fillRect(cx + 7, cy - 6, 5, 16);
      break;
    case "ponytail":
      ctx.beginPath(); ctx.arc(cx, cy - 7, 10, Math.PI, 0); ctx.fill();
      ctx.fillRect(cx - 10, cy - 8, 20, 4);
      ctx.beginPath(); ctx.arc(cx, cy - 17, 5, 0, Math.PI * 2); ctx.fill();
      break;
    case "spiky":
      ctx.fillRect(cx - 10, cy - 8, 20, 5);
      ctx.beginPath(); ctx.moveTo(cx - 10, cy - 8); ctx.lineTo(cx - 6, cy - 18); ctx.lineTo(cx - 2, cy - 8); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx - 3, cy - 8); ctx.lineTo(cx + 1, cy - 20); ctx.lineTo(cx + 5, cy - 8); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx + 3, cy - 8); ctx.lineTo(cx + 8, cy - 16); ctx.lineTo(cx + 11, cy - 8); ctx.fill();
      break;
    case "bob":
      ctx.beginPath(); ctx.arc(cx, cy - 6, 11, Math.PI, 0); ctx.fill();
      ctx.fillRect(cx - 11, cy - 7, 22, 5);
      ctx.fillRect(cx - 11, cy - 4, 4, 8);
      ctx.fillRect(cx + 7, cy - 4, 4, 8);
      break;
    case "afro":
      ctx.beginPath(); ctx.arc(cx, cy - 8, 14, 0, Math.PI * 2); ctx.fill();
      break;
    case "buzz":
      ctx.beginPath(); ctx.arc(cx, cy - 6, 10.5, Math.PI, 0); ctx.fill();
      ctx.fillRect(cx - 10, cy - 7, 20, 3);
      break;
    case "wavy":
      ctx.beginPath(); ctx.arc(cx, cy - 7, 10, Math.PI, 0); ctx.fill();
      ctx.fillRect(cx - 10, cy - 8, 20, 4);
      for (let i = 0; i < 3; i++) {
        const offset = Math.sin(i * 1.2) * 2;
        if (dir !== "right") ctx.fillRect(cx - 12 + offset, cy - 4 + i * 5, 5, 5);
        if (dir !== "left") ctx.fillRect(cx + 7 - offset, cy - 4 + i * 5, 5, 5);
      }
      break;
    case "braids":
      ctx.beginPath(); ctx.arc(cx, cy - 7, 10, Math.PI, 0); ctx.fill();
      ctx.fillRect(cx - 10, cy - 8, 20, 4);
      if (dir !== "right") { ctx.fillRect(cx - 11, cy - 4, 3, 18); ctx.beginPath(); ctx.arc(cx - 9.5, cy + 14, 2, 0, Math.PI * 2); ctx.fill(); }
      if (dir !== "left") { ctx.fillRect(cx + 8, cy - 4, 3, 18); ctx.beginPath(); ctx.arc(cx + 9.5, cy + 14, 2, 0, Math.PI * 2); ctx.fill(); }
      break;
  }
}

function drawAccessory(ctx, cx, cy, acc, dir) {
  switch (acc) {
    case "glasses":
      if (dir === "up") break;
      ctx.strokeStyle = "#FFD700"; ctx.lineWidth = 1.5;
      if (dir === "down") {
        ctx.strokeRect(cx - 6, cy - 6, 5, 4); ctx.strokeRect(cx + 1, cy - 6, 5, 4);
        ctx.beginPath(); ctx.moveTo(cx - 1, cy - 4); ctx.lineTo(cx + 1, cy - 4); ctx.stroke();
      } else if (dir === "left") { ctx.strokeRect(cx - 7, cy - 6, 5, 4); }
      else if (dir === "right") { ctx.strokeRect(cx + 2, cy - 6, 5, 4); }
      break;
    case "headphones":
      ctx.strokeStyle = "#555"; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(cx, cy - 8, 11, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      ctx.fillStyle = "#333"; ctx.fillRect(cx - 13, cy - 6, 4, 7); ctx.fillRect(cx + 9, cy - 6, 4, 7);
      break;
    case "bow":
      if (dir === "up") break;
      ctx.fillStyle = "#ff6b9d";
      ctx.beginPath(); ctx.arc(cx + 8, cy - 12, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 13, cy - 12, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ff4081"; ctx.beginPath(); ctx.arc(cx + 10.5, cy - 12, 2, 0, Math.PI * 2); ctx.fill();
      break;
    case "hat":
      ctx.fillStyle = "#2c3e50"; ctx.fillRect(cx - 13, cy - 14, 26, 3); ctx.fillRect(cx - 9, cy - 22, 18, 10);
      ctx.fillStyle = "#e2b714"; ctx.fillRect(cx - 9, cy - 14, 18, 2);
      break;
    case "earrings":
      if (dir === "up") break;
      ctx.fillStyle = "#FFD700";
      if (dir === "down") {
        ctx.beginPath(); ctx.arc(cx - 9, cy + 2, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 9, cy + 2, 2, 0, Math.PI * 2); ctx.fill();
      } else if (dir === "left") { ctx.beginPath(); ctx.arc(cx - 10, cy + 2, 2, 0, Math.PI * 2); ctx.fill(); }
      else { ctx.beginPath(); ctx.arc(cx + 10, cy + 2, 2, 0, Math.PI * 2); ctx.fill(); }
      break;
    case "bandana":
      ctx.fillStyle = "#e74c3c"; ctx.fillRect(cx - 10, cy - 9, 20, 4);
      ctx.beginPath(); ctx.arc(cx + 10, cy - 7, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(cx + 10, cy - 6, 6, 2); ctx.fillRect(cx + 10, cy - 9, 6, 2);
      break;
    case "scarf":
      ctx.fillStyle = "#e67e22";
      ctx.fillRect(cx - 9, cy + 10, 18, 6);
      ctx.fillRect(cx - 4, cy + 14, 6, 8);
      ctx.fillStyle = "#d35400";
      ctx.fillRect(cx - 9, cy + 13, 18, 2);
      break;
    case "beanie":
      ctx.fillStyle = "#37474f";
      ctx.beginPath(); ctx.arc(cx, cy - 8, 11, Math.PI, 0); ctx.fill();
      ctx.fillRect(cx - 11, cy - 9, 22, 5);
      ctx.fillStyle = "#546e7a"; ctx.fillRect(cx - 11, cy - 6, 22, 3);
      ctx.fillStyle = "#ff5722"; ctx.beginPath(); ctx.arc(cx, cy - 19, 3, 0, Math.PI * 2); ctx.fill();
      break;
  }
}

// ═══════════════════════════════════════════
//  RENDERING HELPERS
// ═══════════════════════════════════════════
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

function drawFloor(ctx, vpX, vpY, vpW, vpH) {
  ctx.fillStyle = "#e0d6c8";
  ctx.fillRect(0, 0, MAP.width, MAP.height);
  for (const z of FLOOR_ZONES) {
    ctx.fillStyle = z.color;
    ctx.fillRect(z.x, z.y, z.w, z.h);
  }
  // Subtle grid — only draw lines in viewport
  ctx.strokeStyle = "rgba(0,0,0,0.03)";
  ctx.lineWidth = 0.5;
  const rStart = Math.max(0, Math.floor(vpY / MAP.tileSize));
  const rEnd = Math.min(Math.ceil(MAP.height / MAP.tileSize), Math.ceil((vpY + vpH) / MAP.tileSize));
  const cStart = Math.max(0, Math.floor(vpX / MAP.tileSize));
  const cEnd = Math.min(Math.ceil(MAP.width / MAP.tileSize), Math.ceil((vpX + vpW) / MAP.tileSize));
  for (let r = rStart; r <= rEnd; r++) {
    const ry = r * MAP.tileSize;
    ctx.beginPath(); ctx.moveTo(vpX, ry); ctx.lineTo(vpX + vpW, ry); ctx.stroke();
  }
  for (let c = cStart; c <= cEnd; c++) {
    const cx = c * MAP.tileSize;
    ctx.beginPath(); ctx.moveTo(cx, vpY); ctx.lineTo(cx, vpY + vpH); ctx.stroke();
  }
  // Zone labels
  ctx.font = "bold 32px 'Segoe UI', system-ui";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  for (const label of ZONE_LABELS) {
    ctx.fillStyle = "rgba(0,0,0,0.05)";
    ctx.fillText(label.text, label.x, label.y);
  }
}

function drawWalls(ctx) {
  for (const w of WALLS) {
    ctx.fillStyle = "#4a4a5a";
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = "#5a5a6a";
    ctx.fillRect(w.x, w.y, w.w, Math.min(2, w.h));
  }
}

function drawFurniture(ctx, item) {
  const { type, x, y, w, h } = item;
  switch (type) {
    case "modern_desk":
      ctx.fillStyle = "#f0ebe5"; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "#d9d2c9"; ctx.fillRect(x, y + h - 3, w, 3);
      ctx.fillStyle = "#888"; ctx.fillRect(x + 4, y + h, 3, 4); ctx.fillRect(x + w - 7, y + h, 3, 4);
      ctx.fillStyle = "#222"; ctx.fillRect(x + w/2 - 16, y + 4, 32, 22);
      ctx.fillStyle = "#3a7bd5"; ctx.fillRect(x + w/2 - 14, y + 6, 28, 17);
      ctx.fillStyle = "#444"; ctx.fillRect(x + w/2 - 3, y + 26, 6, 3); ctx.fillRect(x + w/2 - 10, y + 28, 20, 2);
      ctx.fillStyle = "#ccc"; ctx.fillRect(x + w/2 - 18, y + 34, 36, 10);
      ctx.fillStyle = "#bbb"; ctx.fillRect(x + w/2 + 22, y + 36, 10, 7);
      break;
    case "standing_desk":
      ctx.fillStyle = "#f0ebe5"; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "#d9d2c9"; ctx.fillRect(x, y + h - 2, w, 2);
      ctx.fillStyle = "#666"; ctx.fillRect(x + 6, y + h, 2, 8); ctx.fillRect(x + w - 8, y + h, 2, 8);
      ctx.fillStyle = "#555"; ctx.fillRect(x + w/2 - 14, y + 6, 28, 18);
      ctx.fillStyle = "#4a90d9"; ctx.fillRect(x + w/2 - 12, y + 8, 24, 14);
      break;
    case "office_chair":
      ctx.fillStyle = "#333"; ctx.beginPath(); ctx.arc(x + w/2, y + h/2, w/2 - 1, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#444"; ctx.beginPath(); ctx.arc(x + w/2, y + h/2, w/2 - 4, 0, Math.PI * 2); ctx.fill();
      break;
    case "conf_table":
      ctx.fillStyle = "#6a5a4a"; roundRect(ctx, x, y, w, h, 12); ctx.fill();
      ctx.fillStyle = "#7a6a5a"; roundRect(ctx, x + 3, y + 3, w - 6, h - 6, 10); ctx.fill();
      break;
    case "tv_wall":
      ctx.fillStyle = "#111"; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "#2a6ad4"; ctx.fillRect(x + 2, y + 1, w - 4, h - 2);
      break;
    case "whiteboard":
      ctx.fillStyle = "#f5f5f5"; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = "#ccc"; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h);
      ctx.strokeStyle = "#4a90d9"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x + 8, y + 3); ctx.lineTo(x + 80, y + 3); ctx.stroke();
      ctx.strokeStyle = "#e74c3c";
      ctx.beginPath(); ctx.moveTo(x + 8, y + 7); ctx.lineTo(x + 55, y + 7); ctx.stroke();
      break;
    case "phone_booth":
      ctx.fillStyle = "rgba(100,140,180,0.25)"; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = "#7a9ab5"; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = "#d9d2c9"; ctx.fillRect(x + 8, y + 30, w - 16, 14);
      ctx.fillStyle = "#555"; ctx.beginPath(); ctx.arc(x + w/2, y + 55, 8, 0, Math.PI * 2); ctx.fill();
      break;
    case "counter_long":
      ctx.fillStyle = "#e0e0e0"; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "#ccc"; ctx.fillRect(x, y + h - 3, w, 3);
      ctx.fillStyle = "#bbb"; ctx.fillRect(x + 80, y + 8, 30, 18);
      ctx.fillStyle = "#999"; ctx.fillRect(x + 84, y + 10, 22, 14);
      ctx.fillStyle = "#ccc"; ctx.fillRect(x + 93, y + 4, 4, 6);
      break;
    case "coffee_machine":
      ctx.fillStyle = "#333"; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "#444"; ctx.fillRect(x + 3, y + 3, w - 6, 10);
      ctx.fillStyle = "#4f4"; ctx.fillRect(x + 5, y + 5, 4, 4);
      ctx.fillStyle = "#777"; ctx.fillRect(x + 12, y + 18, 20, 14);
      ctx.fillStyle = "#3a1a0a"; ctx.fillRect(x + 14, y + 20, 16, 10);
      break;
    case "fridge":
      ctx.fillStyle = "#e8e8e8"; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "#ddd"; ctx.fillRect(x, y + h * 0.6, w, 2);
      ctx.fillStyle = "#bbb"; ctx.fillRect(x + w - 6, y + 8, 3, 10); ctx.fillRect(x + w - 6, y + h * 0.6 + 6, 3, 8);
      break;
    case "vending":
      ctx.fillStyle = "#2c3e50"; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "#34495e"; ctx.fillRect(x + 4, y + 4, w - 8, h * 0.6);
      const vColors = ["#e74c3c","#3498db","#2ecc71","#f39c12","#9b59b6"];
      for (let i = 0; i < 5; i++) { ctx.fillStyle = vColors[i]; ctx.fillRect(x + 6 + i * 7, y + 6, 5, 12); }
      ctx.fillStyle = "#1a252f"; ctx.fillRect(x + 10, y + h * 0.7, w - 20, 10);
      break;
    case "microwave":
      ctx.fillStyle = "#ddd"; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "#333"; ctx.fillRect(x + 3, y + 3, w * 0.65, h - 6);
      ctx.fillStyle = "#555"; ctx.fillRect(x + 5, y + 5, w * 0.65 - 4, h - 10);
      ctx.fillStyle = "#aaa"; ctx.fillRect(x + w * 0.72, y + 6, 6, 6);
      break;
    case "dining_table":
      ctx.fillStyle = "#f0ebe5"; roundRect(ctx, x, y, w, h, 6); ctx.fill();
      ctx.fillStyle = "#888"; ctx.fillRect(x + 6, y + h, 3, 3); ctx.fillRect(x + w - 9, y + h, 3, 3);
      break;
    case "stool":
      ctx.fillStyle = "#666"; ctx.beginPath(); ctx.arc(x + w/2, y + h/2, w/2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#777"; ctx.beginPath(); ctx.arc(x + w/2, y + h/2, w/2 - 3, 0, Math.PI * 2); ctx.fill();
      break;
    case "sofa":
      ctx.fillStyle = "#5c6bc0"; roundRect(ctx, x, y, w, h, 6); ctx.fill();
      ctx.fillStyle = "#7986cb"; roundRect(ctx, x + 4, y + 10, w - 8, h - 12, 4); ctx.fill();
      ctx.fillStyle = "#5c6bc0"; ctx.fillRect(x, y + 6, 10, h - 8); ctx.fillRect(x + w - 10, y + 6, 10, h - 8);
      ctx.strokeStyle = "rgba(0,0,0,0.08)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x + w/3, y + 12); ctx.lineTo(x + w/3, y + h - 4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + w*2/3, y + 12); ctx.lineTo(x + w*2/3, y + h - 4); ctx.stroke();
      break;
    case "coffee_table":
      ctx.fillStyle = "#8d6e63"; roundRect(ctx, x, y, w, h, 4); ctx.fill();
      ctx.fillStyle = "#795548"; roundRect(ctx, x + 2, y + 2, w - 4, h - 4, 3); ctx.fill();
      ctx.fillStyle = "#e74c3c"; ctx.fillRect(x + 10, y + 10, 16, 12);
      ctx.fillStyle = "#3498db"; ctx.fillRect(x + 30, y + 14, 14, 10);
      break;
    case "tv_stand":
      ctx.fillStyle = "#5d4037"; ctx.fillRect(x, y + 16, w, 12);
      ctx.fillStyle = "#111"; ctx.fillRect(x + 10, y, w - 20, 18);
      ctx.fillStyle = "#1a1a2e"; ctx.fillRect(x + 12, y + 1, w - 24, 15);
      break;
    case "pingpong":
      ctx.fillStyle = "#1b5e20"; roundRect(ctx, x, y, w, h, 4); ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x + w/2, y + 4); ctx.lineTo(x + w/2, y + h - 4); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.fillRect(x + w/2 - 1, y + 2, 2, h - 4);
      ctx.fillStyle = "#333"; ctx.fillRect(x + 6, y + h, 3, 4); ctx.fillRect(x + w - 9, y + h, 3, 4);
      break;
    case "arcade":
      ctx.fillStyle = "#1a237e"; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "#283593"; ctx.fillRect(x + 4, y + 4, w - 8, h * 0.5);
      ctx.fillStyle = "#4fc3f7"; ctx.fillRect(x + 6, y + 6, w - 12, h * 0.5 - 4);
      ctx.fillStyle = "#333"; ctx.fillRect(x + 8, y + h * 0.6, w - 16, h * 0.3);
      ctx.fillStyle = "#e74c3c"; ctx.beginPath(); ctx.arc(x + w/2 + 6, y + h * 0.7, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#4caf50"; ctx.beginPath(); ctx.arc(x + w/2 - 6, y + h * 0.7, 3, 0, Math.PI * 2); ctx.fill();
      break;
    case "beanbag":
      ctx.fillStyle = "#e8a060"; ctx.beginPath(); ctx.ellipse(x + w/2, y + h/2, w/2, h/2.4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.06)"; ctx.beginPath(); ctx.ellipse(x + w/2 + 2, y + h/2 + 2, w/3, h/3.5, 0, 0, Math.PI * 2); ctx.fill();
      break;
    case "bookshelf":
      ctx.fillStyle = "#5d4037"; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "#4e342e"; ctx.fillRect(x, y + h/3, w, 2); ctx.fillRect(x, y + h*2/3, w, 2);
      const bkColors = ["#e74c3c","#4a90d9","#2ecc71","#f39c12","#9b59b6","#e67e22","#1abc9c","#e91e63","#00bcd4","#ff5722"];
      for (let i = 0; i < Math.floor(w / 10); i++) { ctx.fillStyle = bkColors[i % bkColors.length]; ctx.fillRect(x + 3 + i * 10, y + 2, 8, h/3 - 4); }
      break;
    case "bed":
      // Frame
      ctx.fillStyle = "#8d6e63"; roundRect(ctx, x, y, w, h, 4); ctx.fill();
      // Mattress
      ctx.fillStyle = "#c5cae9"; roundRect(ctx, x + 3, y + 3, w - 6, h - 6, 3); ctx.fill();
      // Pillow
      ctx.fillStyle = "#e8e5e0"; roundRect(ctx, x + w/2 - 18, y + 6, 36, 16, 4); ctx.fill();
      // Blanket
      ctx.fillStyle = "#7986cb"; roundRect(ctx, x + 6, y + h * 0.4, w - 12, h * 0.5, 3); ctx.fill();
      ctx.fillStyle = "#5c6bc0"; ctx.fillRect(x + 6, y + h * 0.4, w - 12, 3);
      break;
    case "nightstand":
      ctx.fillStyle = "#8d6e63"; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "#795548"; ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
      // Lamp
      ctx.fillStyle = "#ffeb3b"; ctx.beginPath(); ctx.arc(x + w/2, y - 4, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#f9a825"; ctx.fillRect(x + w/2 - 2, y - 2, 4, 6);
      break;
    case "plant_big":
      ctx.fillStyle = "#5d4037"; ctx.fillRect(x + 7, y + 16, 16, 14);
      ctx.fillStyle = "#4e342e"; ctx.fillRect(x + 5, y + 14, 20, 4);
      ctx.fillStyle = "#388e3c"; ctx.beginPath(); ctx.arc(x + 15, y + 7, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#4caf50"; ctx.beginPath(); ctx.arc(x + 11, y + 11, 7, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 19, y + 11, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#66bb6a"; ctx.beginPath(); ctx.arc(x + 15, y + 4, 6, 0, Math.PI * 2); ctx.fill();
      break;
    case "plant_small":
      ctx.fillStyle = "#5d4037"; ctx.fillRect(x + 5, y + 12, 12, 10);
      ctx.fillStyle = "#388e3c"; ctx.beginPath(); ctx.arc(x + 11, y + 7, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#4caf50"; ctx.beginPath(); ctx.arc(x + 11, y + 4, 5, 0, Math.PI * 2); ctx.fill();
      break;
    case "rug":
      ctx.fillStyle = "rgba(120,100,80,0.12)"; roundRect(ctx, x, y, w, h, 10); ctx.fill();
      ctx.strokeStyle = "rgba(120,100,80,0.2)"; ctx.lineWidth = 2;
      roundRect(ctx, x + 8, y + 8, w - 16, h - 16, 6); ctx.stroke();
      break;
    case "hot_spring_pool":
      ctx.fillStyle = "#5d4037"; roundRect(ctx, x, y, w, h, 12); ctx.fill();
      ctx.fillStyle = "#4dd0e1"; roundRect(ctx, x+6, y+6, w-12, h-12, 8); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(x+w*0.2+i*w*0.2, y+h*0.5+Math.sin(i*1.5)*10, 12, 0, Math.PI*2); ctx.fill(); }
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(x+w*0.3+i*w*0.2, y+h*0.3, 20, 5, 0, 0, Math.PI*2); ctx.fill(); }
      break;
    case "rock":
      ctx.fillStyle = "#78909c"; ctx.beginPath();
      ctx.moveTo(x+w*0.1, y+h*0.8); ctx.lineTo(x+w*0.3, y+h*0.1); ctx.lineTo(x+w*0.7, y+h*0.05);
      ctx.lineTo(x+w*0.95, y+h*0.6); ctx.lineTo(x+w*0.8, y+h*0.95); ctx.lineTo(x+w*0.15, y+h*0.95);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#90a4ae"; ctx.beginPath();
      ctx.moveTo(x+w*0.2, y+h*0.7); ctx.lineTo(x+w*0.35, y+h*0.2); ctx.lineTo(x+w*0.65, y+h*0.15);
      ctx.lineTo(x+w*0.8, y+h*0.5); ctx.closePath(); ctx.fill();
      break;
    case "towel_rack":
      ctx.fillStyle = "#8d6e63"; ctx.fillRect(x+2, y, 4, h); ctx.fillRect(x+w-6, y, 4, h);
      ctx.fillRect(x, y+8, w, 4); ctx.fillRect(x, y+h*0.5, w, 4);
      ctx.fillStyle = "#e8e5e0"; ctx.fillRect(x+4, y+12, w-8, 10);
      ctx.fillStyle = "#bbdefb"; ctx.fillRect(x+4, y+h*0.5+4, w-8, 10);
      break;
    case "wooden_fence":
      ctx.fillStyle = "#8d6e63"; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "#a1887f";
      for (let i = 0; i < Math.floor(w/15); i++) ctx.fillRect(x+2+i*15, y+2, 12, h-4);
      ctx.fillStyle = "#6d4c41"; ctx.fillRect(x, y+h/2-1, w, 2);
      break;
    case "bar_counter":
      ctx.fillStyle = "#3e2723"; roundRect(ctx, x, y, w, h, 4); ctx.fill();
      ctx.fillStyle = "#4e342e"; roundRect(ctx, x+2, y+2, w-4, h-4, 3); ctx.fill();
      ctx.fillStyle = "#5d4037"; ctx.fillRect(x+4, y+h-6, w-8, 4);
      ctx.fillStyle = "#ffd54f"; ctx.beginPath(); ctx.arc(x+30, y+h/2, 5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#ef5350"; ctx.beginPath(); ctx.arc(x+60, y+h/2, 5, 0, Math.PI*2); ctx.fill();
      break;
    case "karaoke_booth":
      ctx.fillStyle = "#4a148c"; roundRect(ctx, x, y, w, h, 6); ctx.fill();
      ctx.fillStyle = "#6a1b9a"; roundRect(ctx, x+4, y+4, w-8, h*0.5, 4); ctx.fill();
      ctx.fillStyle = "#ce93d8"; ctx.fillRect(x+6, y+6, w-12, h*0.5-4);
      ctx.fillStyle = "#333"; ctx.fillRect(x+w/2-3, y+h*0.6, 6, 16);
      ctx.fillStyle = "#bbb"; ctx.beginPath(); ctx.arc(x+w/2, y+h*0.6, 6, 0, Math.PI*2); ctx.fill();
      break;
    case "pool_table":
      ctx.fillStyle = "#5d4037"; roundRect(ctx, x, y, w, h, 6); ctx.fill();
      ctx.fillStyle = "#2e7d32"; roundRect(ctx, x+6, y+6, w-12, h-12, 3); ctx.fill();
      ctx.fillStyle = "#1b5e20";
      ctx.beginPath(); ctx.moveTo(x+w/2, y+8); ctx.lineTo(x+w/2, y+h-8); ctx.strokeStyle="#fff"; ctx.lineWidth=1; ctx.stroke();
      ctx.fillStyle = "#333";
      const pockets = [[x+8,y+8],[x+w-8,y+8],[x+8,y+h-8],[x+w-8,y+h-8],[x+w/2,y+6],[x+w/2,y+h-6]];
      for (const [px,py] of pockets) { ctx.beginPath(); ctx.arc(px,py,4,0,Math.PI*2); ctx.fill(); }
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x+w*0.35, y+h*0.4, 3, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#f44336"; ctx.beginPath(); ctx.arc(x+w*0.6, y+h*0.5, 3, 0, Math.PI*2); ctx.fill();
      break;
    case "dart_board":
      ctx.fillStyle = "#5d4037"; ctx.fillRect(x, y, w, h);
      const cx2 = x+w/2, cy2 = y+h/2, rings = [18,14,10,6,2];
      const colors2 = ["#222","#e53935","#222","#43a047","#e53935"];
      for (let i=0;i<rings.length;i++) { ctx.fillStyle=colors2[i]; ctx.beginPath(); ctx.arc(cx2,cy2,rings[i],0,Math.PI*2); ctx.fill(); }
      break;
    case "disco_ball":
      const dcx = x+w/2, dcy = y+h/2;
      ctx.fillStyle = "#bdbdbd"; ctx.beginPath(); ctx.arc(dcx, dcy, w/2, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = "#999"; ctx.lineWidth = 0.5;
      for (let i=0;i<6;i++) { ctx.beginPath(); ctx.arc(dcx, dcy, w/2, i*Math.PI/3, i*Math.PI/3+0.1); ctx.lineTo(dcx,dcy); ctx.stroke(); }
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(dcx-3, dcy-3, 3, 0, Math.PI*2); ctx.fill();
      break;
    case "tree":
      ctx.fillStyle = "#5d4037"; ctx.fillRect(x+w/2-6, y+h*0.5, 12, h*0.5);
      ctx.fillStyle = "#2e7d32"; ctx.beginPath(); ctx.arc(x+w/2, y+h*0.35, w*0.45, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#388e3c"; ctx.beginPath(); ctx.arc(x+w/2-6, y+h*0.28, w*0.3, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#43a047"; ctx.beginPath(); ctx.arc(x+w/2+5, y+h*0.22, w*0.25, 0, Math.PI*2); ctx.fill();
      break;
    case "bush":
      ctx.fillStyle = "#388e3c"; ctx.beginPath(); ctx.ellipse(x+w/2, y+h*0.6, w/2, h*0.45, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#4caf50"; ctx.beginPath(); ctx.ellipse(x+w*0.35, y+h*0.45, w*0.3, h*0.35, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#66bb6a"; ctx.beginPath(); ctx.ellipse(x+w*0.65, y+h*0.4, w*0.25, h*0.3, 0, 0, Math.PI*2); ctx.fill();
      break;
    case "bench_park":
      ctx.fillStyle = "#8d6e63"; ctx.fillRect(x, y+4, w, 6); ctx.fillRect(x, y+h-8, w, 6);
      ctx.fillStyle = "#6d4c41";
      ctx.fillRect(x+6, y, 6, h); ctx.fillRect(x+w-12, y, 6, h);
      ctx.fillStyle = "#a1887f"; ctx.fillRect(x+2, y+6, w-4, 3); ctx.fillRect(x+2, y+h-6, w-4, 3);
      break;
    case "jail_bench":
      ctx.fillStyle = "#78909c"; ctx.fillRect(x, y+h-6, w, 6);
      ctx.fillStyle = "#607d8b"; ctx.fillRect(x+4, y, 4, h); ctx.fillRect(x+w-8, y, 4, h);
      ctx.fillStyle = "#90a4ae"; ctx.fillRect(x+2, y+h/2-2, w-4, 4);
      break;
  }
}

// (drawProp removed — all throwable items are now furniture)

// ═══════════════════════════════════════════
//  NAME COLORS (random, non-overlapping)
// ═══════════════════════════════════════════
var NAME_COLORS = [
  "#e2b714", "#4facfe", "#f093fb", "#2ecc71", "#e74c3c",
  "#ff9800", "#00bcd4", "#ab47bc", "#ef5350", "#26c6da",
];
var playerColorMap = new Map();
var usedColorIdx = 0;
function getPlayerColor(playerId) {
  if (playerColorMap.has(playerId)) return playerColorMap.get(playerId);
  const color = NAME_COLORS[usedColorIdx % NAME_COLORS.length];
  usedColorIdx++;
  playerColorMap.set(playerId, color);
  return color;
}

// ═══════════════════════════════════════════
//  SPEECH BUBBLES
// ═══════════════════════════════════════════
function drawChatBubble(ctx, x, y, text) {
  const maxLen = 28;
  const display = text.length > maxLen ? text.substring(0, maxLen) + "..." : text;
  ctx.font = "11px 'Segoe UI', system-ui, sans-serif";
  const tw = ctx.measureText(display).width;
  const pad = 8, bw = tw + pad * 2, bh = 22;
  const bx = x - bw / 2, by = y - 42 - bh;
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  roundRect(ctx, bx, by, bw, bh, 8); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - 5, by + bh); ctx.lineTo(x, by + bh + 6); ctx.lineTo(x + 5, by + bh); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.1)"; ctx.lineWidth = 1; roundRect(ctx, bx, by, bw, bh, 8); ctx.stroke();
  ctx.fillStyle = "#333"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(display, x, by + bh / 2);
}

// ═══════════════════════════════════════════
//  EMOJI AURA EFFECT SYSTEM (Body-Wrapping)
// ═══════════════════════════════════════════
function bodyPoint(px, py) {
  const r = Math.random();
  if (r < 0.25) { const a = Math.random()*Math.PI*2; return { x: px+Math.cos(a)*11, y: py-4+Math.sin(a)*11 }; }
  if (r < 0.5) return { x: px-10-Math.random()*4, y: py+2+Math.random()*14 };
  if (r < 0.75) return { x: px+10+Math.random()*4, y: py+2+Math.random()*14 };
  return { x: px+(Math.random()-0.5)*12, y: py+16+Math.random()*12 };
}

function updateAura(playerId, emoji, px, py, dt) {
  if (!auraParticles.has(playerId)) auraParticles.set(playerId, []);
  const parts = auraParticles.get(playerId);
  const dts = dt / 1000;
  switch (emoji) {
    case "\u{1F600}": { // 광기의 미소 — subtle golden sparkles
      for (let i = 0; i < 2; i++) {
        const bp = bodyPoint(px, py);
        const a = Math.atan2(bp.y-(py+5), bp.x-px);
        parts.push({ x:bp.x, y:bp.y, vx:Math.cos(a)*(25+Math.random()*30), vy:Math.sin(a)*(25+Math.random()*30), life:0.25+Math.random()*0.3, ml:0.55, color:Math.random()>0.3?"#FFD700":"#FFF176", size:1+Math.random()*1.5, t:"spark", gy:0 });
      }
      if (Math.random()<0.06) {
        parts.push({ x:px, y:py+5, vx:0, vy:0, life:0.3, ml:0.3, color:"#FFD700", size:0, t:"ring", gy:0 });
      }
      break;
    }
    case "\u{1F525}": { // 초사이언 — DBZ power-up body-hugging flame
      // Inner white-hot core flames (tight to body)
      for (let i = 0; i < 3; i++) {
        const bp = bodyPoint(px, py);
        parts.push({ x:bp.x, y:bp.y, vx:(bp.x-px)*0.6+(Math.random()-0.5)*5, vy:-55-Math.random()*35, life:0.12+Math.random()*0.12, ml:0.24, color:Math.random()>0.3?"#fff":"#fff9c4", size:2+Math.random()*2, t:"flame", gy:-65 });
      }
      // Outer aura flames (orange/red contour)
      for (let i = 0; i < 4; i++) {
        const bp = bodyPoint(px, py);
        const drift = (bp.x - px) * 0.8;
        parts.push({ x:bp.x, y:bp.y, vx:drift+(Math.random()-0.5)*8, vy:-45-Math.random()*30, life:0.18+Math.random()*0.2, ml:0.38, color:["#ffca28","#ffa726","#ff7043","#f44336"][Math.floor(Math.random()*4)], size:2.5+Math.random()*3, t:"flame", gy:-50 });
      }
      // Rising heat streaks from base
      if (Math.random()<0.4) {
        const ox = (Math.random()-0.5)*14;
        parts.push({ x:px+ox, y:py+26, vx:ox*0.3, vy:-80-Math.random()*30, life:0.1+Math.random()*0.1, ml:0.2, color:"#fff176", size:1.5+Math.random(), t:"streak", gy:0 });
      }
      break;
    }
    case "\u2764\uFE0F": { // 팜므파탈 — gentle hearts
      if (Math.random() < 0.5) {
        const bp = bodyPoint(px, py);
        const a = Math.atan2(bp.y-(py+5), bp.x-px);
        parts.push({ x:bp.x, y:bp.y, vx:Math.cos(a)*5+(Math.random()-0.5)*8, vy:-14-Math.random()*14, life:0.7+Math.random()*0.6, ml:1.3, color:Math.random()>0.4?"#ff4081":"#f50057", size:4+Math.random()*4, t:"heart", gy:0 });
      }
      if (Math.random()<0.08) {
        const a = Math.random()*Math.PI*2;
        parts.push({ x:px+Math.cos(a)*20, y:py+5+Math.sin(a)*12, vx:0, vy:0, life:2+Math.random(), ml:3, color:"#ff80ab", size:7+Math.random()*3, t:"orbit", a:a, r:18+Math.random()*8, cx:px, cy:py+5, spd:1.2+Math.random()*0.6, gy:0 });
      }
      break;
    }
    case "\u{1F622}": { // 분수 눈물 — fountain tears from both eyes
      for (let i = 0; i < 3; i++) {
        parts.push({ x:px-4, y:py-4, vx:-22-Math.random()*18, vy:-22-Math.random()*15, life:0.5+Math.random()*0.3, ml:0.8, color:Math.random()>0.5?"#42a5f5":"#90caf9", size:2+Math.random()*1.5, t:"tear", gy:85 });
      }
      for (let i = 0; i < 3; i++) {
        parts.push({ x:px+4, y:py-4, vx:22+Math.random()*18, vy:-22-Math.random()*15, life:0.5+Math.random()*0.3, ml:0.8, color:Math.random()>0.5?"#42a5f5":"#64b5f6", size:2+Math.random()*1.5, t:"tear", gy:85 });
      }
      break;
    }
    case "\u26A1": { // 초사이어인 — lightning bolts + sparks on body
      for (let i = 0; i < 5; i++) {
        const bp = bodyPoint(px, py);
        parts.push({ x:bp.x, y:bp.y, vx:(Math.random()-0.5)*90, vy:(Math.random()-0.5)*90, life:0.04+Math.random()*0.08, ml:0.12, color:Math.random()>0.4?"#FFEB3B":"#fff", size:1+Math.random()*2.5, t:"spark", gy:0 });
      }
      if (Math.random()<0.4) {
        parts.push({ x:px+(Math.random()-0.5)*14, y:py-12, vx:(Math.random()-0.5)*8, vy:-70-Math.random()*50, life:0.12+Math.random()*0.1, ml:0.22, color:"#FFD600", size:1.5, t:"streak", gy:0 });
      }
      break;
    }
  }
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.life -= dts;
    if (p.life <= 0) { parts.splice(i, 1); continue; }
    if (p.t === "orbit") { p.a += p.spd*dts; p.cx = px; p.cy = py+5; p.x = p.cx+Math.cos(p.a)*p.r; p.y = p.cy+Math.sin(p.a)*(p.r*0.6); }
    else if (p.t === "ring") { p.size += 65*dts; }
    else { p.x += p.vx*dts; p.y += p.vy*dts; if (p.gy) p.vy += p.gy*dts; }
  }
}

function drawAura(ctx, playerId, emoji, px, py) {
  const parts = auraParticles.get(playerId);
  if (!parts || parts.length === 0) return;
  ctx.save();
  // Base glow per type
  if (emoji === "\u{1F600}") {
    const g = ctx.createRadialGradient(px,py+5,4,px,py+5,22);
    g.addColorStop(0,"rgba(255,215,0,0.1)"); g.addColorStop(1,"rgba(255,215,0,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px,py+5,22,0,Math.PI*2); ctx.fill();
    // Crazy golden eyes overlay on face
    const bobY = Math.sin(Date.now()/250) * 1.5;
    ctx.save();
    ctx.shadowColor = "#FFD700"; ctx.shadowBlur = 5;
    ctx.fillStyle = "#FFD700";
    ctx.beginPath(); ctx.arc(px-4, py-5+bobY, 2.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(px+4, py-5+bobY, 2.5, 0, Math.PI*2); ctx.fill();
    // Wide maniacal grin
    ctx.strokeStyle = "#FFD700"; ctx.lineWidth = 1.5; ctx.shadowBlur = 4;
    ctx.beginPath(); ctx.arc(px, py+bobY, 6, 0.15*Math.PI, 0.85*Math.PI); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  } else if (emoji === "\u{1F525}") {
    // Outer orange aura
    const g1 = ctx.createRadialGradient(px,py+2,6,px,py-8,36);
    g1.addColorStop(0,"rgba(255,140,0,0.22)"); g1.addColorStop(0.5,"rgba(255,80,0,0.1)"); g1.addColorStop(1,"rgba(255,30,0,0)");
    ctx.fillStyle = g1; ctx.beginPath(); ctx.arc(px,py-2,36,0,Math.PI*2); ctx.fill();
    // Inner white-hot body glow
    const g2 = ctx.createRadialGradient(px,py+5,3,px,py+5,16);
    g2.addColorStop(0,"rgba(255,255,220,0.2)"); g2.addColorStop(1,"rgba(255,200,80,0)");
    ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(px,py+5,16,0,Math.PI*2); ctx.fill();
  } else if (emoji === "\u2764\uFE0F") {
    const g = ctx.createRadialGradient(px,py+5,4,px,py+5,24);
    g.addColorStop(0,"rgba(255,64,129,0.12)"); g.addColorStop(1,"rgba(255,64,129,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px,py+5,24,0,Math.PI*2); ctx.fill();
  } else if (emoji === "\u{1F622}") {
    ctx.globalAlpha = 0.3; ctx.strokeStyle = "#64b5f6"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(px-4,py-2); ctx.quadraticCurveTo(px-8,py+4,px-6,py+10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px+4,py-2); ctx.quadraticCurveTo(px+8,py+4,px+6,py+10); ctx.stroke();
    ctx.globalAlpha = 1;
  } else if (emoji === "\u26A1") {
    const fl = 0.15+Math.random()*0.12;
    const g = ctx.createRadialGradient(px,py+5,3,px,py+5,38);
    g.addColorStop(0,`rgba(255,235,59,${fl+0.15})`); g.addColorStop(0.5,`rgba(255,215,0,${fl})`); g.addColorStop(1,"rgba(255,215,0,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px,py+5,38,0,Math.PI*2); ctx.fill();
    drawBolts(ctx, px, py);
  }
  // Draw particles
  for (const p of parts) {
    const alpha = Math.max(0, p.life / p.ml);
    ctx.globalAlpha = alpha;
    switch (p.t) {
      case "spark": {
        ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.size*alpha,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(p.x,p.y,p.size*alpha*0.4,0,Math.PI*2); ctx.fill();
        break;
      }
      case "ring": {
        ctx.strokeStyle = p.color; ctx.lineWidth = 2.5*alpha; ctx.globalAlpha = alpha*0.4;
        ctx.beginPath(); ctx.arc(px,py+5,p.size,0,Math.PI*2); ctx.stroke();
        break;
      }
      case "flame": {
        const s = p.size*(0.3+alpha*0.7);
        ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x,p.y,s,0,Math.PI*2); ctx.fill();
        break;
      }
      case "heart": case "orbit": {
        ctx.font = `${Math.round(p.size*Math.max(0.3,alpha))}px serif`; ctx.textAlign="center"; ctx.textBaseline="middle";
        ctx.fillStyle = p.color; ctx.fillText("\u2764",p.x,p.y);
        break;
      }
      case "tear": {
        ctx.fillStyle = p.color; const s = p.size;
        ctx.beginPath(); ctx.moveTo(p.x,p.y-s*1.5);
        ctx.quadraticCurveTo(p.x+s,p.y,p.x,p.y+s);
        ctx.quadraticCurveTo(p.x-s,p.y,p.x,p.y-s*1.5); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.beginPath(); ctx.arc(p.x,p.y-s*0.3,s*0.4,0,Math.PI*2); ctx.fill();
        break;
      }
      case "streak": {
        ctx.strokeStyle = p.color; ctx.lineWidth = 2; ctx.globalAlpha = alpha*0.8;
        ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(p.x+p.vx*0.03,p.y+p.vy*0.03); ctx.stroke();
        break;
      }
    }
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawBolts(ctx, px, py) {
  const n = 2+Math.floor(Math.random()*3);
  for (let b = 0; b < n; b++) {
    const p1 = bodyPoint(px,py), p2 = bodyPoint(px,py);
    const segs = 3+Math.floor(Math.random()*4);
    const pts = [];
    for (let i = 0; i <= segs; i++) {
      const t = i/segs;
      pts.push({ x:p1.x+(p2.x-p1.x)*t+(i>0&&i<segs?(Math.random()-0.5)*16:0), y:p1.y+(p2.y-p1.y)*t+(i>0&&i<segs?(Math.random()-0.5)*16:0) });
    }
    ctx.strokeStyle = "rgba(255,235,59,0.5)"; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y);
    for (let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x,pts[i].y);
    ctx.stroke();
    ctx.strokeStyle = Math.random()>0.5?"#fff":"#FFEB3B"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y);
    for (let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x,pts[i].y);
    ctx.stroke();
  }
}

// ═══════════════════════════════════════════
//  STATUS OPTIONS
// ═══════════════════════════════════════════
var STATUS_OPTIONS = [
  { key: "working", emoji: "\uD83D\uDD28", label: "Working" },
  { key: "afk",     emoji: "\u2615",       label: "AFK" },
  { key: "oncall",  emoji: "\uD83D\uDCDE", label: "On Call" },
  { key: "gaming",  emoji: "\uD83C\uDFAE", label: "Gaming" },
  { key: "lunch",   emoji: "\uD83C\uDF7D\uFE0F", label: "Lunch" },
];
