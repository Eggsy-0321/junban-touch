"use strict";

const BASIC_HIRAGANA = "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん".split("");
const KATAKANA_CHARS = [
  "ア", "イ", "ウ", "エ", "オ",
  "カ", "キ", "ク", "ケ", "コ",
  "サ", "シ", "ス", "セ", "ソ",
  "タ", "チ", "ツ", "テ", "ト",
  "ナ", "ニ", "ヌ", "ネ", "ノ",
  "ハ", "ヒ", "フ", "ヘ", "ホ",
  "マ", "ミ", "ム", "メ", "モ",
  "ヤ", "ユ", "ヨ",
  "ラ", "リ", "ル", "レ", "ロ",
  "ワ", "ヲ", "ン",
  "ガ", "ギ", "グ", "ゲ", "ゴ",
  "ザ", "ジ", "ズ", "ゼ", "ゾ",
  "ダ", "ヂ", "ヅ", "デ", "ド",
  "バ", "ビ", "ブ", "ベ", "ボ",
  "パ", "ピ", "プ", "ペ", "ポ"
];
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const MAX_MISTAKES = 3;

const app = document.getElementById("app");

const state = {
  currentScreen: "title",
  currentMode: "",
  answerText: "",
  answerChars: [],
  numberMax: 0,
  numberSequence: [],
  alphabetRangeName: "",
  currentIndex: 0,
  mistakeCount: 0,
  maxMistakes: MAX_MISTAKES,
  tiles: [],
  isLocked: false,
  hintRevealed: false,
  feedbackTimerId: null
};

function setScreen(name, html) {
  state.currentScreen = name;
  app.innerHTML = html;
}

function showTitleScreen() {
  resetRoundState();
  state.currentMode = "";
  state.answerText = "";
  state.answerChars = [];
  state.numberMax = 0;
  state.numberSequence = [];
  state.alphabetRangeName = "";

  setScreen("title", `
    <section class="screen panel title-screen">
      <h1 class="title">じゅんばん<br>タッチ</h1>
      <p class="subtitle">じゅんばんにタッチしてあそぼう！</p>
      <div class="mode-list">
        <button class="btn" type="button" data-action="hiragana-mode">ひらがなモード</button>
        <button class="btn" type="button" data-action="katakana-mode">カタカナモード</button>
        <button class="btn" type="button" data-action="number-mode">数字モード</button>
        <button class="btn" type="button" data-action="english-mode">英語モード</button>
      </div>
    </section>
  `);

  app.querySelector("[data-action='hiragana-mode']").addEventListener("click", showInputScreen);
  app.querySelector("[data-action='katakana-mode']").addEventListener("click", showKatakanaInputScreen);
  app.querySelector("[data-action='number-mode']").addEventListener("click", showNumberSettingsScreen);
  app.querySelector("[data-action='english-mode']").addEventListener("click", showEnglishModeScreen);
}

function showInputScreen() {
  state.currentMode = "hiragana";

  setScreen("input", `
    <section class="screen panel">
      <h2 class="screen-title">ひらがなモード</h2>
      <p class="description">ことばをひらがなでいれてね</p>
      <input class="input-field" id="hiraganaInput" type="text" inputmode="text" maxlength="8" autocomplete="off" aria-label="ひらがなのことば">
      <p class="error-message" id="inputError" role="alert"></p>
      <div class="button-row">
        <button class="btn" type="button" data-action="start">はじめる</button>
        <button class="btn secondary" type="button" data-action="title">さいしょへ</button>
      </div>
    </section>
  `);

  const input = document.getElementById("hiraganaInput");
  input.focus();
  app.querySelector("[data-action='start']").addEventListener("click", startGame);
  app.querySelector("[data-action='title']").addEventListener("click", resetToTitle);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      startGame();
    }
  });
}

function validateInput(value) {
  return /^[ぁ-ん]{1,8}$/.test(value);
}

function showKatakanaInputScreen() {
  state.currentMode = "katakana";

  setScreen("katakana-input", `
    <section class="screen panel">
      <h2 class="screen-title">カタカナモード</h2>
      <p class="description">カタカナをいれてね</p>
      <input class="input-field" id="katakanaInput" type="text" inputmode="text" maxlength="8" autocomplete="off" aria-label="カタカナのことば">
      <p class="error-message" id="katakanaError" role="alert"></p>
      <div class="button-row">
        <button class="btn" type="button" data-action="start">スタート</button>
        <button class="btn secondary" type="button" data-action="title">さいしょへ</button>
      </div>
    </section>
  `);

  const input = document.getElementById("katakanaInput");
  input.focus();
  app.querySelector("[data-action='start']").addEventListener("click", startKatakanaGame);
  app.querySelector("[data-action='title']").addEventListener("click", resetToTitle);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      startKatakanaGame();
    }
  });
}

function validateKatakanaInput(value) {
  return /^[ァ-ヶー]{1,8}$/.test(value);
}

function showNumberSettingsScreen() {
  state.currentMode = "number";

  setScreen("number-settings", `
    <section class="screen panel">
      <h2 class="screen-title">数字モード</h2>
      <p class="description">どこまでタッチする？</p>
      <div class="mode-list">
        <button class="btn" type="button" data-number-max="5">1〜5</button>
        <button class="btn" type="button" data-number-max="10">1〜10</button>
        <button class="btn" type="button" data-number-max="15">1〜15</button>
      </div>
      <button class="btn secondary" type="button" data-action="title">さいしょへ</button>
    </section>
  `);

  app.querySelectorAll("[data-number-max]").forEach((button) => {
    button.addEventListener("click", () => {
      startNumberGame(Number(button.dataset.numberMax));
    });
  });
  app.querySelector("[data-action='title']").addEventListener("click", resetToTitle);
}

function showEnglishModeScreen() {
  state.currentMode = "english";

  setScreen("english-mode", `
    <section class="screen panel">
      <h2 class="screen-title">えいごモード</h2>
      <p class="description">どっちであそぶ？</p>
      <div class="mode-list">
        <button class="btn" type="button" data-action="alphabet-mode">アルファベット</button>
        <button class="btn" type="button" data-action="spelling-mode">スペル</button>
      </div>
      <button class="btn secondary" type="button" data-action="title">さいしょへ</button>
    </section>
  `);

  app.querySelector("[data-action='alphabet-mode']").addEventListener("click", showAlphabetSettingsScreen);
  app.querySelector("[data-action='spelling-mode']").addEventListener("click", showSpellingInputScreen);
  app.querySelector("[data-action='title']").addEventListener("click", resetToTitle);
}

function showAlphabetSettingsScreen() {
  state.currentMode = "alphabet";

  setScreen("alphabet-settings", `
    <section class="screen panel">
      <h2 class="screen-title">アルファベット</h2>
      <p class="description">どこをタッチする？</p>
      <div class="mode-list">
        <button class="btn" type="button" data-alphabet-range="first">前半 A〜M</button>
        <button class="btn" type="button" data-alphabet-range="second">後半 N〜Z</button>
        <button class="btn" type="button" data-alphabet-range="all">全部 A〜Z</button>
      </div>
      <button class="btn secondary" type="button" data-action="back">もどる</button>
    </section>
  `);

  app.querySelectorAll("[data-alphabet-range]").forEach((button) => {
    button.addEventListener("click", () => {
      startAlphabetGame(button.dataset.alphabetRange);
    });
  });
  app.querySelector("[data-action='back']").addEventListener("click", showEnglishModeScreen);
}

function showSpellingInputScreen() {
  state.currentMode = "spelling";

  setScreen("spelling-input", `
    <section class="screen panel">
      <h2 class="screen-title">スペル</h2>
      <p class="description">えいたんごをいれてね</p>
      <input class="input-field" id="spellingInput" type="text" inputmode="latin" maxlength="20" autocomplete="off" autocapitalize="characters" aria-label="えいたんご">
      <p class="description small-note">1〜10文字の英字を入力してください</p>
      <p class="error-message" id="spellingError" role="alert"></p>
      <div class="button-row">
        <button class="btn" type="button" data-action="start">スタート</button>
        <button class="btn secondary" type="button" data-action="back">もどる</button>
      </div>
    </section>
  `);

  const input = document.getElementById("spellingInput");
  input.focus();
  app.querySelector("[data-action='start']").addEventListener("click", startSpellingGame);
  app.querySelector("[data-action='back']").addEventListener("click", showEnglishModeScreen);
  input.addEventListener("input", () => {
    input.value = input.value.toUpperCase();
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      startSpellingGame();
    }
  });
}

function startGame() {
  const input = document.getElementById("hiraganaInput");
  const error = document.getElementById("inputError");
  const value = input.value.trim();

  if (!validateInput(value)) {
    error.textContent = "ひらがなを1〜8文字で入力してね";
    return;
  }

  state.answerText = value;
  state.answerChars = Array.from(value);
  beginRound();
}

function startKatakanaGame() {
  const input = document.getElementById("katakanaInput");
  const error = document.getElementById("katakanaError");
  const value = input.value.trim();

  if (!validateKatakanaInput(value)) {
    error.textContent = "カタカナを1〜8文字で入力してね";
    return;
  }

  state.currentMode = "katakana";
  state.answerText = value;
  state.answerChars = Array.from(value);
  beginKatakanaRound();
}

function startAlphabetGame(range) {
  const settings = {
    first: {
      chars: ALPHABET.slice(0, 13),
      label: "A〜M",
      name: "前半"
    },
    second: {
      chars: ALPHABET.slice(13),
      label: "N〜Z",
      name: "後半"
    },
    all: {
      chars: ALPHABET,
      label: "A〜Z",
      name: "全部"
    }
  }[range];

  if (!settings) {
    showAlphabetSettingsScreen();
    return;
  }

  state.currentMode = "alphabet";
  state.alphabetRangeName = settings.name;
  state.answerText = settings.label;
  state.answerChars = settings.chars;
  beginAlphabetRound();
}

function validateSpellingInput(value) {
  return /^[A-Za-z]{1,10}$/.test(value);
}

function startSpellingGame() {
  const input = document.getElementById("spellingInput");
  const error = document.getElementById("spellingError");
  const value = input.value.trim();

  if (!value || value.length > 10) {
    error.textContent = "1〜10文字の英字を入力してください";
    return;
  }

  if (!validateSpellingInput(value)) {
    error.textContent = "英字だけで入力してください";
    return;
  }

  state.currentMode = "spelling";
  state.answerText = value.toUpperCase();
  state.answerChars = Array.from(state.answerText);
  beginSpellingRound();
}

function startNumberGame(max) {
  state.currentMode = "number";
  state.numberMax = max;
  state.numberSequence = Array.from({ length: max }, (_, index) => index + 1);
  state.answerText = `1〜${max}`;
  state.answerChars = state.numberSequence.map(String);
  beginNumberRound();
}

function beginRound() {
  resetRoundState();
  state.tiles = createTiles(state.answerChars);
  renderGameScreen();
}

function beginKatakanaRound() {
  resetRoundState();
  state.answerChars = Array.from(state.answerText);
  state.tiles = createKatakanaTiles(state.answerChars);
  renderGameScreen();
}

function beginNumberRound() {
  resetRoundState();
  state.numberSequence = Array.from({ length: state.numberMax }, (_, index) => index + 1);
  state.answerText = `1〜${state.numberMax}`;
  state.answerChars = state.numberSequence.map(String);
  state.tiles = createNumberTiles(state.numberSequence);
  renderGameScreen();
}

function beginAlphabetRound() {
  resetRoundState();
  state.tiles = createAlphabetTiles(state.answerChars);
  renderGameScreen();
}

function beginSpellingRound() {
  resetRoundState();
  state.answerChars = Array.from(state.answerText);
  state.tiles = createEnglishSpellingTiles(state.answerChars);
  renderGameScreen();
}

function resetRoundState() {
  state.currentIndex = 0;
  state.mistakeCount = 0;
  state.tiles = [];
  state.isLocked = false;
  state.hintRevealed = false;
  clearFeedbackTimer();
}

function createTiles(answerChars) {
  const answerTiles = answerChars.map((char, index) => ({
    id: `answer-${index}-${Date.now()}`,
    char,
    isAnswer: true,
    cleared: false
  }));
  const randomTiles = getRandomHiraganaTiles(answerChars, 5).map((char, index) => ({
    id: `random-${index}-${Date.now()}`,
    char,
    isAnswer: false,
    cleared: false
  }));

  return shuffleArray([...answerTiles, ...randomTiles]);
}

function createKatakanaTiles(answerChars) {
  const answerTiles = answerChars.map((char, index) => ({
    id: `katakana-answer-${index}-${Date.now()}`,
    char,
    isAnswer: true,
    cleared: false
  }));
  const randomTiles = getRandomKatakanaTiles(answerChars, 5).map((char, index) => ({
    id: `katakana-random-${index}-${Date.now()}`,
    char,
    isAnswer: false,
    cleared: false
  }));

  return shuffleArray([...answerTiles, ...randomTiles]);
}

function createNumberTiles(numberSequence) {
  const numberTiles = numberSequence.map((number) => ({
    id: `number-${number}-${Date.now()}`,
    char: String(number),
    isAnswer: true,
    cleared: false
  }));

  return shuffleArray(numberTiles);
}

function createAlphabetTiles(answerChars) {
  const alphabetTiles = answerChars.map((char, index) => ({
    id: `alphabet-${index}-${Date.now()}`,
    char,
    isAnswer: true,
    cleared: false
  }));

  return shuffleArray(alphabetTiles);
}

function createEnglishSpellingTiles(answerChars) {
  const answerTiles = answerChars.map((char, index) => ({
    id: `spell-answer-${index}-${Date.now()}`,
    char,
    isAnswer: true,
    cleared: false
  }));
  const randomTiles = getRandomEnglishTiles(answerChars, 5).map((char, index) => ({
    id: `spell-random-${index}-${Date.now()}`,
    char,
    isAnswer: false,
    cleared: false
  }));

  return shuffleArray([...answerTiles, ...randomTiles]);
}

function getRandomHiraganaTiles(answerChars, count) {
  const used = new Set(answerChars);
  const candidates = BASIC_HIRAGANA.filter((char) => !used.has(char));
  return shuffleArray(candidates).slice(0, count);
}

function getRandomKatakanaTiles(answerChars, count) {
  const used = new Set(answerChars);
  const candidates = KATAKANA_CHARS.filter((char) => !used.has(char));
  return shuffleArray(candidates).slice(0, count);
}

function getRandomEnglishTiles(answerChars, count) {
  const used = new Set(answerChars);
  const candidates = ALPHABET.filter((char) => !used.has(char));
  return shuffleArray(candidates).slice(0, count);
}

function shuffleArray(items) {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function renderGameScreen() {
  const isNumberMode = state.currentMode === "number";
  const isAlphabetMode = state.currentMode === "alphabet";
  const isSpellingMode = state.currentMode === "spelling";
  const modeName = getModeName();
  const gameClass = isNumberMode || isAlphabetMode
    ? " number-game"
    : isSpellingMode
      ? " spelling-game"
      : "";
  const tileGridClass = isNumberMode
    ? "tile-grid number-grid"
    : isAlphabetMode
      ? `tile-grid alphabet-grid${state.answerChars.length > 13 ? " alphabet-grid-all" : ""}`
      : isSpellingMode
        ? "tile-grid spelling-grid"
        : "tile-grid";
  const progressClass = isNumberMode
    ? "progress-text number-progress"
    : isAlphabetMode
      ? "progress-text alphabet-progress"
      : "progress-text";
  const hintClass = isNumberMode || isAlphabetMode || isSpellingMode ? " number-next" : "";

  setScreen("game", `
    <section class="screen panel game-screen${gameClass}">
      <div class="game-header">
        <p class="mode-label">${modeName}</p>
        <div class="mistake-label" id="mistakeLabel" aria-label="ミス ${state.mistakeCount} / ${state.maxMistakes}">
          ${renderMistakes()}
        </div>
      </div>
      <button class="hint-box${state.hintRevealed ? " revealed" : ""}" type="button" data-action="toggle-hint" aria-expanded="${state.hintRevealed}" aria-label="ヒント">
        <span class="hint-label">ヒント</span>
        <span class="hint-answer${hintClass}" id="hintAnswer">${renderHint()}</span>
      </button>
      <p class="feedback" id="feedback" role="status"></p>
      <div class="${tileGridClass}" id="tileGrid">
        ${state.tiles.map((tile) => `
          <button class="tile${tile.cleared ? " is-cleared" : ""}" type="button" data-tile-id="${tile.id}" aria-label="${tile.char}${tile.cleared ? " cleared" : ""}"${tile.cleared ? " disabled aria-disabled=\"true\"" : ""}>
            ${tile.char}
          </button>
        `).join("")}
      </div>
      <div class="progress-box" style="--progress-count: ${state.answerChars.length}">
        <p class="progress-label">すすみぐあい</p>
        <p class="${progressClass}" id="progressText">${renderProgress()}</p>
      </div>
      <button class="btn secondary" type="button" data-action="title">さいしょへ</button>
    </section>
  `);

  app.querySelectorAll(".tile").forEach((button) => {
    button.addEventListener("click", handleTileClick);
  });
  const hintButton = app.querySelector("[data-action='toggle-hint']");
  if (hintButton) {
    hintButton.addEventListener("click", toggleHint);
  }
  app.querySelector("[data-action='title']").addEventListener("click", resetToTitle);
}

function getModeName() {
  if (state.currentMode === "number") {
    return "数字モード";
  }

  if (state.currentMode === "alphabet") {
    return `アルファベット ${state.alphabetRangeName}`;
  }

  if (state.currentMode === "spelling") {
    return "スペル";
  }

  if (state.currentMode === "katakana") {
    return "カタカナモード";
  }

  return "ひらがなモード";
}

function renderHint() {
  if (!state.hintRevealed) {
    return "";
  }

  const nextChar = state.answerChars[state.currentIndex];
  return nextChar ? `つぎは「${nextChar}」` : "";
}

function toggleHint(event) {
  state.hintRevealed = !state.hintRevealed;
  const button = event.currentTarget;
  const hintAnswer = document.getElementById("hintAnswer");

  button.classList.toggle("revealed", state.hintRevealed);
  button.setAttribute("aria-expanded", String(state.hintRevealed));
  hintAnswer.textContent = renderHint();
}

function renderProgress() {
  if (state.currentMode === "alphabet") {
    return `あと${state.answerChars.length - state.currentIndex}こ`;
  }

  return state.answerChars
    .map((char, index) => `<span class="progress-char">${index < state.currentIndex ? char : "□"}</span>`)
    .join("");
}

function renderMistakes() {
  return Array.from({ length: state.maxMistakes }, (_, index) => {
    const isMissed = index < state.mistakeCount;
    return `<span class="mistake-mark${isMissed ? " missed" : ""}" aria-hidden="true">${isMissed ? "&times;" : ""}</span>`;
  }).join("");
}

function handleTileClick(event) {
  if (state.isLocked || state.currentScreen !== "game") {
    return;
  }

  const button = event.currentTarget;
  const tileId = button.dataset.tileId;
  const tile = state.tiles.find((item) => item.id === tileId);

  if (!tile || tile.cleared) {
    return;
  }

  const neededChar = state.answerChars[state.currentIndex];
  if (tile.char === neededChar) {
    handleCorrectTile(tile, button);
  } else {
    handleWrongTile(button);
  }
}

function handleCorrectTile(tile, button) {
  state.isLocked = true;
  tile.cleared = true;
  state.currentIndex += 1;
  document.getElementById("progressText").innerHTML = renderProgress();
  updateHintAnswer();
  button.classList.add("correct");
  button.classList.add("is-cleared");
  button.disabled = true;
  button.setAttribute("aria-disabled", "true");
  // 将来ここで正解音 correct を再生する想定です。

  window.setTimeout(() => {
    button.classList.remove("correct");
    state.isLocked = false;

    if (state.currentIndex >= state.answerChars.length) {
      state.isLocked = true;
      showClearScreen();
    }
  }, 260);
}

function handleWrongTile(button) {
  state.isLocked = true;
  state.mistakeCount += 1;
  const mistakeLabel = document.getElementById("mistakeLabel");
  mistakeLabel.innerHTML = renderMistakes();
  mistakeLabel.setAttribute("aria-label", `ミス ${state.mistakeCount} / ${state.maxMistakes}`);
  showTemporaryFeedback("ちがうよ");
  button.classList.remove("wrong");
  void button.offsetWidth;
  button.classList.add("wrong");
  // 将来ここで不正解音 miss を再生する想定です。

  window.setTimeout(() => {
    button.classList.remove("wrong");
    state.isLocked = false;

    if (state.mistakeCount >= state.maxMistakes) {
      state.isLocked = true;
      showGameOverScreen();
    }
  }, 320);
}

function updateHintAnswer() {
  if (!state.hintRevealed) {
    return;
  }

  const hintAnswer = document.getElementById("hintAnswer");
  if (hintAnswer) {
    hintAnswer.textContent = renderHint();
  }
}

function showTemporaryFeedback(message) {
  const feedback = document.getElementById("feedback");
  if (!feedback) {
    return;
  }
  clearFeedbackTimer();
  feedback.textContent = message;
  state.feedbackTimerId = window.setTimeout(() => {
    feedback.textContent = "";
    state.feedbackTimerId = null;
  }, 900);
}

function clearFeedbackTimer() {
  if (state.feedbackTimerId) {
    window.clearTimeout(state.feedbackTimerId);
    state.feedbackTimerId = null;
  }
}

function showClearScreen() {
  clearFeedbackTimer();
  const isNumberMode = state.currentMode === "number";
  // 将来ここでクリア音 clear を再生する想定です。
  setScreen("clear", `
    <section class="screen panel">
      <div class="celebration" aria-hidden="true">
        <span class="spark"></span>
        <span class="spark"></span>
        <span class="spark"></span>
        <span class="spark"></span>
        <span class="spark"></span>
      </div>
      <h2 class="screen-title">${isNumberMode ? "クリア！" : "せいかい！"}</h2>
      <p class="result-word">${state.answerText}</p>
      <p class="description">よくできました！</p>
      <div class="button-row">
        <button class="btn" type="button" data-action="retry">もういちど</button>
        <button class="btn secondary" type="button" data-action="title">さいしょへ</button>
      </div>
    </section>
  `);

  app.querySelector("[data-action='retry']").addEventListener("click", retryGame);
  app.querySelector("[data-action='title']").addEventListener("click", resetToTitle);
}

function showGameOverScreen() {
  clearFeedbackTimer();
  const isNumberMode = state.currentMode === "number";
  // 将来ここでゲームオーバー音 gameover を再生する想定です。
  setScreen("gameover", `
    <section class="screen panel">
      <h2 class="screen-title">${isNumberMode ? "ゲームオーバー" : "ざんねん！"}</h2>
      <p class="description">もういちどやってみよう</p>
      <div class="button-row">
        <button class="btn" type="button" data-action="retry">もういちど</button>
        <button class="btn secondary" type="button" data-action="title">さいしょへ</button>
      </div>
    </section>
  `);

  app.querySelector("[data-action='retry']").addEventListener("click", retryGame);
  app.querySelector("[data-action='title']").addEventListener("click", resetToTitle);
}

function retryGame() {
  if (state.currentMode === "number" && state.numberMax) {
    beginNumberRound();
    return;
  }

  if (state.currentMode === "alphabet" && state.answerChars.length) {
    beginAlphabetRound();
    return;
  }

  if (state.currentMode === "spelling" && state.answerText) {
    beginSpellingRound();
    return;
  }

  if (state.currentMode === "katakana" && state.answerText) {
    beginKatakanaRound();
    return;
  }

  if (!state.answerText) {
    resetToTitle();
    return;
  }

  state.answerChars = Array.from(state.answerText);
  beginRound();
}

function resetToTitle() {
  showTitleScreen();
}

showTitleScreen();
