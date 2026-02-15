import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage, ref, deleteObject } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

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
const storage = getStorage(app);

let allResources = []; 

async function loadAndDisplay() {
    const list = document.getElementById("printableList");
    list.innerHTML = "<p>Loading materials...</p>";
    
    try {
        const querySnapshot = await getDocs(collection(db, "printables"));
        allResources = [];
        querySnapshot.forEach((doc) => {
            allResources.push({ id: doc.id, ...doc.data() });
        });
        applyFilters(); 
    } catch (error) {
        console.error("Firebase Error:", error);
        list.innerHTML = "<p>Error: Check if Firestore Rules are set to 'true'.</p>";
    }
}

function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const topic = document.getElementById('topicFilter').value;
    const age = document.getElementById('ageFilter').value;
    const type = document.getElementById('typeFilter').value;

    const filtered = allResources.filter(res => {
        const matchesSearch = res.title.toLowerCase().includes(searchTerm);
        const matchesTopic = !topic || res.topic === topic;
        const matchesAge = !age || res.ageGroup === age;
        const matchesType = !type || res.type === type;
        return matchesSearch && matchesTopic && matchesAge && matchesType;
    });

    displayPrintables(filtered);
}

function displayPrintables(filteredData) {
    const list = document.getElementById("printableList");
    list.innerHTML = "";
    
    if (filteredData.length === 0) {
        list.innerHTML = "<p>No resources found.</p>";
        return;
    }

    // Group by topic
    const topics = [...new Set(filteredData.map(p => p.topic))];

    topics.forEach(topic => {
        const topicFiles = filteredData.filter(p => p.topic === topic);
        const section = document.createElement("div");
        
        section.innerHTML = `
            <h2 class="topic-header" style="cursor:pointer">▶ ${topic.toUpperCase()} (${topicFiles.length})</h2>
            <div class="topic-content" style="display:none">
                ${topicFiles.map(file => `
                    <div class="resource-item">
                        <h3>${file.title}</h3>
                        <p>👤 ${file.teacher} | 📄 ${file.type}</p>
                        <a href="${file.url}" target="_blank" class="back-button" style="background:#4CAF50; color:white; display:inline-block; padding:5px 10px;">Download</a>
                        <button class="delete-btn" data-id="${file.id}" style="background:red; color:white; border:none; padding:5px 10px; cursor:pointer;">Delete</button>
                        <hr>
                    </div>
                `).join('')}
            </div>
        `;

        // Toggle visibility
        section.querySelector('h2').addEventListener('click', () => {
            const content = section.querySelector('.topic-content');
            const isHidden = content.style.display === "none";
            content.style.display = isHidden ? "block" : "none";
            section.querySelector('h2').textContent = (isHidden ? "▼ " : "▶ ") + topic.toUpperCase();
        });

        list.appendChild(section);
    });
}

// Start the app and listeners
document.getElementById('searchInput').addEventListener('input', applyFilters);
document.getElementById('topicFilter').addEventListener('change', applyFilters);
document.getElementById('ageFilter').addEventListener('change', applyFilters);
document.getElementById('typeFilter').addEventListener('change', applyFilters);

// Ensure the code waits for the HTML elements to exist
window.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const topicFilter = document.getElementById('topicFilter');
    const ageFilter = document.getElementById('ageFilter');
    const typeFilter = document.getElementById('typeFilter');

    // Only attach listeners if the elements are found
    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (topicFilter) topicFilter.addEventListener('change', applyFilters);
    if (ageFilter) ageFilter.addEventListener('change', applyFilters);
    if (typeFilter) typeFilter.addEventListener('change', applyFilters);

loadAndDisplay();
});