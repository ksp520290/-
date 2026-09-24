// ===== 設定: キャラクターを増やす場合はここに追記してください =====
// img/ と gacha/ フォルダに同じ名前(拡張子違い)のファイルを置き、下の配列に1行追加するだけです。
const CHARACTERS = [
  { name: "猗窩座", img: "img/猗窩座.jpg", audio: "gacha/猗窩座.mp3" },
  { name: "煉獄さん", img: "img/煉獄さん.jpg", audio: "gacha/煉獄さん.mp3" },
  { name: "ミニオン", img: "img/ミニオン.jpg", audio: "gacha/ミニオン.m4a" },
  { name: "ちいかわ", img: "img/ちいかわ.webp", audio: "gacha/ちいかわ.mp3" },
  { name: "トランプ大統領", img: "img/trump.webp", audio: "gacha/trump.mp3" },
  { name: "オバマ大統領", img: "img/obama.jpg", audio: "gacha/obama.mp3" },

];

const OUEN_VIDEOS = [
  "ouen/ouen1.mp4",
  "ouen/ouen2.mp4",
  "ouen/ouen3.mp4",
  "ouen/ouen4.mp4",
  "ouen/ouen5.mp4",
  "ouen/ouen6.mp4",
];

const LOGIN_TARGET = new Date("2026-10-03T00:00:00");
const MAIN_TARGET = new Date("2026-10-10T00:00:00");
const GRADUATION_TARGET = new Date("2026-12-22T00:00:00");

function daysUntil(target){
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = target.getTime() - startOfToday.getTime();
  return Math.max(0, Math.ceil(diff / 86400000));
}

function showScreen(id){
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("is-active"));
  document.getElementById(id).classList.add("is-active");
}

function pickRandom(arr){
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---------- 画面1: ログイン ----------
const loginDaysEl = document.getElementById("login-days");
loginDaysEl.textContent = daysUntil(LOGIN_TARGET);

const startBtn = document.getElementById("start-btn");
const loginVideo = document.getElementById("login-video");
const loginSkip = document.getElementById("login-skip");

startBtn.addEventListener("click", () => {
  startBtn.hidden = true;
  loginSkip.hidden = false;
  loginVideo.muted = false;
  loginVideo.play().catch(() => {});
});

function updateMainCountdowns(){
  document.getElementById("main-days").textContent = daysUntil(MAIN_TARGET);
  document.getElementById("graduation-days").textContent = daysUntil(GRADUATION_TARGET);
}

function goToMain(){
  updateMainCountdowns();
  showScreen("screen-main");
}

loginVideo.addEventListener("ended", goToMain);
loginSkip.addEventListener("click", () => {
  loginVideo.pause();
  goToMain();
});

// ---------- 画面2: メイン ----------
const gachaBtn = document.getElementById("gacha-btn");
gachaBtn.addEventListener("click", () => {
  gachaBtn.disabled = true;
  runGacha();
});

// ---------- 画面3: ガチャ演出 ----------
const gachaVideo = document.getElementById("gacha-video");
const gachaReveal = document.getElementById("gacha-reveal");
const gachaImage = document.getElementById("gacha-image");
const gachaName = document.getElementById("gacha-name");
const gachaSubtitle = document.getElementById("gacha-subtitle");
const gachaAudio = document.getElementById("gacha-audio");
const gachaSkip = document.getElementById("gacha-skip");

// 獲得済みキャラクターの管理(端末に保存され、次回訪問時も引き継がれる)
const ACQUIRED_KEY = "ouenGachaAcquired";

function loadAcquired(){
  try {
    return new Set(JSON.parse(localStorage.getItem(ACQUIRED_KEY) || "[]"));
  } catch (e){
    return new Set();
  }
}

const acquiredSet = loadAcquired();

function isAcquired(c){
  return acquiredSet.has(c.name);
}

function acquireCharacter(c){
  if (acquiredSet.has(c.name)) return;
  acquiredSet.add(c.name);
  try {
    localStorage.setItem(ACQUIRED_KEY, JSON.stringify([...acquiredSet]));
  } catch (e){}
}

// 現在のガチャ演出の段階("video"=応援動画再生中 / "audio"=セリフ再生中)
let gachaPhase = "video";

// 音声ファイルのパス(gacha/xxx.mp3など)から、同名のtextファイル(text/xxx.txt)のパスを作る
function textPathFor(audioPath){
  return audioPath.replace(/^gacha\//, "text/").replace(/\.[^.]+$/, ".txt");
}

function runGacha(){
  gachaReveal.classList.remove("is-visible");
  gachaSubtitle.hidden = true;
  gachaSubtitle.textContent = "";
  gachaVideo.style.display = "block";
  gachaVideo.src = pickRandom(OUEN_VIDEOS);
  gachaVideo.currentTime = 0;
  gachaPhase = "video";
  gachaSkip.hidden = false;
  showScreen("screen-gacha");
  gachaVideo.play().catch(() => {});
}

// 画像・名前・字幕・音声をセットしてリベール演出を再生する(通常のガチャ結果表示にも、一覧画面からの再視聴にも共通で使う)
function showReveal(chosen){
  gachaVideo.pause();
  gachaVideo.style.display = "none";

  gachaImage.src = chosen.img;
  gachaName.textContent = chosen.name;
  gachaAudio.src = chosen.audio;

  // セリフに対応するtextファイルがあれば字幕として表示する
  gachaSubtitle.hidden = true;
  gachaSubtitle.textContent = "";
  fetch(textPathFor(chosen.audio))
    .then(res => (res.ok ? res.text() : Promise.reject()))
    .then(text => {
      const trimmed = text.trim();
      if (trimmed){
        gachaSubtitle.textContent = trimmed;
        gachaSubtitle.hidden = false;
      }
    })
    .catch(() => {});

  gachaPhase = "audio";
  gachaSkip.hidden = false;
  gachaReveal.classList.add("is-visible");
  gachaAudio.currentTime = 0;
  gachaAudio.play().catch(() => {});
}

function revealCharacter(){
  const chosen = pickRandom(CHARACTERS);
  acquireCharacter(chosen);
  showReveal(chosen);
}

// キャラ一覧画面から獲得済みキャラをタップした時の再視聴
function previewCharacter(chosen){
  showScreen("screen-gacha");
  showReveal(chosen);
}

function finishGacha(){
  gachaAudio.pause();
  gachaSkip.hidden = true;
  gachaSubtitle.hidden = true;
  gachaBtn.disabled = false;
  showCharacterList();
}

gachaVideo.addEventListener("ended", revealCharacter);
gachaAudio.addEventListener("ended", finishGacha);

// スキップボタン: 応援動画再生中ならセリフ演出へ、セリフ再生中ならキャラ一覧へ進む
gachaSkip.addEventListener("click", () => {
  if (gachaPhase === "video"){
    revealCharacter();
  } else {
    finishGacha();
  }
});

// ---------- 画面4: キャラ一覧 ----------
const listGrid = document.getElementById("list-grid");
const backBtn = document.getElementById("back-btn");

function showCharacterList(){
  listGrid.innerHTML = "";
  CHARACTERS.forEach(c => {
    const acquired = isAcquired(c);
    const card = document.createElement("div");
    card.className = "char-card " + (acquired ? "is-acquired" : "is-locked");
    card.style.backgroundImage = `url("${c.img}")`;
    const label = document.createElement("span");
    label.className = "char-name";
    label.textContent = c.name;
    card.appendChild(label);
    if (acquired){
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.addEventListener("click", () => previewCharacter(c));
    }
    listGrid.appendChild(card);
  });
  showScreen("screen-list");
}

backBtn.addEventListener("click", () => {
  updateMainCountdowns();
  showScreen("screen-main");
});
