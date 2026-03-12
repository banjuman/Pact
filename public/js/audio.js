// audio.js — Sound effects and speech synthesis

var audioCtx = null;
function playNotificationSound() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.frequency.setValueAtTime(1100, audioCtx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.start(audioCtx.currentTime); osc.stop(audioCtx.currentTime + 0.2);
  } catch (e) {}
}
function playThrowSound() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.start(audioCtx.currentTime); osc.stop(audioCtx.currentTime + 0.2);
  } catch (e) {}
}
function playLandSound() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const o1 = audioCtx.createOscillator(); const g1 = audioCtx.createGain();
    o1.connect(g1); g1.connect(audioCtx.destination); o1.type = "sine";
    o1.frequency.setValueAtTime(120, audioCtx.currentTime);
    o1.frequency.setValueAtTime(80, audioCtx.currentTime + 0.05);
    g1.gain.setValueAtTime(0.2, audioCtx.currentTime);
    g1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    o1.start(audioCtx.currentTime); o1.stop(audioCtx.currentTime + 0.15);
    const o2 = audioCtx.createOscillator(); const g2 = audioCtx.createGain();
    o2.connect(g2); g2.connect(audioCtx.destination); o2.type = "sine";
    o2.frequency.setValueAtTime(400, audioCtx.currentTime + 0.08);
    o2.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.25);
    g2.gain.setValueAtTime(0.08, audioCtx.currentTime + 0.08);
    g2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    o2.start(audioCtx.currentTime + 0.08); o2.stop(audioCtx.currentTime + 0.3);
  } catch (e) {}
}
function playHitSound() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.setValueAtTime(150, audioCtx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
    osc.start(audioCtx.currentTime); osc.stop(audioCtx.currentTime + 0.12);
  } catch (e) {}
}

function playJoinSound() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(523, audioCtx.currentTime);
    osc.frequency.setValueAtTime(659, audioCtx.currentTime + 0.08);
    osc.frequency.setValueAtTime(784, audioCtx.currentTime + 0.16);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
    osc.start(audioCtx.currentTime); osc.stop(audioCtx.currentTime + 0.35);
  } catch (e) {}
}

function playFootstep() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const bufSize = Math.floor(audioCtx.sampleRate * 0.04); // 40ms
    const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.3));
    }
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.07, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    const filter = audioCtx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 600 + Math.random() * 200;
    filter.Q.value = 1.5;
    src.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
    src.start(); src.stop(audioCtx.currentTime + 0.05);
  } catch (e) {}
}

function playSlapSound() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const bufSize = Math.floor(audioCtx.sampleRate * 0.06);
    const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.08));
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
    const filter = audioCtx.createBiquadFilter();
    filter.type = "bandpass"; filter.frequency.value = 1200; filter.Q.value = 1;
    src.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
    src.start(); src.stop(audioCtx.currentTime + 0.08);
  } catch (e) {}
}

var vacuumSoundNodes = null;
function playVacuumSound() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    // Cute, gentle machine hum — soft sine waves with wobble
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    osc1.type = "sine"; osc1.frequency.value = 200;
    osc2.type = "sine"; osc2.frequency.value = 300;
    lfo.type = "sine"; lfo.frequency.value = 5;
    lfoGain.gain.value = 6;
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    osc1.connect(gain); osc2.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.value = 0.012;
    osc1.start(); osc2.start(); lfo.start();
    vacuumSoundNodes = { osc1, osc2, lfo, gain };
  } catch (e) {}
}
function stopVacuumSound() {
  if (!vacuumSoundNodes) return;
  try {
    vacuumSoundNodes.gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.4);
    const nodes = vacuumSoundNodes;
    vacuumSoundNodes = null;
    setTimeout(() => { try { nodes.osc1.stop(); nodes.osc2.stop(); nodes.lfo.stop(); } catch(e) {} }, 500);
  } catch (e) { vacuumSoundNodes = null; }
}

function speakCompletion() {
  try {
    const u = new SpeechSynthesisUtterance("취사가 완료되었습니다.");
    u.lang = "ko-KR";
    u.pitch = 1.3;
    u.rate = 0.95;
    u.volume = 0.8;
    const voices = speechSynthesis.getVoices();
    const kf = voices.find(v => v.lang.startsWith("ko") && /female|여|yuna|sunhi/i.test(v.name));
    const k = voices.find(v => v.lang.startsWith("ko"));
    if (kf) u.voice = kf;
    else if (k) u.voice = k;
    speechSynthesis.speak(u);
  } catch (e) {}
}
// Pre-load voices
if (typeof speechSynthesis !== "undefined") speechSynthesis.getVoices();
