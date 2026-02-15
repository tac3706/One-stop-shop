import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCVNUfj11PBHmjoPmDtudky9z6MHAdCsLw",
    authDomain: "one-stop-shop-5e668.firebaseapp.com",
    projectId: "one-stop-shop-5e668",
    storageBucket: "one-stop-shop-5e668.firebasestorage.app",
    messagingSenderId: "158039043020",
    appId: "1:158039043020:web:424c94c7feda5b3004cb69"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const list = document.getElementById("printableList");

async function loadAndDisplay() {
    list.innerHTML = "<p>Loading materials...</p>";
    
    try {
        const querySnapshot = await getDocs(collection(db, "printables"));
        const printablesData = [];
        querySnapshot.forEach((doc) => {
            printablesData.push(doc.data());
        });

        displayPrintables(printablesData);
    } catch (e) {
        list.innerHTML = "<p>Error loading materials. Make sure your Firestore rules are set to Test Mode.</p>";
    }
}

function displayPrintables(filteredData) {
    list.innerHTML = "";
    if (filteredData.length === 0) {
        list.innerHTML = "<p>No materials found yet.</p>";
        return;
    }

    const topics = [...new Set(filteredData.map(p => p.topic))];

    topics.forEach(topic => {
        const section = document.createElement("div");
        const header = document.createElement("h2");
        const topicFiles = filteredData.filter(p => p.topic === topic);
        
        header.textContent = `▶ ${topic.toUpperCase()} (${topicFiles.length})`;
        header.style.cursor = "pointer";
        header.className = "topic-header";
        
        const content = document.createElement("div");
        content.style.display = "none";

        topicFiles.forEach(file => {
            const div = document.createElement("div");
            div.className = "resource-item";
            div.innerHTML = `
                <h3>${file.title}</h3>
                <p>Teacher: ${file.teacher}</p>
                <a href="${file.url}" target="_blank" class="back-button" style="background-color: #4CAF50;">📥 Download PDF</a>
                <hr>
            `;
            content.appendChild(div);
        });

        header.addEventListener("click", () => {
            const isHidden = content.style.display === "none";
            content.style.display = isHidden ? "block" : "none";
            header.textContent = (isHidden ? "▼ " : "▶ ") + topic.toUpperCase() + ` (${topicFiles.length})`;
        });

        section.appendChild(header);
        section.appendChild(content);
        list.appendChild(section);
    });
}

// Kick off the load
loadAndDisplay();