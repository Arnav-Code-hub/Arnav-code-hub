// Builds every profile image from profile.json.
// Usage: node scripts/generate.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p));
const write = (p, s) => {
  mkdirSync(dirname(join(root, p)), { recursive: true });
  if (p.endsWith(".svg")) s = optimizeSvg(s);
  writeFileSync(join(root, p), s);
  console.log("wrote", p);
};
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const profile = JSON.parse(read("profile.json"));

// ---------- palette and shared filters ----------
const C = {
  ink: "#1b1714",
  ink2: "#2a231e",
  paper: "#ebe2d1",
  paperText: "#efe6d6",
  red: "#a3241b",
  red2: "#b3261e",
  gold: "#c9a227",
  muted: "#6b5f50",
};
const SERIF = "Georgia,'Times New Roman',serif";
const DISPLAY = "'Cinzel','Trajan Pro',Georgia,'Times New Roman',serif";

const filters = `
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="7" stitchTiles="stitch"/>
      <feColorMatrix values="0 0 0 0 0.33  0 0 0 0 0.26  0 0 0 0 0.18  0.9 0 0 0 -0.32"/>
    </filter>
    <filter id="stain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.008" numOctaves="3" seed="13"/>
      <feColorMatrix values="0 0 0 0 0.42  0 0 0 0 0.33  0 0 0 0 0.23  1.4 0 0 0 -0.62"/>
    </filter>
    <filter id="ink" x="-10%" y="-40%" width="120%" height="180%">
      <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="3" seed="3" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="inkFine" x="-5%" y="-20%" width="110%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="5" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="2" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="3"/></filter>`;

const petal = (w = 12) => `M0 0 Q${w / 2} ${-w / 4} ${w} 0 Q${w / 2} ${w / 4} 0 0Z`;

// ---------- hero banner ----------
function hero() {
  const avatar = read("assets/avatar.jpg").toString("base64");
  const roleW = Math.round(profile.role.length * 13 + 40);
  const vars = {
    AVATAR: avatar,
    COMMITS: stats.total,
    REPOS: stats.repos,
    FIRST: esc(profile.name.first),
    LAST: esc(profile.name.last),
    ROLE: esc(profile.role),
    ROLE_W: roleW,
    ROLE_CX: roleW / 2,
    STACK: esc(profile.stack.join(" · ")),
    QUOTE: esc(profile.quote),
  };
  const svg = read("templates/hero-hud.svg")
    .toString("utf8")
    .replace(/\{\{(\w+)\}\}/g, (_, k) => (k in vars ? vars[k] : `{{${k}}}`));
  write("assets/hero-hud.svg", svg);
}

// ---------- section header: hanging wooden plaque ----------
function header({ id, title, tag }) {
  const titleW = Math.round(title.length * 27 + 76);
  const x = 24;
  const cx = x + titleW / 2;
  const tagX = x + titleW + 26;
  const tagW = Math.round(tag.length * 11 + 40);
  const lineStart = tagX + tagW + 22;
  const lineEnd = 1090;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" width="1200" height="120">
  <defs>${filters}
    <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5a3e29"/>
      <stop offset="1" stop-color="#2f2017"/>
    </linearGradient>
    <linearGradient id="goldText" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f7e3a6"/>
      <stop offset="1" stop-color="#c9a227"/>
    </linearGradient>
    <style>
      .node { animation: node 2.4s ease-in-out infinite; }
      @keyframes node { 0%,100% { opacity: .5 } 50% { opacity: 1 } }
    </style>
  </defs>

  <!-- Plaque swinging gently on its ropes -->
  <g>
    <animateTransform attributeName="transform" type="rotate" values="-0.9 ${cx} 0;0.9 ${cx} 0;-0.9 ${cx} 0" dur="5s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
    <g stroke="#8a6a48" stroke-width="2.2" stroke-linecap="round">
      <line x1="${x + 36}" y1="0" x2="${x + 36}" y2="26"/>
      <line x1="${x + titleW - 36}" y1="0" x2="${x + titleW - 36}" y2="26"/>
    </g>
    <rect x="${x}" y="24" width="${titleW}" height="72" rx="5" fill="url(#wood)" filter="url(#inkFine)"/>
    <g stroke="#6e4f36" stroke-width="1.2" fill="none" opacity="0.7">
      <path d="M${x + 10} 40 Q${cx} 34 ${x + titleW - 10} 42"/>
      <path d="M${x + 14} 80 Q${cx} 86 ${x + titleW - 12} 78"/>
    </g>
    <rect x="${x + 6}" y="30" width="${titleW - 12}" height="60" rx="3" fill="none" stroke="${C.gold}" stroke-opacity="0.55" stroke-width="1.4"/>
    <g fill="${C.gold}">
      <circle cx="${x + 36}" cy="30" r="3"/><circle cx="${x + titleW - 36}" cy="30" r="3"/>
    </g>
    <text x="${cx + 1.5}" y="72.5" text-anchor="middle" font-family="${DISPLAY}" font-size="34" font-weight="700" letter-spacing="6" fill="#120d09" opacity="0.8">${esc(title)}</text>
    <text x="${cx}" y="71" text-anchor="middle" font-family="${DISPLAY}" font-size="34" font-weight="700" letter-spacing="6" fill="url(#goldText)">${esc(title)}</text>
  </g>

  <!-- Vermilion subtitle tag -->
  <rect x="${tagX}" y="45" width="${tagW}" height="28" fill="${C.red}" filter="url(#inkFine)"/>
  <text x="${tagX + tagW / 2}" y="64" text-anchor="middle" font-family="${SERIF}" font-size="13" letter-spacing="4" fill="${C.paperText}">${esc(tag)}</text>

  <!-- Brush line with petals drifting along it -->
  <path filter="url(#ink)" fill="${C.red2}" opacity="0.9"
        d="M${lineStart} 57 C${lineStart + 120} 55 ${lineEnd - 120} 56 ${lineEnd} 58 L${lineEnd} 61 C${lineEnd - 120} 60 ${lineStart + 120} 61 ${lineStart} 61Z"/>
  ${[0, 2.6, 5.2].map((d) => `<path d="${petal(11)}" fill="#c4382b" opacity="0">
    <animateMotion path="M${lineEnd} 50 C${lineEnd - 200} 40 ${lineStart + 200} 66 ${lineStart} 52" dur="7.8s" begin="${d}s" repeatCount="indefinite" rotate="auto"/>
    <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.85;1" dur="7.8s" begin="${d}s" repeatCount="indefinite"/>
  </path>`).join("\n  ")}

  <!-- Resurrection nodes -->
  <circle class="node" cx="1118" cy="59" r="7" fill="${C.red2}"/>
  <circle class="node" style="animation-delay:-0.8s" cx="1142" cy="59" r="7" fill="${C.red2}"/>
  <circle cx="1166" cy="59" r="7" fill="none" stroke="${C.red2}" stroke-width="1.8"/>
</svg>
`;
}

// ---------- divider: a Shadow Fight-style duel ----------
function divider() {
  const W = 1200, H = 190, G = 172, LOOP = 14;
  const SH = "#0b0908";
  const T = (sec) => sec / LOOP; // seconds → loop fraction
  const f4 = (n) => +Math.min(Math.max(n, 0), 1).toFixed(4);
  const ease = (n) => Array(n).fill("0.42 0 0.2 1").join(";");
  const animKeys = (type, values, keys, begin = 0) =>
    `<animateTransform attributeName="transform" type="${type}" values="${values.join(";")}" keyTimes="${keys.map(f4).join(";")}" calcMode="spline" keySplines="${ease(keys.length - 1)}" dur="${LOOP}s" begin="${begin}s" repeatCount="indefinite"/>`;
  const anim = (attr, values, keys) =>
    `<animate attributeName="${attr}" values="${values.join(";")}" keyTimes="${keys.map(f4).join(";")}" dur="${LOOP}s" repeatCount="indefinite"/>`;
  const pulse = (t, len, peak = 1) => anim("opacity", [0, 0, peak, 0, 0], [0, t - 0.002, t, t + len, 1]);

  // ---------- skeleton and kinematics ----------
  const L = { thigh: 33, shin: 32, upper: 24, fore: 22, torso: 40 };
  const rad = (d) => (d * Math.PI) / 180;
  const R = (a, [x, y]) => [x * Math.cos(rad(a)) - y * Math.sin(rad(a)), x * Math.sin(rad(a)) + y * Math.cos(rad(a))];
  const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
  const footY = (t, s) => L.thigh * Math.cos(rad(t)) + L.shin * Math.cos(rad(t + s));
  const hipY = (p, scale) => Math.max(footY(p.fT, p.fS), footY(p.bT, p.bS)) * scale;
  const rootOf = (p, scale) => [p.x, G - hipY(p, scale) + (p.jump || 0)];
  // World position of the weapon tip for a pose
  const tipOf = (p, blade, scale, flip) => {
    const local = R(p.lean, add([0, -L.torso + 4], R(p.sU, add([0, L.upper], R(p.sF, add([0, L.fore], R(p.w, [0, blade])))))));
    const r = rootOf(p, scale);
    return [r[0] + local[0] * scale * (flip ? -1 : 1), r[1] + local[1] * scale];
  };
  const chestOf = (p, scale, flip) => {
    const local = R(p.lean, [0, -26]);
    const r = rootOf(p, scale);
    return [r[0] + local[0] * scale * (flip ? -1 : 1), r[1] + local[1] * scale];
  };
  const lerpPose = (a, b, u) => {
    const o = {};
    for (const k of Object.keys(a)) o[k] = typeof a[k] === "number" ? a[k] + ((b[k] ?? 0) - a[k]) * u : a[k];
    o.jump = (a.jump || 0) + ((b.jump || 0) - (a.jump || 0)) * u;
    return o;
  };

  const limb = (len, w1, w2) =>
    `<path d="M${-w1 / 2} 0 C${-w1 / 2} ${len * 0.4} ${-w2 / 2} ${len * 0.7} ${-w2 / 2} ${len} L${w2 / 2} ${len} C${w2 / 2} ${len * 0.7} ${w1 / 2} ${len * 0.4} ${w1 / 2} 0Z"/><circle cx="0" cy="0" r="${w1 / 2}"/><circle cx="0" cy="${len}" r="${w2 / 2}"/>`;

  // Anatomy, drawn along +y from each joint; +x is the front of a right-facing body
  const BODY = {
    pelvis: `<ellipse cx="0" cy="2" rx="12.5" ry="7.5"/>`,
    thigh: `<path d="M-8.5 0 C-9.5 9 -8.5 19 -5.5 ${L.thigh} L5 ${L.thigh} C7.5 23 10.5 11 8.5 0Z"/><circle cx="0" cy="${L.thigh}" r="5.2"/>`,
    shin: `<path d="M-5 0 C-8.5 6 -8.5 13 -4.5 21 C-3.4 26 -3.2 29 -3 ${L.shin} L3 ${L.shin} C3 26 4.2 14 5 0Z"/>`,
    boot: `<path d="M-5 -6 L4 -6 L6 -2 L14 0 L14.5 3.5 L-6 3.5Z"/>`,
    upper: `<circle cx="0" cy="1" r="6.8"/><path d="M-5.6 0 C-7.2 7 -5.4 16 -4 ${L.upper} L4 ${L.upper} C5.2 16 7.4 7 5.6 0Z"/><circle cx="0" cy="${L.upper}" r="4.2"/>`,
    fore: `<path d="M-4.3 0 C-5.2 6 -3.8 16 -3 ${L.fore} L3 ${L.fore} C3.8 16 5.4 6 4.3 0Z"/><ellipse cx="0.6" cy="${L.fore + 2.2}" rx="4.4" ry="5"/>`,
    torso: `<path d="M-10 6 C-12 -4 -11 -14 -12.5 -22 C-14.5 -30 -15 -36 -11 -41 C-6 -44.5 6 -44.5 11 -41 C16.5 -36 16.5 -27 13.5 -19 C11.5 -11 11 -2 10 6Z"/>
          <path d="M-11 -40 Q-5 -47 0 -47 Q5 -47 11 -40Z"/>
          <path d="M-4.2 -45 L4.2 -45 L3.6 -51 L-3.6 -51Z"/>`,
    head: `<path d="M-6.5 -9 C-7.5 -15 -4 -18.5 1 -18.5 C6.5 -18.5 9 -14.5 8.6 -9 C8.4 -5 8.8 -3 7.4 -1 C5.6 1.4 2 1.6 -1 0.8 C-4.6 -0.2 -6 -4 -6.5 -9Z"/>`,
  };

  function fighter(poses, { weapon, eye, flip = false, scale = 1, glowBlade = "", begin = 0, opacity = 1, costume = {} }) {
    const c = { thigh: "", shin: "", upper: "", fore: "", back: "", front: "", head: "", ...costume };
    const keys = poses.map((p) => T(p.s));
    const col = (k) => poses.map((p) => p[k]);
    const rot = (k) => animKeys("rotate", col(k).map((a) => `${a} 0 0`), keys, begin);
    const rootVals = poses.map((p) => rootOf(p, scale).map((v) => v.toFixed(1)).join(" "));
    const leg = (Tk, Sk) => `
          <g>${rot(Tk)}
            ${BODY.thigh}${c.thigh}
            <g transform="translate(0 ${L.thigh})"><g>${rot(Sk)}
              ${BODY.shin}${c.shin}
              <g transform="translate(0 ${L.shin})"><g>
                ${animKeys("rotate", poses.map((p) => `${(-(p[Tk] + p[Sk]) * 0.8).toFixed(1)} 0 0`), keys, begin)}
                ${BODY.boot}
              </g></g>
            </g></g>
          </g>`;
    const arm = (U, F, hand = "") => `
            <g>${rot(U)}
              ${BODY.upper}${c.upper}
              <g transform="translate(0 ${L.upper})"><g>${rot(F)}
                ${BODY.fore}${c.fore}
                ${hand}
              </g></g>
            </g>`;
    const weaponG = `<g transform="translate(0 ${L.fore})"><g>${rot("w")}${weapon}${glowBlade}</g></g>`;
    return `
    <g opacity="${typeof opacity === "number" ? opacity : 1}">${typeof opacity === "string" ? opacity : ""}
      ${animKeys("translate", rootVals, keys, begin)}
      <g transform="scale(${flip ? -scale : scale} ${scale})" fill="${SH}">
        <g>${rot("lean")}${c.back}</g>
        ${leg("bT", "bS")}
        <g>${rot("lean")}<g transform="translate(0 ${-L.torso + 4})">${arm("oU", "oF")}</g></g>
        ${BODY.pelvis}
        <g>${rot("lean")}
          ${BODY.torso}
          ${c.front}
          <g transform="translate(1 -49)"><g>${rot("head")}
            ${BODY.head}
            ${c.head}
            <ellipse cx="${eye.x}" cy="${eye.y}" rx="2.6" ry="1.3" fill="${eye.color}" filter="url(#eyeGlow)"/>
            <ellipse cx="${eye.x}" cy="${eye.y}" rx="1.6" ry="0.8" fill="#fff"/>
          </g></g>
        </g>
        ${leg("fT", "fS")}
        <g>${rot("lean")}<g transform="translate(0 ${-L.torso + 4})">${arm("sU", "sF", weaponG)}</g></g>
      </g>
    </g>`;
  }

  // ---------- weapons and costume ----------
  const KATANA = 76, SPEAR = 126;
  const katana = `
    <path d="M-1.8 -9 L1.8 -9 L1.8 6 L-1.8 6Z"/>
    <ellipse cx="0" cy="6.5" rx="5" ry="1.8"/>
    <path d="M-1.6 7 L2 7 C2.6 30 1.8 54 -0.2 76 C-0.8 54 -2 30 -1.6 7Z" fill="#1d1a18"/>
    <path d="M1.9 9 C2.4 30 1.7 52 -0.1 74" stroke="#d9d4ca" stroke-width="0.9" fill="none"/>`;
  const katanaGlow = (a, b) => `<path d="M-1.6 7 L2 7 C2.6 30 1.8 54 -0.2 76 C-0.8 54 -2 30 -1.6 7Z" fill="#ff5a2a" filter="url(#eyeGlow)" opacity="0">
    ${anim("opacity", [0, 0, 1, 1, 0, 0], [0, T(a) - 0.002, T(a), T(b), T(b) + 0.01, 1])}</path>`;
  const spear = `
    <path d="M-1.4 -46 L1.4 -46 L1.4 96 L-1.4 96Z"/>
    <path d="M-3 94 L3 94 L3 99 L-3 99Z"/>
    <path d="M-3.2 99 L3.2 99 L0 126Z" fill="#1d1a18"/>
    <path d="M2.6 101 L0.2 124" stroke="#d9d4ca" stroke-width="0.9"/>`;

  // ---------- costumes ----------
  const flutter = (dur, a, b) => `<path><animate attributeName="d" dur="${dur}s" repeatCount="indefinite" values="${a};${b};${a}"/></path>`;
  const ARMOR = "#1b1613";
  const heroCostume = {
    // Baggy hakama over the thighs and calves
    thigh: `<path d="M-10.5 -2 C-13 10 -14 22 -12.5 ${L.thigh + 3} L11.5 ${L.thigh + 4} C13 24 12 10 10 -2Z"/>`,
    shin: `<path d="M-8 0 C-9.5 9 -8.5 18 -5.5 26 L5 26 C7 18 8 9 7 0Z"/><path d="M-5.5 25 L5 25 L4 29 L-4.5 29Z"/>`,
    // Waist sash tails and the scarf stream behind
    back: flutter(0.7, "M-10 0 C-20 2 -30 8 -38 6 C-30 12 -20 10 -9 5Z", "M-10 0 C-20 -2 -30 2 -40 -2 C-31 6 -20 8 -9 5Z")
      + flutter(0.9, "M-10 3 C-18 8 -24 16 -32 18 C-24 20 -16 14 -9 7Z", "M-10 3 C-19 6 -27 10 -35 10 C-26 14 -17 12 -9 7Z")
      + flutter(0.8, "M-4 -44 C-18 -46 -32 -40 -46 -44 C-34 -36 -20 -36 -6 -38Z", "M-4 -44 C-18 -40 -32 -48 -48 -38 C-34 -34 -20 -32 -6 -38Z")
      + flutter(0.65, "M-5 -41 C-16 -38 -26 -30 -38 -32 C-28 -26 -16 -28 -7 -35Z", "M-5 -41 C-16 -34 -26 -38 -40 -28 C-28 -22 -16 -26 -7 -35Z"),
    front: `<path d="M-12 -2 L12 -2 L12.5 5 L-12.5 5Z"/><path d="M-11 -40 L4 -30 L13 -40 L11 -42 L4 -34 L-9 -42Z"/>`,
    // Topknot, loose strands, headband with tails
    head: `<path d="M-6 -13 C-7 -21 2 -23 8 -17 L10 -12 L6 -14Z"/>
            <path d="M-4 -16 C-10 -23 -18 -23 -22 -19 C-16 -18 -10 -16 -6 -12Z"/>
            <path d="M-7 -8 L-12 -4 L-6 -3Z"/><path d="M5 -17 L9 -21 L8 -15Z"/>
            <rect x="-7" y="-13.5" width="16" height="3"/>`
      + flutter(0.6, "M-6 -12 C-14 -12 -22 -8 -30 -10 C-22 -4 -14 -6 -6 -9Z", "M-6 -12 C-14 -8 -22 -14 -32 -8 C-22 -2 -14 -4 -6 -9Z"),
  };
  const saintCostume = {
    // Layered shoulder plates on the upper arm
    upper: `<path d="M-10 -6 L10 -6 L11.5 16 L-11.5 18Z" fill="${ARMOR}"/>
            <g stroke="${SH}" stroke-width="1.2"><path d="M-11 3 L11 2"/><path d="M-11.3 10 L11.3 9"/></g>`,
    fore: `<path d="M-5 4 L5 4 L4.4 18 L-4.4 18Z" fill="${ARMOR}"/>`,
    thigh: `<path d="M-10 -2 C-12 10 -12 20 -10 ${L.thigh} L10 ${L.thigh} C11 20 11 10 9.5 -2Z"/>`,
    shin: `<path d="M-6 2 L6 2 L5 22 L-5 22Z" fill="${ARMOR}"/>`,
    // Cape behind
    back: flutter(1.3, "M-8 -40 C-24 -30 -32 -6 -38 22 C-26 12 -18 -8 -10 -18Z", "M-8 -40 C-28 -30 -40 -8 -48 16 C-32 8 -20 -10 -10 -18Z"),
    // Chest plate and armoured skirt
    front: `<path d="M-13 -40 C-6 -44 8 -44 14 -40 C17 -32 16 -22 13 -14 L-12 -14 C-14 -24 -15 -32 -13 -40Z" fill="${ARMOR}"/>
            <g stroke="${SH}" stroke-width="1.2" fill="none"><path d="M-13 -30 L15 -30"/><path d="M-12.5 -22 L14.5 -22"/></g>
            <path d="M-16 -4 L16 -4 L21 20 L-21 20Z" fill="${ARMOR}"/>
            <g stroke="${SH}" stroke-width="1.3"><path d="M-17.5 4 L17.5 4"/><path d="M-19 12 L19 12"/><path d="M-6 -4 L-8 20"/><path d="M6 -4 L8 20"/></g>`,
    // Flowing white mane and beard
    head: `<path fill="#e6e0d4"><animate attributeName="d" dur="1.5s" repeatCount="indefinite"
              values="M2 -18 C-6 -21 -14 -15 -18 -7 C-24 3 -30 11 -40 17 C-28 15 -20 9 -14 1 C-18 11 -24 19 -32 25 C-18 21 -10 9 -6 -3 C-4 -11 0 -15 2 -18Z;M2 -18 C-6 -21 -15 -14 -20 -6 C-27 3 -34 9 -46 13 C-32 13 -22 7 -15 1 C-20 10 -28 17 -38 21 C-21 19 -11 8 -6 -3 C-4 -11 0 -15 2 -18Z;M2 -18 C-6 -21 -14 -15 -18 -7 C-24 3 -30 11 -40 17 C-28 15 -20 9 -14 1 C-18 11 -24 19 -32 25 C-18 21 -10 9 -6 -3 C-4 -11 0 -15 2 -18Z"/></path>
            <path d="M2 -1 L9.5 -1 L7 10 L4 8Z" fill="#e6e0d4"/>`,
  };

  // ---------- poses ----------
  const HI = { lean: 6, head: -4, sU: -40, sF: -50, w: -35, oU: -20, oF: -60, fT: -28, fS: 26, bT: 24, bS: 6, jump: 0 };
  const HP = {
    idle: {},
    breathe: { lean: 8, fS: 30, bS: 10 },
    walk1: { lean: 8, fT: -30, fS: 10, bT: 25, bS: 15 },
    walk2: { lean: 8, fT: 18, fS: 28, bT: -24, bS: 12 },
    highWind: { lean: 4, sU: -150, sF: -20, w: -30, oU: -120, oF: -20 },
    highEnd: { lean: 20, fT: -50, fS: 44, bT: 40, bS: 10, sU: -50, sF: -10, w: 20, oU: -40, oF: -20 },
    lowWind: { lean: 10, sU: 40, sF: -30, w: -70, oU: 0, oF: -60 },
    lowEnd: { lean: 24, fT: -55, fS: 60, bT: 44, bS: 20, sU: -70, sF: 0, w: 40, oU: -60, oF: -20 },
    stabWind: { lean: 0, sU: 20, sF: -110, w: -10 },
    stabEnd: { lean: 26, fT: -62, fS: 52, bT: 50, bS: 8, sU: -85, sF: 0, w: 0, oU: 10, oF: -30 },
    recoil: { lean: -10, fT: -20, fS: 30, bT: 30, bS: 10, sU: -60, sF: -60, w: -30 },
    hop: { jump: -30, lean: -6, fT: -50, fS: 90, bT: 10, bS: 90, sU: -40, sF: -60, w: -40 },
    deflect: { lean: -4, fT: -24, fS: 30, bT: 28, bS: 12, sU: -110, sF: -20, w: -40, oU: -80, oF: -40 },
    hit: { lean: -26, head: 16, sU: 10, sF: -30, w: -60, oU: -60, oF: -20, fT: -10, fS: 20, bT: 34, bS: 20 },
    crouch: { lean: 30, fT: -40, fS: 100, bT: 40, bS: 90 },
    sweep: { lean: 36, fT: -88, fS: 4, bT: 10, bS: 90, sU: 20, sF: -60, w: -80, oU: 40, oF: -20 },
    riseWind: { lean: 24, fT: -40, fS: 70, bT: 40, bS: 40, sU: 30, sF: -20, w: 60 },
    riseEnd: { lean: -6, fT: -30, fS: 20, bT: 30, bS: 10, sU: -160, sF: -10, w: -20, oU: -40, oF: -40 },
    bind: { lean: 22, fT: -60, fS: 50, bT: 50, bS: 10, sU: -90, sF: -20, w: -40, oU: -80, oF: -30 },
    jumpPrep: { lean: 16, fT: -40, fS: 70, bT: 30, bS: 60 },
    air1: { jump: -38, lean: 10, fT: -80, fS: 110, bT: -20, bS: 110, sU: -70, sF: -30, w: -40, oU: -50, oF: -60 },
    air2: { jump: -32, lean: 12, fT: -70, fS: 100, bT: -10, bS: 100, sU: -80, sF: -30, w: -40, oU: -50, oF: -60 },
    strikeWind: { lean: 24, fT: -55, fS: 50, bT: 45, bS: 15, sU: -140, sF: -10, w: -30, oU: -100, oF: -20 },
    strikeEnd: { lean: 20, fT: -55, fS: 50, bT: 45, bS: 15, sU: -50, sF: -10, w: 20, oU: -40, oF: -20 },
    kickPrep: { lean: 14, fT: -30, fS: 50, bT: 36, bS: 20 },
    flyKick: { jump: -26, lean: -10, fT: -85, fS: 0, bT: 40, bS: 70, sU: 20, sF: -60, w: -60, oU: -60, oF: -40 },
    flourish: { lean: 4, sU: 10, sF: -100, w: -120 },
  };
  const SI = { lean: 4, head: -4, sU: -30, sF: -60, w: -10, oU: -10, oF: -70, fT: -24, fS: 22, bT: 24, bS: 8, jump: 0 };
  const SP = {
    idle: {},
    breathe: { lean: 6, fS: 26, bS: 12 },
    walk1: { lean: 6, fT: -28, fS: 10, bT: 24, bS: 14 },
    walk2: { lean: 6, fT: 18, fS: 26, bT: -22, bS: 12 },
    spinA: { sU: -60, sF: -40, w: -190 },
    spinB: { sU: -50, sF: -50, w: -370 },
    blockHigh: { lean: -4, sU: -150, sF: -20, w: 80 },
    blockLow: { lean: 6, sU: -20, sF: -40, w: 30 },
    parry: { lean: -2, sU: -80, sF: -40, w: -30 },
    sweepWind: { lean: -10, sU: 40, sF: -60, w: 20 },
    sweepEnd: { lean: 26, fT: -55, fS: 55, bT: 45, bS: 15, sU: -60, sF: 0, w: 60 },
    thrustWind: { lean: -6, sU: 20, sF: -80, w: 0, fT: -20, fS: 30, bT: 30, bS: 10 },
    thrustEnd: { lean: 20, fT: -60, fS: 50, bT: 50, bS: 8, sU: -80, sF: -10, w: 0, oU: -60, oF: -20 },
    knock: { lean: -24, head: 12, sU: 10, sF: -60, w: -20, fT: -10, fS: 20, bT: 30, bS: 30 },
    kneel: { lean: 12, head: 8, fT: -80, fS: 100, bT: 70, bS: 90, sU: 0, sF: -40, w: -60, oU: 20, oF: -30 },
    bind: { lean: 20, fT: -55, fS: 45, bT: 45, bS: 10, sU: -90, sF: -20, w: -30 },
    raise: { lean: -6, sU: -170, sF: 0, w: 0, oU: -30, oF: -60 },
    release: { lean: 24, sU: -40, sF: -10, w: 20, fT: -55, fS: 50, bT: 45, bS: 10 },
    stagger: { lean: -26, head: 14, sU: 30, sF: -40, w: -40, fT: 0, fS: 30, bT: 40, bS: 30 },
  };
  const seq = (base, lib, list) => list.map(([s, x, name, extra = {}]) => ({ ...base, ...lib[name], ...extra, s, x }));

  const heroPoses = seq(HI, HP, [
    [0, 380, "idle"], [0.5, 380, "breathe"], [1.0, 380, "idle"],
    [1.25, 450, "walk1"], [1.5, 520, "walk2"], [1.75, 580, "walk1"],
    [1.95, 600, "highWind"], [2.1, 612, "highEnd"],
    [2.25, 606, "lowWind"], [2.4, 616, "lowEnd"],
    [2.55, 606, "stabWind"], [2.72, 632, "stabEnd"],
    [2.9, 592, "recoil"], [3.15, 580, "idle"],
    [3.3, 540, "hop"], [3.5, 505, "idle"],
    [3.75, 500, "deflect"], [3.95, 496, "idle"],
    [4.15, 492, "deflect"], [4.35, 490, "idle"],
    [4.55, 452, "hit"], [4.85, 450, "idle"],
    [5.1, 520, "crouch"], [5.35, 560, "sweep"], [5.6, 560, "idle"],
    [5.85, 600, "riseWind"], [6.05, 640, "riseEnd"],
    [6.3, 650, "bind"], [6.6, 656, "bind", { lean: 26 }], [6.9, 600, "recoil"], [7.2, 580, "idle"],
    [7.7, 575, "breathe"], [7.9, 575, "jumpPrep"],
    [8.1, 600, "air1"], [8.3, 625, "air2"],
    [8.5, 650, "strikeWind"], [8.65, 656, "strikeEnd"], [8.9, 650, "idle"],
    [9.3, 650, "kickPrep"], [9.55, 705, "flyKick"], [9.8, 690, "idle"],
    [10.4, 690, "flourish"], [11.0, 690, "idle"],
    [11.4, 620, "walk2"], [11.8, 550, "walk1"], [12.2, 480, "walk2"], [12.6, 420, "walk1"],
    [13.0, 380, "idle"], [13.5, 380, "breathe"], [14, 380, "idle"],
  ]);
  const saintPoses = seq(SI, SP, [
    [0, 840, "idle"], [0.3, 840, "idle"],
    [0.55, 840, "spinA"], [0.85, 840, "spinB"], [0.86, 840, "idle", { w: -370 }], [0.861, 840, "idle"],
    [1.3, 840, "breathe"], [1.85, 840, "idle"],
    [2.1, 846, "blockHigh"], [2.4, 850, "blockLow"], [2.72, 854, "parry"], [2.95, 846, "idle"],
    [3.1, 840, "sweepWind"], [3.3, 800, "sweepEnd"], [3.55, 800, "idle"],
    [3.65, 800, "thrustWind"], [3.75, 762, "thrustEnd"],
    [3.92, 790, "thrustWind"], [4.15, 760, "thrustEnd"],
    [4.32, 782, "thrustWind"], [4.55, 742, "thrustEnd"],
    [4.8, 760, "idle"], [5.2, 770, "idle"],
    [5.4, 822, "knock"], [5.6, 830, "kneel"], [5.85, 822, "idle"],
    [6.05, 830, "blockHigh"], [6.3, 814, "bind"], [6.6, 810, "bind", { lean: 24 }],
    [6.9, 850, "knock", { lean: -12, head: 4 }], [7.2, 850, "idle"],
    [7.6, 850, "raise"], [7.95, 850, "raise", { lean: -8 }], [8.1, 850, "release"],
    [8.4, 850, "idle"], [8.65, 850, "idle"], [8.72, 900, "stagger"], [9.0, 905, "stagger", { lean: -12 }],
    [9.4, 900, "idle"], [9.55, 952, "knock"], [9.85, 962, "kneel"], [10.5, 962, "kneel"],
    [10.9, 950, "idle"], [11.2, 950, "idle"], [11.4, 950, "spinA"], [11.65, 950, "spinB"], [11.66, 950, "idle", { w: -370 }], [11.661, 950, "idle"],
    [12.0, 930, "walk1"], [12.4, 900, "walk2"], [12.8, 870, "walk1"], [13.2, 840, "idle"],
    [13.6, 840, "breathe"], [14, 840, "idle"],
  ]);

  // ---------- effects ----------
  const HS = 1, SS = 1.08;
  const poseAt = (poses, s) => poses.find((p) => Math.abs(p.s - s) < 1e-6);
  const heroTip = (s) => tipOf(poseAt(heroPoses, s), KATANA, HS, false);
  const saintTip = (s) => tipOf(poseAt(saintPoses, s), SPEAR, SS, true);
  const heroChest = (s) => chestOf(poseAt(heroPoses, s), HS, false);
  const saintChest = (s) => chestOf(poseAt(saintPoses, s), SS, true);

  const trail = (poses, s0, s1, blade, scale, flip, color = "#fff") => {
    const a = poseAt(poses, s0), b = poseAt(poses, s1);
    const pts = Array.from({ length: 10 }, (_, i) => tipOf(lerpPose(a, b, 0.45 + 0.55 * (i / 9)), blade, scale, flip));
    const d = "M" + pts.map((p) => p.map((v) => v.toFixed(1)).join(" ")).join(" L");
    const t = T(s1);
    return `<path d="${d}" stroke="${color}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round" filter="url(#eyeGlow)" opacity="0">${pulse(t, 0.012, 0.5)}</path>
      <path d="${d}" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0">${pulse(t, 0.009, 0.85)}</path>`;
  };
  const sparks = (x, y, t, n = 10, color = "#ffe39a") =>
    Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 + 0.4;
      const d = 16 + (i % 3) * 9;
      return `<circle r="${i % 2 ? 1.6 : 2.4}" fill="${i % 3 ? color : "#fff"}" opacity="0">
        <animateTransform attributeName="transform" type="translate" values="${x} ${y};${x} ${y};${(x + Math.cos(a) * d).toFixed(1)} ${(y + Math.sin(a) * d).toFixed(1)}" keyTimes="0;${f4(t)};${f4(t + 0.025)}" dur="${LOOP}s" repeatCount="indefinite"/>
        ${pulse(t, 0.025)}</circle>`;
    }).join("");
  const impact = ([x, y], s, color = "#fff2cf", big = false) => {
    const t = T(s);
    x = +x.toFixed(1); y = +y.toFixed(1);
    const r = big ? 22 : 14;
    return `
      <circle cx="${x}" cy="${y}" r="${r}" fill="${color}" filter="url(#bigGlow)" opacity="0">${pulse(t, 0.02, 0.95)}</circle>
      <path d="M${x - r * 1.6} ${y} L${x + r * 1.6} ${y} M${x} ${y - r * 1.6} L${x} ${y + r * 1.6} M${x - r} ${y - r} L${x + r} ${y + r} M${x + r} ${y - r} L${x - r} ${y + r}" stroke="#fff" stroke-width="2" opacity="0">${pulse(t, 0.014)}</path>
      ${sparks(x, y, t, big ? 14 : 9, color === "#fff2cf" ? "#ffe39a" : "#ff8a5a")}`;
  };
  const dust = (x, s, size = 1) => {
    const t = T(s);
    return [-1, 1].map((d) => `
      <ellipse cx="0" cy="0" rx="${12 * size}" ry="${4 * size}" fill="#d9a070" opacity="0">
        <animateTransform attributeName="transform" type="translate" values="${x} ${G - 2};${x} ${G - 2};${x + d * 26 * size} ${G - 6}" keyTimes="0;${f4(t)};${f4(t + 0.04)}" dur="${LOOP}s" repeatCount="indefinite"/>
        ${pulse(t, 0.04, 0.55)}
      </ellipse>`).join("");
  };
  const bolt = (pts, s, lenS, width = 3) => {
    const t = T(s), len = T(lenS);
    const d = "M" + pts.map((p) => p.map((v) => +(+v).toFixed(1)).join(" ")).join(" L");
    const flick = anim("opacity", [0, 0, 1, 0.3, 1, 0, 0], [0, t - 0.002, t, t + len * 0.3, t + len * 0.6, t + len, 1]);
    return `<path d="${d}" stroke="#ff3b1f" stroke-width="${width + 6}" fill="none" stroke-linejoin="round" filter="url(#eyeGlow)" opacity="0">${flick}</path>
      <path d="${d}" stroke="#fff4e6" stroke-width="${width}" fill="none" stroke-linejoin="round" opacity="0">${flick}</path>`;
  };
  const wave = (s) => {
    const t = T(s);
    return `
    <g opacity="0">
      ${anim("opacity", [0, 0, 1, 1, 0, 0], [0, t - 0.002, t, t + 0.025, t + 0.035, 1])}
      <animateTransform attributeName="transform" type="translate" values="0 0;0 0;-330 0;-330 0" keyTimes="0;${f4(t)};${f4(t + 0.035)};1" dur="${LOOP}s" repeatCount="indefinite"/>
      <path d="M800 166 L780 150 L762 168 L742 146 L724 166 L706 152" stroke="#ff3b1f" stroke-width="9" fill="none" filter="url(#eyeGlow)"/>
      <path d="M800 166 L780 150 L762 168 L742 146 L724 166 L706 152" stroke="#fff4e6" stroke-width="2.6" fill="none"/>
    </g>`;
  };

  // Screen shake on the heavy hits
  const heavy = [4.55, 5.35, 6.05, 8.65, 9.55];
  const shake = { k: [0], v: ["0 0"] };
  for (const s of heavy) {
    const t = T(s);
    shake.k.push(t - 0.001, t, t + 0.004, t + 0.008, t + 0.013);
    shake.v.push("0 0", "5 -3", "-4 2", "3 -1", "0 0");
  }
  shake.k.push(1); shake.v.push("0 0");

  // Afterimages show only during dashes
  const ghostWindows = [[1.9, 2.75], [5.8, 6.1], [9.3, 9.6]];
  const ghostOpacity = (peak) => {
    const k = [0], v = [0];
    for (const [a, b] of ghostWindows) { k.push(T(a), T(a) + 0.003, T(b) - 0.003, T(b)); v.push(0, peak, peak, 0); }
    k.push(1); v.push(0);
    return anim("opacity", v, k);
  };

  // Health bars
  const bar = (x, w, dir, steps, label, labelX, anchor) => {
    const keys = [0], vals = [1];
    for (const [s, v] of steps) { keys.push(T(s), T(s) + 0.002); vals.push(vals[vals.length - 1], v); }
    keys.push(T(13.6), T(13.6) + 0.02, 1); vals.push(vals[vals.length - 1], 1, 1);
    return `
    <g>
      <rect x="${x - 2}" y="12" width="${w + 4}" height="14" rx="2" fill="${SH}" opacity="0.85"/>
      <rect x="${x}" y="14" width="${w}" height="10" fill="#4a1410"/>
      <rect x="${x}" y="14" width="${w}" height="10" fill="url(#hpGrad)" ${dir < 0 ? `transform="translate(${2 * x + w} 0) scale(-1 1)"` : ""}>
        <animate attributeName="width" values="${vals.map((v) => (v * w).toFixed(1)).join(";")}" keyTimes="${keys.map(f4).join(";")}" dur="${LOOP}s" repeatCount="indefinite"/>
      </rect>
      <rect x="${x}" y="14" width="${w}" height="3" fill="#fff" opacity="0.25"/>
      <text x="${labelX}" y="42" text-anchor="${anchor}" font-family="${SERIF}" font-size="12" font-weight="700" letter-spacing="3" fill="#fbe9c9">${label}</text>
    </g>`;
  };

  const heroOpts = { weapon: katana, costume: heroCostume, eye: { x: 5.5, y: -9, color: "#ffffff" } };
  const saintOpts = { weapon: spear, costume: saintCostume, eye: { x: 5.5, y: -9, color: "#ff8a2a" }, flip: true, scale: SS };
  const st = saintTip(7.95);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <clipPath id="frame"><rect width="${W}" height="${H}" rx="12"/></clipPath>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2b0f1f"/>
      <stop offset="0.45" stop-color="#8a2a24"/>
      <stop offset="0.75" stop-color="#e0773a"/>
      <stop offset="1" stop-color="#f4b36a"/>
    </linearGradient>
    <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#fff1c8"/>
      <stop offset="0.7" stop-color="#ffc77a"/>
      <stop offset="1" stop-color="#ff9a4a"/>
    </radialGradient>
    <radialGradient id="sunHalo">
      <stop offset="0" stop-color="#ffd38a" stop-opacity="0.7"/>
      <stop offset="1" stop-color="#ffd38a" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="fog" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f4b36a" stop-opacity="0"/>
      <stop offset="1" stop-color="#f4b36a" stop-opacity="0.55"/>
    </linearGradient>
    <linearGradient id="hpGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e8483a"/>
      <stop offset="1" stop-color="#9c1c14"/>
    </linearGradient>
    <radialGradient id="vignette" cx="0.5" cy="0.5" r="0.75">
      <stop offset="0.6" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.55"/>
    </radialGradient>
    <filter id="eyeGlow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="2"/></filter>
    <filter id="bigGlow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="6"/></filter>
    <style>
      .fogA { animation: drift 30s linear infinite; }
      .fogB { animation: drift 70s linear infinite; }
      .cloudA { animation: drift 120s linear infinite; }
      .cloudB { animation: drift 80s linear infinite; }
      .drift { animation: wind linear infinite; }
      .tw { animation: tw 3s ease-in-out infinite; }
      .flick { animation: flick 1.8s steps(5) infinite; }
      .flock { animation: flock 26s linear infinite; }
      .ember { animation: ember linear infinite; }
      .grass { animation: grass 3.2s ease-in-out infinite; }
      .swayL { animation: swayL 5s ease-in-out infinite; }
      .swayR { animation: swayR 5.5s ease-in-out infinite; }
      @keyframes tw { 0%,100% { opacity: .2 } 50% { opacity: .9 } }
      @keyframes flick { 0%,100% { opacity: .9 } 30% { opacity: .45 } 60% { opacity: 1 } 80% { opacity: .6 } }
      @keyframes flock { from { transform: translate(-60px,10px) } to { transform: translate(${W + 60}px,-8px) } }
      @keyframes ember { 0% { transform: translate(0,0); opacity: 0 } 15% { opacity: .9 } 100% { transform: translate(30px,-150px); opacity: 0 } }
      @keyframes grass { 0%,100% { transform: rotate(-3deg) } 50% { transform: rotate(4deg) } }
      @keyframes swayL { 0%,100% { transform: rotate(0deg) } 50% { transform: rotate(2deg) } }
      @keyframes swayR { 0%,100% { transform: rotate(0deg) } 50% { transform: rotate(-2deg) } }
      @keyframes drift { from { transform: translateX(0) } to { transform: translateX(-${W}px) } }
      @keyframes wind {
        0% { transform: translate(0,0) rotate(0deg); opacity: 0 }
        8% { opacity: 1 } 90% { opacity: 1 }
        100% { transform: translate(-${W + 80}px,70px) rotate(-600deg); opacity: 0 }
      }
    </style>
  </defs>
  <g clip-path="url(#frame)">
    <!-- ===== Dusk arena ===== -->
    <rect width="${W}" height="${H}" fill="url(#sky)"/>
    <!-- First stars -->
    <g fill="#ffe9d0">
      ${[[60, 8], [180, 22], [300, 10], [470, 26], [720, 12], [880, 24], [1040, 9], [1140, 30], [540, 6]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 ? 0.9 : 1.3}" class="tw" style="animation-delay:${-i * 0.7}s"/>`).join("")}
    </g>
    <!-- Slowly turning sun rays -->
    <g opacity="0.16">
      <animateTransform attributeName="transform" type="rotate" from="0 600 128" to="360 600 128" dur="160s" repeatCount="indefinite"/>
      ${Array.from({ length: 12 }, (_, i) => `<path d="M600 128 L${(600 + Math.cos(rad(i * 30)) * 700).toFixed(0)} ${(128 + Math.sin(rad(i * 30)) * 700).toFixed(0)} L${(600 + Math.cos(rad(i * 30 + 9)) * 700).toFixed(0)} ${(128 + Math.sin(rad(i * 30 + 9)) * 700).toFixed(0)}Z" fill="#ffd8a0"/>`).join("")}
    </g>
    <circle cx="600" cy="128" r="130" fill="url(#sunHalo)"/>
    <circle cx="600" cy="128" r="46" fill="url(#sun)"><animate attributeName="r" values="46;47.5;46" dur="6s" repeatCount="indefinite"/></circle>
    <!-- Banded clouds drifting at two speeds -->
    <g class="cloudA" opacity="0.55">
      ${[0, W].map((o) => `<path d="M${o + 80} 52 C${o + 120} 44 ${o + 260} 44 ${o + 330} 50 C${o + 360} 53 ${o + 350} 58 ${o + 320} 58 L${o + 96} 58 C${o + 70} 58 ${o + 66} 54 ${o + 80} 52Z" fill="#d9603e"/>
      <path d="M${o + 700} 38 C${o + 740} 31 ${o + 900} 31 ${o + 980} 37 C${o + 1004} 40 ${o + 996} 45 ${o + 970} 45 L${o + 716} 45 C${o + 690} 45 ${o + 688} 41 ${o + 700} 38Z" fill="#c64c3a"/>`).join("")}
    </g>
    <g class="cloudB" opacity="0.5">
      ${[0, W].map((o) => `<path d="M${o + 380} 78 C${o + 430} 70 ${o + 620} 70 ${o + 700} 77 C${o + 728} 80 ${o + 720} 86 ${o + 690} 86 L${o + 396} 86 C${o + 368} 86 ${o + 366} 81 ${o + 380} 78Z" fill="#f08a52"/>
      <path d="M${o + 1000} 92 C${o + 1030} 87 ${o + 1140} 87 ${o + 1190} 91 C${o + 1206} 93 ${o + 1200} 97 ${o + 1180} 97 L${o + 1012} 97 C${o + 994} 97 ${o + 992} 94 ${o + 1000} 92Z" fill="#ea7a48"/>`).join("")}
    </g>
    <!-- A flock crossing the sky -->
    <g fill="none" stroke="#3a1418" stroke-width="1.4" stroke-linecap="round">
      ${[[0, 0, 1], [14, 6, 0.8], [-12, 8, 0.85], [26, 12, 0.7], [-22, 14, 0.7]].map(([dx, dy, s], i) => `
      <g class="flock" style="animation-delay:${-i * 0.15}s"><path transform="translate(${dx} ${46 + dy}) scale(${s})">
        <animate attributeName="d" dur="${0.7 + i * 0.05}s" repeatCount="indefinite" values="M-7 0 Q-3 -5 0 0 Q3 -5 7 0;M-7 -2 Q-3 2 0 0 Q3 2 7 -2;M-7 0 Q-3 -5 0 0 Q3 -5 7 0"/>
      </path></g>`).join("")}
    </g>

    <!-- Far range with haze -->
    <path fill="#a8503e" opacity="0.5" d="M0 120 L70 98 L130 108 L210 82 L300 104 L390 88 L470 106 L560 92 L650 110 L740 86 L830 104 L920 84 L1010 100 L1100 88 L1200 102 L1200 ${H} L0 ${H}Z"/>
    <path fill="#a8503e" opacity="0.35" d="M200 84 L210 82 L222 88 L214 87Z M732 88 L740 86 L750 91 L742 90Z M912 86 L920 84 L930 89 L922 88Z" />
    <g class="fogB" opacity="0.5">
      ${[0, W].map((o) => `<ellipse cx="${o + 200}" cy="118" rx="300" ry="14" fill="#f6b46c" opacity="0.4" filter="url(#bigGlow)"/><ellipse cx="${o + 820}" cy="114" rx="320" ry="12" fill="#f6b46c" opacity="0.35" filter="url(#bigGlow)"/>`).join("")}
    </g>
    <!-- Mid range -->
    <path fill="#7a2f2c" opacity="0.85" d="M0 134 L100 114 L190 126 L290 106 L380 124 L480 112 L600 130 L700 116 L790 128 L900 108 L960 112 L1000 96 L1060 92 L1120 108 L1200 116 L1200 ${H} L0 ${H}Z"/>

    <!-- Castle on the cliff, lantern windows flickering -->
    <g fill="#4e1e22">
      <path d="M960 132 L975 112 L990 100 L1012 92 L1066 92 L1090 104 L1110 124 L1120 140 L960 140Z"/>
      <g transform="translate(1038 92)">
        <rect x="-26" y="-14" width="52" height="14"/><path d="M-36 -12 Q-28 -17 -26 -22 L26 -22 Q28 -17 36 -12Z"/>
        <rect x="-18" y="-34" width="36" height="12"/><path d="M-27 -32 Q-20 -37 -18 -41 L18 -41 Q20 -37 27 -32Z"/>
        <rect x="-11" y="-50" width="22" height="9"/><path d="M-18 -48 Q-13 -52 -11 -55 L11 -55 Q13 -52 18 -48Z"/>
        <path d="M-6 -55 L0 -64 L6 -55Z"/>
      </g>
    </g>
    <g fill="#ffb35a">
      ${[[1022, 84], [1036, 84], [1050, 84], [1030, 66], [1046, 66], [1038, 48]].map(([x, y], i) => `<rect x="${x}" y="${y}" width="3" height="4" class="flick" style="animation-delay:${-i * 0.4}s"/>`).join("")}
    </g>

    <!-- Temple wall and gate -->
    <g fill="#5a2628" opacity="0.85">
      <rect x="0" y="146" width="${W}" height="12"/>
      <path d="M-10 146 L${W + 10} 146 L${W + 10} 142 L-10 142Z"/>
      ${Array.from({ length: 25 }, (_, i) => `<rect x="${i * 50}" y="138" width="4" height="10"/>`).join("")}
    </g>
    <g fill="#4a1c20">
      <g transform="translate(160 118)">
        <rect x="-16" y="10" width="32" height="20"/><path d="M-30 12 Q-22 6 -18 0 L18 0 Q22 6 30 12Z"/>
        <rect x="-10" y="-12" width="20" height="12"/><path d="M-22 -10 Q-15 -15 -12 -20 L12 -20 Q15 -15 22 -10Z"/>
        <path d="M-6 -20 L0 -32 L6 -20Z"/>
      </g>
      <g transform="translate(700 146)"><rect x="-24" y="-34" width="4.5" height="36"/><rect x="19.5" y="-34" width="4.5" height="36"/><path d="M-34 -36 Q0 -43 34 -36 L32 -31 Q0 -37 -32 -31Z"/><rect x="-26" y="-27" width="52" height="3.5"/></g>
    </g>
    <!-- Stone lanterns with a glow -->
    ${[290, 1000].map((x) => `
    <g transform="translate(${x} 146)" fill="#4a1c20">
      <ellipse cx="0" cy="-22" rx="16" ry="10" fill="#ffb35a" opacity="0.25" filter="url(#bigGlow)" class="flick"/>
      <rect x="-8" y="-4" width="16" height="4"/><rect x="-3" y="-16" width="6" height="12"/>
      <rect x="-7" y="-26" width="14" height="10"/><rect x="-4" y="-24" width="8" height="5" fill="#ffb35a" class="flick"/>
      <path d="M-12 -26 L12 -26 L6 -32 L-6 -32Z"/><path d="M-2 -32 L0 -36 L2 -32Z"/>
    </g>`).join("")}

    <!-- Cherry trees swaying -->
    ${[[110, 1], [1090, -1]].map(([x, d], i) => `
    <g transform="translate(${x} 158)">
      <path d="M-4 0 C-6 -20 -2 -34 ${d * 6} -50 L${d * 10} -50 C${d * 4} -34 2 -20 4 0Z" fill="#3e171b"/>
      <path d="M${d * 2} -36 C${d * 14} -44 ${d * 24} -46 ${d * 34} -52" stroke="#3e171b" stroke-width="3" fill="none"/>
      <path d="M${d * 4} -44 C${-d * 8} -52 ${-d * 16} -56 ${-d * 24} -58" stroke="#3e171b" stroke-width="2.6" fill="none"/>
      <g class="${i ? "swayR" : "swayL"}" style="transform-origin:${x}px 108px">
        ${Array.from({ length: 26 }, (_, k) => {
          const a = k * 2.399, r = 6 + (k % 7) * 4.2;
          const cx = (Math.cos(a) * r * 1.5 * d + d * 6).toFixed(1), cy = (-64 + Math.sin(a) * r * 0.75).toFixed(1);
          const col = ["#a8344e", "#c24a62", "#d8687c", "#b83c56", "#e88a9c"][k % 5];
          return `<circle cx="${cx}" cy="${cy}" r="${(7 + (k % 4) * 2).toFixed(1)}" fill="${col}" opacity="0.82"/>`;
        }).join("")}
        ${Array.from({ length: 9 }, (_, k) => `<circle cx="${((k * 9 - 36) * d).toFixed(1)}" cy="${(-48 - (k % 3) * 2).toFixed(1)}" r="2" fill="#f4a0b0"/>`).join("")}
      </g>
    </g>`).join("")}

    <g class="fogA" opacity="0.6">
      ${[0, W].map((o) => `<ellipse cx="${o + 300}" cy="156" rx="320" ry="18" fill="#f4b36a" opacity="0.32" filter="url(#bigGlow)"/><ellipse cx="${o + 900}" cy="160" rx="340" ry="16" fill="#f4b36a" opacity="0.28" filter="url(#bigGlow)"/>`).join("")}
    </g>
    <rect y="126" width="${W}" height="${H - 126}" fill="url(#fog)"/>

    <!-- Embers rising -->
    <g fill="#ffb35a">
      ${Array.from({ length: 12 }, (_, i) => `<circle cx="${60 + i * 98}" cy="${H}" r="${i % 3 ? 1.2 : 1.8}" class="ember" style="animation-duration:${5 + (i % 4)}s;animation-delay:${-i * 0.9}s"/>`).join("")}
    </g>

    <!-- Lightning from the sky into the raised spear -->
    ${bolt([[st[0] + 30, -10], [st[0] + 14, st[1] * 0.3], [st[0] + 26, st[1] * 0.5], [st[0] + 6, st[1] * 0.75], [st[0], st[1]]], 7.75, 0.5, 3.2)}
    ${bolt([[st[0] - 60, -10], [st[0] - 48, 16], [st[0] - 64, 32], [st[0] - 50, 50]], 7.82, 0.35, 2)}

    <g>
      <animateTransform attributeName="transform" type="translate" values="${shake.v.join(";")}" keyTimes="${shake.k.map(f4).join(";")}" dur="${LOOP}s" repeatCount="indefinite"/>

      ${fighter(saintPoses, saintOpts)}
      ${fighter(heroPoses, { ...heroOpts, glowBlade: katanaGlow(8.15, 8.65) })}

      <!-- Weapon trails -->
      ${trail(heroPoses, 1.95, 2.1, KATANA, HS, false)}
      ${trail(heroPoses, 2.25, 2.4, KATANA, HS, false)}
      ${trail(heroPoses, 2.55, 2.72, KATANA, HS, false)}
      ${trail(heroPoses, 5.85, 6.05, KATANA, HS, false)}
      ${trail(heroPoses, 8.5, 8.65, KATANA, HS, false, "#ff8a5a")}
      ${trail(saintPoses, 3.1, 3.3, SPEAR, SS, true)}
      ${trail(saintPoses, 3.65, 3.75, SPEAR, SS, true)}
      ${trail(saintPoses, 3.92, 4.15, SPEAR, SS, true)}
      ${trail(saintPoses, 4.32, 4.55, SPEAR, SS, true)}
      ${trail(saintPoses, 7.95, 8.1, SPEAR, SS, true, "#ff5a2a")}

      <!-- Clashes and hits -->
      ${impact(heroTip(2.1), 2.1)}
      ${impact(heroTip(2.4), 2.4)}
      ${impact(heroTip(2.72), 2.72, "#ffd27a")}
      ${impact(saintTip(3.75), 3.75, "#ffd27a")}
      ${impact(saintTip(4.15), 4.15, "#ffd27a")}
      ${impact(heroChest(4.55), 4.55, "#ffb08a", true)}
      ${impact([saintChest(5.4)[0] - 4, G - 22], 5.35, "#fff2cf", true)}
      ${impact(heroTip(6.05), 6.05, "#fff2cf", true)}
      ${sparks(heroTip(6.3)[0], heroTip(6.3)[1], T(6.35), 8)}
      ${sparks(heroTip(6.6)[0], heroTip(6.6)[1], T(6.6), 8)}
      ${impact(saintChest(8.72), 8.72, "#ffb08a", true)}
      ${impact(saintChest(9.55), 9.55, "#fff2cf", true)}

      <!-- Lightning wave and the reversal bolt -->
      ${wave(8.1)}
      ${bolt([heroTip(8.65), [heroTip(8.65)[0] + 60, heroTip(8.65)[1] + 14], [heroTip(8.65)[0] + 120, heroTip(8.65)[1] - 6], [saintChest(8.72)[0] - 40, saintChest(8.72)[1] + 10], saintChest(8.72)], 8.65, 0.45, 3)}

      <!-- Dust -->
      ${dust(505, 3.5)}${dust(560, 5.35, 1.3)}${dust(650, 8.5)}${dust(690, 9.8)}${dust(962, 9.85, 1.2)}${dust(830, 5.6)}
      ${[1.25, 1.5, 1.75].map((s, i) => dust([450, 520, 580][i], s, 0.6)).join("")}
    </g>

    <!-- Screen flashes -->
    <rect width="${W}" height="${H}" fill="#fff6e6" opacity="0">${anim("opacity", [0, 0, 0.5, 0, 0.3, 0, 0], [0, T(7.75) - 0.001, T(7.75), T(7.8), T(7.84), T(7.9), 1])}</rect>
    <rect width="${W}" height="${H}" fill="#fff6e6" opacity="0">${pulse(T(8.65), 0.015, 0.35)}</rect>

    <!-- ===== Foreground ===== -->
    <path fill="${SH}" d="M-10 ${G} C200 ${G - 2} 400 ${G + 2} 600 ${G} C800 ${G - 2} 1000 ${G + 2} 1210 ${G} L1210 ${H} L-10 ${H}Z"/>
    <!-- Grass tufts swaying -->
    <g stroke="${SH}" stroke-linecap="round" fill="none">
      ${[[16, 1], [34, 0.8], [52, 0.6], [240, 0.5], [258, 0.45], [960, 0.5], [1150, 1], [1168, 0.8], [1186, 0.6]].map(([x, s], i) => `
      <g class="grass" style="transform-origin:${x}px ${H}px;animation-delay:${-i * 0.4}s">
        <path d="M${x} ${H} Q${x + 6 * s} ${H - 24 * s} ${x - 4 * s} ${H - 50 * s}" stroke-width="${3 * s + 0.6}"/>
        <path d="M${x + 4} ${H} Q${x + 14 * s} ${H - 20 * s} ${x + 24 * s} ${H - 38 * s}" stroke-width="${2.4 * s + 0.5}"/>
      </g>`).join("")}
    </g>
    <!-- Dark blossom branches framing the scene, below the health bars -->
    <g fill="${SH}">
      <g class="swayL" style="transform-origin:0px 60px">
        <path d="M-10 54 C30 58 70 66 110 64 C120 63 124 67 112 70 C70 74 30 66 -10 64Z"/>
        <path d="M60 64 C70 72 78 82 76 92" stroke="${SH}" stroke-width="2.4" fill="none"/>
        ${[[110, 66, 6], [96, 60, 5], [76, 94, 5], [40, 58, 4], [124, 70, 4]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join("")}
      </g>
      <g class="swayR" style="transform-origin:1200px 60px">
        <path d="M1210 56 C1170 60 1130 68 1092 66 C1082 65 1078 69 1090 72 C1130 76 1170 68 1210 66Z"/>
        <path d="M1136 66 C1128 76 1122 86 1126 96" stroke="${SH}" stroke-width="2.4" fill="none"/>
        ${[[1092, 68, 6], [1106, 62, 5], [1126, 98, 5], [1160, 60, 4], [1080, 72, 4]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join("")}
      </g>
    </g>
    <!-- Petals on the wind -->
    <g>
      ${[[60, 9, -2, 10], [90, 11, -7, 8], [40, 10, -4.5, 9], [120, 12, -9, 8], [76, 8.5, -1, 7], [104, 10.5, -5.5, 9]].map(([y, d, dl, w], i) => `<g transform="translate(1230,${y})"><path class="drift" fill="${i % 2 ? "#ffc0c8" : "#ff9aa8"}" style="animation-duration:${d}s;animation-delay:${dl}s" d="${petal(w)}"/></g>`).join("")}
    </g>

    <!-- Health bars -->
    ${bar(24, 360, 1, [[3.75, 0.97], [4.15, 0.94], [4.55, 0.72]], "ARNAV", 24, "start")}
    ${bar(816, 360, -1, [[2.1, 0.97], [2.4, 0.94], [2.72, 0.92], [5.35, 0.78], [6.05, 0.74], [8.72, 0.42], [9.55, 0.15]], "SWORD SAINT", 1176, "end")}
    <g transform="translate(600 20)">
      <path d="M-16 -10 L16 -10 L20 0 L16 10 L-16 10 L-20 0Z" fill="${SH}" opacity="0.85"/>
      <text x="0" y="5" text-anchor="middle" font-family="${SERIF}" font-size="13" font-weight="700" fill="#fbe9c9">VS</text>
    </g>

    <rect width="${W}" height="${H}" fill="url(#vignette)"/>
  </g>
</svg>
`;
}

// ---------- the dojo: a dusk room where the swordsman codes ----------
function dojo() {
  const W = 1200, H = 420, SH = "#0b0908", LOOP = 12;
  const lines = profile.dojo.terminal;
  const rad = (d) => (d * Math.PI) / 180;
  const kt = (a) => a.map((n) => +Math.min(Math.max(n, 0), 1).toFixed(4)).join(";");

  // The scroll in his hands: headings in vermilion, answers in ink, written line by line
  const SX = 716, SY = 104, SW = 300, SHT = 204, SROT = 0;
  let y = 40;
  const rows = lines.map((l) => {
    const head = l.startsWith(">"), done = l.startsWith("★");
    const text = head ? l.replace(/^>\s*/, "").toUpperCase() : done ? l.replace(/^★\s*/, "") : l;
    const row = { text, head, done, y };
    y += head ? 21 : 28;
    return row;
  });
  const sealAt = 0.1 + rows.length * 0.07;
  const scrollText = rows.map((r, i) => {
    const t0 = 0.1 + i * 0.07, t1 = t0 + 0.05;
    const x = 36;
    const w = r.text.length * (r.head ? 14 : 9.6) + 30;
    const style = r.head
      ? `font-family="Georgia,'Times New Roman',serif" font-size="12" font-weight="700" letter-spacing="4" fill="#a3241b"`
      : `font-family="Georgia,'Times New Roman',serif" font-style="italic" font-size="17" fill="${r.done ? "#7a5f1a" : "#1b1714"}"`;
    const mark = r.head ? `<path d="M${x - 15} ${r.y - 4} l6 -4 l6 4 l-6 4Z" fill="#a3241b"/>` : "";
    return `
        <clipPath id="ln${i}"><rect x="${x - 18}" y="${r.y - 18}" width="0" height="24">
          <animate attributeName="width" values="0;0;${w};${w}" keyTimes="${kt([0, t0, t1, 1])}" dur="${LOOP}s" repeatCount="indefinite"/>
        </rect></clipPath>
        <g clip-path="url(#ln${i})">${mark}<text x="${x}" y="${r.y}" ${style}>${esc(r.text)}</text></g>`;
  }).join("");

  const flutter = (dur, a, b) => `<path><animate attributeName="d" dur="${dur}s" repeatCount="indefinite" values="${a};${b};${a}"/></path>`;
  const lantern = (x, i) => `
    <g transform="translate(${x} 34)">
      <line x1="0" y1="0" x2="0" y2="26" stroke="${SH}" stroke-width="2"/>
      <g>
        <animateTransform attributeName="transform" type="rotate" values="-3 0 0;3 0 0;-3 0 0" dur="${4 + i}s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
        <ellipse cx="0" cy="48" rx="46" ry="40" fill="#ff9a4a" opacity="0.28" filter="url(#dGlow)" class="flick"/>
        <rect x="-13" y="24" width="26" height="5" fill="${SH}"/>
        <rect x="-16" y="28" width="32" height="38" rx="14" fill="#c4361f"/>
        <rect x="-10" y="33" width="20" height="28" rx="9" fill="#ffb066" opacity="0.6" class="flick"/>
        ${[38, 47, 56].map((y) => `<line x1="-16" y1="${y}" x2="16" y2="${y}" stroke="#7a1810" stroke-width="1.2"/>`).join("")}
        <rect x="-10" y="65" width="20" height="5" fill="${SH}"/>
        <line x1="0" y1="70" x2="0" y2="80" stroke="${SH}" stroke-width="1.6"/>
      </g>
    </g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>${filters}
    <clipPath id="dFrame"><rect width="${W}" height="${H}" rx="14"/></clipPath>
    <clipPath id="dDoor"><rect x="150" y="40" width="900" height="290"/></clipPath>
    <linearGradient id="dSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2b0f1f"/><stop offset="0.45" stop-color="#8a2a24"/>
      <stop offset="0.78" stop-color="#e0773a"/><stop offset="1" stop-color="#f4b36a"/>
    </linearGradient>
    <radialGradient id="dSun" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff1c8"/><stop offset="0.7" stop-color="#ffc77a"/><stop offset="1" stop-color="#ff9a4a"/></radialGradient>
    <radialGradient id="dHalo"><stop offset="0" stop-color="#ffd38a" stop-opacity="0.7"/><stop offset="1" stop-color="#ffd38a" stop-opacity="0"/></radialGradient>
    <linearGradient id="dFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a1a12"/><stop offset="1" stop-color="#0b0908"/></linearGradient>
    <linearGradient id="dShoji" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0c98e"/><stop offset="1" stop-color="#d9894a"/></linearGradient>
    <linearGradient id="dRay" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd8a0" stop-opacity="0.35"/><stop offset="1" stop-color="#ffd8a0" stop-opacity="0"/></linearGradient>
    <linearGradient id="dParch" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ece3d2"/><stop offset="1" stop-color="#d6c9b2"/></linearGradient>
    <radialGradient id="dVig" cx="0.5" cy="0.5" r="0.75"><stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.6"/></radialGradient>
    <filter id="dGlow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="10"/></filter>
    <filter id="dEye" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="2"/></filter>
    <style>
      .flick { animation: flick 1.8s steps(5) infinite; }
      .drift { animation: wind linear infinite; }
      .fogD { animation: fogD 40s linear infinite; }
      .tw { animation: tw 3s ease-in-out infinite; }
      .mote { animation: mote linear infinite; }
      @keyframes mote { 0% { transform: translate(0,0); opacity: 0 } 20% { opacity: .7 } 100% { transform: translate(-30px,-90px); opacity: 0 } }
      @keyframes flick { 0%,100% { opacity: .9 } 30% { opacity: .5 } 60% { opacity: 1 } 80% { opacity: .65 } }
      @keyframes fogD { from { transform: translateX(0) } to { transform: translateX(-900px) } }
      @keyframes tw { 0%,100% { opacity: .2 } 50% { opacity: .9 } }
      @keyframes wind {
        0% { transform: translate(0,0) rotate(0deg); opacity: 0 }
        8% { opacity: 1 } 90% { opacity: 1 }
        100% { transform: translate(-900px,220px) rotate(-600deg); opacity: 0 }
      }
    </style>
  </defs>
  <g clip-path="url(#dFrame)">
    <rect width="${W}" height="${H}" fill="${SH}"/>

    <!-- The view through the open doors -->
    <g clip-path="url(#dDoor)">
      <rect x="150" y="40" width="900" height="290" fill="url(#dSky)"/>
      ${[[240, 60], [420, 52], [700, 66], [880, 56], [980, 70]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="1.2" fill="#ffe9d0" class="tw" style="animation-delay:${-i * 0.6}s"/>`).join("")}
      <circle cx="600" cy="262" r="150" fill="url(#dHalo)"/>
      <circle cx="600" cy="262" r="58" fill="url(#dSun)"/>
      <path fill="#a8503e" opacity="0.55" d="M150 262 L230 236 L300 248 L390 220 L470 244 L560 230 L650 250 L740 226 L830 244 L920 222 L1050 246 L1050 330 L150 330Z"/>
      <g class="fogD" opacity="0.55">
        ${[0, 900].map((o) => `<ellipse cx="${o + 360}" cy="262" rx="260" ry="14" fill="#f6b46c" opacity="0.45" filter="url(#dGlow)"/><ellipse cx="${o + 860}" cy="258" rx="280" ry="12" fill="#f6b46c" opacity="0.4" filter="url(#dGlow)"/>`).join("")}
      </g>
      <path fill="#7a2f2c" d="M150 288 L260 268 L350 280 L460 262 L560 282 L680 270 L780 284 L860 266 L900 250 L960 246 L1010 262 L1050 270 L1050 330 L150 330Z"/>
      <!-- Castle on the far cliff -->
      <g fill="#4e1e22" transform="translate(386 252)">
        <rect x="-24" y="-12" width="48" height="12"/><path d="M-33 -10 Q-26 -15 -24 -19 L24 -19 Q26 -15 33 -10Z"/>
        <rect x="-16" y="-30" width="32" height="11"/><path d="M-24 -28 Q-18 -33 -16 -36 L16 -36 Q18 -33 24 -28Z"/>
        <path d="M-6 -36 L0 -46 L6 -36Z"/>
      </g>
      ${[[374, 244], [390, 244], [382, 228]].map(([x, y], i) => `<rect x="${x}" y="${y}" width="3" height="4" fill="#ffb35a" class="flick" style="animation-delay:${-i * 0.5}s"/>`).join("")}
      <!-- Torii and a cherry tree on the near ridge -->
      <g fill="#4a1c20" transform="translate(300 300)"><rect x="-22" y="-32" width="4" height="34"/><rect x="18" y="-32" width="4" height="34"/><path d="M-31 -34 Q0 -40 31 -34 L29 -30 Q0 -35 -29 -30Z"/><rect x="-24" y="-25" width="48" height="3"/></g>
      <g transform="translate(820 318)">
        <path d="M-3 0 C-5 -18 -1 -30 4 -42 L8 -42 C4 -30 2 -18 3 0Z" fill="#3e171b"/>
        ${Array.from({ length: 16 }, (_, k) => { const a = k * 2.399, r = 4 + (k % 6) * 3.4; return `<circle cx="${(Math.cos(a) * r * 1.5 + 6).toFixed(1)}" cy="${(-52 + Math.sin(a) * r * 0.7).toFixed(1)}" r="${6 + (k % 3) * 2}" fill="${["#a8344e", "#c24a62", "#d8687c", "#e88a9c"][k % 4]}" opacity="0.85"/>`; }).join("")}
      </g>
      <rect x="150" y="300" width="900" height="30" fill="#f4b36a" opacity="0.25"/>
    </g>

    <!-- Light rays falling into the room -->
    <g opacity="0.7">
      <path d="M420 40 L560 40 L820 420 L560 420Z" fill="url(#dRay)"><animate attributeName="opacity" values="0.6;1;0.6" dur="6s" repeatCount="indefinite"/></path>
      <path d="M640 40 L720 40 L980 420 L830 420Z" fill="url(#dRay)" opacity="0.6"><animate attributeName="opacity" values="0.4;0.8;0.4" dur="7s" repeatCount="indefinite"/></path>
    </g>

    <!-- Half-open shoji doors glowing with dusk light -->
    ${[[150, 150], [900, 150]].map(([x, w]) => `
    <g>
      <rect x="${x}" y="40" width="${w}" height="290" fill="url(#dShoji)" opacity="0.9"/>
      <g stroke="${SH}" stroke-width="3">
        ${[1, 2].map((k) => `<line x1="${x + (w / 3) * k}" y1="40" x2="${x + (w / 3) * k}" y2="330"/>`).join("")}
        ${[1, 2, 3, 4, 5].map((k) => `<line x1="${x}" y1="${40 + 48 * k}" x2="${x + w}" y2="${40 + 48 * k}"/>`).join("")}
      </g>
      <rect x="${x}" y="40" width="${w}" height="290" fill="none" stroke="${SH}" stroke-width="8"/>
    </g>`).join("")}

    <!-- Room frame: beams, posts, floor -->
    <rect x="0" y="0" width="${W}" height="40" fill="${SH}"/>
    <rect x="0" y="34" width="${W}" height="10" fill="#1a110d"/>
    <rect x="0" y="0" width="150" height="${H}" fill="${SH}"/>
    <rect x="1050" y="0" width="150" height="${H}" fill="${SH}"/>
    <rect x="132" y="0" width="22" height="${H}" fill="#1a110d"/>
    <rect x="1046" y="0" width="22" height="${H}" fill="#1a110d"/>
    <path d="M0 330 L${W} 330 L${W} ${H} L0 ${H}Z" fill="url(#dFloor)"/>
    ${Array.from({ length: 9 }, (_, i) => `<line x1="${i * 150}" y1="330" x2="${i * 150 - 90}" y2="${H}" stroke="#000" stroke-width="2" opacity="0.6"/>`).join("")}
    <ellipse cx="640" cy="350" rx="300" ry="16" fill="#ff9a4a" opacity="0.18" filter="url(#dGlow)"/>

    ${lantern(240, 0)}${lantern(960, 1)}

    <!-- The swordsman, facing us, cross-legged, reading a scroll open across his lap -->
    <ellipse cx="470" cy="300" rx="120" ry="60" fill="#ffd8a0" opacity="0.16" filter="url(#dGlow)"><animate attributeName="opacity" values="0.1;0.22;0.1" dur="4s" repeatCount="indefinite"/></ellipse>
    <g transform="translate(470 336) scale(1.15)" fill="${SH}">
      <!-- scarf tails blowing to one side -->
      ${flutter(0.9, "M18 -100 C38 -104 58 -98 78 -104 C64 -92 42 -92 20 -94Z", "M18 -100 C38 -96 58 -106 80 -98 C64 -88 42 -90 20 -94Z")}
      ${flutter(1.1, "M16 -96 C32 -92 48 -84 66 -86 C52 -78 34 -80 16 -90Z", "M16 -96 C32 -96 48 -92 68 -96 C54 -82 34 -82 16 -90Z")}
      <!-- crossed legs -->
      <path d="M-84 0 C-86 -14 -64 -28 -32 -30 L32 -30 C64 -28 86 -14 84 0Z"/>
      <ellipse cx="-62" cy="-12" rx="22" ry="12"/><ellipse cx="62" cy="-12" rx="22" ry="12"/>
      <!-- torso and shoulders -->
      <path d="M-36 -26 C-40 -56 -36 -86 -22 -100 L22 -100 C36 -86 40 -56 36 -26Z"/>
      <circle cx="-28" cy="-92" r="12"/><circle cx="28" cy="-92" r="12"/>
      <path d="M-36 -34 L36 -34 L37 -27 L-37 -27Z"/>
      <path d="M-14 -100 L0 -80 L14 -100" stroke="#2a201b" stroke-width="2" fill="none"/>
      <rect x="-6" y="-112" width="12" height="14"/>
      <!-- head bowed over the scroll, nodding as he reads -->
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 2;0 2;0 0;0 0" keyTimes="0;0.25;0.6;0.8;1" dur="6s" repeatCount="indefinite"/>
        <ellipse cx="0" cy="-124" rx="15" ry="17"/>
        <circle cx="0" cy="-144" r="6.5"/><rect x="-3" y="-141" width="6" height="4"/>
        <path d="M-14 -132 C-6 -137 6 -137 14 -132 L15 -128 C6 -132 -6 -132 -15 -128Z"/>
        ${flutter(0.7, "M13 -131 C22 -134 30 -130 40 -134 C34 -124 24 -124 14 -127Z", "M13 -131 C22 -128 30 -132 42 -128 C34 -120 24 -122 14 -127Z")}
        <path d="M-12 -126 C-10 -138 10 -138 12 -126 L10 -129 L4 -133 L0 -129 L-5 -133 L-10 -129Z"/>
        <!-- eyes, looking down at the scroll -->
        <path d="M-9 -119 Q-6 -117.5 -3 -119" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" filter="url(#dEye)"/>
        <path d="M3 -119 Q6 -117.5 9 -119" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" filter="url(#dEye)"/>
        <path d="M-8.5 -119 Q-6 -118 -3.5 -119" stroke="#fff" stroke-width="0.9" fill="none"/>
        <path d="M3.5 -119 Q6 -118 8.5 -119" stroke="#fff" stroke-width="0.9" fill="none"/>
      </g>
      <!-- the scroll open across his lap -->
      <path d="M-50 -50 L50 -50 L60 -28 L-60 -28Z" fill="url(#dParch)"/>
      <path d="M-50 -50 L50 -50 L60 -28 L-60 -28Z" filter="url(#grain)" opacity="0.5"/>
      <g stroke="#1b1714" stroke-width="1" opacity="0.65">
        ${[-36, -24, -12, 0, 12, 24, 36].map((x, k) => `<line x1="${x}" y1="${-46 + (k % 2)}" x2="${x * 1.1}" y2="${-34 - (k % 3)}"/>`).join("")}
      </g>
      <rect x="30" y="-40" width="7" height="7" fill="#b3261e" opacity="0.85"/>
      <rect x="-60" y="-52" width="10" height="28" rx="4" fill="#3a2414"/>
      <rect x="50" y="-52" width="10" height="28" rx="4" fill="#3a2414"/>
      <!-- arms with wide sleeves, both hands holding the rollers -->
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -1.2;0 0" dur="3.5s" repeatCount="indefinite"/>
        <path d="M-38 -96 C-50 -84 -58 -66 -60 -50 L-48 -46 C-46 -60 -38 -74 -26 -84Z"/>
        <path d="M-40 -84 C-52 -74 -62 -60 -66 -46 C-58 -44 -50 -50 -46 -58 C-44 -66 -38 -74 -32 -80Z" opacity="0.9"/>
        <ellipse cx="-55" cy="-44" rx="7" ry="6"/>
        <path d="M38 -96 C50 -84 58 -66 60 -50 L48 -46 C46 -60 38 -74 26 -84Z"/>
        <path d="M40 -84 C52 -74 62 -60 66 -46 C58 -44 50 -50 46 -58 C44 -66 38 -74 32 -80Z" opacity="0.9"/>
        <ellipse cx="55" cy="-44" rx="7" ry="6"/>
      </g>
    </g>
    <!-- a thread of light from the lap scroll to the great scroll -->
    <path d="M540 286 C600 260 650 220 ${SX - 14} ${SY + SHT / 2}" stroke="#ffd8a0" stroke-width="1.4" fill="none" stroke-dasharray="3 6" opacity="0.5">
      <animate attributeName="stroke-dashoffset" values="0;-36" dur="1.5s" repeatCount="indefinite"/>
    </path>

    <!-- The display scroll beside him: opens downward, then your details write themselves -->
    <g transform="translate(${SX} ${SY}) rotate(${SROT})">
      <ellipse cx="${SW / 2}" cy="${SHT / 2}" rx="${SW * 0.75}" ry="${SHT * 0.7}" fill="#ffd8a0" opacity="0.2" filter="url(#dGlow)"><animate attributeName="opacity" values="0.14;0.26;0.14" dur="4s" repeatCount="indefinite"/></ellipse>
      <clipPath id="unroll"><rect x="-4" y="0" width="${SW + 8}" height="0">
        <animate attributeName="height" values="0;${SHT};${SHT};0;0" keyTimes="${kt([0, 0.07, 0.92, 0.98, 1])}" dur="${LOOP}s" repeatCount="indefinite"/>
      </rect></clipPath>
      <g clip-path="url(#unroll)">
        <rect x="0" y="0" width="${SW}" height="${SHT}" fill="url(#dParch)"/>
        <rect x="0" y="0" width="${SW}" height="${SHT}" filter="url(#grain)" opacity="0.55"/>
        <rect x="0" y="0" width="8" height="${SHT}" fill="#7a1810" opacity="0.8"/>
        <rect x="${SW - 8}" y="0" width="8" height="${SHT}" fill="#7a1810" opacity="0.8"/>
        <rect x="14" y="10" width="${SW - 28}" height="${SHT - 20}" fill="none" stroke="#a3241b" stroke-opacity="0.45" stroke-width="1.1"/>
        ${scrollText}
        <g opacity="0">
          <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="${kt([0, sealAt, sealAt + 0.01, 0.9, 0.92, 1])}" dur="${LOOP}s" repeatCount="indefinite"/>
          <circle cx="${SW - 36}" cy="${SHT - 32}" r="14" fill="#b3261e"/>
          <circle cx="${SW - 36}" cy="${SHT - 32}" r="10" fill="none" stroke="#efe6d6" stroke-width="1.2"/>
          <path d="M${SW - 41} ${SHT - 32} L${SW - 31} ${SHT - 32} M${SW - 36} ${SHT - 37} L${SW - 36} ${SHT - 27}" stroke="#efe6d6" stroke-width="1.5"/>
        </g>
      </g>
      <!-- top roller stays in his hand; bottom roller drops as it unrolls -->
      <rect x="-10" y="-8" width="${SW + 20}" height="12" rx="5" fill="#3a2414"/>
      <rect x="-14" y="-9" width="8" height="14" rx="3" fill="${SH}"/><rect x="${SW + 6}" y="-9" width="8" height="14" rx="3" fill="${SH}"/>
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 ${SHT};0 ${SHT};0 0;0 0" keyTimes="${kt([0, 0.07, 0.92, 0.98, 1])}" dur="${LOOP}s" repeatCount="indefinite"/>
        <rect x="-10" y="-4" width="${SW + 20}" height="12" rx="5" fill="#3a2414"/>
        <rect x="-14" y="-5" width="8" height="14" rx="3" fill="${SH}"/><rect x="${SW + 6}" y="-5" width="8" height="14" rx="3" fill="${SH}"/>
      </g>
      ${Array.from({ length: 5 }, (_, i) => `<circle cx="${30 + i * 40}" cy="${SHT}" r="${i % 2 ? 1.4 : 2}" fill="#1b1714" class="mote" style="animation-delay:${-i * 0.8}s;animation-duration:${4 + (i % 3)}s"/>`).join("")}
    </g>

    <!-- katana resting beside him -->
    <path d="M250 336 C280 330 320 330 352 334" stroke="${SH}" stroke-width="5" fill="none"/>

    <!-- Katana stand and incense on the right -->
    <g fill="${SH}">
      <rect x="1080" y="290" width="6" height="44"/><rect x="1160" y="290" width="6" height="44"/><rect x="1072" y="330" width="104" height="6"/>
      <path d="M1066 290 C1100 282 1150 282 1186 288" stroke="${SH}" stroke-width="6" fill="none"/>
      <path d="M1066 290 L1094 286" stroke="#a3241b" stroke-width="6"/>
      <rect x="300" y="322" width="16" height="12" rx="3"/>
    </g>
    <path d="M308 322 C300 300 318 280 306 256 C298 236 314 218 308 196" stroke="#e8d8c0" stroke-width="2" fill="none" opacity="0.45">
      <animate attributeName="d" dur="4s" repeatCount="indefinite" values="M308 322 C300 300 318 280 306 256 C298 236 314 218 308 196;M308 322 C318 300 298 280 312 256 C320 236 302 218 310 196;M308 322 C300 300 318 280 306 256 C298 236 314 218 308 196"/>
    </path>

    <!-- Petals blowing in through the doors -->
    <g>
      ${[[90, 10, -1], [150, 12, -5], [60, 9, -3], [200, 11, -8], [120, 13, -10]].map(([y, d, dl], i) => `<g transform="translate(1060,${y})"><path class="drift" fill="${i % 2 ? "#ffc0c8" : "#ff9aa8"}" style="animation-duration:${d}s;animation-delay:${dl}s" d="${petal(10)}"/></g>`).join("")}
    </g>

    <rect width="${W}" height="${H}" fill="url(#dVig)"/>
  </g>
</svg>
`;
}

// ---------- shared pieces for the parchment sections ----------
const gh = (() => {
  try { return JSON.parse(read("data/github.json")); } catch { return null; }
})();
const stats = (() => {
  const days = gh?.days || [];
  let run = 0, longest = 0;
  for (const d of days) { run = d.count ? run + 1 : 0; longest = Math.max(longest, run); }
  const best = days.reduce((a, d) => (d.count > (a?.count ?? -1) ? d : a), null);
  return {
    total: gh?.total ?? profile.stats.commits,
    repos: gh?.repos ?? profile.stats.repos,
    active: days.filter((d) => d.count > 0).length,
    best,
    longest,
  };
})();
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

const parchDefs = `
    <linearGradient id="pc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ece3d2"/><stop offset="1" stop-color="#d6c9b2"/></linearGradient>
    <radialGradient id="pcShade" cx="0.5" cy="0.5" r="0.75"><stop offset="0.6" stop-color="#3e2f20" stop-opacity="0"/><stop offset="1" stop-color="#3e2f20" stop-opacity="0.35"/></radialGradient>`;
const card = (x, y, w, h) => `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="url(#pc)"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" filter="url(#grain)" opacity="0.45"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="url(#pcShade)"/>
    <rect x="${x + 1}" y="${y + 1}" width="${w - 2}" height="${h - 2}" rx="9" fill="none" stroke="#3a2a1e" stroke-width="2"/>`;
const svgDoc = (w, h, body, extraDefs = "", style = "") => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs>${filters}${parchDefs}${extraDefs}
    <style>
      .pop { opacity: 0; animation: pop .5s ease-out forwards; }
      @keyframes pop { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
      ${style}
    </style>
  </defs>
${body}
</svg>
`;

// Icons drawn in a 40x40 box
const ICON = {
  blade: `<path d="M6 34 L30 10 L33 7 L34 10 L31 13 L9 36Z" fill="#e8e1d4" stroke="#1b1714" stroke-width="1.4"/><path d="M4 30 L12 38" stroke="#1b1714" stroke-width="3"/><path d="M2 36 L6 40" stroke="#a3241b" stroke-width="3"/>`,
  spear: `<path d="M4 36 L28 12" stroke="#1b1714" stroke-width="3"/><path d="M28 12 L36 4 L34 14Z" fill="#e8e1d4" stroke="#1b1714" stroke-width="1.2"/><path d="M24 14 L30 16" stroke="#a3241b" stroke-width="3"/>`,
  shuriken: `<g transform="translate(20 20)"><g><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="6s" repeatCount="indefinite"/><path d="M0 -16 L4 -4 L16 0 L4 4 L0 16 L-4 4 L-16 0 L-4 -4Z" fill="#1b1714"/><circle r="3" fill="#e6dccb"/></g></g>`,
  flame: `<path d="M20 36 C10 36 8 26 14 20 C14 26 18 26 18 22 C18 14 24 12 22 4 C30 10 32 20 28 26 C30 24 31 22 31 20 C34 26 30 36 20 36Z" fill="#a3241b" stroke="#1b1714" stroke-width="1.4"><animate attributeName="opacity" values="1;0.75;1;0.85;1" dur="1.4s" repeatCount="indefinite"/></path>`,
  star: `<path d="M20 4 L24 15 L36 15 L26 22 L30 34 L20 27 L10 34 L14 22 L4 15 L16 15Z" fill="#c9a227" stroke="#1b1714" stroke-width="1.4"/>`,
  banner: `<path d="M10 4 L10 38" stroke="#1b1714" stroke-width="3"/><path d="M11 6 L34 6 L28 14 L34 22 L11 22Z" fill="#a3241b" stroke="#1b1714" stroke-width="1.4"><animate attributeName="d" dur="1.6s" repeatCount="indefinite" values="M11 6 L34 6 L28 14 L34 22 L11 22Z;M11 6 L32 8 L27 15 L34 21 L11 22Z;M11 6 L34 6 L28 14 L34 22 L11 22Z"/></path>`,
  seal: `<rect x="6" y="6" width="28" height="28" rx="4" fill="#b3261e"/><rect x="10" y="10" width="20" height="20" rx="2" fill="none" stroke="#efe6d6" stroke-width="1.4"/>`,
  coin: `<circle cx="20" cy="20" r="14" fill="#c9a227" stroke="#7a5f1a" stroke-width="2"/><rect x="15" y="15" width="10" height="10" fill="#e6dccb" stroke="#7a5f1a" stroke-width="1.4"/>`,
  blossom: Array.from({ length: 5 }, (_, i) => { const a = i * 1.2566, cx = 20 + 8 * Math.cos(a), cy = 20 + 8 * Math.sin(a); return `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="6" ry="4" transform="rotate(${(a * 57.3 + 90).toFixed(0)} ${cx.toFixed(1)} ${cy.toFixed(1)})" fill="#c24a62"/>`; }).join("") + `<circle cx="20" cy="20" r="3.5" fill="#f4d58a"/>`,
  sword: `<path d="M8 32 L30 10" stroke="#1b1714" stroke-width="3"/><path d="M28 12 L36 4" stroke="#e8e1d4" stroke-width="3"/><path d="M6 28 L12 34" stroke="#a3241b" stroke-width="3"/>`,
  gourd: `<circle cx="20" cy="27" r="10" fill="#a3241b" stroke="#1b1714" stroke-width="1.4"/><circle cx="20" cy="13" r="6" fill="#a3241b" stroke="#1b1714" stroke-width="1.4"/><rect x="18" y="3" width="4" height="5" fill="#1b1714"/>`,
};
const icon = (k, x, y, s = 40) => `<g transform="translate(${x} ${y}) scale(${s / 40})">${ICON[k] || ICON.seal}</g>`;
const T_SERIF = `font-family="Georgia,'Times New Roman',serif"`;
const tagW = (t) => Math.round(t.length * 9.3 + 22);

// ---------- PROSTHETIC TOOLS: four parchment cards with stamped tags ----------
function tools() {
  const W = 1200, gap = 24, cw = (W - gap) / 2, pad = 20;
  const layout = profile.tools.map((t) => {
    const rows = [[]]; let x = 0;
    for (const it of t.items) {
      const w = tagW(it);
      if (x + w > cw - pad * 2 && rows[rows.length - 1].length) { rows.push([]); x = 0; }
      rows[rows.length - 1].push({ it, w, x }); x += w + 10;
    }
    return { t, rows, h: 84 + rows.length * 40 + 12 };
  });
  const rowsOf2 = [];
  for (let i = 0; i < layout.length; i += 2) rowsOf2.push(layout.slice(i, i + 2));
  let y = 4, body = "", n = 0;
  for (const pair of rowsOf2) {
    const h = Math.max(...pair.map((c) => c.h));
    pair.forEach((c, k) => {
      const x = k * (cw + gap);
      body += `<g class="pop" style="animation-delay:${(n++ * 0.12).toFixed(2)}s">${card(x + 1, y, cw - 2, h)}
        <rect x="${x + pad}" y="${y + 16}" width="50" height="50" rx="6" fill="#efe6d6" stroke="#1b1714" stroke-width="2"/>
        ${icon(c.t.icon, x + pad + 5, y + 21)}
        <text x="${x + pad + 66}" y="${y + 42}" ${T_SERIF} font-size="22" font-weight="700" letter-spacing="3" fill="#1b1714">${esc(c.t.title)}</text>
        <text x="${x + pad + 66}" y="${y + 61}" ${T_SERIF} font-size="11" letter-spacing="3" fill="#a3241b">${esc(c.t.sub)}</text>
        ${c.rows.map((row, r) => row.map((tg) => {
          const tx = x + pad + tg.x, ty = y + 80 + r * 40;
          return `<rect x="${tx + 3}" y="${ty + 3}" width="${tg.w}" height="28" fill="#1b1714"/><rect x="${tx}" y="${ty}" width="${tg.w}" height="28" fill="#efe6d6" stroke="#1b1714" stroke-width="1.5"/>
          <text x="${tx + tg.w / 2}" y="${ty + 19}" text-anchor="middle" ${T_SERIF} font-size="13" letter-spacing="2" fill="#1b1714">${esc(tg.it)}</text>`;
        }).join("")).join("")}
      </g>`;
    });
    y += h + gap;
  }
  return svgDoc(W, y - gap + 6, body);
}

// ---------- WAR MAP: the real contribution calendar on parchment ----------
function warmap() {
  const days = gh?.days || [];
  const first = new Date(days[0]?.date || Date.now());
  const offset = first.getUTCDay();
  const cell = 15, gap = 4, x0 = 72, y0 = 104;
  const weeks = Math.ceil((days.length + offset) / 7);
  const W = Math.max(1200, x0 + weeks * (cell + gap) + 40), H = 300;
  let months = "", cells = "", lastMonth = -1;
  const pts = [];
  days.forEach((d, i) => {
    const idx = i + offset, wk = Math.floor(idx / 7), dow = idx % 7;
    const x = x0 + wk * (cell + gap), y = y0 + dow * (cell + gap);
    const dt = new Date(d.date);
    if (dt.getUTCMonth() !== lastMonth && dow <= 1) {
      months += `<text x="${x}" y="${y0 - 12}" ${T_SERIF} font-size="11" letter-spacing="2" fill="#6b5f50">${MONTHS[dt.getUTCMonth()]}</text>`;
      lastMonth = dt.getUTCMonth();
    }
    if (!d.level) {
      cells += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="3" fill="#d8ccb6" stroke="#b9ab93" stroke-width="0.8"/>`;
    } else {
      const col = ["", "#e29aa6", "#cf6a7c", "#b8405a", "#8e1c2e"][d.level];
      const cx = x + cell / 2, cy = y + cell / 2;
      const petals = Array.from({ length: 5 }, (_, k) => {
        const a = k * 1.2566, px = cx + 3.6 * Math.cos(a), py = cy + 3.6 * Math.sin(a);
        return `<ellipse cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" rx="3.4" ry="2.4" transform="rotate(${(a * 57.3 + 90).toFixed(0)} ${px.toFixed(1)} ${py.toFixed(1)})" fill="${col}"/>`;
      }).join("");
      cells += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="3" fill="#e9dfcc" stroke="#b9ab93" stroke-width="0.8"/>
        <g class="pop" style="animation-delay:${(0.2 + (wk / weeks) * 1.8).toFixed(2)}s">${petals}<circle cx="${cx}" cy="${cy}" r="1.6" fill="#f4d58a"/></g>`;
      pts.push([cx, cy]);
    }
  });
  const path = pts.length ? "M" + pts.map((p) => p.join(" ")).join(" L") : "";
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  len = Math.ceil(len) + 10;
  const labels = [[1, "MON"], [3, "WED"], [5, "FRI"]].map(([r, n]) => `<text x="24" y="${y0 + r * (cell + gap) + 11}" ${T_SERIF} font-size="10" letter-spacing="1" fill="#6b5f50">${n}</text>`).join("");
  const range = days.length ? `${days[0].date} → ${days[days.length - 1].date}` : "";
  const body = `${card(1, 1, W - 2, H - 2)}
    <text x="28" y="34" ${T_SERIF} font-size="12" letter-spacing="4" fill="#a3241b">WAR MAP · LAST 12 MONTHS · @${esc(gh?.login || "")}</text>
    <text x="28" y="66" ${T_SERIF} font-size="26" font-weight="700" letter-spacing="4" fill="#1b1714">EVERY COMMIT IS A STEP ON THE PATH.</text>
    <text x="${W - 32}" y="34" text-anchor="end" ${T_SERIF} font-size="10" letter-spacing="3" fill="#6b5f50">CONTRIBUTIONS · ${esc(range)}</text>
    <text x="${W - 32}" y="72" text-anchor="end" ${T_SERIF} font-size="40" font-weight="700" fill="#a3241b">${stats.total}</text>
    ${months}${labels}${cells}
    <path d="${path}" stroke="#a3241b" stroke-width="1.5" stroke-dasharray="3 4" fill="none" opacity="0.75" class="trail" style="stroke-dasharray:${len};stroke-dashoffset:${len}"/>
    <text x="28" y="${H - 24}" ${T_SERIF} font-size="10" letter-spacing="2" fill="#6b5f50">EMPTY PAPER = REST DAY · BLOSSOM = CONTRIBUTIONS (DEEPER RED = MORE) · UPDATED ${esc(gh?.updated || "")}</text>`;
  return svgDoc(W, H, body, "", `.trail { animation: trail 3s ease-in-out .6s forwards; } @keyframes trail { to { stroke-dashoffset: 0 } }`);
}

// ---------- BATTLE RECORD: four stat tiles ----------
function record() {
  const W = 1200, gap = 18, tw = (W - gap * 3) / 4, H = 176;
  const bestLabel = stats.best ? `FIERCEST DAY · ${MONTHS[new Date(stats.best.date).getUTCMonth()]} ${new Date(stats.best.date).getUTCDate()}` : "FIERCEST DAY";
  const tiles = [
    ["coin", String(stats.total).padStart(3, "0"), "SEN · CONTRIBUTIONS"],
    ["blossom", `×${stats.active}`, "DAYS OF TRAINING"],
    ["sword", String(stats.best?.count ?? 0), bestLabel],
    ["gourd", String(stats.longest), "LONGEST STREAK"],
  ];
  const body = tiles.map(([ic, num, label], i) => {
    const x = i * (tw + gap);
    return `<g class="pop" style="animation-delay:${(i * 0.15).toFixed(2)}s">${card(x + 1, 2, tw - 2, H - 4)}
      ${icon(ic, x + tw / 2 - 20, 20)}
      <text x="${x + tw / 2}" y="${112}" text-anchor="middle" ${T_SERIF} font-size="44" font-weight="700" fill="#1b1714">${esc(num)}</text>
      <text x="${x + tw / 2}" y="${146}" text-anchor="middle" ${T_SERIF} font-size="12" letter-spacing="2" fill="#a3241b">${esc(label)}</text>
    </g>`;
  }).join("");
  return svgDoc(W, H, body);
}

// ---------- THE PATH / HONORS: entry cards ----------
function entries(list, gold = false) {
  const W = 1200, h = 118, gap = 16;
  const body = list.map((e, i) => {
    const y = i * (h + gap);
    const chip = e.status || e.when || "";
    const chipW = Math.round(chip.length * 10.5 + 28);
    const live = /NOW/.test(chip);
    return `<g class="pop" style="animation-delay:${(i * 0.15).toFixed(2)}s">${card(1, y + 1, W - 2, h - 2)}
      <rect x="24" y="${y + 22}" width="72" height="72" rx="8" fill="#efe6d6" stroke="#1b1714" stroke-width="2"/>
      ${icon(e.icon, 36, y + 34, 48)}
      <text x="120" y="${y + 50}" ${T_SERIF} font-size="24" font-weight="700" letter-spacing="3" fill="#1b1714">${esc(e.title)}</text>
      <text x="120" y="${y + 74}" ${T_SERIF} font-size="15" letter-spacing="1" fill="#6b4a2f">${esc(e.role || e.sub || "")}</text>
      <text x="120" y="${y + 98}" ${T_SERIF} font-size="14" font-style="italic" fill="#3a302a">${esc(e.desc || "")}</text>
      <g>
        ${live ? `<animate attributeName="opacity" values="1;0.55;1" dur="1.6s" repeatCount="indefinite"/>` : ""}
        <rect x="${W - 24 - chipW}" y="${y + 26}" width="${chipW}" height="28" fill="${gold ? "#c9a227" : "#a3241b"}" stroke="${gold ? "#1b1714" : "none"}" stroke-width="1.5" filter="url(#inkFine)"/>
        <text x="${W - 24 - chipW / 2}" y="${y + 45}" text-anchor="middle" ${T_SERIF} font-size="13" letter-spacing="3" fill="${gold ? "#1b1714" : "#efe6d6"}">${esc(chip)}</text>
      </g>
    </g>`;
  }).join("");
  return svgDoc(W, list.length * (h + gap) - gap + 4, body);
}

// ---------- a realistic crow, built feather by feather ----------
// One feather lying along +x from its base at the origin
const feather = (len, w, angle, x = 0, y = 0, fill = "url(#fthr)") => {
  const d = `M0 ${-w / 2} C${len * 0.3} ${-w / 2} ${len * 0.82} ${-w * 0.42} ${len} 0 C${len * 0.82} ${w * 0.42} ${len * 0.3} ${w / 2} 0 ${w / 2}Z`;
  return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angle.toFixed(1)})"><path d="${d}" fill="${fill}" stroke="#05050a" stroke-width="0.5"/><path d="M1 0 L${(len * 0.92).toFixed(1)} 0" stroke="#3b4050" stroke-width="0.6" opacity="0.8"/></g>`;
};
// The wing is drawn raised: the arm runs from the shoulder (origin) up and back to the wrist
const WRIST = [-24, -38];
const crowWingArm = () => {
  let out = "";
  // secondaries along the trailing edge of the arm
  for (let i = 0; i < 10; i++) {
    const t = 0.12 + i * 0.09;
    out += feather(34 - i * 0.6, 8.5, -168 + i * 2.2, WRIST[0] * t, WRIST[1] * t + 2);
  }
  // coverts layered over the arm
  for (let i = 0; i < 9; i++) {
    const t = 0.08 + i * 0.1;
    out += feather(18, 7, -160 + i * 2, WRIST[0] * t + 2, WRIST[1] * t, "url(#fthrCov)");
  }
  for (let i = 0; i < 8; i++) {
    const t = 0.1 + i * 0.11;
    out += feather(10, 6, -150, WRIST[0] * t + 4, WRIST[1] * t - 1, "url(#fthrCov)");
  }
  return `<path d="M2 2 L${WRIST[0]} ${WRIST[1]}" stroke="#0c0c11" stroke-width="5" stroke-linecap="round"/>` + out;
};
const crowWingHand = () => {
  let out = "";
  // primaries fan out from the wrist, separated at the tips like fingers
  for (let i = 0; i < 7; i++) out += feather(46 + i * 2.6, 8 - i * 0.25, -108 - i * 10, 0, 0);
  // primary coverts
  for (let i = 0; i < 6; i++) out += feather(20, 7, -112 - i * 10, 1, 0, "url(#fthrCov)");
  return out + `<circle r="4" fill="#101016"/>`;
};
const crowWing = (armVals, handVals, keyTimes, splines, dur, scale, opacity) => `
  <g opacity="${opacity}">
    <animateTransform attributeName="transform" type="rotate" values="${armVals}" keyTimes="${keyTimes}" calcMode="spline" keySplines="${splines}" dur="${dur}s" repeatCount="indefinite"/>
    <g transform="scale(${scale})">
      <g transform="translate(${WRIST[0]} ${WRIST[1]})">
        <g>
          <animateTransform attributeName="transform" type="rotate" values="${handVals}" keyTimes="${keyTimes}" calcMode="spline" keySplines="${splines}" dur="${dur}s" repeatCount="indefinite"/>
          ${crowWingHand()}
        </g>
      </g>
      ${crowWingArm()}
    </g>
  </g>`;

function crow() {
  const kt = "0;0.42;1", sp = "0.55 0 0.75 1;0.3 0 0.5 1", dur = 0.95;
  const tail = Array.from({ length: 11 }, (_, i) => feather(46 - Math.abs(i - 5) * 1.6, 9, 180 - 26 + i * 5.2, -42, 3)).join("");
  // small scale-like feather texture over the body
  const texture = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 7; c++) {
    const x = -30 + c * 10 + (r % 2) * 5, y = -10 + r * 7;
    texture.push(`<path d="M${x - 4} ${y} Q${x} ${y + 4} ${x + 4} ${y}" stroke="#2a2d3c" stroke-width="0.7" fill="none" opacity="0.35"/>`);
  }
  return `
      <!-- far wing, deeper in shadow -->
      <g transform="translate(4 -12)">${crowWing("38 0 0;-96 0 0;38 0 0", "8 0 0;-18 0 0;8 0 0", kt, sp, dur, 0.92, 0.55)}</g>
      <!-- tail -->
      ${tail}
      <!-- body -->
      <path d="M-46 2 C-34 -14 -6 -20 20 -18 C36 -16 48 -10 54 -2 C46 8 24 16 -2 16 C-22 16 -38 10 -46 2Z" fill="url(#crowBody)"/>
      <path d="M-40 -2 C-24 -14 0 -18 24 -15" stroke="url(#sheen)" stroke-width="5" fill="none" opacity="0.45"/>
      ${texture.join("")}
      <!-- legs and talons gripping the scroll -->
      <g stroke="#15151a" stroke-linecap="round" fill="none">
        <path d="M6 12 L10 28" stroke-width="3"/><path d="M20 12 L26 28" stroke-width="3"/>
        <path d="M10 28 L5 33 M10 28 L10 34 M10 28 L15 32 M26 28 L21 33 M26 28 L26 34 M26 28 L31 32" stroke-width="1.8"/>
      </g>
      <g transform="translate(18 37) rotate(-6)">
        <rect x="-22" y="-6" width="44" height="12" rx="6" fill="#efe6d6" stroke="#1b1714" stroke-width="1.4"/>
        <rect x="-26" y="-7" width="5" height="14" rx="2" fill="#3a2414"/><rect x="21" y="-7" width="5" height="14" rx="2" fill="#3a2414"/>
        <circle r="4.5" fill="#b3261e"/>
        <path fill="#b3261e"><animate attributeName="d" dur="0.7s" repeatCount="indefinite" values="M-2 4 C-6 12 -14 16 -22 16 C-14 20 -6 16 1 6Z;M-2 4 C-8 10 -16 10 -24 8 C-16 16 -6 14 1 6Z;M-2 4 C-6 12 -14 16 -22 16 C-14 20 -6 16 1 6Z"/></path>
      </g>
      <!-- head -->
      <path d="M40 -10 C44 -24 62 -28 72 -20 C78 -15 79 -8 75 -2 C67 4 50 3 42 -2Z" fill="url(#crowBody)"/>
      <path d="M46 -18 C54 -25 66 -25 72 -19" stroke="url(#sheen)" stroke-width="3" fill="none" opacity="0.5"/>
      <!-- heavy beak with bristles at the base -->
      <path d="M71 -17 C80 -18 93 -14 102 -6 C93 -5 82 -6 72 -6Z" fill="url(#beak)"/>
      <path d="M72 -6 C82 -6 93 -5 100 -5 C92 -1 81 0 71 -1Z" fill="#141418"/>
      <path d="M73 -13 C82 -14 92 -11 99 -7" stroke="#55565e" stroke-width="0.8" fill="none" opacity="0.7"/>
      <g stroke="#0c0c10" stroke-width="0.9" stroke-linecap="round">
        <path d="M70 -15 L78 -15.5"/><path d="M70 -13 L79 -12.5"/><path d="M70 -11 L77 -10"/>
      </g>
      <!-- eye: dark, glossy, with a highlight -->
      <circle cx="65" cy="-15" r="3" fill="#2a2a30"/>
      <circle cx="65" cy="-15" r="2.2" fill="#070708"/>
      <circle cx="65.9" cy="-15.9" r="0.8" fill="#fff"/>
      <!-- near wing -->
      <g transform="translate(6 -13)">${crowWing("46 0 0;-108 0 0;46 0 0", "12 0 0;-24 0 0;12 0 0", kt, sp, dur, 1.06, 1)}</g>`;
}

// ---------- SEND A CROW: contact card ----------
function contact() {
  const W = 1200, H = 210;
  const eyeDef = `<filter id="eyeG" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="1.6"/></filter>
    <linearGradient id="fthr" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#08080c"/><stop offset="0.7" stop-color="#16171e"/><stop offset="1" stop-color="#22242e"/></linearGradient>
    <linearGradient id="fthrCov" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0a0a0f"/><stop offset="1" stop-color="#1c1e2a"/></linearGradient>
    <linearGradient id="crowBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1c26"/><stop offset="0.5" stop-color="#0c0c12"/><stop offset="1" stop-color="#050507"/></linearGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3b4a9a"/><stop offset="0.5" stop-color="#6a4a9a"/><stop offset="1" stop-color="#2a6a8a"/></linearGradient>
    <linearGradient id="beak" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3b42"/><stop offset="1" stop-color="#121216"/></linearGradient>`;
  const c = profile.contact;
  const handles = c.links.map((l) => `${l.kind.toUpperCase()}  ${l.label}`).join("   ·   ");
  const body = `${card(1, 1, W - 2, H - 2)}
    <!-- Wind streaks behind the crow -->
    <g stroke="#6b5f50" stroke-width="1.6" stroke-linecap="round" opacity="0.5">
      ${[[40, 96, 70], [26, 122, 54], [52, 146, 40]].map(([x, y, l], i) => `<line x1="${x}" y1="${y}" x2="${x + l}" y2="${y}"><animate attributeName="opacity" values="0;1;0" dur="${1.2 + i * 0.3}s" begin="${-i * 0.4}s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="translate" values="20 0;-20 0" dur="${1.2 + i * 0.3}s" begin="${-i * 0.4}s" repeatCount="indefinite"/></line>`).join("")}
    </g>
    <!-- The messenger crow, flying right with a sealed scroll in its talons -->
    <g>
      <animateTransform attributeName="transform" type="translate" values="0 0;0 -6;0 0" dur="0.95s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
      <g transform="translate(170 122) scale(0.95)">${crow()}</g>
    </g>
    <text x="300" y="82" ${T_SERIF} font-size="34" font-weight="700" letter-spacing="6" fill="#1b1714">SEND A CROW</text>
    <text x="300" y="116" ${T_SERIF} font-size="17" fill="#3a302a">${esc(c.message)}</text>
    <text x="300" y="150" ${T_SERIF} font-size="14" letter-spacing="2" fill="#a3241b">${esc(handles)}</text>
    ${Array.from({ length: 4 }, (_, i) => `<g transform="translate(${1060 + i * 30} ${50 + (i % 2) * 30})"><path d="${petal(12)}" fill="${i % 2 ? "#c24a62" : "#e88a9c"}"><animateTransform attributeName="transform" type="rotate" values="0 6 0;30 6 0;0 6 0" dur="${3 + i}s" repeatCount="indefinite"/></path></g>`).join("")}`;
  return svgDoc(W, H, body, eyeDef);
}

// Small link button (the README wraps it in a link)
function button(label) {
  const w = Math.round(label.length * 12 + 70), h = 50;
  return svgDoc(w + 6, h + 6, `
    <rect x="5" y="5" width="${w}" height="${h}" fill="#1b1714"/>
    <rect x="1" y="1" width="${w}" height="${h}" fill="url(#pc)" stroke="#1b1714" stroke-width="2"/>
    <text x="${w / 2 - 8}" y="${h / 2 + 7}" text-anchor="middle" ${T_SERIF} font-size="17" font-weight="700" letter-spacing="4" fill="#1b1714">${esc(label)}</text>
    <text x="${w - 26}" y="${h / 2 + 7}" ${T_SERIF} font-size="18" fill="#a3241b">→<animate attributeName="x" values="${w - 28};${w - 22};${w - 28}" dur="1.4s" repeatCount="indefinite"/></text>`);
}

// ---------- README ----------
function readme() {
  const img = (src, alt, extra = "") => `<img src="./assets/${src}" alt="${esc(alt)}" width="100%"${extra}/>`;
  const center = (inner) => `<p align="center">\n  ${inner}\n</p>\n`;
  const sec = (id) => profile.sections.find((s) => s.id === id);
  const H = (id) => center(img(`headers/${id}.svg`, `${sec(id).title}: ${sec(id).tag}`));
  const DUEL = center(img("divider-dash.svg", "Animated duel divider"));
  const DIV = center(img("divider-slash.svg", "Divider"));
  const o = profile.origin;
  const table = ["| | |", "|---|---|", ...o.table.map((r) => `| **${r.label}** | ${r.value} |`)].join("\n");
  const list = (items) => items.map((e) => `- **${e.title}** · ${e.role || e.sub} · ${e.desc}`).join("\n");
  const links = profile.contact.links.map((l) => `<a href="${l.url}"><img src="./assets/btn-${l.kind}.svg" alt="${l.kind}" height="44"/></a>`).join("&nbsp;&nbsp;");
  return `<!-- Generated by scripts/generate.mjs from profile.json. Edit profile.json, not this file. -->

${center(img("hero-hud.svg", `${profile.name.first} ${profile.name.last}: ${profile.role}`))}
${DUEL}
${H("origin")}
${o.bio}

${table}

${DIV}
${H("tools")}
${center(img("tools.svg", "Prosthetic tools: " + profile.tools.map((t) => `${t.title}: ${t.items.join(", ")}`).join("; ")))}
${DIV}
${H("dojo")}
${center(img("dojo.svg", "The dojo: reading a scroll at dusk"))}
${DIV}
${H("warmap")}
${center(img("warmap.svg", `Contribution calendar: ${stats.total} contributions in the last year`))}
${H("record")}
${center(img("record.svg", `${stats.total} contributions, ${stats.active} active days, best day ${stats.best?.count ?? 0}, longest streak ${stats.longest}`))}
> The war map and battle record are drawn from the real contribution calendar by \`scripts/sync.mjs\` and redrawn every day by a scheduled workflow.

${DIV}
${H("path")}
${center(img("path.svg", "The path"))}
${list(profile.path)}

${H("honors")}
${center(img("honors.svg", "Honors"))}
${list(profile.honors)}

${DIV}
${H("contact")}
${center(img("contact.svg", "Send a crow"))}
${center(links)}
${center(img("footer.svg", profile.quote))}`;
}

// ---------- performance pass ----------
// Chrome repaints an animated SVG image every frame and re-runs every filter in it.
// This pass runs on every SVG before it is written and removes per-frame filter work:
//   ink / inkFine / wash displacement → the rough edge is baked into the shape's geometry
//   blur glows                        → soft radial-gradient fills, or translucent strokes
//   grain / stain noise               → a small pre-made texture tile and a few cheap blotches
const ROUGH = { ink: { amp: 2.2, step: 6 }, inkFine: { amp: 0.7, step: 4 }, wash: { amp: 3.4, step: 10 } };
const BLUR = new Set(["glow", "eyeGlow", "bigGlow", "dGlow", "dEye", "glowBlur", "soft", "eyeG"]);
const GRAIN_PNG = (() => { try { return read("templates/grain.png").toString("base64"); } catch { return null; } })();

function seeded(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// Flatten an SVG path into polylines (one per subpath). Returns null for commands it does not handle.
function flattenPath(d) {
  const tok = d.match(/[MLHVCSQTZmlhvcsqtz]|-?\d*\.?\d+(?:e[-+]?\d+)?/g);
  if (!tok || /[Aa]/.test(d)) return null;
  const subs = []; let cur = null, cmd = null, i = 0, x = 0, y = 0, sx = 0, sy = 0, lc = null, lq = null;
  const num = () => parseFloat(tok[i++]);
  const push = (px, py) => cur.pts.push([px, py]);
  const cubic = (x1, y1, x2, y2, x3, y3) => {
    for (let k = 1; k <= 10; k++) {
      const t = k / 10, u = 1 - t;
      push(u * u * u * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3, u * u * u * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3);
    }
    lc = [x2, y2]; x = x3; y = y3;
  };
  const quad = (x1, y1, x2, y2) => {
    for (let k = 1; k <= 8; k++) { const t = k / 8, u = 1 - t; push(u * u * x + 2 * u * t * x1 + t * t * x2, u * u * y + 2 * u * t * y1 + t * t * y2); }
    lq = [x1, y1]; x = x2; y = y2;
  };
  while (i < tok.length) {
    if (/[A-Za-z]/.test(tok[i])) cmd = tok[i++];
    if (!cmd) return null;
    const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase();
    const ox = rel ? x : 0, oy = rel ? y : 0;
    if (C === "Z") { if (cur) { cur.closed = true; x = sx; y = sy; } cmd = null; lc = lq = null; continue; }
    if (C === "M") { x = num() + ox; y = num() + oy; sx = x; sy = y; cur = { pts: [[x, y]], closed: false }; subs.push(cur); cmd = rel ? "l" : "L"; lc = lq = null; continue; }
    if (!cur) return null;
    if (C === "L") { x = num() + ox; y = num() + oy; push(x, y); lc = lq = null; }
    else if (C === "H") { x = num() + (rel ? x : 0); push(x, y); lc = lq = null; }
    else if (C === "V") { y = num() + (rel ? y : 0); push(x, y); lc = lq = null; }
    else if (C === "C") { const a = [num() + ox, num() + oy, num() + ox, num() + oy, num() + ox, num() + oy]; cubic(...a); lq = null; }
    else if (C === "S") { const r = lc ? [2 * x - lc[0], 2 * y - lc[1]] : [x, y]; const a = [num() + ox, num() + oy, num() + ox, num() + oy]; cubic(r[0], r[1], ...a); lq = null; }
    else if (C === "Q") { const a = [num() + ox, num() + oy, num() + ox, num() + oy]; quad(...a); lc = null; }
    else if (C === "T") { const r = lq ? [2 * x - lq[0], 2 * y - lq[1]] : [x, y]; quad(r[0], r[1], num() + ox, num() + oy); lc = null; }
    else return null;
  }
  return subs;
}

// Resample a polyline every `step` units and push points sideways with smooth seeded noise.
function roughen(subs, amp, step, seed) {
  const rnd = seeded(seed);
  const ph = [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28];
  const fr = [0.11 + rnd() * 0.05, 0.31 + rnd() * 0.1, 0.9 + rnd() * 0.3];
  const f = (s) => (Math.sin(s * fr[0] + ph[0]) * 0.55 + Math.sin(s * fr[1] + ph[1]) * 0.3 + Math.sin(s * fr[2] + ph[2]) * 0.15) * amp + (rnd() - 0.5) * amp * 0.35;
  return subs.map(({ pts, closed }) => {
    const p = closed ? [...pts, pts[0]] : pts;
    const out = []; let dist = 0;
    for (let k = 0; k < p.length - 1; k++) {
      const [ax, ay] = p[k], [bx, by] = p[k + 1];
      const len = Math.hypot(bx - ax, by - ay) || 0.0001;
      const nx = -(by - ay) / len, ny = (bx - ax) / len;
      const n = Math.max(1, Math.round(len / step));
      for (let j = 0; j < n; j++) {
        const t = j / n, off = f(dist + t * len);
        out.push([ax + (bx - ax) * t + nx * off, ay + (by - ay) * t + ny * off]);
      }
      dist += len;
    }
    if (!closed) out.push(p[p.length - 1]);
    return "M" + out.map(([a, b]) => `${a.toFixed(1)} ${b.toFixed(1)}`).join(" L") + (closed ? "Z" : "");
  }).join(" ");
}

const ellipsePts = (cx, cy, rx, ry) => [{ pts: Array.from({ length: 48 }, (_, k) => [cx + rx * Math.cos(k * Math.PI / 24), cy + ry * Math.sin(k * Math.PI / 24)]), closed: true }];
const attrsOf = (s) => { const m = {}; for (const [, k, v] of s.matchAll(/([\w:-]+)="([^"]*)"/g)) m[k] = v; return m; };
const attrStr = (m) => Object.entries(m).map(([k, v]) => `${k}="${v}"`).join(" ");

function optimizeSvg(svg) {
  let seed = 1;
  const gradients = new Map();
  const softFill = (color) => {
    const id = "sf" + color.replace(/[^0-9a-z]/gi, "");
    if (!gradients.has(id)) gradients.set(id, `<radialGradient id="${id}"><stop offset="0" stop-color="${color}"/><stop offset="0.5" stop-color="${color}" stop-opacity="0.55"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`);
    return `url(#${id})`;
  };
  // Every element (self-closing or with children) that carries a filter attribute
  svg = svg.replace(/<(path|circle|ellipse|rect|line|polyline|text|g|use|image)\b([^>]*?)\sfilter="url\(#([\w-]+)\)"([^>]*?)(\/?)>/g, (all, tag, a1, id, a2, selfClose) => {
    const m = attrsOf(a1 + " " + a2);
    if (id === "grain") { delete m.fill; m.fill = "url(#grainPat)"; return `<${tag} ${attrStr(m)}${selfClose}>`; }
    if (id === "stain") { delete m.fill; m.fill = "url(#stainPat)"; return `<${tag} ${attrStr(m)}${selfClose}>`; }
    if (ROUGH[id]) {
      const { amp, step } = ROUGH[id];
      let subs = null;
      if (tag === "path" && selfClose && m.d) subs = flattenPath(m.d);
      else if (tag === "circle" && selfClose) subs = ellipsePts(+(m.cx || 0), +(m.cy || 0), +m.r, +m.r);
      else if (tag === "ellipse" && selfClose) subs = ellipsePts(+(m.cx || 0), +(m.cy || 0), +m.rx, +m.ry);
      else if (tag === "rect" && selfClose && !m.transform) {
        const x = +(m.x || 0), y = +(m.y || 0), w = +m.width, h = +m.height;
        subs = [{ pts: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], closed: true }];
      }
      if (subs) {
        for (const k of ["d", "cx", "cy", "r", "rx", "ry", "x", "y", "width", "height"]) delete m[k];
        return `<path d="${roughen(subs, amp, step, seed++ * 7919)}" ${attrStr(m)}/>`;
      }
      return `<${tag} ${attrStr(m)}${selfClose}>`;            // animated or grouped: just drop the filter
    }
    if (BLUR.has(id)) {
      if ((tag === "circle" || tag === "ellipse") && m.fill && !m.fill.startsWith("url")) {
        m.fill = softFill(m.fill);
        for (const k of ["r", "rx", "ry"]) if (m[k]) m[k] = (+m[k] * 1.5).toFixed(1);
      } else if (m.stroke && m.stroke !== "none") m["stroke-opacity"] = "0.4";
      else if (m.fill) m["fill-opacity"] = "0.6";
      return `<${tag} ${attrStr(m)}${selfClose}>`;
    }
    return `<${tag} ${attrStr(m)}${selfClose}>`;
  });
  // Shared texture definitions, only when used
  let defs = [...gradients.values()].join("");
  if (svg.includes("url(#grainPat)") && GRAIN_PNG) defs += `<pattern id="grainPat" patternUnits="userSpaceOnUse" width="96" height="96"><image width="96" height="96" href="data:image/png;base64,${GRAIN_PNG}"/></pattern>`;
  if (svg.includes("url(#stainPat)")) defs += `<pattern id="stainPat" patternUnits="userSpaceOnUse" width="640" height="420"><rect width="640" height="420" fill="none"/>
    <ellipse cx="140" cy="110" rx="160" ry="90" fill="#6b5236" opacity="0.07"/><ellipse cx="460" cy="300" rx="190" ry="110" fill="#6b5236" opacity="0.06"/><ellipse cx="520" cy="80" rx="90" ry="60" fill="#6b5236" opacity="0.05"/></pattern>`;
  if (defs) svg = svg.replace("</defs>", defs + "</defs>");
  // Drop filter definitions nothing references any more
  svg = svg.replace(/<filter id="([\w-]+)"[^>]*>[\s\S]*?<\/filter>/g, (blk, id) => (svg.split(`url(#${id})`).length > 1 ? blk : ""));
  // Respect reduced motion for CSS-driven loops
  svg = svg.replace("</style>", "  @media (prefers-reduced-motion: reduce) { * { animation: none !important } }\n    </style>");
  return svg;
}


// ---------- light divider: a brush stroke cut across parchment (used between most sections) ----------
function slash() {
  const W = 1200, H = 64;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>${filters}
    <linearGradient id="pc" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e6dccb" stop-opacity="0"/><stop offset="0.12" stop-color="#e6dccb"/><stop offset="0.88" stop-color="#e6dccb"/><stop offset="1" stop-color="#e6dccb" stop-opacity="0"/></linearGradient>
    <clipPath id="cut"><rect x="600" y="0" width="0" height="${H}">
      <animate attributeName="x" values="600;90;90" keyTimes="0;0.25;1" dur="6s" repeatCount="indefinite"/>
      <animate attributeName="width" values="0;1020;1020" keyTimes="0;0.25;1" dur="6s" repeatCount="indefinite"/>
    </rect></clipPath>
    <style>.p { animation: drift 7s linear infinite; } @keyframes drift { 0% { transform: translate(1120px,14px) rotate(0); opacity: 0 } 10% { opacity: 1 } 90% { opacity: 1 } 100% { transform: translate(80px,40px) rotate(-540deg); opacity: 0 } }</style>
  </defs>
  <rect x="0" y="18" width="${W}" height="28" fill="url(#pc)" opacity="0.9"/>
  <g clip-path="url(#cut)">
    <path filter="url(#ink)" fill="${C.red2}" d="M100 30 C300 27 500 28 588 30 L588 34 C500 36 300 36 100 34Z"/>
    <path filter="url(#ink)" fill="${C.red2}" d="M612 30 C700 28 900 27 1100 30 L1100 34 C900 36 700 36 612 34Z"/>
  </g>
  <g transform="translate(600 32) rotate(-6)">
    <rect x="-13" y="-13" width="26" height="26" rx="3" fill="${C.red2}" filter="url(#ink)"/>
    <rect x="-9" y="-9" width="18" height="18" rx="1.5" fill="none" stroke="#efe6d6" stroke-width="1.2"/>
  </g>
  <path class="p" d="${petal(10)}" fill="#c4382b"/>
</svg>
`;
}

hero();
for (const s of profile.sections) write(`assets/headers/${s.id}.svg`, header(s));
write("assets/divider-dash.svg", divider());
write("assets/divider-slash.svg", slash());
write("assets/footer.svg", read("templates/footer.svg").toString("utf8"));
write("assets/dojo.svg", dojo());
write("assets/tools.svg", tools());
write("assets/warmap.svg", warmap());
write("assets/record.svg", record());
write("assets/path.svg", entries(profile.path));
write("assets/honors.svg", entries(profile.honors, true));
write("assets/contact.svg", contact());
for (const l of profile.contact.links) write(`assets/btn-${l.kind}.svg`, button(l.kind.toUpperCase()));
write("README.md", readme());
