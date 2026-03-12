// map.js — Map data, zones, walls, furniture, characters

var CHARACTERS = [
  { name: "Alex",    skin: "#f4c794", body: "#4a90d9", hair: "#3a2a1a", hairStyle: "short",    accessory: "none" },
  { name: "Jordan",  skin: "#8d5524", body: "#e74c3c", hair: "#1a1a1a", hairStyle: "curly",    accessory: "glasses" },
  { name: "Sam",     skin: "#ffe0bd", body: "#2ecc71", hair: "#c2883a", hairStyle: "long",     accessory: "headphones" },
  { name: "Riley",   skin: "#c68642", body: "#f39c12", hair: "#1a1a1a", hairStyle: "ponytail", accessory: "bow" },
  { name: "Casey",   skin: "#f4c794", body: "#9b59b6", hair: "#e74c3c", hairStyle: "spiky",    accessory: "hat" },
  { name: "Morgan",  skin: "#d4a574", body: "#e91e63", hair: "#8B4513", hairStyle: "bob",      accessory: "earrings" },
  { name: "Taylor",  skin: "#6b4226", body: "#00bcd4", hair: "#1a1a1a", hairStyle: "afro",     accessory: "bandana" },
  { name: "Drew",    skin: "#ffe0bd", body: "#ff5722", hair: "#333",    hairStyle: "buzz",     accessory: "scarf" },
  { name: "Quinn",   skin: "#f4c794", body: "#607d8b", hair: "#c0c0c0", hairStyle: "wavy",     accessory: "none" },
  { name: "Avery",   skin: "#8d5524", body: "#1a237e", hair: "#1a1a1a", hairStyle: "braids",   accessory: "beanie" },
];

// ═══════════════════════════════════════════
//  MAP - Modern Office (1600 x 1000)
// ═══════════════════════════════════════════
var MAP = { width: 2400, height: 1600, tileSize: 32 };

// Jail zone bounds (matches server.js)
var JAIL = { x: 1796, y: 794, w: 590, h: 792 };

var FLOOR_ZONES = [
  // Top row
  { x: 14,   y: 14,  w: 580, h: 680, color: "#ede5d8" },  // 사무실
  { x: 608,  y: 14,  w: 580, h: 680, color: "#dce3ed" },  // 휴게실
  { x: 1202, y: 14,  w: 580, h: 680, color: "#ddd5e5" },  // 침실
  { x: 1796, y: 14,  w: 590, h: 680, color: "#d5e8e0" },  // 온천
  // Corridor
  { x: 14,   y: 694, w: 2372, h: 100, color: "#e8e4de" }, // 복도
  // Bottom row
  { x: 14,   y: 794, w: 580, h: 792, color: "#e5dcd0" },  // 유흥업소
  { x: 608,  y: 794, w: 580, h: 792, color: "#e5e5e0" },  // 식당
  { x: 1202, y: 794, w: 580, h: 792, color: "#d8e5d0" },  // 숲
  { x: 1796, y: 794, w: 590, h: 792, color: "#e0d5d5" },  // 감옥
];

var ZONE_LABELS = [
  { text: "사무실",  x: 304,  y: 354 },
  { text: "휴게실",  x: 898,  y: 354 },
  { text: "침실",    x: 1492, y: 354 },
  { text: "온천",    x: 2091, y: 354 },
  { text: "유흥업소", x: 304,  y: 1190 },
  { text: "식당",    x: 898,  y: 1190 },
  { text: "숲",      x: 1492, y: 1190 },
  { text: "감옥",    x: 2091, y: 1190 },
];

var WALLS = [
  // Outer walls
  { x: 0, y: 0, w: 2400, h: 14 },
  { x: 0, y: 1586, w: 2400, h: 14 },
  { x: 0, y: 0, w: 14, h: 1600 },
  { x: 2386, y: 0, w: 14, h: 1600 },
  // Top row vertical walls (100px doorway centered ~y=354, so 304..404)
  { x: 594,  y: 14, w: 14, h: 290 }, { x: 594,  y: 404, w: 14, h: 290 },  // 사무실/휴게실
  { x: 1188, y: 14, w: 14, h: 290 }, { x: 1188, y: 404, w: 14, h: 290 }, // 휴게실/침실
  { x: 1782, y: 14, w: 14, h: 290 }, { x: 1782, y: 404, w: 14, h: 290 }, // 침실/온천
  // Bottom row vertical walls (100px doorway centered ~y=1190, so 1140..1240)
  { x: 594,  y: 794, w: 14, h: 346 }, { x: 594,  y: 1240, w: 14, h: 346 }, // 유흥업소/식당
  { x: 1188, y: 794, w: 14, h: 346 }, { x: 1188, y: 1240, w: 14, h: 346 }, // 식당/숲
  // 숲/감옥 — fully sealed (no doorway)
  { x: 1782, y: 794, w: 14, h: 792 },
];

var FURNITURE = [
  // ══════ 사무실 (Office) x=14~594, y=14~694 ══════
  { type: "modern_desk",  x: 50,  y: 52,  w: 100, h: 50 },
  { type: "modern_desk",  x: 50,  y: 165, w: 100, h: 50 },
  { type: "modern_desk",  x: 50,  y: 279, w: 100, h: 50 },
  { type: "modern_desk",  x: 180, y: 52,  w: 100, h: 50 },
  { type: "modern_desk",  x: 180, y: 165, w: 100, h: 50 },
  { type: "modern_desk",  x: 180, y: 279, w: 100, h: 50 },
  { type: "modern_desk",  x: 310, y: 52,  w: 100, h: 50 },
  { type: "modern_desk",  x: 310, y: 165, w: 100, h: 50 },
  { type: "modern_desk",  x: 310, y: 279, w: 100, h: 50 },
  { type: "office_chair", x: 70,  y: 90,  w: 22, h: 22 },
  { type: "office_chair", x: 70,  y: 203, w: 22, h: 22 },
  { type: "office_chair", x: 70,  y: 316, w: 22, h: 22 },
  { type: "office_chair", x: 200, y: 90,  w: 22, h: 22 },
  { type: "office_chair", x: 200, y: 203, w: 22, h: 22 },
  { type: "office_chair", x: 200, y: 316, w: 22, h: 22 },
  { type: "office_chair", x: 331, y: 90,  w: 22, h: 22 },
  { type: "office_chair", x: 331, y: 203, w: 22, h: 22 },
  { type: "office_chair", x: 331, y: 316, w: 22, h: 22 },
  { type: "standing_desk", x: 420, y: 68,  w: 70, h: 40 },
  { type: "standing_desk", x: 420, y: 194, w: 70, h: 40 },
  { type: "standing_desk", x: 420, y: 320, w: 70, h: 40 },
  { type: "modern_desk",  x: 50,  y: 446, w: 100, h: 50 },
  { type: "modern_desk",  x: 50,  y: 560, w: 100, h: 50 },
  { type: "modern_desk",  x: 180, y: 446, w: 100, h: 50 },
  { type: "modern_desk",  x: 180, y: 560, w: 100, h: 50 },
  { type: "modern_desk",  x: 310, y: 446, w: 100, h: 50 },
  { type: "modern_desk",  x: 310, y: 560, w: 100, h: 50 },
  { type: "office_chair", x: 70,  y: 484, w: 22, h: 22 },
  { type: "office_chair", x: 70,  y: 598, w: 22, h: 22 },
  { type: "office_chair", x: 200, y: 484, w: 22, h: 22 },
  { type: "office_chair", x: 200, y: 598, w: 22, h: 22 },
  { type: "office_chair", x: 331, y: 484, w: 22, h: 22 },
  { type: "office_chair", x: 331, y: 598, w: 22, h: 22 },
  { type: "standing_desk", x: 420, y: 446, w: 70, h: 40 },
  { type: "standing_desk", x: 420, y: 560, w: 70, h: 40 },
  { type: "whiteboard",   x: 124, y: 396, w: 160, h: 12 },
  { type: "phone_booth",  x: 497, y: 68,  w: 60, h: 70 },
  { type: "phone_booth",  x: 497, y: 169, w: 60, h: 70 },
  { type: "conf_table",   x: 124, y: 620, w: 220, h: 60 },
  { type: "plant_big",    x: 23,  y: 24,  w: 30, h: 30 },
  { type: "plant_big",    x: 552, y: 24,  w: 30, h: 30 },
  { type: "plant_small",  x: 552, y: 320, w: 22, h: 22 },

  // ══════ 휴게실 (Lounge) x=608~1188, y=14~694 ══════
  { type: "tv_wall",      x: 639, y: 18,  w: 100, h: 12 },
  { type: "tv_stand",     x: 639, y: 30,  w: 100, h: 28 },
  { type: "sofa",         x: 627, y: 68,  w: 140, h: 50 },
  { type: "sofa",         x: 627, y: 163, w: 140, h: 50 },
  { type: "coffee_table", x: 639, y: 112, w: 100, h: 55 },
  { type: "pingpong",     x: 793, y: 68,  w: 120, h: 70 },
  { type: "arcade",       x: 911, y: 56,  w: 48,  h: 44 },
  { type: "arcade",       x: 947, y: 56,  w: 48,  h: 44 },
  { type: "beanbag",      x: 793, y: 182, w: 40,  h: 40 },
  { type: "beanbag",      x: 840, y: 182, w: 40,  h: 40 },
  { type: "beanbag",      x: 887, y: 182, w: 40,  h: 40 },
  { type: "sofa",         x: 627, y: 320, w: 140, h: 50 },
  { type: "sofa",         x: 627, y: 415, w: 140, h: 50 },
  { type: "coffee_table", x: 639, y: 364, w: 100, h: 55 },
  { type: "pingpong",     x: 793, y: 320, w: 120, h: 70 },
  { type: "beanbag",      x: 793, y: 434, w: 40,  h: 40 },
  { type: "beanbag",      x: 840, y: 434, w: 40,  h: 40 },
  { type: "arcade",       x: 911, y: 320, w: 48,  h: 44 },
  { type: "sofa",         x: 627, y: 541, w: 140, h: 50 },
  { type: "beanbag",      x: 887, y: 434, w: 40,  h: 40 },
  { type: "plant_big",    x: 1154, y: 24,  w: 30, h: 30 },
  { type: "plant_big",    x: 1154, y: 655, w: 30, h: 30 },
  { type: "rug",          x: 621, y: 56,  w: 180, h: 160, noCollision: true },
  { type: "rug",          x: 775, y: 163, w: 160, h: 110, noCollision: true },

  // ══════ 침실 (Bedroom) x=1202~1782, y=14~694 ══════
  { type: "bed",          x: 1236, y: 56,  w: 120, h: 65 },
  { type: "bed",          x: 1236, y: 156, w: 120, h: 65 },
  { type: "bed",          x: 1236, y: 257, w: 120, h: 65 },
  { type: "bed",          x: 1236, y: 358, w: 120, h: 65 },
  { type: "bed",          x: 1402, y: 56,  w: 120, h: 65 },
  { type: "bed",          x: 1402, y: 156, w: 120, h: 65 },
  { type: "bed",          x: 1402, y: 257, w: 120, h: 65 },
  { type: "bed",          x: 1402, y: 358, w: 120, h: 65 },
  { type: "nightstand",   x: 1325, y: 68,  w: 40, h: 30 },
  { type: "nightstand",   x: 1325, y: 169, w: 40, h: 30 },
  { type: "nightstand",   x: 1325, y: 270, w: 40, h: 30 },
  { type: "nightstand",   x: 1325, y: 371, w: 40, h: 30 },
  { type: "bookshelf",    x: 1236, y: 459, w: 100, h: 28 },
  { type: "bookshelf",    x: 1402, y: 459, w: 100, h: 28 },
  { type: "bookshelf",    x: 1556, y: 459, w: 100, h: 28 },
  { type: "bed",          x: 1236, y: 522, w: 120, h: 65 },
  { type: "bed",          x: 1236, y: 610, w: 120, h: 65 },
  { type: "bed",          x: 1402, y: 522, w: 120, h: 65 },
  { type: "bed",          x: 1402, y: 610, w: 120, h: 65 },
  { type: "nightstand",   x: 1325, y: 534, w: 40, h: 30 },
  { type: "nightstand",   x: 1325, y: 623, w: 40, h: 30 },
  { type: "plant_big",    x: 1751, y: 24,  w: 30, h: 30 },
  { type: "rug",          x: 1230, y: 43,  w: 200, h: 130, noCollision: true },
  { type: "rug",          x: 1390, y: 43,  w: 200, h: 130, noCollision: true },

  // ══════ 온천 (Hot Spring) x=1796~2386, y=14~694 ══════
  { type: "hot_spring_pool", x: 1858, y: 100, w: 240, h: 170 },
  { type: "hot_spring_pool", x: 1858, y: 380, w: 240, h: 170 },
  { type: "rock",         x: 1828, y: 81,  w: 40, h: 35 },
  { type: "rock",         x: 2049, y: 87,  w: 35, h: 30 },
  { type: "rock",         x: 1828, y: 310, w: 40, h: 35 },
  { type: "rock",         x: 2049, y: 340, w: 35, h: 30 },
  { type: "rock",         x: 1918, y: 580, w: 45, h: 35 },
  { type: "towel_rack",   x: 2108, y: 131, w: 35, h: 50 },
  { type: "towel_rack",   x: 2108, y: 420, w: 35, h: 50 },
  { type: "wooden_fence", x: 1810, y: 24,  w: 120, h: 14 },
  { type: "wooden_fence", x: 1810, y: 340, w: 120, h: 14 },
  { type: "wooden_fence", x: 2168, y: 24,  w: 120, h: 14 },
  { type: "wooden_fence", x: 2168, y: 340, w: 120, h: 14 },
  { type: "bench_park",   x: 2108, y: 310, w: 70,  h: 30 },
  { type: "plant_big",    x: 2345, y: 24,  w: 30, h: 30 },
  { type: "plant_big",    x: 2345, y: 655, w: 30, h: 30 },

  // ══════ 유흥업소 (Entertainment) x=14~594, y=794~1586 ══════
  { type: "bar_counter",  x: 35,  y: 818,  w: 200, h: 40 },
  { type: "bar_counter",  x: 35,  y: 1060, w: 200, h: 40 },
  { type: "stool",        x: 38,  y: 852,  w: 18, h: 18 },
  { type: "stool",        x: 70,  y: 852,  w: 18, h: 18 },
  { type: "stool",        x: 102, y: 852,  w: 18, h: 18 },
  { type: "stool",        x: 134, y: 852,  w: 18, h: 18 },
  { type: "stool",        x: 166, y: 852,  w: 18, h: 18 },
  { type: "stool",        x: 38,  y: 1094, w: 18, h: 18 },
  { type: "stool",        x: 70,  y: 1094, w: 18, h: 18 },
  { type: "stool",        x: 102, y: 1094, w: 18, h: 18 },
  { type: "stool",        x: 134, y: 1094, w: 18, h: 18 },
  { type: "stool",        x: 166, y: 1094, w: 18, h: 18 },
  { type: "karaoke_booth", x: 254, y: 825, w: 100, h: 80 },
  { type: "karaoke_booth", x: 373, y: 825, w: 100, h: 80 },
  { type: "pool_table",   x: 225, y: 987,  w: 130, h: 75 },
  { type: "dart_board",   x: 485, y: 812,  w: 40,  h: 40 },
  { type: "dart_board",   x: 527, y: 812,  w: 40,  h: 40 },
  { type: "disco_ball",   x: 296, y: 940,  w: 30,  h: 30, noCollision: true },
  { type: "sofa",         x: 35,  y: 1165, w: 140, h: 50 },
  { type: "sofa",         x: 35,  y: 1265, w: 140, h: 50 },
  { type: "coffee_table", x: 47,  y: 1210, w: 100, h: 55 },
  { type: "beanbag",      x: 420, y: 1165, w: 40,  h: 40 },
  { type: "beanbag",      x: 467, y: 1165, w: 40,  h: 40 },
  { type: "arcade",       x: 485, y: 1001, w: 48,  h: 44 },
  { type: "arcade",       x: 527, y: 1001, w: 48,  h: 44 },
  { type: "plant_big",    x: 23,  y: 1555, w: 30, h: 30 },

  // ══════ 식당 (Restaurant) x=608~1188, y=794~1586 ══════
  { type: "counter_long",   x: 621, y: 812,  w: 200, h: 36 },
  { type: "coffee_machine", x: 751, y: 812,  w: 44,  h: 36 },
  { type: "fridge",         x: 787, y: 809,  w: 40,  h: 44 },
  { type: "vending",        x: 822, y: 809,  w: 44,  h: 44 },
  { type: "microwave",      x: 858, y: 813,  w: 36,  h: 30 },
  { type: "counter_long",   x: 935, y: 812,  w: 200, h: 36 },
  { type: "dining_table",   x: 639, y: 920,  w: 90, h: 50 },
  { type: "dining_table",   x: 639, y: 1035, w: 90, h: 50 },
  { type: "dining_table",   x: 639, y: 1150, w: 90, h: 50 },
  { type: "dining_table",   x: 787, y: 920,  w: 90, h: 50 },
  { type: "dining_table",   x: 787, y: 1035, w: 90, h: 50 },
  { type: "dining_table",   x: 787, y: 1150, w: 90, h: 50 },
  { type: "dining_table",   x: 935, y: 920,  w: 90, h: 50 },
  { type: "dining_table",   x: 935, y: 1035, w: 90, h: 50 },
  { type: "stool",  x: 633,  y: 960,  w: 18, h: 18 },
  { type: "stool",  x: 658,  y: 960,  w: 18, h: 18 },
  { type: "stool",  x: 683,  y: 960,  w: 18, h: 18 },
  { type: "stool",  x: 633,  y: 1075, w: 18, h: 18 },
  { type: "stool",  x: 658,  y: 1075, w: 18, h: 18 },
  { type: "stool",  x: 683,  y: 1075, w: 18, h: 18 },
  { type: "stool",  x: 633,  y: 1190, w: 18, h: 18 },
  { type: "stool",  x: 658,  y: 1190, w: 18, h: 18 },
  { type: "stool",  x: 683,  y: 1190, w: 18, h: 18 },
  { type: "stool",  x: 781,  y: 960,  w: 18, h: 18 },
  { type: "stool",  x: 806,  y: 960,  w: 18, h: 18 },
  { type: "stool",  x: 831,  y: 960,  w: 18, h: 18 },
  { type: "stool",  x: 781,  y: 1075, w: 18, h: 18 },
  { type: "stool",  x: 806,  y: 1075, w: 18, h: 18 },
  { type: "stool",  x: 831,  y: 1075, w: 18, h: 18 },
  { type: "stool",  x: 929,  y: 960,  w: 18, h: 18 },
  { type: "stool",  x: 954,  y: 960,  w: 18, h: 18 },
  { type: "stool",  x: 979,  y: 960,  w: 18, h: 18 },
  { type: "stool",  x: 929,  y: 1075, w: 18, h: 18 },
  { type: "stool",  x: 954,  y: 1075, w: 18, h: 18 },
  { type: "stool",  x: 979,  y: 1075, w: 18, h: 18 },
  { type: "plant_big", x: 1154, y: 805,  w: 30, h: 30 },
  { type: "plant_big", x: 1154, y: 1555, w: 30, h: 30 },

  // ══════ 숲 (Forest) x=1202~1782, y=794~1586 ══════
  { type: "tree",       x: 1248, y: 839,  w: 50, h: 60 },
  { type: "tree",       x: 1331, y: 825,  w: 50, h: 60 },
  { type: "tree",       x: 1426, y: 852,  w: 50, h: 60 },
  { type: "tree",       x: 1515, y: 832,  w: 50, h: 60 },
  { type: "tree",       x: 1603, y: 845,  w: 50, h: 60 },
  { type: "tree",       x: 1692, y: 839,  w: 50, h: 60 },
  { type: "tree",       x: 1272, y: 994,  w: 50, h: 60 },
  { type: "tree",       x: 1396, y: 1008, w: 50, h: 60 },
  { type: "tree",       x: 1538, y: 981,  w: 50, h: 60 },
  { type: "tree",       x: 1657, y: 1001, w: 50, h: 60 },
  { type: "tree",       x: 1301, y: 1163, w: 50, h: 60 },
  { type: "tree",       x: 1455, y: 1183, w: 50, h: 60 },
  { type: "tree",       x: 1574, y: 1150, w: 50, h: 60 },
  { type: "tree",       x: 1716, y: 1170, w: 50, h: 60 },
  { type: "tree",       x: 1367, y: 1332, w: 50, h: 60 },
  { type: "tree",       x: 1515, y: 1345, w: 50, h: 60 },
  { type: "tree",       x: 1633, y: 1319, w: 50, h: 60 },
  { type: "bush",       x: 1236, y: 927,  w: 35, h: 28 },
  { type: "bush",       x: 1378, y: 940,  w: 35, h: 28 },
  { type: "bush",       x: 1479, y: 1095, w: 35, h: 28 },
  { type: "bush",       x: 1627, y: 1075, w: 35, h: 28 },
  { type: "bush",       x: 1301, y: 1264, w: 35, h: 28 },
  { type: "bush",       x: 1538, y: 1251, w: 35, h: 28 },
  { type: "bush",       x: 1686, y: 1264, w: 35, h: 28 },
  { type: "bush",       x: 1420, y: 1433, w: 35, h: 28 },
  { type: "bench_park", x: 1390, y: 933,  w: 70, h: 30 },
  { type: "bench_park", x: 1568, y: 1068, w: 70, h: 30 },
  { type: "bench_park", x: 1331, y: 1399, w: 70, h: 30 },
  { type: "plant_small", x: 1290, y: 893,  w: 22, h: 22 },
  { type: "plant_small", x: 1467, y: 1028, w: 22, h: 22 },
  { type: "plant_small", x: 1615, y: 1231, w: 22, h: 22 },

  // ══════ 감옥 (Jail) x=1796~2386, y=794~1586 ══════
  { type: "jail_bench", x: 1888, y: 933,  w: 80, h: 28 },
  { type: "jail_bench", x: 2049, y: 933,  w: 80, h: 28 },
  { type: "jail_bench", x: 1888, y: 1136, w: 80, h: 28 },
  { type: "jail_bench", x: 2049, y: 1136, w: 80, h: 28 },
  { type: "jail_bench", x: 1965, y: 1339, w: 80, h: 28 },
];

// All furniture is throwable — originals fly at full size and land at new position
var FURN_NO_THROW = new Set(["rug"]); // skip rugs
