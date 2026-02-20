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
let currentQuestion = null;

const boardSize = 10;
const tileSize = canvas.width / boardSize;

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
  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      ctx.fillStyle = (row + col) % 2 === 0 ? "#f9c74f" : "#90be6d";
      ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);
      ctx.strokeRect(col * tileSize, row * tileSize, tileSize, tileSize);
    }
  }
}

function getCoordinates(position) {
  const row = boardSize - 1 - Math.floor((position - 1) / boardSize);
  let col = (position - 1) % boardSize;

  if (Math.floor((position - 1) / boardSize) % 2 === 1) {
    col = boardSize - 1 - col;
  }

  return {
    x: col * tileSize + tileSize / 2,
    y: row * tileSize + tileSize / 2
  };
}

function drawPlayers() {
  Object.keys(positions).forEach(player => {
    if (positions[player] === 0) return;
    const {x, y} = getCoordinates(positions[player]);
    ctx.beginPath();
    ctx.arc(x, y, tileSize / 5, 0, Math.PI * 2);
    ctx.fillStyle = player == 1 ? "red" : "blue";
    ctx.fill();
  });
}

function updateBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBoard();
  drawPlayers();
}

function rollDice() {
  diceSound.currentTime = 0;
  diceSound.play().catch(()=>{});
  diceValue = Math.floor(Math.random() * 6) + 1;
  rollBtn.textContent = "🎲 " + diceValue;
  askQuestion();
}

function askQuestion() {
  const topic = document.getElementById("topicSelect").value;
  const list = questions[topic];
  currentQuestion = list[Math.floor(Math.random() * list.length)];
  questionText.textContent = currentQuestion.q;
  questionBox.classList.remove("hidden");
}

function movePlayer() {
  positions[currentPlayer] += diceValue;

  if (positions[currentPlayer] > 100) {
    positions[currentPlayer] = 100;
  }

  if (snakes[positions[currentPlayer]]) {
    snakeSound.play().catch(()=>{});
    positions[currentPlayer] = snakes[positions[currentPlayer]];
  }

  if (ladders[positions[currentPlayer]]) {
    positions[currentPlayer] = ladders[positions[currentPlayer]];
  }

  updateBoard();

  p1PosText.textContent = positions[1];
  p2PosText.textContent = positions[2];

  if (positions[currentPlayer] === 100) {
    setTimeout(() => {
      alert("🎉 Player " + currentPlayer + " Wins!");
      positions = {1: 0, 2: 0};
      updateBoard();
    }, 200);
  }

  currentPlayer = currentPlayer === 1 ? 2 : 1;
  currentPlayerText.textContent = "Player " + currentPlayer;
}

rollBtn.addEventListener("click", rollDice);

submitAnswer.addEventListener("click", () => {
  if (!currentQuestion) return;

  if (answerInput.value.trim().toLowerCase() === currentQuestion.a) {
    correctSound.play().catch(()=>{});
    movePlayer();
  }

  questionBox.classList.add("hidden");
  answerInput.value = "";
});

drawBoard();
updateBoard();