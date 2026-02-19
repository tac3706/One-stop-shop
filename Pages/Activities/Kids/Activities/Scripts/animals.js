const animals = [
    {
        name: "Lion",
        sound: "sounds/lion.mp3"
    },
    {
        name: "Elephant",
        sound: "sounds/elephant.mp3"
    },
    {
        name: "Monkey",
        sound: "sounds/monkey.mp3"
    }
];

let currentAnimal;
let score = 0;

const playSoundBtn = document.getElementById("playSound");
const choiceButtons = document.querySelectorAll(".choice-btn");
const feedback = document.getElementById("feedback");
const scoreDisplay = document.getElementById("score");
const nextBtn = document.getElementById("nextBtn");

function loadQuestion() {
    feedback.textContent = "";
    nextBtn.style.display = "none";

    currentAnimal = animals[Math.floor(Math.random() * animals.length)];

    // Shuffle choices
    const shuffled = [...animals]
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

    // Ensure correct answer is included
    if (!shuffled.find(a => a.name === currentAnimal.name)) {
        shuffled[0] = currentAnimal;
    }

    choiceButtons.forEach((btn, index) => {
        btn.textContent = shuffled[index].name;
        btn.onclick = () => checkAnswer(shuffled[index].name);
    });
}

function checkAnswer(selected) {
    if (selected === currentAnimal.name) {
        feedback.textContent = "✅ Correct!";
        score++;
        scoreDisplay.textContent = "Score: " + score;
        nextBtn.style.display = "inline-block";
    } else {
        feedback.textContent = "❌ Try again!";
    }
}

playSoundBtn.addEventListener("click", () => {
    const audio = new Audio(currentAnimal.sound);
    audio.play();
});

nextBtn.addEventListener("click", loadQuestion);

loadQuestion();
