"use strict";

const BASIC_HIRAGANA = "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん".split("");
const MAX_MISTAKES = 3;

const app = document.getElementById("app");

const state = {
  currentScreen: "title",
  currentMode: "",
  answerText: "",
  answerChars: [],
  numberMax: 0,
  numberSequence: [],
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

  setScreen("title", `
    <section class="screen panel">
      <h1 class="title">じゅんばん<br>タッチ</h1>
      <p class="subtitle">じゅんばんにタッチしてあそぼう！</p>
      <div class="mode-list">
        <button class="btn" type="button" data-action="hiragana-mode">ひらがなモード</button>
        <button class="btn" type="button" data-action="number-mode">数字モード</button>
        <button class="btn" type="button" disabled>英語モード 準備中</button>
      </div>
    </section>
  `);

  app.querySelector("[data-action='hiragana-mode']").addEventListener("click", showInputScreen);
  app.querySelector("[data-action='number-mode']").addEventListener("click", showNumberSettingsScreen);
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
      <button class="btn secondary" type="button" data-action="title">もどる</button>
    </section>
  `);

  app.querySelectorAll("[data-number-max]").forEach((button) => {
    button.addEventListener("click", () => {
      startNumberGame(Number(button.dataset.numberMax));
    });
  });
  app.querySelector("[data-action='title']").addEventListener("click", resetToTitle);
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

function beginNumberRound() {
  resetRoundState();
  state.numberSequence = Array.from({ length: state.numberMax }, (_, index) => index + 1);
  state.answerText = `1〜${state.numberMax}`;
  state.answerChars = state.numberSequence.map(String);
  state.tiles = createNumberTiles(state.numberSequence);
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
    removed: false
  }));
  const randomTiles = getRandomHiraganaTiles(answerChars, 5).map((char, index) => ({
    id: `random-${index}-${Date.now()}`,
    char,
    isAnswer: false,
    removed: false
  }));

  return shuffleArray([...answerTiles, ...randomTiles]);
}

function createNumberTiles(numberSequence) {
  const numberTiles = numberSequence.map((number) => ({
    id: `number-${number}-${Date.now()}`,
    char: String(number),
    isAnswer: true,
    removed: false
  }));

  return shuffleArray(numberTiles);
}

function getRandomHiraganaTiles(answerChars, count) {
  const used = new Set(answerChars);
  const candidates = BASIC_HIRAGANA.filter((char) => !used.has(char));
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
  const modeName = isNumberMode ? "数字モード" : "ひらがなモード";
  const gameClass = isNumberMode ? " number-game" : "";
  const tileGridClass = isNumberMode ? "tile-grid number-grid" : "tile-grid";
  const progressClass = isNumberMode ? "progress-text number-progress" : "progress-text";

  setScreen("game", `
    <section class="screen panel${gameClass}">
      <div class="game-header">
        <p class="mode-label">${modeName}</p>
        <div class="mistake-label" id="mistakeLabel" aria-label="ミス ${state.mistakeCount} / ${state.maxMistakes}">
          ${renderMistakes()}
        </div>
      </div>
      ${isNumberMode ? `
        <button class="hint-box${state.hintRevealed ? " revealed" : ""}" type="button" data-action="toggle-hint" aria-expanded="${state.hintRevealed}" aria-label="ヒント">
          <span class="hint-label">ヒント</span>
          <span class="hint-answer number-next" id="hintAnswer">${renderHint()}</span>
        </button>
      ` : `
        <button class="hint-box${state.hintRevealed ? " revealed" : ""}" type="button" data-action="toggle-hint" aria-expanded="${state.hintRevealed}" aria-label="ヒント">
          <span class="hint-label">ヒント</span>
          <span class="hint-answer" id="hintAnswer">${renderHint()}</span>
        </button>
      `}
      <p class="feedback" id="feedback" role="status"></p>
      <div class="${tileGridClass}" id="tileGrid">
        ${state.tiles.map((tile) => `
          <button class="tile" type="button" data-tile-id="${tile.id}" aria-label="${tile.char}">
            ${tile.char}
          </button>
        `).join("")}
      </div>
      <div class="progress-box" style="--progress-count: ${state.answerChars.length}">
        <p class="progress-label">すすみぐあい</p>
        <p class="${progressClass}" id="progressText">${renderProgress()}</p>
      </div>
      <button class="btn secondary" type="button" data-action="title">${isNumberMode ? "タイトルへ" : "さいしょへ"}</button>
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

function renderHint() {
  if (!state.hintRevealed) {
    return "";
  }

  if (state.currentMode === "number") {
    const nextNumber = state.answerChars[state.currentIndex];
    return nextNumber ? `つぎは「${nextNumber}」` : "";
  }

  return state.answerText;
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

  if (!tile || tile.removed) {
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
  tile.removed = true;
  state.currentIndex += 1;
  document.getElementById("progressText").innerHTML = renderProgress();
  updateNextNumberLabel();
  button.classList.add("correct");
  button.disabled = true;
  // 将来ここで正解音 correct を再生する想定です。

  window.setTimeout(() => {
    button.remove();
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

function updateNextNumberLabel() {
  if (state.currentMode !== "number") {
    return;
  }

  const nextLabel = document.getElementById("hintAnswer");
  if (nextLabel) {
    nextLabel.textContent = renderHint();
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
        <button class="btn secondary" type="button" data-action="title">${isNumberMode ? "タイトルへ" : "さいしょへ"}</button>
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
        <button class="btn secondary" type="button" data-action="title">${isNumberMode ? "タイトルへ" : "さいしょへ"}</button>
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
