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

function showCard() {
    const cardContent = document.getElementById("card-content");
    if (!cardContent) return; // Safety check

    if (!flipped) {
        cardContent.innerHTML = `<strong>${flashcards[currentCard].base}</strong>`;
    } else {
        cardContent.innerHTML = `
            Past: ${flashcards[currentCard].past}<br>
            Participle: ${flashcards[currentCard].participle}<br><br>
            <em>${flashcards[currentCard].example}</em>
        `;
    }
}

// Attach functions to the window so the HTML buttons can find them
window.flipCard = function() {
    flipped = !flipped;
    showCard();
}

window.nextCard = function() {
    currentCard = (currentCard + 1) % flashcards.length;
    flipped = false;
    showCard();
}

window.prevCard = function() {
    currentCard = (currentCard - 1 + flashcards.length) % flashcards.length;
    flipped = false;
    showCard();
}

// Run the first card as soon as the DOM is ready
document.addEventListener("DOMContentLoaded", showCard);