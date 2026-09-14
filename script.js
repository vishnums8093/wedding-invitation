const body = document.body;
const cover = document.getElementById("cover");
const coverCard = document.getElementById("coverCard");
const openButton = document.getElementById("openButton");
const invitation = document.getElementById("invitation");
const tapLayer = document.getElementById("tapLayer");

function createTapEffect(x, y) {
  tapLayer.style.left = `${x}px`;
  tapLayer.style.top = `${y}px`;
  tapLayer.classList.remove("ripple");
  void tapLayer.offsetWidth;
  tapLayer.classList.add("ripple");

  const symbols = ["✦", "✧", "•", "✿"];
  for (let i = 0; i < 5; i++) {
    const s = document.createElement("span");
    s.className = "spark";
    s.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    s.style.left = `${x}px`;
    s.style.top = `${y}px`;
    s.style.setProperty("--dx", `${(Math.random() - .5) * 100}px`);
    s.style.setProperty("--dy", `${(Math.random() - .5) * 100}px`);
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 950);
  }
}

document.addEventListener("pointerdown", (e) => {
  if (!e.target.closest("#scratchWrap")) createTapEffect(e.clientX, e.clientY);
}, { passive: true });

function openInvitation() {
  if (body.classList.contains("opened")) return;
  body.classList.add("opened");
  invitation.setAttribute("aria-hidden", "false");

  setTimeout(() => {
    invitation.classList.add("visible");
    window.scrollTo({ top: window.innerHeight * .88, behavior: "smooth" });
  }, 650);
}

openButton.addEventListener("click", openInvitation);
coverCard.addEventListener("click", (e) => {
  if (!e.target.closest("#openButton")) openInvitation();
});

/* Scroll reveals */
const revealItems = document.querySelectorAll(".reveal");
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add("in-view");
  });
}, { threshold: 0.14 });

revealItems.forEach(el => observer.observe(el));

/* Touch-friendly scratch card */
const canvas = document.getElementById("scratchCanvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const scratchWrap = document.getElementById("scratchWrap");
const scratchHint = document.querySelector(".scratch-hint");
const scratchNote = document.getElementById("scratchNote");

let drawing = false;
let scratchedPixels = 0;
let lastPoint = null;
let revealed = false;

function resizeScratch() {
  const rect = scratchWrap.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawCoating(rect.width, rect.height);
}

function drawCoating(w, h) {
  ctx.globalCompositeOperation = "source-over";

  const gradient = ctx.createLinearGradient(0, 0, w, h);
  gradient.addColorStop(0, "#c89d55");
  gradient.addColorStop(.45, "#e4c986");
  gradient.addColorStop(1, "#b88842");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  // subtle metallic texture
  for (let i = 0; i < 1000; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * .08})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
  }

  // brush-like edges
  ctx.strokeStyle = "rgba(91,61,26,.22)";
  ctx.lineWidth = 3;
  ctx.strokeRect(5, 5, w - 10, h - 10);
}

function pointFromEvent(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function scratchAt(p) {
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = 38;

  if (lastPoint) {
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 19, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
  lastPoint = p;
  checkScratchProgress();
}

function checkScratchProgress() {
  if (revealed) return;

  // Sample the canvas to estimate how much coating is gone.
  const w = canvas.width;
  const h = canvas.height;
  const sample = ctx.getImageData(0, 0, w, h).data;
  let transparent = 0;
  const step = 16;

  for (let i = 3; i < sample.length; i += 4 * step) {
    if (sample[i] < 40) transparent++;
  }

  const total = Math.ceil(sample.length / (4 * step));
  const percent = transparent / total;

  if (percent > .46) {
    revealScratch();
  } else if (percent > .12) {
    scratchHint.style.opacity = ".25";
    scratchNote.textContent = "Almost there… ✦";
  }
}

function revealScratch() {
  revealed = true;
  scratchHint.style.opacity = "0";
  scratchNote.textContent = "Our special day ✦";

  // Fade away the remaining coating.
  let opacity = 1;
  const fade = setInterval(() => {
    opacity -= .08;
    canvas.style.opacity = Math.max(opacity, 0);
    if (opacity <= 0) {
      clearInterval(fade);
      canvas.style.display = "none";
      createScratchCelebration();
    }
  }, 30);
}

function createScratchCelebration() {
  const rect = scratchWrap.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;

  for (let i = 0; i < 18; i++) {
    const s = document.createElement("span");
    s.className = "spark";
    s.textContent = i % 3 === 0 ? "✿" : "✦";
    s.style.left = `${x}px`;
    s.style.top = `${y}px`;
    s.style.setProperty("--dx", `${(Math.random() - .5) * 220}px`);
    s.style.setProperty("--dy", `${(Math.random() - .5) * 160}px`);
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 950);
  }
}

canvas.addEventListener("pointerdown", (e) => {
  drawing = true;
  lastPoint = null;
  canvas.setPointerCapture(e.pointerId);
  scratchAt(pointFromEvent(e));
});

canvas.addEventListener("pointermove", (e) => {
  if (!drawing) return;
  scratchAt(pointFromEvent(e));
});

function stopScratch() {
  drawing = false;
  lastPoint = null;
}
canvas.addEventListener("pointerup", stopScratch);
canvas.addEventListener("pointercancel", stopScratch);
canvas.addEventListener("pointerleave", stopScratch);

window.addEventListener("resize", () => {
  if (!revealed) resizeScratch();
});

resizeScratch();
