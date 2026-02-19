const animals = [
    { name: "Lion", sound: "sounds/lion.mp3" },
    { name: "Elephant", sound: "sounds/elephant.mp3" },
    { name: "Monkey", sound: "sounds/monkey.mp3" },
    { name: "Cow", sound: "sounds/cow.mp3" },
    { name: "Duck", sound: "sounds/duck.mp3" },
    { name: "Cat", sound: "sounds/cat.mp3" },
    { name: "Dog", sound: "sounds/dog.mp3" },
    { name: "Sheep", sound: "sounds/sheep.mp3" },
    { name: "Horse", sound: "sounds/horse.mp3" },
    { name: "Chicken", sound: "sounds/chicken.mp3" },
    { name: "Pig", sound: "sounds/pig.mp3" },
    { name: "Bee", sound: "sounds/bee.mp3" },
    { name: "Owl", sound: "sounds/owl.mp3" },
    { name: "Frog", sound: "sounds/frog.mp3" }
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
    feedback.className = "";
    nextBtn.style.display = "none";
    playSoundBtn.disabled = false;
    
    // Choose a random animal
    currentAnimal = animals[Math.floor(Math.random() * animals.length)];

    // Create a pool of options: start with the correct one
    let options = [currentAnimal];
    
    // Get wrong options
    let remainingAnimals = animals.filter(a => a.name !== currentAnimal.name);
    
    // Shuffle the remaining ones and pick 2
    remainingAnimals.sort(() => 0.5 - Math.random());
    options.push(remainingAnimals[0], remainingAnimals[1]);

    // Shuffle the final 3 options so the correct one isn't always first
    options.sort(() => 0.5 - Math.random());

    choiceButtons.forEach((btn, index) => {
        btn.textContent = options[index].name;
        btn.disabled = false;
        btn.style.opacity = "1";
        btn.onclick = () => checkAnswer(options[index].name, btn);
    });
}

function checkAnswer(selected, clickedBtn) {
    if (selected === currentAnimal.name) {
        feedback.textContent = "✅ Correct! Well done!";
        feedback.className = "correct-text";
        score++;
        scoreDisplay.textContent = "Score: " + score;
        nextBtn.style.display = "inline-block";
        
        // Disable choices after correct answer
        choiceButtons.forEach(btn => btn.disabled = true);
    } else {
        feedback.textContent = "❌ Not quite! Try again!";
        feedback.className = "incorrect-text";
        clickedBtn.style.opacity = "0.5";
        clickedBtn.disabled = true;
    }
}

playSoundBtn.addEventListener("click", () => {
    const audio = new Audio(currentAnimal.sound);
    audio.play().catch(err => {
        console.log("Audio play failed:", err);
        // On mobile, audio often needs a direct user click to start
        alert("Wait! If sound doesn't play, please click the speaker button again.");
    });
});

nextBtn.addEventListener("click", loadQuestion);

// Start game
loadQuestion();