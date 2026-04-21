/**
 * Interaktiv historie (vælg-din-egen-vej)
 * - scenes: alle sider i historien
 * - next: scene-id (intern navigation)
 * - url: link til anden side (fx landingpage)
 */

// ====== SETTINGS ======
const LANDING_PAGE_URL = "landingpage.html"; // ret hvis nødvendigt (fx "../landingpage.html")

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
    text: "Her har vi Pølse. Pølse er en vaske ægte vaskebjørn, der elsker at rode i skraldespande.",
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
    text: "Pølse har opdaget et spændende lys, der stråler ud under containeren i gyden bag ved hans ynglings bager. Orla prøver at holde Pølse tilbage, så de ikke havner i problemer for hurtigt.",
    image: "assets/side4.png",
    alt: "gyden bag bageren",
    choices: [{ label: "Næste side", next: "ovelse" }],
  },

  ovelse: {
    title: "Vejrtræknings øvelse",
    text: "Orla viser Pølse en vejrtræknings øvelse, som hjælper en med at holde focus og ikke tage for hurtige beslutninger. Man skal trække vejret langsomt ind imens man tæller til 4 inde i hovedet, så skal man holde vejret i 4 sekunder, der efter skal man puste luften ud og det skal også tage 4 sekunder, så holder man vejret igen i 4 sekunder og så starter man forfra. Når man har gjort det 10 gange, så er man klar til at tage gode beslutninger.",
    image: "assets/side5.png",
    alt: "øvelse",
    choices: [{ label: "Næste side", next: "valg1" }],
  },

  valg1: {
    title: "Det første valg",
    text: "Nu har du 3 forskellige valg muligheder, tænk dig om før du vælger.",
    image: "assets/side6.png",
    alt: "første valg",
    choices: [
      { label: "Trække vejret", next: "træk" },
      { label: "Løbe der hen", next: "surdue" },
      { label: "Gå væk", next: "vejr" },
    ],
  },

  træk: {
    title: "Lav øvelsen",
    text: "Nu laver vi lige vejr træknings øvelsen inden vi går der hen, så vi er sikker på at vi holder fokus, siger Orla roligt til Pølse. Da de stille går hen til containeren, ser de en kæmpe due, der står og vogter over den. Da de kommer helt tæt på spørg Pølse roligt duen, hvad det er den står og holder vagt over og duen viser stolt dens skraldeguld frem.",
    image: "assets/side7a.png",
    alt: "due og skraldeguld",
    choices: [{ label: "Næste side", next: "valg2" }],
  },

  surdue: {
    title: "Den sure due!",
    text: "En kæmpe stor og arrig bydue springer frem og puster sig op, imens den råber at sine lungers fulde kraft; Det er mit skraldeguld, i holder nallerne for jer selv.",
    image: "assets/side7b.png",
    alt: "sur due i gyden",
    choices: [{ label: "Næste side", next: "valg2" }],
  },

  vejr: {
    title: "Gå væk",
    text: "De 2 kammerater vælger at gå ned til gyden bag ved grillbaren istedet, hvor de plejer at finde Pølses ynglingsret.",
    image: "assets/side7c.png",
    alt: "på vej væk",
    choices: [{ label: "Næste side", next: "grill" }],
  },

  grill: {
    title: "Grill snacks",
    text: "Pølse og Orla har fundet en bakke med gamle pomfritter og en ordenligt stor pølser, de er rigtig glade for at de valgte at gå her ned istedet for.",
    image: "assets/side8c.png",
    alt: "grillbar",
    choices: [
      { label: "Afslut", url: "landingpage.html" },
      { label: "Tilbage til valget", next: "valg1" },
    ],
  },

  valg2: {
    title: "Det andet valg",
    text: "Nu får du lov til at vælge, her er 3 forskellige handlinger.",
    image: "assets/side8.png",
    alt: "andet valg",
    choices: [
      { label: "Slås med duen", next: "slag" },
      { label: "Snakke med duen", next: "snak" },
      { label: "Forhandle med duen", next: "dele" },
    ],
  },

  slag: {
    title: "Slåskamp",
    text: "Pølse og Orla overfalder duen og der bliver et vældigt turmult.",
    image: "assets/side8b.png",
    alt: "slåskamp",
    choices: [{ label: "Næste side", next: "flugt" }],
  },

  flugt: {
    title: "Flugten",
    text: "De ender med at brække duens ene vinge, så de skynder sig at stikker af i en vældig fart.",
    image: "assets/side9b.png",
    alt: "flugt",
    choices: [{ label: "Næste side", next: "politi" }],
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
      { label: "Afslut", url: "landingpage.html" },
      { label: "Tilbage til valget", next: "valg2" },
    ],
  },

  snak: {
    title: "Snakke sammen",
    text: "Pølse og Orla får sig en rigtig god snak med duen, som de finder ud af hedder Lars Bo. Lars Bo har holdt vagt over skraldeguldet i snart 8 timer, imens han har prøvet at finde på en plan om, hvordan han skal få det hele med hjem.",
    image: "assets/side8a.png",
    alt: "snak",
    choices: [{ label: "Næste side", next: "dele" }],
  },

  dele: {
    title: "Dele skraldeguldet",
    text: "De har besluttet sig for at dele skraldeguldet imellem hinanden, så kan duen også nemmere få sin andel med hjem. Vores 2 kammerater er ovenud lykkelige over hvor heldige de har været.",
    image: "assets/side9a.png",
    alt: "dele",
    choices: [{ label: "Næste side", next: "hjem" }],
  },

  hjem: {
    title: "På vejen hjem",
    text: "Pølse og Orla begynder at gå hjem af med deres skraldeguld, da de ser en lille flok slutnen dyr der står og varmer sig ved en udlufningsrist, som kommer inde fra bageren af.",
    image: "assets/side10.png",
    alt: "hjem",
    choices: [{ label: "Næste side", next: "trist" }],
  },

  trist: {
    title: "Trist",
    text: "Pølse sætter sig og kigger trist ned i en vandpyt og Orla sætter sig ved siden af ham.",
    image: "assets/side11.png",
    alt: "trist",
    choices: [{ label: "Næste side", next: "folelser" }],
  },

  folelser: {
    title: "Følelser",
    text: "Pølse og Orla prøver at finde ud af hvilke følelser Pølse har lige nu. De finder ud af at Pølse er ked af det, fordi de andre dyr er sultene og ikke har noget mad.",
    image: "assets/side12.png",
    alt: "følelser",
    choices: [{ label: "Næste side", next: "valg3" }],
  },

  valg3: {
    title: "3 valg",
    text: "Pølse og Orla har nu 3 valg muligheder, tænk dig godt om, før du vælger.",
    image: "assets/side13.png",
    alt: "tredje valg",
    choices: [
      { label: "Spise det selv", next: "forlad" },
      { label: "Efterlad skraldeguld", next: "efterlad" },
      { label: "Dele med de andre", next: "dele2" },
    ],
  },

  forlad: {
    title: "Gå væk",
    text: "Pølse og Orla beslutter sig for, at spise alt det gamle brød og kager selv, så de skynder sig væk.",
    image: "assets/side14a.png",
    alt: "gå væk",
    choices: [{ label: "Næste side", next: "fed" }],
  },

  efterlad: {
    title: "Efterlad",
    text: "Pølse og Orla efterlader alt det gamle brød og kager og håber, at der er nogle andre der kan finde det.",
    image: "assets/side14b.png",
    alt: "efterlad",
    choices: [{ label: "Næste side", next: "taget" }],
  },

  dele2: {
    title: "Dele",
    text: "Pølse og Orla deler deres skraldeguld med de sultne små dyr, så de alle kan gå mætte i seng idag.",
    image: "assets/side14c.png",
    alt: "dele2",
    choices: [{ label: "Næste side", next: "taget" }],
  },

  fed: {
    title: "De fede må svede",
    text: "Pølse og Orla har spist alt det gamle brød og kager og har nu fået kæmpe ondt i deres maver, der er en urolig nat i vente for vores to grådige drenge.",
    image: "assets/side15a.png",
    alt: "fed",
    choices: [
      { label: "Afslut", url: "landingpage.html" },
      { label: "Tilbage til valget", next: "valg3" },
    ],
  },

  taget: {
    title: "En god dag",
    text: "Pølse og Orla nyder solopgangen på toppen af et hustag og snakker om alle de ting de har oplevet idag.",
    image: "assets/side16.png",
    alt: "taget",
    choices: [
      { label: "Afslut", url: "landingpage.html" },
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

  // Byg knapper
  if (choicesEl) {
    choicesEl.innerHTML = "";

    (scene.choices || []).forEach(choice => {
      const btn = document.createElement("button");
      btn.className = "choice";
      btn.type = "button";
      btn.textContent = choice.label;

      btn.addEventListener("click", () => {
        if (choice.url) {
          window.location.href = new URL(choice.url, window.location.href).href;
        } else {
          renderScene(choice.next, true);
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
      });

      choicesEl.appendChild(btn);
    });
  }

  // Vis/skjul tilbageknap
  if (backBtn) {
    backBtn.style.display = sceneHistory.length > 0 ? "grid" : "none";
  }
}

// ====== START APP ======
renderScene(currentSceneId, false);
