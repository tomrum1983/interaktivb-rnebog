/**
 * Interaktiv historie (vælg-din-egen-vej)
 * - scenes: alle sider i historien
 * - next: scene-id (intern navigation)
 * - url: link til anden side (fx landingpage)
 */

// ====== SETTINGS ======
const LANDING_PAGE_URL = "index.html"; // ret hvis nødvendigt (fx "../landingpage.html")

// ====== STATE ======
let currentSceneId = "start";
const sceneHistory = []; // stack til tilbage-knappen

// ====== DOM ======
const sceneTitle = document.getElementById("sceneTitle");
const sceneText = document.getElementById("sceneText");
const sceneImage = document.getElementById("sceneImage");
const choicesEl = document.getElementById("choices");

const closeBookBtn = document.getElementById("closeBook");
const backBtn = document.getElementById("backBtn");

// Lyd
const bgAudio = document.getElementById("bgAudio");
const audioToggle = document.getElementById("audioToggle");
const volume = document.getElementById("volume");

let isPlaying = false;

// ====== CLOSE BOOK (X) ======
if (closeBookBtn) {
  closeBookBtn.addEventListener("click", () => {
    window.location.href = new URL(LANDING_PAGE_URL, window.location.href).href;
  });
}

// ====== BACK BUTTON (←) ======
if (backBtn) {
  backBtn.addEventListener("click", () => {
    if (sceneHistory.length === 0) return;

    const prev = sceneHistory.pop();
    renderScene(prev, false); // false: vi skal ikke tilføje historik igen
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// ====== AUDIO ======
if (audioToggle && bgAudio && volume) {
  audioToggle.addEventListener("click", async () => {
    try {
      if (!isPlaying) {
        bgAudio.volume = Number(volume.value);
        await bgAudio.play(); // kræver brugerklik
        isPlaying = true;
        audioToggle.textContent = "🔊";
      } else {
        bgAudio.pause();
        isPlaying = false;
        audioToggle.textContent = "🔈";
      }
    } catch (err) {
      console.warn("Kunne ikke afspille lyd:", err);
    }
  });

  volume.addEventListener("input", () => {
    bgAudio.volume = Number(volume.value);
  });
}

// ====== FLUGT SPIL ======
let gameCleanup = null;

function startFlugtGame() {
  const nextBtn = choicesEl?.querySelector(".choice");
  if (nextBtn) nextBtn.style.display = "none";

  const mediaEl = document.querySelector(".media");
  const cardEl  = document.querySelector(".card");
  if (mediaEl) mediaEl.style.display = "none";
  if (cardEl)  cardEl.classList.add("card--image-choices");

  const wrapper = document.createElement("div");
  wrapper.className = "flugt-wrapper";
  wrapper.innerHTML = `
    <p class="flugt-hint">Stik af! Brug piletasterne eller knapperne herunder</p>
    <canvas class="flugt-canvas"></canvas>
    <div class="flugt-dpad">
      <button class="dpad-btn" data-dir="up">↑</button>
      <div class="dpad-row">
        <button class="dpad-btn" data-dir="left">←</button>
        <div class="dpad-center"></div>
        <button class="dpad-btn" data-dir="right">→</button>
      </div>
      <button class="dpad-btn" data-dir="down">↓</button>
    </div>
  `;
  if (choicesEl) choicesEl.insertAdjacentElement("beforebegin", wrapper);

  const canvas = wrapper.querySelector(".flugt-canvas");
  const W = 480, H = 260;
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Vejbaner
  const ROAD_TOP    = H * 0.28;
  const ROAD_BOTTOM = H * 0.72;
  const ROAD_H      = ROAD_BOTTOM - ROAD_TOP;

  // Scroll
  const SCROLL_SPD = 200;
  let scroll = 0;


  // Lygtepæle
  const lamps = Array.from({ length: 6 }, (_, i) => ({ x: i * 100 + 40 }));

  // Forhindringer
  const OBSTACLES = ["📦", "🗑️", "🚧", "🪣"];
  const obstacles  = [];
  let obstTimer    = 1.8;

  // Spiller
  const player = { x: 90, y: H / 2, r: 14, spd: 155, stunTime: 0 };

  // Politibil — starter uden for skærmen til venstre (bagfra)
  const cop = { x: -90, y: H / 2, r: 15, spd: 0 };

  let keys    = new Set();
  let over    = false;
  let elapsed = 0;
  let lastTs  = null;
  let raf;

  const onDown = e => {
    keys.add(e.key);
    if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key))
      e.preventDefault();
  };
  const onUp = e => keys.delete(e.key);
  document.addEventListener("keydown", onDown);
  document.addEventListener("keyup",   onUp);

  wrapper.querySelectorAll(".dpad-btn").forEach(btn => {
    const k = "dpad-" + btn.dataset.dir;
    btn.addEventListener("pointerdown",  () => keys.add(k));
    btn.addEventListener("pointerup",    () => keys.delete(k));
    btn.addEventListener("pointerleave", () => keys.delete(k));
  });

  gameCleanup = () => {
    cancelAnimationFrame(raf);
    document.removeEventListener("keydown", onDown);
    document.removeEventListener("keyup",   onUp);
  };

  function spawnObstacle() {
    const margin = 22;
    obstacles.push({
      x:     W + 30,
      y:     ROAD_TOP + margin + Math.random() * (ROAD_H - margin * 2),
      r:     16,
      emoji: OBSTACLES[Math.floor(Math.random() * OBSTACLES.length)],
    });
  }

  function update(dt) {
    elapsed  += dt;
    scroll   += SCROLL_SPD * dt;

    // Forhindringer
    obstTimer -= dt;
    if (obstTimer <= 0) {
      spawnObstacle();
      obstTimer = 1.2 + Math.random() * 1.4;
    }
    for (let i = obstacles.length - 1; i >= 0; i--) {
      obstacles[i].x -= SCROLL_SPD * dt;
      if (obstacles[i].x < -40) obstacles.splice(i, 1);
    }

    // Politibil accelererer løbende — umuligt efter ~22 sek
    cop.spd = 35 + elapsed * 7;
    const dx   = player.x - cop.x;
    const dy   = player.y - cop.y;
    const dist = Math.hypot(dx, dy) || 1;
    cop.x += (dx / dist) * cop.spd * dt;
    cop.y += (dy / dist) * cop.spd * dt;

    // Spillerbevægelse (låst til vejen)
    if (player.stunTime > 0) {
      player.stunTime -= dt;
    } else {
      let vx = 0, vy = 0;
      if (keys.has("ArrowLeft")  || keys.has("dpad-left"))  vx = -1;
      if (keys.has("ArrowRight") || keys.has("dpad-right")) vx =  1;
      if (keys.has("ArrowUp")    || keys.has("dpad-up"))    vy = -1;
      if (keys.has("ArrowDown")  || keys.has("dpad-down"))  vy =  1;
      if (vx && vy) { vx *= 0.707; vy *= 0.707; }
      player.x = Math.max(player.r,          Math.min(W - player.r,          player.x + vx * player.spd * dt));
      player.y = Math.max(ROAD_TOP + player.r, Math.min(ROAD_BOTTOM - player.r, player.y + vy * player.spd * dt));
    }

    // Kollision med forhindring → kort stun
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      if (Math.hypot(player.x - o.x, player.y - o.y) < player.r + o.r - 4) {
        player.stunTime = 0.75;
        obstacles.splice(i, 1);
      }
    }

    // Politibil fanger spilleren
    if (Math.hypot(player.x - cop.x, player.y - cop.y) < player.r + cop.r)
      over = true;
  }

  function draw() {
    // ---- Mørk baggrund (top + bund) ----
    ctx.fillStyle = "#0b0d18";
    ctx.fillRect(0, 0, W, ROAD_TOP - 16);
    ctx.fillRect(0, ROAD_BOTTOM + 16, W, H - ROAD_BOTTOM - 16);

    // ---- Fortov top + bund ----
    ctx.fillStyle = "#252840";
    ctx.fillRect(0, ROAD_TOP - 16, W, 16);
    ctx.fillRect(0, ROAD_BOTTOM,   W, 16);

    // ---- Vej ----
    ctx.fillStyle = "#181b2c";
    ctx.fillRect(0, ROAD_TOP, W, ROAD_H);

    // Vejkanter
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth   = 2;
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(0, ROAD_TOP);    ctx.lineTo(W, ROAD_TOP);    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, ROAD_BOTTOM); ctx.lineTo(W, ROAD_BOTTOM); ctx.stroke();

    // Midterstribe (animeret scroll)
    ctx.strokeStyle   = "rgba(255,200,0,0.35)";
    ctx.lineWidth     = 2;
    ctx.setLineDash([22, 14]);
    ctx.lineDashOffset = scroll % 36;
    ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
    ctx.setLineDash([]);

    // ---- Lygtepæle (top fortov) ----
    lamps.forEach(lamp => {
      const x = ((lamp.x - scroll) % (W + 120) + W + 120) % (W + 120) - 60;
      ctx.strokeStyle = "rgba(160,165,200,0.55)";
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.moveTo(x, ROAD_TOP - 2);
      ctx.lineTo(x, ROAD_TOP - 24);
      ctx.lineTo(x + 14, ROAD_TOP - 24);
      ctx.stroke();
      const glow = ctx.createRadialGradient(x + 14, ROAD_TOP - 24, 0, x + 14, ROAD_TOP - 24, 22);
      glow.addColorStop(0, "rgba(255,215,80,0.22)");
      glow.addColorStop(1, "rgba(255,215,80,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(x - 8, ROAD_TOP - 46, 44, 44);
    });

    // ---- Forhindringer ----
    ctx.font         = "22px serif";
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    obstacles.forEach(o => ctx.fillText(o.emoji, o.x, o.y));

    // ---- Spiller (blinker ved stun) ----
    if (player.stunTime <= 0 || Math.floor(player.stunTime * 10) % 2 === 0)
      ctx.fillText("🦝", player.x, player.y);

    // ---- Politibil (vendt mod højre) ----
    ctx.save();
    ctx.scale(-1, 1);
    ctx.fillText("🚓", -cop.x, cop.y);
    ctx.restore();
  }

  function loop(ts) {
    if (!lastTs) lastTs = ts;
    const dt = Math.min((ts - lastTs) / 1000, 0.05);
    lastTs = ts;

    if (!over) {
      update(dt);
      draw();
      raf = requestAnimationFrame(loop);
    } else {
      draw();
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle    = "#f4f6ff";
      ctx.font         = "bold 22px system-ui";
      ctx.textAlign    = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Du blev fanget! 🚓", W / 2, H / 2 - 14);
      ctx.font      = "14px system-ui";
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fillText("Politiet er på vej...", W / 2, H / 2 + 16);

      gameCleanup();
      gameCleanup = null;
      setTimeout(() => renderScene("politi", true), 2000);
    }
  }

  raf = requestAnimationFrame(loop);
}

// ====== FØLELSER SLIDER ======
function startEmotionSlider() {
  const emotions = [
    { emoji: "😄", label: "Glad" },
    { emoji: "😊", label: "Lidt glad" },
    { emoji: "😐", label: "Neutral" },
    { emoji: "😢", label: "Ked af det" },
    { emoji: "😠", label: "Sur" },
  ];
  const correctIndex = 3;
  const startIndex   = 2;

  // Lås "Næste side"-knappen til at starte med
  const nextBtn = choicesEl?.querySelector(".choice");
  if (nextBtn) nextBtn.disabled = true;

  const facesHTML = emotions.map((e, i) =>
    `<div class="emotion-face${i === startIndex ? " active" : ""}" data-index="${i}">
      <span class="emotion-emoji">${e.emoji}</span>
      <span class="emotion-label">${e.label}</span>
    </div>`
  ).join("");

  const wrapper = document.createElement("div");
  wrapper.className = "emotion-slider";
  wrapper.innerHTML = `
    <p class="emotion-question">Hvad føler Pølse?</p>
    <div class="emotion-faces">${facesHTML}</div>
    <input type="range" class="emotion-range" min="0" max="4" step="1" value="${startIndex}" />
    <p class="emotion-hint">Flyt markøren og find den rigtige følelse</p>
    <p class="emotion-explanation">Pølse er ked af det, fordi de andre dyr er sultne og ikke har noget mad.</p>
  `;

  if (choicesEl) choicesEl.insertAdjacentElement("beforebegin", wrapper);

  const rangeEl       = wrapper.querySelector(".emotion-range");
  const faceEls       = wrapper.querySelectorAll(".emotion-face");
  const hintEl        = wrapper.querySelector(".emotion-hint");
  const explanationEl = wrapper.querySelector(".emotion-explanation");

  rangeEl.addEventListener("input", () => {
    const val = Number(rangeEl.value);
    faceEls.forEach((f, i) => f.classList.toggle("active", i === val));

    if (val === correctIndex) {
      hintEl.textContent = "Ja! Pølse er ked af det 😢";
      hintEl.classList.add("emotion-correct");
      explanationEl.classList.add("visible");
      if (nextBtn) nextBtn.disabled = false;
    } else {
      hintEl.textContent = "Flyt markøren og find den rigtige følelse";
      hintEl.classList.remove("emotion-correct");
      explanationEl.classList.remove("visible");
      if (nextBtn) nextBtn.disabled = true;
    }
  });
}

// ====== VEJRTRÆKNINGS ANIMATION ======
let breathInterval = null;

function stopBreathingAnimation() {
  if (breathInterval) {
    clearInterval(breathInterval);
    breathInterval = null;
  }
}

function startBreathingAnimation() {
  const phases = [
    { label: "Træk vejret ind", cls: "inhale" },
    { label: "Hold",            cls: "hold-in" },
    { label: "Pust ud",         cls: "exhale" },
    { label: "Hold",            cls: "hold-out" },
  ];

  const wrapper = document.createElement("div");
  wrapper.className = "breath-anim";
  wrapper.innerHTML = `
    <div class="breath-ring"></div>
    <div class="breath-circle">
      <span class="breath-count"></span>
    </div>
    <span class="breath-label"></span>
    <span class="breath-round" style="visibility:hidden">Runde <strong>1</strong>&thinsp;/&thinsp;10</span>
    <button class="breath-toggle" type="button">Start øvelsen</button>
  `;

  // Indsæt før valgknapperne
  if (choicesEl) choicesEl.insertAdjacentElement("beforebegin", wrapper);

  const labelEl  = wrapper.querySelector(".breath-label");
  const roundEl  = wrapper.querySelector(".breath-round strong");
  const countEl  = wrapper.querySelector(".breath-count");
  const circleEl = wrapper.querySelector(".breath-circle");
  const ringEl   = wrapper.querySelector(".breath-ring");
  const toggleBtn = wrapper.querySelector(".breath-toggle");

  let phaseIndex = 0;
  let round = 1;
  let secondsLeft = 4;
  let running = false;

  function applyPhase() {
    const phase = phases[phaseIndex];
    labelEl.textContent = phase.label;
    circleEl.className  = `breath-circle ${phase.cls}`;
    ringEl.className    = `breath-ring ${phase.cls}`;
    secondsLeft = 4;
    countEl.textContent = secondsLeft;
  }

  function startInterval() {
    breathInterval = setInterval(() => {
      secondsLeft--;
      if (secondsLeft > 0) {
        countEl.textContent = secondsLeft;
        return;
      }
      phaseIndex++;
      if (phaseIndex >= phases.length) {
        phaseIndex = 0;
        if (round < 10) {
          round++;
          roundEl.textContent = round;
        }
      }
      applyPhase();
    }, 1000);
  }

  toggleBtn.addEventListener("click", () => {
    if (!running) {
      // Start
      running = true;
      phaseIndex = 0;
      round = 1;
      roundEl.textContent = "1";
      wrapper.querySelector(".breath-round").style.visibility = "visible";
      applyPhase();
      startInterval();
      toggleBtn.textContent = "Stop øvelsen";
    } else {
      // Stop
      running = false;
      stopBreathingAnimation();
      circleEl.className = "breath-circle";
      ringEl.className   = "breath-ring";
      labelEl.textContent = "";
      countEl.textContent = "";
      wrapper.querySelector(".breath-round").style.visibility = "hidden";
      toggleBtn.textContent = "Start øvelsen";
    }
  });
}

// ====== SCENES ======
const scenes = {
  start: {
    title: "SkraldeGuld",
    text: "",
    image: "assets/forsiden.png",
    alt: "StorbyJunglen",
    choices: [{ label: "Start Historien", next: "polse" }],
  },

  polse: {
    title: "Mød Pølse",
    text: "Her har vi Pølse. Pølse er en vaskeægte vaskebjørn, der elsker at rode i skraldespande.",
    image: "assets/side2.png",
    alt: "pølse roder i skraldespand",
    choices: [{ label: "Videre til næste side", next: "orla" }],
  },

  orla: {
    title: "Mød Orla",
    text: "Orla er en sød og lidt fræk kat, der er bedste venner med Pølse. Han er god til at hjælpe Pølse i de svære situationer, de nogle gange havner i.",
    image: "assets/side3.png",
    alt: "Orla sidder ned",
    choices: [{ label: "Næste side", next: "skrald" }],
  },

  skrald: {
    title: "Skraldespanden",
    text: "Pølse har opdaget et spændende lys, der stråler ud under containeren i gyden bagved hans yndlingsbager. Orla prøver at holde Pølse tilbage, så de ikke havner i problemer for hurtigt.",
    image: "assets/side4.png",
    alt: "gyden bag bageren",
    choices: [{ label: "Næste side", next: "ovelse" }],
  },

  ovelse: {
    title: "Vejrtrækningsøvelse",
    text: "Orla viser Pølse en vejrtrækningsøvelse. Træk vejret ind i 4 sekunder, hold i 4 sekunder, pust ud i 4 sekunder, hold i 4 sekunder — gentag 10 gange, så er du klar til at tage gode beslutninger.",
    image: "assets/side5.png",
    alt: "øvelse",
    animation: "breathing",
    choices: [{ label: "Næste side", next: "valg1" }],
  },

  valg1: {
    title: "Det første valg",
    text: "Nu har du 3 forskellige valgmuligheder, tænk dig om før du vælger.",
    image: "assets/side6.png",
    alt: "første valg",
    choices: [
      { label: "Trække vejret", next: "træk",    image: "assets/side7a.png", alt: "trække vejret" },
      { label: "Løbe der hen",  next: "surdue",  image: "assets/side7b.png", alt: "løbe der hen" },
      { label: "Gå væk",        next: "vejr",    image: "assets/side7c.png", alt: "gå væk" },
    ],
  },

  træk: {
    title: "Lav øvelsen",
    text: "Nu laver vi lige vejrtrækningsøvelsen, inden vi går derhen, så vi er sikre på, at vi holder fokus, siger Orla roligt til Pølse. Da de stille går hen til containeren, ser de en kæmpe due, der står og vogter over den. Da de kommer helt tæt på, spørger Pølse roligt duen, hvad det er, den står og holder vagt over, og duen viser stolt sit skraldeguld frem.",
    image: "assets/side7a.png",
    alt: "due og skraldeguld",
    choices: [{ label: "Næste side", next: "valg2" }],
  },

  surdue: {
    title: "Den sure due!",
    text: "En kæmpe stor og arrig bydue springer frem og puster sig op, imens den råber af sine lungers fulde kraft: »Det er mit skraldeguld — I holder nallerne for jer selv!«",
    image: "assets/side7b.png",
    alt: "sur due i gyden",
    choices: [{ label: "Næste side", next: "valg2" }],
  },

  vejr: {
    title: "Gå væk",
    text: "De to kammerater vælger at gå ned til gyden bagved grillbaren i stedet, hvor de plejer at finde Pølses yndlingsret.",
    image: "assets/side7c.png",
    alt: "på vej væk",
    choices: [{ label: "Næste side", next: "grill" }],
  },

  grill: {
    title: "Grill snacks",
    text: "Pølse og Orla har fundet en bakke med gamle pomfritter og en ordentlig stor pølse. De er rigtig glade for, at de valgte at gå her ned i stedet.",
    image: "assets/side8c.png",
    alt: "grillbar",
    choices: [
      { label: "Afslut", url: "index.html" },
      { label: "Tilbage til valget", next: "valg1" },
    ],
  },

  valg2: {
    title: "Det andet valg",
    text: "Nu får du lov til at vælge, her er 3 forskellige handlinger.",
    image: "assets/side8.png",
    alt: "andet valg",
    choices: [
      { label: "Slås med duen",     next: "slag",  image: "assets/side8b.png", alt: "slåskamp med duen" },
      { label: "Snakke med duen",   next: "snak",  image: "assets/side8a.png", alt: "snakke med duen" },
      { label: "Forhandle med duen",next: "dele",  image: "assets/side9a.png", alt: "forhandle med duen" },
    ],
  },

  slag: {
    title: "Slåskamp",
    text: "Pølse og Orla overfalder duen, og der bliver et vældigt tumult.",
    image: "assets/side8b.png",
    alt: "slåskamp",
    choices: [{ label: "Næste side", next: "flugt" }],
  },

  flugt: {
    title: "Flugten",
    text: "De ender med at brække duens ene vinge, så de skynder sig at stikke af i en vældig fart.",
    image: "assets/side9b.png",
    alt: "flugt",
    choices: [{ label: "Stik af!", action: "flugt-game" }],
  },

  politi: {
    title: "Anholdt",
    text: "Politiet finder og anholder hurtigt de to ballademager.",
    image: "assets/side10b.png",
    alt: "anholdt",
    choices: [{ label: "Næste side", next: "fængsel" }],
  },

  fængsel: {
    title: "Fængsel",
    text: "Pølse og Orla ender med at komme i fængsel og må græde sig selv i søvn den nat.",
    image: "assets/side11b.png",
    alt: "fængsel",
    choices: [
      { label: "Afslut", url: "index.html" },
      { label: "Tilbage til valget", next: "valg2" },
    ],
  },

  snak: {
    title: "Snakke sammen",
    text: "Pølse og Orla får sig en rigtig god snak med duen, som de finder ud af, at den hedder Lars Bo. Lars Bo har holdt vagt over skraldeguldet i snart 8 timer, imens han har prøvet at finde på en plan om, hvordan han skal få det hele med hjem.",
    image: "assets/side8a.png",
    alt: "snak",
    choices: [{ label: "Næste side", next: "dele" }],
  },

  dele: {
    title: "Dele skraldeguldet",
    text: "De har besluttet sig for at dele skraldeguldet mellem hinanden, så kan duen også nemmere få sin andel med hjem. Vores to kammerater er ovenud lykkelige over, hvor heldige de har været.",
    image: "assets/side9a.png",
    alt: "dele",
    choices: [{ label: "Næste side", next: "hjem" }],
  },

  hjem: {
    title: "På vejen hjem",
    text: "Pølse og Orla begynder at gå hjemad med deres skraldeguld, da de ser en lille flok sultne dyr, der står og varmer sig ved en udluftningsrist fra bageren.",
    image: "assets/side10.png",
    alt: "hjem",
    choices: [{ label: "Næste side", next: "trist" }],
  },

  trist: {
    title: "Trist",
    text: "Pølse sætter sig og kigger trist ned i en vandpyt, og Orla sætter sig ved siden af ham.",
    image: "assets/side11.png",
    alt: "trist",
    choices: [{ label: "Næste side", next: "folelser" }],
  },

  folelser: {
    title: "Følelser",
    text: "Pølse og Orla prøver at finde ud af, hvilke følelser Pølse har lige nu. Find den rigtige følelse på slideren herunder.",
    image: "assets/side12.png",
    alt: "følelser",
    animation: "emotions",
    choices: [{ label: "Næste side", next: "valg3" }],
  },

  valg3: {
    title: "3 valg",
    text: "Pølse og Orla har nu 3 valgmuligheder, tænk dig godt om, før du vælger.",
    image: "assets/side13.png",
    alt: "tredje valg",
    choices: [
      { label: "Spise det selv",      next: "forlad",  image: "assets/side14a.png", alt: "spise selv" },
      { label: "Efterlad skraldeguld",next: "efterlad",image: "assets/side14b.png", alt: "efterlade skraldeguld" },
      { label: "Dele med de andre",   next: "dele2",   image: "assets/side14c.png", alt: "dele med de andre" },
    ],
  },

  forlad: {
    title: "Gå væk",
    text: "Pølse og Orla beslutter sig for at spise alt det gamle brød og kager selv, så de skynder sig væk.",
    image: "assets/side14a.png",
    alt: "gå væk",
    choices: [{ label: "Næste side", next: "fed" }],
  },

  efterlad: {
    title: "Efterlad",
    text: "Pølse og Orla efterlader alt det gamle brød og kager og håber, at der er nogle andre, der kan finde det.",
    image: "assets/side14b.png",
    alt: "efterlad",
    choices: [{ label: "Næste side", next: "taget" }],
  },

  dele2: {
    title: "Dele",
    text: "Pølse og Orla deler deres skraldeguld med de sultne små dyr, så de alle kan gå mætte i seng i dag.",
    image: "assets/side14c.png",
    alt: "dele2",
    choices: [{ label: "Næste side", next: "taget" }],
  },

  fed: {
    title: "De fede må svede",
    text: "Pølse og Orla har spist alt det gamle brød og kager og har nu fået kæmpe ondt i deres maver. Der er en urolig nat i vente for vores to grådige drenge.",
    image: "assets/side15a.png",
    alt: "fed",
    choices: [
      { label: "Afslut", url: "index.html" },
      { label: "Tilbage til valget", next: "valg3" },
    ],
  },

  taget: {
    title: "En god dag",
    text: "Pølse og Orla nyder solopgangen på toppen af et hustag og snakker om alle de ting, de har oplevet i dag.",
    image: "assets/side16.png",
    alt: "taget",
    choices: [
      { label: "Afslut", url: "index.html" },
      { label: "Tilbage til valget", next: "valg3" },
    ],
  },
};

// ====== RENDER ======
function renderScene(sceneId, addToHistory = true) {
  const scene = scenes[sceneId];
  if (!scene) {
    console.error("Scene findes ikke:", sceneId);
    return;
  }

  // Stop evt. kørende animation/spil og ryd op
  stopBreathingAnimation();
  if (gameCleanup) { gameCleanup(); gameCleanup = null; }
  document.querySelector(".breath-anim")?.remove();
  document.querySelector(".emotion-slider")?.remove();
  document.querySelector(".flugt-wrapper")?.remove();

  // Gem historik
  if (addToHistory && currentSceneId) {
    sceneHistory.push(currentSceneId);
  }

  currentSceneId = sceneId;

  // Opdater UI
  if (sceneTitle) sceneTitle.textContent = scene.title;
  if (sceneText) sceneText.textContent = scene.text;
  if (sceneImage) {
    sceneImage.src = scene.image;
    sceneImage.alt = scene.alt || scene.title;
  }

  // Byg valg (billeder eller knapper)
  if (choicesEl) {
    choicesEl.innerHTML = "";

    const useImages = (scene.choices || []).every(c => c.image);

    // Skjul/vis det store scenebillede og juster kortlayout
    const cardEl = document.querySelector(".card");
    const mediaEl = document.querySelector(".media");
    if (useImages) {
      if (mediaEl) mediaEl.style.display = "none";
      if (cardEl) cardEl.classList.add("card--image-choices");
    } else {
      if (mediaEl) mediaEl.style.display = "";
      if (cardEl) cardEl.classList.remove("card--image-choices");
    }

    if (useImages) {
      choicesEl.className = "choices image-choices";

      (scene.choices || []).forEach(choice => {
        const card = document.createElement("button");
        card.className = "image-choice";
        card.type = "button";
        card.setAttribute("aria-label", choice.label);

        const img = document.createElement("img");
        img.src = choice.image;
        img.alt = choice.alt || choice.label;

        const label = document.createElement("span");
        label.textContent = choice.label;

        card.appendChild(img);
        card.appendChild(label);

        card.addEventListener("click", () => {
          if (choice.url) {
            window.location.href = new URL(choice.url, window.location.href).href;
          } else {
            renderScene(choice.next, true);
          }
          window.scrollTo({ top: 0, behavior: "smooth" });
        });

        choicesEl.appendChild(card);
      });
    } else {
      choicesEl.className = "choices";

      (scene.choices || []).forEach(choice => {
        const btn = document.createElement("button");
        btn.className = "choice";
        btn.type = "button";
        btn.textContent = choice.label;

        btn.addEventListener("click", () => {
          if (choice.url) {
            window.location.href = new URL(choice.url, window.location.href).href;
          } else if (choice.action === "flugt-game") {
            startFlugtGame();
          } else {
            renderScene(choice.next, true);
          }
          window.scrollTo({ top: 0, behavior: "smooth" });
        });

        choicesEl.appendChild(btn);
      });
    }
  }

  // Start animation hvis scenen kræver det
  if (scene.animation === "breathing") startBreathingAnimation();
  if (scene.animation === "emotions")  startEmotionSlider();

  // Vis/skjul tilbageknap
  if (backBtn) {
    backBtn.style.display = sceneHistory.length > 0 ? "grid" : "none";
  }
}

// ====== START APP ======
renderScene(currentSceneId, false);
