(() => {
  const TOTAL_QUESTIONS = 5;

  const WORDS = ["Um", "Ta", "Eek", "Ah", "Zo", "Ki", "Lu", "Fen"];
  const ICONS = ["🍓", "🧁", "🍕", "🍏", "🍋", "🍉", "🍒", "🍪", "🥨", "🍇"];

  const state = {
    question: 1,
    current: null
  };

  const $ = (selector) => document.querySelector(selector);

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

  function makeQuestion() {
    const mapping = makeMapping();
    const selected = sample(mapping, 3);

    // The question uses the three code words.
    // The correct answer is their alternative representation:
    // money becomes the matching icon, and icon becomes the matching money value.
    const question = selected.map(item => item.word).join(" ");

    const correct = selected.map(item => ({
      value: item.value,
      icon: item.icon
    }));

    const distractors = [];
    const used = new Set();

    while (distractors.length < 4) {
      const wrong = correct.map((item, index) => {
        const shouldChange = index === Math.floor(Math.random() * 3) || Math.random() < 0.35;
        if (!shouldChange) return { ...item };

        const alternatives = mapping.filter(candidate =>
          candidate.value !== item.value &&
          candidate.icon !== item.icon
        );

        const replacement = alternatives[Math.floor(Math.random() * alternatives.length)];
        return {
          value: replacement.value,
          icon: replacement.icon
        };
      });

      // Guarantee at least one changed position.
      if (wrong.every((item, index) =>
        item.value === correct[index].value && item.icon === correct[index].icon
      )) {
        const index = Math.floor(Math.random() * 3);
        const replacement = mapping.find(candidate =>
          candidate.value !== correct[index].value &&
          candidate.icon !== correct[index].icon
        );
        wrong[index] = {
          value: replacement.value,
          icon: replacement.icon
        };
      }

      const key = wrong.map(item => `${item.value}|${item.icon}`).join(";");
      if (!used.has(key)) {
        used.add(key);
        distractors.push(wrong);
      }
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
        .map(item => `<span>£${item.value}</span><span class="mini-icon">${item.icon}</span>`)
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
    button.classList.add(button.dataset.correct === "true" ? "correct" : "incorrect");

    const correctButton = [...buttons].find(option => option.dataset.correct === "true");
    if (correctButton && correctButton !== button) {
      correctButton.classList.add("correct");
    }

    $(".next-button-wrap .primary-button").disabled = false;
  }

  document.addEventListener("click", (event) => {
    const answer = event.target.closest(".answer-option");
    if (answer && !answer.disabled) {
      selectAnswer(answer);
      return;
    }

    const next = event.target.closest(".next-button-wrap .primary-button");
    if (next && !next.disabled) {
      if (state.question < TOTAL_QUESTIONS) {
        state.question += 1;
        renderQuestion();
      } else {
        state.question = 1;
        renderQuestion();
      }
    }
  });

  renderQuestion();
})();