(() => {
  const TOTAL_QUESTIONS = 5;

  const WORDS = ["Um", "Ta", "Eek", "Ah", "Zo", "Ki", "Lu", "Fen"];
  const ICONS = ["🍓", "🧁", "🍕", "🍏", "🍋", "🍉", "🍒", "🍪", "🥨", "🍇"];

  const state = {
    question: 1,
    current: null
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

  // Every answer uses one item of each code type:
  // letter + money + picture. This prevents answers such as
  // "🍓 🍏 🍕" or "£4 £7 £2" from being obvious by type.
  function makeRepresentations(items) {
    const types = shuffle(["letter", "money", "picture"]);
    return items.map((item, index) => representation(item, types[index]));
  }

  function makeQuestion() {
    const mapping = makeMapping();

    // Pick three different columns for the original code.
    const selected = sample(mapping, 3);
    const question = selected.map(item => item.word).join(" ");

    // The correct answer must use one alternative from each selected
    // column, in exactly the same order.
    const correct = makeRepresentations(selected);

    const distractors = [];
    const used = new Set([selected.map(item => mapping.indexOf(item)).join("|")]);

    // Every answer must use three DIFFERENT columns. This prevents
    // obviously wrong answers such as "£4 £4 A".
    while (distractors.length < 4) {
      const wrongColumns = sample(mapping, 3);
      const columnKey = wrongColumns.map(item => mapping.indexOf(item)).join("|");

      // A wrong answer cannot use the exact same three columns in the
      // exact same order as the original code.
      if (columnKey === selected.map(item => mapping.indexOf(item)).join("|")) {
        continue;
      }

      // Avoid repeating the same column sequence.
      if (used.has(columnKey)) {
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

      button.disabled = false;
      button.classList.remove("selected", "correct", "incorrect");
    });

    $(".next-button-wrap .primary-button").disabled = true;
  }

  function selectAnswer(button) {
    const buttons = document.querySelectorAll(".answer-option");

    buttons.forEach(option => {
      option.disabled = true;
      option.classList.remove("selected", "correct", "incorrect");
    });

    button.classList.add("selected");
    button.classList.add(
      button.dataset.correct === "true" ? "correct" : "incorrect"
    );

    const correctButton = [...buttons].find(
      option => option.dataset.correct === "true"
    );

    if (correctButton && correctButton !== button) {
      correctButton.classList.add("correct");
    }

    $(".next-button-wrap .primary-button").disabled = false;
  }

  document.addEventListener("click", event => {
    const answer = event.target.closest(".answer-option");

    if (answer && !answer.disabled) {
      selectAnswer(answer);
      return;
    }

    const next = event.target.closest(".next-button-wrap .primary-button");

    if (next && !next.disabled) {
      state.question = state.question < TOTAL_QUESTIONS ? state.question + 1 : 1;
      renderQuestion();
    }
  });

  renderQuestion();
})();