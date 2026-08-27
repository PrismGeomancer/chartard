const clock = document.querySelector(".live-clock");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function updateClock() {
  if (clock) clock.textContent = new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
updateClock();
window.setInterval(updateClock, 1000);

// Interactive market-signal sculpture. It is deliberately abstract: wallet nodes
// orbit a volatile core while transaction trails cut through the documentary stills.
async function initThreeScene() {
  const canvas = document.querySelector("#hero-canvas");
  const hero = document.querySelector(".hero");
  if (!canvas || !hero) return;

  let THREE;
  try {
    THREE = await import("https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.js");
  } catch {
    canvas.hidden = true;
    return;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  } catch {
    canvas.hidden = true;
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0, 8.5);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
  renderer.setClearColor(0x000000, 0);

  const world = new THREE.Group();
  world.position.set(2.6, 0.2, 0);
  scene.add(world);

  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.4, 2),
    new THREE.MeshBasicMaterial({ color: 0xf139d2, wireframe: true, transparent: true, opacity: 0.72 })
  );
  world.add(core);

  const innerCore = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.72, 1),
    new THREE.MeshBasicMaterial({ color: 0xc5ff2e, transparent: true, opacity: 0.13 })
  );
  world.add(innerCore);

  const ringMaterials = [0xc5ff2e, 0x7a4cff, 0xf139d2].map((color) => new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.34 }));
  const rings = ringMaterials.map((material, index) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.25 + index * 0.5, 0.012, 8, 150), material);
    ring.rotation.set(index * 0.72, index * 0.4, index * 0.9);
    world.add(ring);
    return ring;
  });

  const nodes = new THREE.Group();
  const nodeGeometry = new THREE.SphereGeometry(0.055, 10, 10);
  const positions = [];
  for (let i = 0; i < 28; i += 1) {
    const angle = (i / 28) * Math.PI * 2;
    const radius = 2.35 + (i % 5) * 0.21;
    const position = new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle * 2.1) * 1.7, Math.sin(angle) * radius * 0.42);
    positions.push(position);
    const node = new THREE.Mesh(nodeGeometry, new THREE.MeshBasicMaterial({ color: i % 6 === 0 ? 0xff5247 : 0xc5ff2e }));
    node.position.copy(position);
    nodes.add(node);
  }
  world.add(nodes);

  const linePositions = [];
  positions.forEach((position, index) => {
    if (index % 2 === 0) {
      linePositions.push(0, 0, 0, position.x, position.y, position.z);
    }
  });
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
  const traces = new THREE.LineSegments(lineGeometry, new THREE.LineBasicMaterial({ color: 0x7a4cff, transparent: true, opacity: 0.24 }));
  world.add(traces);

  // A soft additive halo separates the signal from the photographic backdrop.
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(1.82, 28, 28),
    new THREE.MeshBasicMaterial({ color: 0xf139d2, transparent: true, opacity: 0.065, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  world.add(halo);

  // Glowing packets continuously travel from the wallet nodes into the core.
  const packetGeometry = new THREE.SphereGeometry(0.075, 12, 12);
  const packetMaterial = new THREE.MeshBasicMaterial({ color: 0xc5ff2e, blending: THREE.AdditiveBlending, depthWrite: false });
  const packets = positions.slice(0, 12).map((position, index) => {
    const bend = position.clone().multiplyScalar(0.58);
    bend.z += index % 2 ? 1.15 : -1.15;
    const curve = new THREE.QuadraticBezierCurve3(position, bend, new THREE.Vector3());
    const packet = new THREE.Mesh(packetGeometry, packetMaterial);
    packet.position.copy(curve.getPoint(index / 12));
    world.add(packet);
    return { packet, curve, offset: index / 12, speed: 0.06 + (index % 4) * 0.012 };
  });

  // Pointer presses release a brief burst from the market core.
  const bursts = [];
  function createBurst() {
    if (reducedMotion || bursts.length > 2) return;
    const count = 46;
    const burstPositions = new Float32Array(count * 3);
    const velocities = [];
    for (let i = 0; i < count; i += 1) {
      const direction = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      velocities.push(direction.multiplyScalar(0.025 + Math.random() * 0.045));
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(burstPositions, 3));
    const material = new THREE.PointsMaterial({ color: Math.random() > 0.5 ? 0xc5ff2e : 0xf139d2, size: 0.055, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
    const points = new THREE.Points(geometry, material);
    world.add(points);
    bursts.push({ points, velocities, age: 0 });
  }

  const starCount = 650;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i += 1) {
    starPositions[i * 3] = (Math.random() - 0.5) * 18;
    starPositions[i * 3 + 1] = (Math.random() - 0.5) * 10;
    starPositions[i * 3 + 2] = (Math.random() - 0.5) * 8;
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xf3f2ec, size: 0.018, transparent: true, opacity: 0.48 }));
  scene.add(stars);

  const pointer = { x: 0, y: 0 };
  hero.addEventListener("pointermove", (event) => {
    const rect = hero.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
  }, { passive: true });
  hero.addEventListener("pointerleave", () => { pointer.x = 0; pointer.y = 0; });
  hero.addEventListener("pointerdown", createBurst);

  let scrollAmount = 0;
  function updateScroll() {
    scrollAmount = Math.min(1, Math.max(0, -hero.getBoundingClientRect().top / Math.max(hero.offsetHeight, 1)));
  }
  updateScroll();
  window.addEventListener("scroll", updateScroll, { passive: true });

  function resize() {
    const width = hero.clientWidth;
    const height = hero.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    world.position.x = width < 760 ? 0.7 : 2.6;
    world.scale.setScalar(width < 760 ? 0.72 : 1);
  }
  resize();
  window.addEventListener("resize", resize);

  const timer = new THREE.Clock();
  function render() {
    const elapsed = timer.getElapsedTime();
    if (!reducedMotion) {
      core.rotation.x = elapsed * 0.15;
      core.rotation.y = elapsed * 0.24;
      innerCore.rotation.y = -elapsed * 0.38;
      innerCore.scale.setScalar(1 + Math.sin(elapsed * 2.2) * 0.08);
      halo.scale.setScalar(1 + Math.sin(elapsed * 1.45) * 0.09);
      halo.material.opacity = 0.055 + Math.sin(elapsed * 1.45) * 0.018;
      rings.forEach((ring, index) => { ring.rotation.z += 0.0015 * (index + 1); ring.rotation.x += 0.0008 * (index + 1); });
      packets.forEach(({ packet, curve, offset, speed }) => {
        const progress = (elapsed * speed + offset) % 1;
        packet.position.copy(curve.getPoint(1 - progress));
        packet.scale.setScalar(0.65 + Math.sin(progress * Math.PI) * 0.9);
      });
      for (let burstIndex = bursts.length - 1; burstIndex >= 0; burstIndex -= 1) {
        const burst = bursts[burstIndex];
        const attribute = burst.points.geometry.getAttribute("position");
        for (let i = 0; i < burst.velocities.length; i += 1) {
          attribute.setXYZ(i, attribute.getX(i) + burst.velocities[i].x, attribute.getY(i) + burst.velocities[i].y, attribute.getZ(i) + burst.velocities[i].z);
        }
        attribute.needsUpdate = true;
        burst.age += 0.018;
        burst.points.material.opacity = Math.max(0, 0.9 - burst.age);
        if (burst.age >= 0.9) {
          world.remove(burst.points);
          burst.points.geometry.dispose();
          burst.points.material.dispose();
          bursts.splice(burstIndex, 1);
        }
      }
      nodes.rotation.y = elapsed * 0.07;
      traces.rotation.y = elapsed * 0.07;
      stars.rotation.y = elapsed * 0.008;
      world.rotation.y += (pointer.x * 0.18 - world.rotation.y) * 0.035;
      world.rotation.x += (-pointer.y * 0.12 - world.rotation.x) * 0.035;
      world.position.y += ((0.2 + scrollAmount * 0.85) - world.position.y) * 0.04;
      camera.position.z += ((8.5 + scrollAmount * 1.6) - camera.position.z) * 0.04;
    }
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }
  render();
}

initThreeScene();

const cases = [
  { name: "The Trencher", summary: "Lives on new pairs, sleeps with DexScreener open, still convinced the next 100x is one refresh away.", stats: [["Balance", "$143.82"], ["Screen time", "17H"], ["Last win", "9 days ago"]], note: "“Refreshes first. Eats last.”", alt: "Late night trader watching multiple monitors" },
  { name: "The Rugger", summary: "Every announcement is immaculate. Every roadmap has a Phase 3. Every chart has the same ending.", stats: [["Wallets", "37"], ["Tokens launched", "84"], ["Bio", "Building"]], note: "“Visionary until block 43.”", alt: "Suspicious luxury desk with cash and laptop" },
  { name: "The Caller", summary: "The signal arrives after the wallet. The disclaimer arrives after the candle. The pinned message never remembers yesterday.", stats: [["Calls today", "14"], ["Deleted posts", "6"], ["Win rate", "Classified"]], note: "“Posts candle, edits history.”", alt: "Anonymous signal caller broadcasting at monitors" },
  { name: "The KOL", summary: "A sovereign state of ring lights, affiliate codes, delayed disclosures, and suspiciously perfect timing.", stats: [["Followers", "782K"], ["Engagement", "Organic*"], ["Entry", "4 min before you"]], note: "“Sponsored by timing.”", alt: "Luxury livestream setup overlooking a city" },
  { name: "The Whale", summary: "No pinned post. No community call. One transaction and the entire chart asks permission.", stats: [["Wallet", "$8,421,884"], ["Price impact", "Yes"], ["Messages", "0"]], note: "“The chart asks permission.”", alt: "Anonymous whale trader surrounded by screens" },
  { name: "The Round Tripper", summary: "Watched +$284,000 become +$1,842. Never sold. Still has the screenshot from the top.", stats: [["Peak PnL", "+$284,000"], ["Realized", "+$1,842"], ["Evidence", "1 screenshot"]], note: "“He screenshotted the top.”", alt: "Trader looking at a phone after watching profits vanish" }
];

const caseTabs = [...document.querySelectorAll(".case-tab")];
const caseImage = document.querySelector("#case-image");
const caseName = document.querySelector("#case-name");
const caseLabel = document.querySelector("#case-label");
const caseSummary = document.querySelector("#case-summary");
const caseStats = document.querySelector("#case-stats");
const caseNote = document.querySelector("#case-note");
const caseProgress = document.querySelector("#case-progress");
const imageCode = document.querySelector("#image-code");
let activeCase = 0;

function renderCase(index) {
  activeCase = (index + cases.length) % cases.length;
  const data = cases[activeCase];
  const caseNumber = String(activeCase + 1).padStart(3, "0");
  caseTabs.forEach((tab, tabIndex) => { tab.classList.toggle("is-active", tabIndex === activeCase); tab.setAttribute("aria-selected", String(tabIndex === activeCase)); });
  caseImage.className = `case-image crop-${activeCase + 1}`;
  caseImage.setAttribute("aria-label", data.alt);
  caseName.textContent = data.name;
  caseLabel.textContent = `CASE ${caseNumber} — ACTIVE`;
  caseSummary.textContent = data.summary;
  caseStats.innerHTML = data.stats.map(([term, value]) => `<div><dt>${term}</dt><dd>${value}</dd></div>`).join("");
  caseNote.textContent = data.note;
  caseProgress.textContent = `${String(activeCase + 1).padStart(2, "0")} / 06`;
  imageCode.textContent = `SUBJECT ${caseNumber} / 04:${18 + activeCase}:09`;
}

caseTabs.forEach((tab) => tab.addEventListener("click", () => renderCase(Number(tab.dataset.case))));
document.querySelector("[data-case-prev]")?.addEventListener("click", () => renderCase(activeCase - 1));
document.querySelector("[data-case-next]")?.addEventListener("click", () => renderCase(activeCase + 1));

const feedRows = [...document.querySelectorAll(".feed-row")];
const feedToggle = document.querySelector("[data-feed-toggle]");
let activeRow = 0;
let feedPaused = false;
window.setInterval(() => {
  if (!feedRows.length || feedPaused) return;
  feedRows.forEach((row) => row.classList.remove("is-active"));
  feedRows[activeRow].classList.add("is-active");
  activeRow = (activeRow + 1) % feedRows.length;
}, 1200);
feedToggle?.addEventListener("click", () => { feedPaused = !feedPaused; feedToggle.textContent = feedPaused ? "RESUME FEED" : "PAUSE FEED"; });

const transformations = {
  trader: { beforeHeading: "A functioning person.", before: ["Sleeping normally", "$3,200 savings", "Friends"], afterHeading: "Community manager.", after: ["4 monitors", "$184 wallet balance", "“One more play”"] },
  caller: { beforeHeading: "Crypto student.", before: ["4,200 members", "Reads every disclaimer", "Posts market notes"], afterHeading: "Founder. Visionary.", after: ["184,000 members", "Win rate: classified", "Deletes market notes"] }
};

document.querySelectorAll("[data-transform]").forEach((button) => button.addEventListener("click", () => {
  const data = transformations[button.dataset.transform];
  document.querySelectorAll("[data-transform]").forEach((item) => item.classList.toggle("is-active", item === button));
  document.querySelector("#before-heading").textContent = data.beforeHeading;
  document.querySelector("#before-list").innerHTML = data.before.map((item) => `<li>${item}</li>`).join("");
  document.querySelector("#after-heading").textContent = data.afterHeading;
  document.querySelector("#after-list").innerHTML = data.after.map((item) => `<li>${item}</li>`).join("");
}));

const menuToggle = document.querySelector(".menu-toggle");
const mobileNav = document.querySelector(".site-header nav");
menuToggle?.addEventListener("click", () => {
  const open = mobileNav.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.textContent = open ? "CLOSE" : "MENU";
});
mobileNav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => { mobileNav.classList.remove("is-open"); menuToggle?.setAttribute("aria-expanded", "false"); if (menuToggle) menuToggle.textContent = "MENU"; }));
