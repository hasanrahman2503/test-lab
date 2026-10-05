document.addEventListener("DOMContentLoaded", () => {
  const TOTAL_QUESTIONS = 10;
  const TIME_LIMIT_SECONDS = 60;

  const WORDS = ["Um", "Ta", "Eek", "Ah", "Zo", "Ki", "Lu", "Fen"];
  const ICONS = ["🍓", "🧁", "🍕", "🍏", "🍋", "🍉", "🍒", "🍪", "🥨", "🍇"];

  const state = {
    question: 1,
    current: null,
    timerInterval: null,
    deadline: 0,
    timeRemaining: TIME_LIMIT_SECONDS,
    score: 0,
    finished: false
  };

  const $ = selector => document.querySelector(selector);

  function shuffle(items) {
    const copy = [...items];

    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;
  }

  function sample(items, count) {
    return shuffle(items).slice(0, count);
  }

  function makeMapping() {
    const words = sample(WORDS, 4);
    const values = sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 4);
    const icons = sample(ICONS, 4);

    return words.map((word, index) => ({
      word,
      value: values[index],
      icon: icons[index]
    }));
  }

  function representation(item, type) {
    if (type === "letter") return item.word;
    if (type === "money") return `£${item.value}`;
    return item.icon;
  }

  function makeRepresentations(items) {
    const types = shuffle(["letter", "money", "picture"]);
    return items.map((item, index) => representation(item, types[index]));
  }

  function makeQuestion() {
    const mapping = makeMapping();
    const selected = sample(mapping, 3);
    const question = selected.map(item => item.word).join(" ");
    const correct = makeRepresentations(selected);

    const distractors = [];
    const originalKey = selected.map(item => mapping.indexOf(item)).join("|");
    const used = new Set([originalKey]);

    while (distractors.length < 4) {
      const wrongColumns = sample(mapping, 3);
      const columnKey = wrongColumns.map(item => mapping.indexOf(item)).join("|");

      if (columnKey === originalKey || used.has(columnKey)) {
        continue;
      }

      used.add(columnKey);
      distractors.push(makeRepresentations(wrongColumns));
    }

    const options = shuffle([
      { items: correct, correct: true },
      ...distractors.map(items => ({ items, correct: false }))
    ]);

    return { mapping, selected, question, options };
  }

  function updateTimer() {
    const millisecondsRemaining = Math.max(0, state.deadline - Date.now());
    state.timeRemaining = Math.ceil(millisecondsRemaining / 1000);

    const minutes = Math.floor(state.timeRemaining / 60);
    const seconds = state.timeRemaining % 60;
    const timer = $("#work-rate-timer");

    if (timer) {
      timer.textContent = `${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
    }

    const progress = $(".progress-fill");
    if (progress) {
      progress.style.width = `${(millisecondsRemaining / (TIME_LIMIT_SECONDS * 1000)) * 100}%`;
    }

    if (millisecondsRemaining <= 0) {
      state.timeRemaining = 0;

      if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
      }

      const nextButton = $(".next-button-wrap .primary-button");
      if (nextButton) {
        nextButton.disabled = true;
      }

      finishTest();
    }
  }

  function finishTest() {
    if (state.finished) return;

    state.finished = true;

    if (state.timerInterval) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
    }

    const main = $(".work-rate-screen");

    main.innerHTML = `
      <div class="work-rate-results">
        <p class="results-eyebrow">Test complete</p>
        <h1>Your score</h1>
        <div class="results-score">
          <strong>${state.score}</strong>
          <span>/ ${TOTAL_QUESTIONS}</span>
        </div>
        <p class="results-message">
          You scored ${state.score} out of ${TOTAL_QUESTIONS}.
        </p>
        <a class="primary-button results-button" href="../../">Back to tests</a>
      </div>
    `;
  }

  function startTimer() {
    if (state.timerInterval) {
      clearInterval(state.timerInterval);
    }

    state.deadline = Date.now() + TIME_LIMIT_SECONDS * 1000;
    state.timeRemaining = TIME_LIMIT_SECONDS;

    updateTimer();
    state.timerInterval = setInterval(updateTimer, 100);
  }

  function renderQuestion() {
    state.current = makeQuestion();

    $(".question-number").textContent = state.question;
    $(".question-total").textContent = TOTAL_QUESTIONS;
    $(".work-rate-question h2").textContent = state.current.question;

    const cells = document.querySelectorAll(".code-cell");

    state.current.mapping.forEach((item, index) => {
      cells[index].querySelector("span").textContent = item.word;
      cells[index + 4].querySelector("span").textContent = `£${item.value}`;
      cells[index + 8].querySelector("span").textContent = item.icon;
    });

    const answerGroups = document.querySelectorAll(".answer-group");

    answerGroups.forEach((group, index) => {
      const option = state.current.options[index];
      const button = group.querySelector(".answer-option");

      button.dataset.correct = option.correct ? "true" : "false";
      button.innerHTML = option.items
        .map(item => `<span class="answer-item">${item}</span>`)
        .join("");

      button.disabled = state.timeRemaining === 0;
      button.classList.remove("selected", "correct", "incorrect");
    });

    const nextButton = $(".next-button-wrap .primary-button");
    if (nextButton) {
      nextButton.disabled = state.timeRemaining === 0;
    }
  }

  function selectAnswer(button) {
    if (state.timeRemaining === 0) return;

    const buttons = document.querySelectorAll(".answer-option");

    buttons.forEach(option => {
      option.classList.remove("selected", "correct", "incorrect");
    });

    button.classList.add("selected");

    $(".next-button-wrap .primary-button").disabled = false;
  }

  document.addEventListener("click", event => {
    const answer = event.target.closest(".answer-option");

    if (answer && !answer.disabled) {
      selectAnswer(answer);
      return;
    }

    const next = event.target.closest(".next-button-wrap .primary-button");

    if (next && !next.disabled && state.timeRemaining > 0 && !state.finished) {
      const selected = document.querySelector(".answer-option.selected");

      if (selected && selected.dataset.correct === "true") {
        state.score += 1;
      }

      if (state.question >= TOTAL_QUESTIONS) {
        finishTest();
        return;
      }

      state.question += 1;
      renderQuestion();
    }
  });

  renderQuestion();
  startTimer();
});