// ui.js — Entry screen, HUD, emoji/status buttons, canvas resize

var selectedCharacter = 0;

function setupEntryScreen() {
  const container = document.getElementById("character-select");
  CHARACTERS.forEach((ch, i) => {
    const canvas = document.createElement("canvas");
    canvas.className = "char-preview" + (i === 0 ? " selected" : "");
    canvas.width = 52; canvas.height = 64;
    container.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    drawCharacter(ctx, 26, 34, i, "down", "", false, 0);
    canvas.addEventListener("click", () => {
      selectedCharacter = i;
      document.querySelectorAll(".char-preview").forEach(c => c.classList.remove("selected"));
      canvas.classList.add("selected");
    });
  });
  document.getElementById("join-btn").addEventListener("click", joinRoom);
  document.getElementById("name-input").addEventListener("keydown", (e) => { if (e.key === "Enter") joinRoom(); });
}

// ═══════════════════════════════════════════
//  EMOJI TOGGLE
// ═══════════════════════════════════════════
document.querySelectorAll(".emoji-btn").forEach(btn => {
  if (btn.id === "throw-btn" || btn.id === "vacuum-btn" || btn.dataset.status) return;
  btn.addEventListener("click", () => {
    if (socket) socket.emit("emoji-toggle", { emoji: btn.dataset.emoji });
  });
});

function updateEmojiButtons() {
  const myEmoji = localPlayer ? localPlayer.activeEmoji : null;
  document.querySelectorAll(".emoji-btn").forEach(btn => {
    if (btn.id === "throw-btn" || btn.id === "vacuum-btn" || btn.dataset.status) return;
    btn.classList.toggle("emoji-active", btn.dataset.emoji === myEmoji);
  });
}

// ═══════════════════════════════════════════
//  STATUS BADGES
// ═══════════════════════════════════════════
document.querySelectorAll(".emoji-btn[data-status]").forEach(btn => {
  btn.addEventListener("click", () => {
    if (socket) socket.emit("status-change", { status: btn.dataset.status });
  });
});

function updateStatusButtons() {
  const myStatus = localPlayer ? localPlayer.activeStatus : null;
  document.querySelectorAll(".emoji-btn[data-status]").forEach(btn => {
    btn.classList.toggle("status-active", btn.dataset.status === myStatus);
  });
}

// ═══════════════════════════════════════════
//  HUD
// ═══════════════════════════════════════════
function updateHUD() {
  const count = remotePlayers.size + 1;
  document.getElementById("hud-players").textContent = count;
  const dot = document.getElementById("hud-dot");
  if (dot) dot.className = count > 0 ? "online" : "";
}

// ═══════════════════════════════════════════
//  CANVAS RESIZE
// ═══════════════════════════════════════════
function resizeCanvas() {
  const canvas = document.getElementById("game-canvas");
  const dpr = window.devicePixelRatio || 1;
  // Let CSS (width:100%; height:100%) control display size — never set inline styles
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (w > 0 && h > 0) {
    canvas.width = w * dpr; canvas.height = h * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr); ctx.imageSmoothingEnabled = false;
  }
}
window.addEventListener("resize", () => {
  if (gameRunning) requestAnimationFrame(resizeCanvas);
});
