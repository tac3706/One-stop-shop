let mediaRecorder;
let audioChunks = [];
let audioUrl = null;
let imageUrl = null;
let cardCollection = [];

const imageUpload = document.getElementById('imageUpload');
const imagePreview = document.getElementById('imagePreview');
const startRecord = document.getElementById('startRecord');
const stopRecord = document.getElementById('stopRecord');
const audioPlayback = document.getElementById('audioPlayback');
const saveBtn = document.getElementById('saveCard');
const downloadBtn = document.getElementById('downloadCollection');
const grid = document.getElementById('flashcardGrid');

imageUpload.addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imageUrl = e.target.result;
            imagePreview.innerHTML = `<img src="${imageUrl}">`;
        };
        reader.readAsDataURL(file);
    }
});

startRecord.onclick = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const reader = new FileReader();
            reader.onloadend = () => {
                audioUrl = reader.result; // Store as Base64 for downloading
                audioPlayback.src = audioUrl;
                audioPlayback.style.display = 'block';
            };
            reader.readAsDataURL(audioBlob);
        };
        mediaRecorder.start();
        startRecord.disabled = true;
        stopRecord.disabled = false;
        startRecord.innerText = "🔴 Recording...";
    } catch (err) {
        alert("Microphone access denied or not available.");
    }
};

stopRecord.onclick = () => {
    mediaRecorder.stop();
    startRecord.disabled = false;
    stopRecord.disabled = true;
    startRecord.innerText = "🎤 Start Recording";
};

saveBtn.onclick = () => {
    const label = document.getElementById('cardLabel').value;
    if (!label || !imageUrl) {
        alert("Please provide a name and an image!");
        return;
    }

    const cardData = { label, imageUrl, audioUrl };
    cardCollection.push(cardData);
    renderCards();
    
    // Reset
    document.getElementById('cardLabel').value = '';
    imagePreview.innerHTML = '';
    audioPlayback.style.display = 'none';
    audioUrl = null;
    imageUrl = null;
};

function renderCards() {
    grid.innerHTML = '';
    cardCollection.forEach((card, index) => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'custom-card';
        cardDiv.innerHTML = `
            <img src="${card.imageUrl}">
            <h3>${card.label}</h3>
            ${card.audioUrl ? `<button class="play-voice-btn" onclick="new Audio('${card.audioUrl}').play()">🔊 Hear Voice</button>` : ''}
        `;
        grid.appendChild(cardDiv);
    });
}

downloadBtn.onclick = () => {
    if (cardCollection.length === 0) {
        alert("Your collection is empty!");
        return;
    }

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>My Flashcards</title>
        <style>
            body { font-family: sans-serif; text-align: center; background: #f0f4f8; padding: 20px; }
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
            .card { background: white; padding: 15px; border-radius: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
            img { width: 100%; height: 200px; object-fit: contain; background: #fafafa; border-radius: 10px; }
            button { width: 100%; padding: 10px; background: #2196f3; color: white; border: none; border-radius: 5px; cursor: pointer; margin-top: 10px; font-weight: bold; }
        </style>
    </head>
    <body>
        <h1>Flashcard Collection</h1>
        <div class="grid">
            ${cardCollection.map(c => `
                <div class="card">
                    <img src="${c.imageUrl}">
                    <h2>${c.label}</h2>
                    ${c.audioUrl ? `<button onclick="new Audio('${c.audioUrl}').play()">🔊 Play Sound</button>` : ''}
                </div>
            `).join('')}
        </div>
    </body>
    </html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'my-flashcards.html';
    link.click();
};