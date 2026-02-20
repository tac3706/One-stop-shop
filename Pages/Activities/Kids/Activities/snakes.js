const board = document.getElementById("board");
const rollBtn = document.getElementById("rollBtn");
const diceResult = document.getElementById("diceResult");
const questionBox = document.getElementById("questionBox");
const questionText = document.getElementById("questionText");
const answerInput = document.getElementById("answerInput");
const submitAnswer = document.getElementById("submitAnswer");
const statusText = document.getElementById("status");

const totalSquares = 30;
let playerPosition = 1;
let diceValue = 0;

// Grammar questions
const questions = [
    { q: "Fill in: She ____ (go) to school yesterday.", a: "went" },
    { q: "Fill in: They ____ (play) football now.", a: "are playing" },
    { q: "Fill in: I have ____ (eat) breakfast.", a: "eaten" },
    { q: "Fill in: He ____ (be) happy.", a: "is" }
];

// Snakes and ladders
const snakes = { 14: 7, 25: 10 };
const ladders = { 3: 11, 8: 18 };

// Build board
for (let i = totalSquares; i >= 1; i--) {
    const square = document.createElement("div");
    square.classList.add("square");
    square.id = "square-" + i;
    square.textContent = i;
    board.appendChild(square);
}

function updatePlayer() {
    document.querySelectorAll(".player").forEach(p => p.remove());

    const player = document.createElement("div");
    player.classList.add("player");

    const currentSquare = document.getElementById("square-" + playerPosition);
    currentSquare.appendChild(player);
}

function rollDice() {
    diceValue = Math.floor(Math.random() * 6) + 1;
    diceResult.textContent = "You rolled: " + diceValue;

    playerPosition += diceValue;

    if (playerPosition > totalSquares) {
        playerPosition = totalSquares;
    }

    askQuestion();
}

function askQuestion() {
    const randomQ = questions[Math.floor(Math.random() * questions.length)];
    questionText.textContent = randomQ.q;
    questionBox.style.display = "block";

    submitAnswer.onclick = function () {
        if (answerInput.value.toLowerCase() === randomQ.a) {
            statusText.textContent = "✅ Correct!";
            checkSnakesAndLadders();
        } else {
            statusText.textContent = "❌ Wrong! Move back.";
            playerPosition -= diceValue;
        }

        questionBox.style.display = "none";
        answerInput.value = "";
        updatePlayer();
        checkWin();
    };
}

function checkSnakesAndLadders() {
    if (snakes[playerPosition]) {
        playerPosition = snakes[playerPosition];
        statusText.textContent += " 🐍 Snake!";
    }
    if (ladders[playerPosition]) {
        playerPosition = ladders[playerPosition];
        statusText.textContent += " 🪜 Ladder!";
    }
}

function checkWin() {
    if (playerPosition === totalSquares) {
        statusText.textContent = "🎉 You Win!";
        rollBtn.disabled = true;
    }
}

rollBtn.addEventListener("click", rollDice);

updatePlayer();