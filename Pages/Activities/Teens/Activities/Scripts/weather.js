const activityData = [
    {
        title: "Weather vs. Climate",
        explanation: "<strong>Weather</strong> refers to specific short-term conditions (what is happening right now). <strong>Climate</strong> refers to long-term patterns (what usually happens). Label 'W' for Weather and 'C' for Climate.",
        type: "gap-fill",
        questions: [
            { text: "____ Today it is 16° Celsius.", answer: "W" },
            { text: "____ In Andalucía, the summers are hot.", answer: "C" },
            { text: "____ In Cádiz, the winters are mild.", answer: "C" },
            { text: "____ Yesterday it was sunny and warm.", answer: "W" },
            { text: "____ On Saturday, it rained all day.", answer: "W" },
            { text: "____ The coasts have mild weather in summer and winter.", answer: "C" }
        ]
    }
    // You can add future standalone activities here (e.g., Vocabulary, Phonics)
];

// 1. Navigation: Show/Hide the game display
function loadActivity(index) {
    const act = activityData[index];
    const display = document.getElementById('game-display');
    const content = document.getElementById('game-content');

    display.style.display = 'block';
    
    content.innerHTML = `
        <div class="explanation-box">
            <h3>Lesson: ${act.title}</h3>
            <p>${act.explanation}</p>
        </div>
        <div class="game-card">
            ${renderGame(act)}
        </div>
    `;
}

// Update this function in activities.js
function showMenu() {
    // We use 'flex' to match the .section-grid class in your style.css
    document.getElementById('activity-menu').style.display = 'flex';
    document.getElementById('game-display').style.display = 'none';
}

// 2. Game Rendering: Modified to include feedback spans
function renderGame(act) {
    return act.questions.map((q, i) => `
        <div class="question-item">
            <p>${q.text.replace('____', `<input type="text" id="ans-${i}" placeholder="W or C" maxlength="1" style="width: 60px;">`)}
               <span id="feedback-${i}" class="feedback"></span>
            </p>
            <button onclick="checkAnswer(${i}, '${q.answer}')">Check Answer</button>
        </div>
    `).join('');
}

// 3. Logic: Check the user's answer
function checkAnswer(index, correctAnswer) {
    const userInput = document.getElementById(`ans-${index}`).value.trim().toUpperCase(); // Uppercase for W/C
    const feedback = document.getElementById(`feedback-${index}`);

    if (userInput === correctAnswer.toUpperCase()) {
        feedback.textContent = "✓ Correct!";
        feedback.className = "feedback correct";
    } else {
        feedback.textContent = `✗ Try again.`;
        feedback.className = "feedback incorrect";
    }
}// This triggers the activity automatically when the script loads
loadActivity(0);