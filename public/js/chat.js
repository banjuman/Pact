// chat.js — Chat system, popup window, message display

var chatPopupWindow = null;
function openChatPopup() {
  if (chatPopupWindow && !chatPopupWindow.closed) { chatPopupWindow.focus(); return; }
  chatPopupWindow = window.open("", "PactChat", "width=360,height=600,resizable=yes");
  if (!chatPopupWindow) return;
  const doc = chatPopupWindow.document;
  doc.write(`<!DOCTYPE html><html><head><title>Pact Chat</title><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#1a1a2e;color:#fff;font-family:'Segoe UI',system-ui,sans-serif;display:flex;flex-direction:column;height:100vh}
    #msgs{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:5px}
    #msgs::-webkit-scrollbar{width:4px}#msgs::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:2px}
    .m{font-size:13px;line-height:1.4;color:rgba(255,255,255,0.85);word-break:break-word}
    .m .n{font-weight:700}
    .m.s{color:rgba(255,255,255,0.35);font-style:italic;font-size:12px}
    #iw{padding:10px;border-top:1px solid rgba(255,255,255,0.08)}
    #inp{width:100%;padding:10px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.06);color:#fff;font-size:13px;outline:none}
    #inp:focus{border-color:rgba(255,255,255,0.25)}
  </style></head><body><div id="msgs"></div><div id="iw"><input id="inp" placeholder="Type a message..." maxlength="500" autocomplete="off"/></div></body></html>`);
  doc.close();
  // Copy existing messages
  const msgs = document.getElementById("chat-messages");
  const popMsgs = doc.getElementById("msgs");
  for (const child of msgs.children) { const cl = child.cloneNode(true); cl.className = child.classList.contains("system") ? "m s" : "m"; popMsgs.appendChild(cl); }
  popMsgs.scrollTop = 999999;
  // Input handler
  doc.getElementById("inp").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.isComposing) {
      const text = e.target.value.trim();
      if (text && socket) { socket.emit("chat-message", { text }); e.target.value = ""; }
    }
  });
  chatPopupWindow.addEventListener("beforeunload", () => { chatPopupWindow = null; if (gameRunning) document.getElementById("chat-panel").style.display = "flex"; });
  // Hide main chat
  document.getElementById("chat-panel").style.display = "none";
}
function pushToPopup(name, text, color, isSystem) {
  if (!chatPopupWindow || chatPopupWindow.closed) return;
  const doc = chatPopupWindow.document;
  const msgs = doc.getElementById("msgs");
  if (!msgs) return;
  const div = doc.createElement("div"); div.className = isSystem ? "m s" : "m";
  if (isSystem) { div.textContent = text; }
  else { const n = doc.createElement("span"); n.className = "n"; n.style.color = color; n.textContent = name; div.appendChild(n); div.appendChild(doc.createTextNode(": " + text)); }
  msgs.appendChild(div); msgs.scrollTop = 999999;
}

function addChatMessage(senderId, name, text, isSelf) {
  const color = getPlayerColor(senderId);
  const div = document.createElement("div"); div.className = "chat-msg";
  const nameSpan = document.createElement("span"); nameSpan.className = "chat-name"; nameSpan.style.color = color; nameSpan.textContent = name;
  div.appendChild(nameSpan); div.appendChild(document.createTextNode(": " + text));
  document.getElementById("chat-messages").appendChild(div);
  document.getElementById("chat-messages").scrollTop = 999999;
  pushToPopup(name, text, color, false);
}
function addSystemMessage(text) {
  const div = document.createElement("div"); div.className = "chat-msg system"; div.textContent = text;
  document.getElementById("chat-messages").appendChild(div);
  document.getElementById("chat-messages").scrollTop = 999999;
  pushToPopup("", text, "", true);
}

document.getElementById("chat-input").addEventListener("keydown", (e) => {
  e.stopPropagation();
  if (e.key === "Enter" && !e.isComposing) {
    const text = e.target.value.trim();
    if (text && socket) { socket.emit("chat-message", { text }); e.target.value = ""; }
  }
  if (e.key === "Escape") e.target.blur();
});
