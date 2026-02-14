const flashcards = [
    {
        base: "go",
        past: "went",
        participle: "gone",
        example: "I went to school yesterday."
    },
    {
        base: "eat",
        past: "ate",
        participle: "eaten",
        example: "She has eaten breakfast."
    },
    {
        base: "see",
        past: "saw",
        participle: "seen",
        example: "They have seen the movie."
    }
];

let currentCard = 0;
let flipped = false;

const cardContent = document.getElementById("card-content");

function showCard() {
    if (!flipped) {
        cardContent.innerHTML = `
            <strong>${flashcards[currentCard].base}</strong>
        `;
    } else {
        cardContent.innerHTML = `
            Past: ${flashcards[currentCard].past}<br>
            Participle: ${flashcards[currentCard].participle}<br><br>
            <em>${flashcards[currentCard].example}</em>
        `;
    }
}

function flipCard() {
    flipped = !flipped;
    showCard();
}

function nextCard() {
    currentCard = (currentCard + 1) % flashcards.length;
    flipped = false;
    showCard();
}

function prevCard() {
    currentCard = (currentCard - 1 + flashcards.length) % flashcards.length;
    flipped = false;
    showCard();
}

showCard();
