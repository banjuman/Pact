// physics.js — Collision detection and A* pathfinding

function checkCollision(px, py) {
  const box = { x: px - 6, y: py + 16, w: 12, h: 12 };
  for (const w of WALLS) { if (aabb(box, w)) return true; }
  for (const f of FURNITURE) { if (f.noCollision) continue; if (aabb(box, f)) return true; }
  return false;
}
function aabb(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

const GRID_SIZE = 16;
var navGrid = null, navCols = 0, navRows = 0;

function buildNavGrid() {
  navCols = Math.ceil(MAP.width / GRID_SIZE);
  navRows = Math.ceil(MAP.height / GRID_SIZE);
  navGrid = new Uint8Array(navCols * navRows);
  for (let r = 0; r < navRows; r++) {
    for (let c = 0; c < navCols; c++) {
      const px = c * GRID_SIZE + GRID_SIZE / 2;
      const py = r * GRID_SIZE + GRID_SIZE / 2;
      navGrid[r * navCols + c] = checkCollision(px, py) ? 1 : 0;
    }
  }
}

// MinHeap for A*
class MinHeap {
  constructor() { this.d = []; }
  push(v) { this.d.push(v); let i = this.d.length - 1; while (i > 0) { const p = (i-1)>>1; if (this.d[i].f >= this.d[p].f) break; [this.d[i],this.d[p]]=[this.d[p],this.d[i]]; i=p; } }
  pop() { const t=this.d[0]; const l=this.d.pop(); if(this.d.length>0){this.d[0]=l;let i=0;const n=this.d.length;while(true){let m=i;const a=2*i+1,b=2*i+2;if(a<n&&this.d[a].f<this.d[m].f)m=a;if(b<n&&this.d[b].f<this.d[m].f)m=b;if(m===i)break;[this.d[i],this.d[m]]=[this.d[m],this.d[i]];i=m;}} return t; }
  get size() { return this.d.length; }
}

function findPath(sx, sy, ex, ey) {
  if (!navGrid) return null;
  let sc = Math.floor(sx / GRID_SIZE), sr = Math.floor(sy / GRID_SIZE);
  let ec = Math.floor(ex / GRID_SIZE), er = Math.floor(ey / GRID_SIZE);
  sc = Math.max(0, Math.min(navCols-1, sc)); sr = Math.max(0, Math.min(navRows-1, sr));
  ec = Math.max(0, Math.min(navCols-1, ec)); er = Math.max(0, Math.min(navRows-1, er));

  // If end blocked, find nearest walkable
  if (navGrid[er * navCols + ec]) {
    const alt = nearestWalkable(ec, er);
    if (!alt) return null;
    ec = alt.c; er = alt.r;
  }
  if (navGrid[sr * navCols + sc]) {
    const alt = nearestWalkable(sc, sr);
    if (!alt) return null;
    sc = alt.c; sr = alt.r;
  }

  const start = sr * navCols + sc, end = er * navCols + ec;
  if (start === end) return [{ x: ex, y: ey }];

  const DIRS = [[-1,0,10],[1,0,10],[0,-1,10],[0,1,10],[-1,-1,14],[1,-1,14],[-1,1,14],[1,1,14]];
  const total = navCols * navRows;
  const gScore = new Float32Array(total).fill(1e9);
  const cameFrom = new Int32Array(total).fill(-1);
  const closed = new Uint8Array(total);

  gScore[start] = 0;
  const open = new MinHeap();
  open.push({ idx: start, f: octile(sc, sr, ec, er) });

  while (open.size > 0) {
    const cur = open.pop();
    if (closed[cur.idx]) continue;
    if (cur.idx === end) {
      const path = [];
      let n = end;
      while (n !== start) {
        const pr = Math.floor(n / navCols), pc = n % navCols;
        path.unshift({ x: pc * GRID_SIZE + GRID_SIZE/2, y: pr * GRID_SIZE + GRID_SIZE/2 });
        n = cameFrom[n];
      }
      // Replace last waypoint with actual target
      if (path.length > 0) { path[path.length-1].x = ex; path[path.length-1].y = ey; }
      return simplifyPath(path);
    }
    closed[cur.idx] = 1;
    const cr = Math.floor(cur.idx / navCols), cc = cur.idx % navCols;

    for (const [dr, dc, cost] of DIRS) {
      const nr = cr + dr, nc = cc + dc;
      if (nr < 0 || nr >= navRows || nc < 0 || nc >= navCols) continue;
      const nIdx = nr * navCols + nc;
      if (closed[nIdx] || navGrid[nIdx]) continue;
      if (dr !== 0 && dc !== 0) {
        if (navGrid[cr * navCols + nc] || navGrid[nr * navCols + cc]) continue;
      }
      const tentG = gScore[cur.idx] + cost;
      if (tentG < gScore[nIdx]) {
        cameFrom[nIdx] = cur.idx;
        gScore[nIdx] = tentG;
        open.push({ idx: nIdx, f: tentG + octile(nc, nr, ec, er) });
      }
    }
  }
  return null;
}

function octile(c1, r1, c2, r2) {
  const dx = Math.abs(c2 - c1), dy = Math.abs(r2 - r1);
  return 10 * (dx + dy) - 6 * Math.min(dx, dy);
}

function nearestWalkable(tc, tr) {
  for (let rad = 1; rad < 30; rad++) {
    for (let dr = -rad; dr <= rad; dr++) {
      for (let dc = -rad; dc <= rad; dc++) {
        if (Math.abs(dr) !== rad && Math.abs(dc) !== rad) continue;
        const nr = tr + dr, nc = tc + dc;
        if (nr >= 0 && nr < navRows && nc >= 0 && nc < navCols && !navGrid[nr * navCols + nc])
          return { c: nc, r: nr };
      }
    }
  }
  return null;
}

function simplifyPath(path) {
  if (path.length <= 2) return path;
  const s = [path[0]];
  for (let i = 1; i < path.length - 1; i++) {
    const p = s[s.length - 1], n = path[i + 1];
    if ((path[i].x - p.x) !== (n.x - path[i].x) || (path[i].y - p.y) !== (n.y - path[i].y))
      s.push(path[i]);
  }
  s.push(path[path.length - 1]);
  return s;
}

function findJumpLanding(fromX, fromY, toX, toY) {
  const dx = toX - fromX, dy = toY - fromY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 1) return { x: fromX, y: fromY };
  const steps = Math.ceil(dist / 8);
  let lastX = fromX, lastY = fromY;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const px = fromX + dx * t, py = fromY + dy * t;
    if (checkCollision(px, py)) break;
    lastX = px; lastY = py;
  }
  return { x: lastX, y: lastY };
}
