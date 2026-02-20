const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

const rollBtn = document.getElementById("rollBtn");
const questionBox = document.getElementById("questionBox");
const questionText = document.getElementById("questionText");
const answerInput = document.getElementById("answerInput");
const submitAnswer = document.getElementById("submitAnswer");

const diceSound = document.getElementById("diceSound");
const correctSound = document.getElementById("correctSound");
const snakeSound = document.getElementById("snakeSound");

const p1PosText = document.getElementById("p1Pos");
const p2PosText = document.getElementById("p2Pos");
const currentPlayerText = document.getElementById("currentPlayer");

let currentPlayer = 1;
let positions = {1: 0, 2: 0};
let diceValue = 0;

const snakes = {16: 6, 48: 30, 62: 19, 88: 24, 95: 56};
const ladders = {2: 38, 7: 14, 15: 26, 21: 42, 28: 84};

const questions = {
  past: [
    {q: "Go → ?", a: "went"},
    {q: "Eat → ?", a: "ate"},
    {q: "See → ?", a: "saw"}
  ],
  present: [
    {q: "He (go) to school.", a: "goes"},
    {q: "She (eat) apples.", a: "eats"},
    {q: "They (play) football.", a: "play"}
  ],
  articles: [
    {q: "___ apple", a: "an"},
    {q: "___ sun", a: "the"},
    {q: "___ car", a: "a"}
  ]
};

function drawBoard() {
  const size = 50;
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      let x = col * size;
      let y = row * size;
      ctx.fillStyle = (row + col) % 2 === 0 ? "#f9c74f" : "#90be6d";
      ctx.fillRect(x, y, size, size);
      ctx.strokeRect(x, y, size, size);
    }
  }
}

function drawPlayer(position, color) {
  if (position === 0) return;
  const size = 50;
  let row = 9 - Math.floor((position - 1) / 10);
  let col = (position - 1) % 10;
  if (Math.floor((position - 1) / 10) % 2 === 1) {
    col = 9 - col;
  }
  ctx.beginPath();
  ctx.arc(col * size + 25, row * size + 25, 10, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

function updateBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBoard();
  drawPlayer(positions[1], "red");
  drawPlayer(positions[2], "blue");
}

function rollDiceAnimation(callback) {
  let rolls = 10;
  let interval = setInterval(() => {
    diceValue = Math.floor(Math.random() * 6) + 1;
    rollBtn.textContent = "🎲 " + diceValue;
    rolls--;
    if (rolls === 0) {
      clearInterval(interval);
      callback();
    }
  }, 100);
}

rollBtn.onclick = () => {
  diceSound.play();
  rollDiceAnimation(() => {
    askQuestion();
  });
};

function askQuestion() {
  const topic = document.getElementById("topicSelect").value;
  const randomQ = questions[topic][Math.floor(Math.random() * questions[topic].length)];
  questionText.textContent = randomQ.q;
  questionBox.classList.remove("hidden");

  submitAnswer.onclick = () => {
    if (answerInput.value.toLowerCase() === randomQ.a) {
      correctSound.play();
      movePlayer();
    }
    questionBox.classList.add("hidden");
    answerInput.value = "";
  };
}

function movePlayer() {
  positions[currentPlayer] += diceValue;
  if (positions[currentPlayer] > 100) positions[currentPlayer] = 100;

  if (snakes[positions[currentPlayer]]) {
    snakeSound.play();
    positions[currentPlayer] = snakes[positions[currentPlayer]];
  }

  if (ladders[positions[currentPlayer]]) {
    positions[currentPlayer] = ladders[positions[currentPlayer]];
  }

  updateBoard();
  p1PosText.textContent = positions[1];
  p2PosText.textContent = positions[2];

  if (positions[currentPlayer] === 100) {
    alert("🎉 Player " + currentPlayer + " Wins!");
    positions = {1: 0, 2: 0};
  }

  currentPlayer = currentPlayer === 1 ? 2 : 1;
  currentPlayerText.textContent = "Player " + currentPlayer;
}

drawBoard();
updateBoard();