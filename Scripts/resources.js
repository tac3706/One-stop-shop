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

let allResources = [];

async function loadAndDisplay() {
    const list = document.getElementById("resourceList");
    list.innerHTML = "<p>Loading library...</p>";
    
    try {
        // Fetch from 'resources' collection where teacher links are saved
        const querySnapshot = await getDocs(collection(db, "resources"));
        allResources = [];
        querySnapshot.forEach((doc) => {
            allResources.push({ id: doc.id, ...doc.data() });
        });
        applyFilters(); 
    } catch (error) {
        console.error("Firebase Error:", error);
        list.innerHTML = "<p>Error loading resources. Check database permissions.</p>";
    }
}

function displayResources(filteredData) {
    const list = document.getElementById("resourceList");
    list.innerHTML = "";
    
    if (filteredData.length === 0) {
        list.innerHTML = "<p>No resources found matching these filters.</p>";
        return;
    }

    // DYNAMIC TAGS: Automatically find every unique topic in the data
    const topics = [...new Set(filteredData.map(res => res.topic || "general"))];

    topics.forEach(topic => {
        const topicItems = filteredData.filter(res => res.topic === topic);
        const section = document.createElement("div");
        
        section.innerHTML = `
            <h2 class="topic-header" style="cursor:pointer; background:#e3f2fd; padding:10px; border-radius:8px; margin-bottom:10px;">
                ▶ ${topic.toUpperCase()} (${topicItems.length})
            </h2>
            <div class="topic-content" style="display:none; padding-left: 15px;">
                ${topicItems.map(res => `
                    <div class="resource-item" style="margin-bottom: 20px; text-align: left;">
                        <h3>${res.title}</h3>
                        <p>👤 Teacher: ${res.teacher || "Staff"} | 🎯 Age: ${res.ageGroup || "All"}</p>
                        <a href="${res.url}" target="_blank" class="back-button" style="background:#4CAF50; color:white; display:inline-block; padding:5px 15px;">🔗 Open Resource</a>
                        <hr style="border:0.5px solid #ddd; margin-top:15px;">
                    </div>
                `).join('')}
            </div>
        `;

        // Toggle logic for collapsible headers
        section.querySelector('h2').addEventListener('click', () => {
            const content = section.querySelector('.topic-content');
            const isHidden = content.style.display === "none";
            content.style.display = isHidden ? "block" : "none";
            section.querySelector('h2').textContent = (isHidden ? "▼ " : "▶ ") + topic.toUpperCase() + ` (${topicItems.length})`;
        });

        list.appendChild(section);
    });
}

function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const topic = document.getElementById('topicFilter').value;
    const age = document.getElementById('ageFilter').value;
    const teacherSearch = document.getElementById('teacherFilter').value.toLowerCase(); // Variable Teacher Search

    const filtered = allResources.filter(res => {
        const matchesSearch = res.title.toLowerCase().includes(searchTerm);
        const matchesTopic = !topic || res.topic === topic;
        const matchesAge = !age || res.ageGroup === age;
        const matchesTeacher = !teacherSearch || (res.teacher && res.teacher.toLowerCase().includes(teacherSearch));
        return matchesSearch && matchesTopic && matchesAge && matchesTeacher;
    });

    displayResources(filtered);
}

// Listeners
document.getElementById('searchInput').addEventListener('input', applyFilters);
document.getElementById('topicFilter').addEventListener('change', applyFilters);
document.getElementById('ageFilter').addEventListener('change', applyFilters);
document.getElementById('teacherFilter').addEventListener('input', applyFilters);

// Initialize
window.addEventListener('DOMContentLoaded', loadAndDisplay);