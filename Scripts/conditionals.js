const conditionalData = [
    {
        title: "Zero Conditional",
        rule: "100% Truth: Used for scientific facts and general truths. <br><strong>Form:</strong> If + Present Simple, Present Simple.",
        questions: [
            { text: "If you heat water to 100 degrees, it ____.", answer: "boils" },
            { text: "If it rains, the ground ____ wet.", answer: "gets" }
        ]
    },
    {
        title: "1st Conditional",
        rule: "Real Possibility: Things that might happen in the future. <br><strong>Form:</strong> If + Present Simple, Will + Verb.",
        questions: [
            { text: "If I have enough money, I ____ buy a new car.", answer: "will" },
            { text: "If you study hard, you ____ pass the exam.", answer: "will" }
        ]
    },
    {
        title: "2nd Conditional",
        rule: "Hypothetical: Unreal situations in the present or future. <br><strong>Form:</strong> If + Past Simple, Would + Verb.",
        questions: [
            { text: "If I ____ (be) you, I would go to the doctor.", answer: "were" },
            { text: "If I won the lottery, I ____ travel the world.", answer: "would" }
        ]
    },
    {
        title: "3rd Conditional",
        rule: "Past Regret: Unreal situations in the past. <br><strong>Form:</strong> If + Past Perfect, Would have + Past Participle.",
        questions: [
            { text: "If I ____ (study) harder, I would have passed.", answer: "had studied" }
        ]
    }
];

function loadConditional(index) {
    const data = conditionalData[index];
    const menu = document.getElementById('conditional-menu');
    const display = document.getElementById('game-display');
    const content = document.getElementById('game-content');
    document.getElementById('general-overview').style.display = 'none';

    // Hide the selection grid and show the game area
    menu.style.display = 'none';
    display.style.display = 'block';

    content.innerHTML = `
        <div class="explanation-box">
            <h3>${data.title}</h3>
            <p>${data.rule}</p>
        </div>
        <div class="game-card">
            ${data.questions.map((q, i) => `
                <div class="question-item">
                    <p>${q.text.replace('____', `<input type="text" id="cond-ans-${i}" placeholder="...">`)}
                       <span id="cond-feedback-${i}" class="feedback"></span>
                    </p>
                    <button onclick="checkCond(${i}, '${q.answer}')">Check</button>
                </div>
            `).join('')}
        </div>
    `;
}

function checkCond(id, correct) {
    const userInput = document.getElementById(`cond-ans-${id}`).value.trim().toLowerCase();
    const feedback = document.getElementById(`cond-feedback-${id}`);

    if (userInput === correct.toLowerCase()) {
        feedback.textContent = "✓ Correct!";
        feedback.className = "feedback correct";
    } else {
        feedback.textContent = "✗ Try again!";
        feedback.className = "feedback incorrect";
    }
}

function showCondMenu() {
    document.getElementById('conditional-menu').style.display = 'flex';
    document.getElementById('game-display').style.display = 'none';
    document.getElementById('general-overview').style.display = 'block';
}