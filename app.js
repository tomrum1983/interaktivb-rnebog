/* Strømmen Under Byen — prototype
   - Single-page e-bog
   - Navn vælges af spiller og gemmes
   - Opgaver låser videre scener op
*/

const STORAGE_KEY = "strommen_under_byen_v1";

const $ = (sel) => document.querySelector(sel);

const ui = {
  name: $("#uiName"),
  chapter: $("#uiChapter"),
  scene: $("#uiScene"),

  sceneTitle: $("#sceneTitle"),
  sceneTag: $("#sceneTag"),
  sceneText: $("#sceneText"),

  btnPrev: $("#btnPrev"),
  btnNext: $("#btnNext"),
  btnRestart: $("#btnRestart"),

  nameGate: $("#nameGate"),
  nameInput: $("#nameInput"),
  btnSaveName: $("#btnSaveName"),

  panelTitle: $("#panelTitle"),
  puzzleWrap: $("#puzzleWrap"),
  puzzlePrompt: $("#puzzlePrompt"),
  puzzleChoices: $("#puzzleChoices"),
  puzzleNumber: $("#puzzleNumber"),
  numberInput: $("#numberInput"),

  btnHint: $("#btnHint"),
  btnCheck: $("#btnCheck"),
  hintBox: $("#hintBox"),
  feedbackBox: $("#feedbackBox"),
  panelNote: $("#panelNote"),
};

/** Data: scener + opgaver
 *  Puzzle types: "none" | "mcq" | "number"
 *  Brug {{NAME}} i tekst, så indsætter vi navnet ved render.
 */
const STORY = {
  meta: { title: "Strømmen Under Byen", chapter: 1 },
  scenes: [
    {
      id: "c1s1",
      title: "Kapitel 1 · Lyset flimrer",
      tag: "København · ungdomsevent",
      image: "assets/side1_2.png",
      text:
`Du står bag scenen i en sportshal på Nørrebro, hvor der er ungdomsevent i fuld gang.
Der er lys, musik, grin — og din praktik-mentor, Sana, der har lokket dig med som “ekstra øjne”.

Så flimrer lyset.

Først én gang. Så igen. Og igen.

Sana kigger på dig, som om hun allerede ved, du har set noget vigtigt:
“Okay, {{NAME}}, vi har et problem. Men vi har også tid… hvis vi tænker hurtigt.”`,
      puzzle: {
        type: "mcq",
        prompt:
          "Hvad er den mest fornuftige første handling, når lys og lyd flimrer (og du vil undgå panik)?",
        choices: [
          { id: "a", text: "Skru op for musikken, så ingen lægger mærke til det." },
          { id: "b", text: "Tjek om der er et mønster: sker det ved bestemte øjeblikke/forbrug?" },
          { id: "c", text: "Sluk alt med det samme og håb på det bedste." },
        ],
        answer: "b",
        feedbackGood:
          "Yes. Første skridt er at observere og forstå systemet. Mønstre = spor.",
        feedbackBad:
          "Den er risky. Når noget opfører sig mærkeligt, er det smart at finde et mønster før du gør noget drastisk.",
        hints: [
          "Tænk som en ingeniør: først data, så beslutning.",
          "Hvis du ændrer noget uden at vide hvorfor, kan du gøre det værre.",
          "Find et mønster = find en ledetråd.",
        ],
        requiredToAdvance: true,
      },
    },

    {
      id: "c1s2",
      title: "Kontrolboksen",
      tag: "Effekt · overblik",
      text:
`I teknikrummet hænger en simpel oversigt over, hvad der bruger mest strøm lige nu.
Sana peger: “Når det topper, begynder det at flimre.”

Der står tre store forbrugere:

• Lysrig: 6 kW
• Lyd: 3 kW
• Opladningshjørne (telefoner/powerbanks): 1 kW

Sana: “Hvis vi skal aflaste hurtigt uden at ødelægge eventet — hvad vælger du?”`,
      puzzle: {
        type: "mcq",
        prompt:
          "Hvad giver mest mening at skrue ned for først, hvis målet er at reducere belastningen mest?",
        choices: [
          { id: "a", text: "Lysrig (6 kW)" },
          { id: "b", text: "Lyd (3 kW)" },
          { id: "c", text: "Opladningshjørne (1 kW)" },
        ],
        answer: "a",
        feedbackGood:
          "Korrekt. 6 kW er størst — og små ændringer dér kan gøre en stor forskel.",
        feedbackBad:
          "Ikke helt. Kig på tallene: du får størst effekt ved at reducere den største forbruger.",
        hints: [
          "kW er effekt: hvor meget der bruges lige nu.",
          "Du vil reducere mest muligt med mindst muligt drama.",
          "Vælg den største kW-værdi.",
        ],
        requiredToAdvance: true,
      },
    },

    {
      id: "c1s3",
      title: "Nødstrøm",
      tag: "Energi · Wh",
      text:
`I det øjeblik I skruer lidt ned for lysriggen, går det sort… og så tænder nødlyset.
Publikum gisper — men musikken kører stadig svagt.

Sana hvisker: “Okay. Nødstrømmen er slået til. Vi har et vindue. Men hvor langt er det vindue?”

På batteriboksen står der:
Batteri-kapacitet: 1200 Wh
Nødforbrug: 300 W`,
      puzzle: {
        type: "number",
        prompt:
          "Hvor mange timer kan nødstrømmen cirka holde? (brug: tid = Wh / W)",
        number: { target: 4, tolerance: 0.2 },
        feedbackGood:
          "Ja! Cirka 4 timer. Ikke meget — men nok til at handle smart, hvis I ikke spilder tiden.",
        feedbackBad:
          "Ikke helt. Husk: Wh er energi. W er “forbrug pr. time”. Du finder tid ved at dividere.",
        hints: [
          "Wh / W giver timer.",
          "1200 delt med 300 er et pænt rundt tal.",
          "Tænk: 300 W fire gange = 1200 Wh.",
        ],
        requiredToAdvance: true,
      },
    },

    {
      id: "c1s4",
      title: "Den skjulte årsag",
      tag: "Fejlfinding · symptomer",
      text:
`Sana åbner loggen fra styringen. Flimren startede præcis, da “mobile ladestation” blev sat op.
Men ladestationens tal er ikke så højt…

Du ser et andet spor: en billig forlænger-kabeltromle ligger rullet sammen bag en stand.
Den er varm. Alt for varm.

Sana: “Hvad er det mest sandsynlige problem her?”`,
      puzzle: {
        type: "mcq",
        prompt: "Hvad er den bedste forklaring på varm kabeltromle og ustabil strøm?",
        choices: [
          { id: "a", text: "Kablet er rullet sammen → varme kan ikke slippe væk → risiko for overophedning/spændingsfald." },
          { id: "b", text: "Det er helt normalt at kabeltromler bliver meget varme." },
          { id: "c", text: "Det betyder at strømmen er ekstra stærk og derfor bedre." },
        ],
        answer: "a",
        feedbackGood:
          "Præcis. Rullet kabel = dårlig varmeafledning. Det kan give overophedning og spændingsproblemer.",
        feedbackBad:
          "Ikke helt. Varme + rullet kabel er et klassisk faresignal.",
        hints: [
          "Varme er et tegn på tab i systemet.",
          "Hvis kablet ikke kan komme af med varme, bliver det værre over tid.",
          "Rullet kabeltromle + belastning = farligt.",
        ],
        requiredToAdvance: true,
      },
    },

    {
      id: "c1s5",
      title: "Stille sejr",
      tag: "Beslutning · sikkerhed",
      text:
`I får rullet kabeltromlen helt ud og flytter ladestationen til et korrekt udtag.
Flimren stopper. Nødlyset slukker, og det normale lys kommer tilbage.

Publikum jubler — men de tror, det er en del af showet.

Sana sender dig et blik, der siger alt:
“Du ved godt, at det her… det var ingeniørarbejde.”

Og så vibrerer hendes telefon.
En ny besked.
En anden lokation i byen.
Et andet problem.

Kapitel 2 venter…`,
      puzzle: { type: "none" }
    }
  ]
};

/** State */
let state = loadState();

function defaultState(){
  return {
    name: "",
    sceneIndex: 0,
    solved: {},       // puzzle solved by scene id
    hintsUsed: {},    // hints used by scene id (0-3)
  };
}

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return { ...defaultState(), ...parsed };
  }catch{
    return defaultState();
  }
}

function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/** Name helper */
function safeName(){
  const n = (state.name || "du").trim();
  return n.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}

function currentScene(){
  return STORY.scenes[state.sceneIndex];
}

function isSolved(sceneId){
  return !!state.solved[sceneId];
}

function markSolved(sceneId){
  state.solved[sceneId] = true;
  saveState();
}

function hintsUsed(sceneId){
  return state.hintsUsed[sceneId] ?? 0;
}

function incHint(sceneId){
  state.hintsUsed[sceneId] = Math.min(3, hintsUsed(sceneId) + 1);
  saveState();
}

/** Rendering */
function render(){
  // Header pills
  ui.name.textContent = state.name ? state.name : "—";
  ui.chapter.textContent = String(STORY.meta.chapter);
  ui.scene.textContent = String(state.sceneIndex + 1);

  // Name gate
  const hasName = !!state.name.trim();
  ui.nameGate.classList.toggle("hidden", hasName);
  ui.puzzleWrap.classList.toggle("hidden", !hasName);

  // Scene
  const sc = currentScene();
  ui.sceneTitle.textContent = sc.title;
  ui.sceneTag.textContent = sc.tag;

  // Insert name placeholder
  ui.sceneText.innerHTML = sc.text.replaceAll("{{NAME}}", safeName());
  const img = document.getElementById("sceneImage");

if (sc.image) {
  img.src = sc.image;
  img.classList.remove("hidden");
} else {
  img.classList.add("hidden");
}


  // Nav buttons
  ui.btnPrev.disabled = state.sceneIndex === 0;

  const needsSolve = sc.puzzle?.requiredToAdvance;
  const solved = isSolved(sc.id);
  const atEnd = state.sceneIndex >= STORY.scenes.length - 1;

  if(atEnd){
    ui.btnNext.textContent = "Slut (prototype)";
    ui.btnNext.disabled = true;
  }else{
    ui.btnNext.textContent = "Fortsæt →";
    ui.btnNext.disabled = !!(needsSolve && !solved);
  }

  ui.panelTitle.textContent = sc.puzzle?.type === "none" ? "Ingen opgave her" : "Opgave";
  renderPuzzle(sc);
}

function clearFeedback(){
  ui.feedbackBox.classList.add("hidden");
  ui.feedbackBox.textContent = "";
  ui.feedbackBox.classList.remove("good","bad");
}

function clearHint(){
  ui.hintBox.classList.add("hidden");
  ui.hintBox.textContent = "";
}

function renderPuzzle(sc){
  clearFeedback();
  clearHint();

  const p = sc.puzzle || { type: "none" };
  const solved = isSolved(sc.id);

  ui.btnHint.disabled = p.type === "none" || solved;
  ui.btnCheck.disabled = p.type === "none" || solved;

  if(p.type === "none"){
    ui.puzzlePrompt.textContent = "Du kan bare læse videre 🙂";
    ui.puzzleChoices.classList.add("hidden");
    ui.puzzleNumber.classList.add("hidden");
    return;
  }

  ui.puzzlePrompt.textContent = p.prompt || "";

  ui.puzzleChoices.innerHTML = "";
  ui.numberInput.value = "";
  ui.puzzleChoices.classList.add("hidden");
  ui.puzzleNumber.classList.add("hidden");

  if(p.type === "mcq"){
    ui.puzzleChoices.classList.remove("hidden");
    for(const c of p.choices){
      const label = document.createElement("label");
      label.className = "choice";
      label.innerHTML = `
        <input type="radio" name="mcq" value="${c.id}">
        <div><strong>${c.id.toUpperCase()}.</strong> ${escapeHtml(c.text)}</div>
      `;
      ui.puzzleChoices.appendChild(label);
    }
  }

  if(p.type === "number"){
    ui.puzzleNumber.classList.remove("hidden");
  }

  if(solved){
    ui.btnHint.disabled = true;
    ui.btnCheck.disabled = true;
    showFeedback(true, "Du har allerede løst denne opgave ✅");
  }
}

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;");
}

function checkAnswer(){
  const sc = currentScene();
  const p = sc.puzzle;

  if(!p || p.type === "none") return;
  if(isSolved(sc.id)) return;

  if(p.type === "mcq"){
    const sel = document.querySelector('input[name="mcq"]:checked');
    if(!sel){
      showFeedback(false, "Vælg et svar først.");
      return;
    }
    const ok = sel.value === p.answer;
    if(ok){
      markSolved(sc.id);
      showFeedback(true, p.feedbackGood || "Korrekt!");
      render(); // unlock next
    }else{
      showFeedback(false, p.feedbackBad || "Ikke helt. Prøv igen.");
    }
  }

  if(p.type === "number"){
    const raw = ui.numberInput.value.trim().replace(",", ".");
    const val = Number(raw);
    if(!Number.isFinite(val)){
      showFeedback(false, "Skriv et tal (fx 4).");
      return;
    }
    const target = p.number?.target;
    const tol = p.number?.tolerance ?? 0;
    const ok = Math.abs(val - target) <= tol;

    if(ok){
      markSolved(sc.id);
      showFeedback(true, p.feedbackGood || "Korrekt!");
      render();
    }else{
      showFeedback(false, p.feedbackBad || "Ikke helt. Prøv igen.");
    }
  }
}

function showFeedback(ok, msg){
  ui.feedbackBox.classList.remove("hidden");
  ui.feedbackBox.textContent = msg;
  ui.feedbackBox.classList.toggle("good", !!ok);
  ui.feedbackBox.classList.toggle("bad", !ok);
}

function showHint(){
  const sc = currentScene();
  const p = sc.puzzle;
  if(!p || p.type === "none") return;
  if(isSolved(sc.id)) return;

  const used = hintsUsed(sc.id);
  if(used >= 3){
    ui.hintBox.classList.remove("hidden");
    ui.hintBox.textContent = "Du har brugt alle hints til denne opgave.";
    return;
  }
  incHint(sc.id);
  const newUsed = hintsUsed(sc.id);
  const hint = p.hints?.[newUsed - 1] ?? "Ingen hint tilgængelig.";
  ui.hintBox.classList.remove("hidden");
  ui.hintBox.textContent = `Hint ${newUsed}/3: ${hint}`;
}

function goNext(){
  const sc = currentScene();
  const needsSolve = sc.puzzle?.requiredToAdvance;
  if(needsSolve && !isSolved(sc.id)) return;

  state.sceneIndex = Math.min(state.sceneIndex + 1, STORY.scenes.length - 1);
  saveState();
  render();
}

function goPrev(){
  state.sceneIndex = Math.max(0, state.sceneIndex - 1);
  saveState();
  render();
}

function saveName(){
  const n = ui.nameInput.value.trim();
  if(n.length < 2){
    alert("Skriv et navn på mindst 2 tegn 🙂");
    return;
  }
  state.name = n;
  saveState();
  render();
}

function restart(){
  if(!confirm("Nulstil alt? Det sletter navn og progression på denne enhed.")) return;
  localStorage.removeItem(STORAGE_KEY);
  state = defaultState();
  render();
}

/** Events */
ui.btnSaveName.addEventListener("click", saveName);
ui.nameInput.addEventListener("keydown", (e) => {
  if(e.key === "Enter") saveName();
});

ui.btnCheck.addEventListener("click", checkAnswer);
ui.btnHint.addEventListener("click", showHint);

ui.btnNext.addEventListener("click", goNext);
ui.btnPrev.addEventListener("click", goPrev);
ui.btnRestart.addEventListener("click", restart);

/** Boot */
render();
