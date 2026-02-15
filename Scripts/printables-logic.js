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
const list = document.getElementById("printableList");

async function loadAndDisplay() {
    list.innerHTML = "<p>Loading materials...</p>";
    const querySnapshot = await getDocs(collection(db, "printables"));
    const printablesData = [];
    querySnapshot.forEach((document) => {
        // We include the ID so we know which one to delete later
        printablesData.push({ id: document.id, ...document.data() });
    });
    displayPrintables(printablesData);
}

function displayPrintables(filteredData) {
    list.innerHTML = "";
    const topics = [...new Set(filteredData.map(p => p.topic))];

    topics.forEach(topic => {
        const section = document.createElement("div");
        const topicFiles = filteredData.filter(p => p.topic === topic);
        
        const header = document.createElement("h2");
        header.textContent = `▶ ${topic.toUpperCase()} (${topicFiles.length})`;
        header.style.cursor = "pointer";
        header.className = "topic-header";
        
        const content = document.createElement("div");
        content.style.display = "none";

        topicFiles.forEach(file => {
            const div = document.createElement("div");
            div.className = "resource-item";
            
            // We display the Type and Age Group tags here
            div.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h3 style="margin-bottom: 5px;">${file.title}</h3>
                        <p style="font-size: 0.9em; color: #666;">
                            👤 <strong>${file.teacher}</strong> | 
                            🎂 ${file.ageGroup} | 
                            📄 ${file.type}
                        </p>
                    </div>
                </div>
                <div style="display: flex; gap: 10px; margin-top: 10px;">
                    <a href="${file.url}" target="_blank" class="back-button" style="background-color: #4CAF50; margin:0; padding: 8px 15px;">
                        📥 View/Download ${file.type}
                    </a>
                    <button class="delete-btn" data-id="${file.id}" data-path="${file.storagePath}" 
                        style="background-color: #ff4444; color: white; border: none; border-radius: 5px; cursor: pointer; padding: 5px 10px;">
                        🗑 Delete
                    </button>
                </div>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;">
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

    // Add click events to all delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            const path = e.target.getAttribute('data-path');
            
            // 1. Ask for the secret password
            const adminKey = prompt("Enter Admin Password to delete:");

            if (adminKey === null) return; // User cancelled

            if (confirm("Are you sure you want to delete this resource?")) {
                try {
                    // Note: Firebase Client SDK doesn't support custom headers easily for delete.
                    // So for a simple "Teacher Site," we do a local check first:
                    if (adminKey !== "YourSecretPassword123") {
                        alert("Incorrect Password!");
                        return;
                    }

                    // 2. Proceed with deletion
                    await deleteDoc(doc(db, "printables", id));
                    
                    if (path) {
                        const fileRef = ref(storage, path);
                        await deleteObject(fileRef);
                    }
                    
                    alert("Deleted successfully!");
// Inside printables-logic.js
let allResources = []; // To store data for filtering

async function loadAndDisplay() {
    list.innerHTML = "<p>Loading materials...</p>";
    try {
        const querySnapshot = await getDocs(collection(db, "printables"));
        allResources = [];
        querySnapshot.forEach((doc) => {
            allResources.push({ id: doc.id, ...doc.data() });
        });
        applyFilters(); // Initial display
    } catch (error) {
        console.error("Error loading:", error);
        list.innerHTML = "<p>Error loading materials. check console.</p>";
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

// Add event listeners for the filters
document.getElementById('searchInput').addEventListener('input', applyFilters);
document.getElementById('topicFilter').addEventListener('change', applyFilters);
document.getElementById('ageFilter').addEventListener('change', applyFilters);
document.getElementById('typeFilter').addEventListener('change', applyFilters);
                } catch (error) {
                    console.error("Error deleting:", error);
                    alert("Delete failed. You might not have permission.");
                }
            }
        });
    });
}

loadAndDisplay();