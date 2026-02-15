// 1. Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, collection, getDocs, doc, deleteDoc, updateDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 2. Firebase Config
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

// 3. Load Data
async function loadAndDisplay() {
    const list = document.getElementById("resourceList");
    if (!list) return;
    list.innerHTML = "<p>Loading library...</p>";
    try {
        const querySnapshot = await getDocs(collection(db, "resources"));
        allResources = []; 
        querySnapshot.forEach((doc) => {
            allResources.push({ id: doc.id, ...doc.data() });
        });
        applyFilters(); 
    } catch (error) {
        console.error("Database error:", error);
    }
}

// 4. Display Logic
function displayResources(filteredData) {
    const list = document.getElementById("resourceList");
    list.innerHTML = "";
    
    if (filteredData.length === 0) {
        list.innerHTML = "<p>No resources found.</p>";
        return;
    }

    const topics = [...new Set(filteredData.map(res => String(res.topic || "general").toLowerCase()))];

    topics.forEach(topic => {
        const topicItems = filteredData.filter(res => String(res.topic || "general").toLowerCase() === topic);
        const section = document.createElement("div");
        section.style.marginBottom = "15px";
        
        section.innerHTML = `
            <h2 class="topic-header" style="cursor:pointer; background:#f0f0f0; padding:10px; border-radius:5px;">
                ▶ ${topic.toUpperCase()} (${topicItems.length})
            </h2>
            <div class="topic-content" style="display:none; padding:10px;">
                ${topicItems.map(res => {
                    let displayTags = Array.isArray(res.tags) ? res.tags.join(", ") : (res.tags || "Staff");
                    return `
                    <div class="resource-item" style="margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">
                        <h3>${res.title || "Untitled"}</h3>
                        <p>👤 Teacher: ${displayTags}</p>
                        <p>🏷️ Topic: ${res.topic || "General"} | 🎂 Age: ${res.ageGroup || "All"}</p>
                        <a href="${res.url}" target="_blank" class="back-button" style="background:#4CAF50; color:white; display:inline-block; padding:5px 15px; text-decoration:none; border-radius:3px;">🔗 Open</a>
                        
                        <div style="margin-top:10px;">
                            <button class="edit-btn" data-id="${res.id}" style="background:#2196F3; color:white; border:none; padding:5px 10px; cursor:pointer; border-radius:3px;">Edit Any Field</button>
                            <button class="delete-btn" data-id="${res.id}" style="background:red; color:white; border:none; padding:5px 10px; cursor:pointer; margin-left:10px; border-radius:3px;">Delete</button>
                        </div>
                    </div>
                `}).join('')}
            </div>
        `;

        section.querySelector('h2').onclick = () => {
            const content = section.querySelector('.topic-content');
            content.style.display = content.style.display === "none" ? "block" : "none";
        };

        // DYNAMIC EDIT LOGIC: Loops through existing fields
        section.querySelectorAll('.edit-btn').forEach(btn => {
            btn.onclick = async (e) => {
                const docId = e.target.getAttribute('data-id');
                const item = allResources.find(r => r.id === docId);
                if (!item) return;

                let updatedData = {};
                let userCancelled = false;

                for (const key in item) {
                    if (key === 'id') continue; 

                    let currentValue = item[key];
                    if (Array.isArray(currentValue)) currentValue = currentValue.join(", ");

                    const newValue = prompt(`Edit ${key}:`, currentValue);
                    if (newValue === null) {
                        userCancelled = true;
                        break;
                    }
                    updatedData[key] = newValue;
                }

                if (!userCancelled) { 
                    try {
                        const docRef = doc(db, "resources", docId);
                        await updateDoc(docRef, updatedData);
                        alert("Updated successfully!");
                        loadAndDisplay(); 
                    } catch (error) {
                        console.error("Update Error:", error);
                        alert("Error updating database.");
                    }
                }
            };
        });

        section.querySelectorAll('.delete-btn').forEach(btn => {
            btn.onclick = async (e) => {
                const docId = e.target.getAttribute('data-id');
                if (confirm("Are you sure?")) {
                    try {
                        await deleteDoc(doc(db, "resources", docId));
                        loadAndDisplay(); 
                    } catch (error) {
                        console.error("Delete Error:", error);
                    }
                }
            };
        });

        list.appendChild(section);
    });
}

// 5. Unified Filter Logic
function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const topic = document.getElementById('topicFilter').value.toLowerCase();
    const age = document.getElementById('ageFilter').value;
    const teacherSearch = document.getElementById('teacherFilter').value.toLowerCase();

    const filtered = allResources.filter(res => {
        const matchesSearch = (res.title || "").toLowerCase().includes(searchTerm);
        const matchesTopic = !topic || (String(res.topic || "").toLowerCase() === topic);
        const matchesAge = !age || res.ageGroup === age;
        const currentTeacher = String(res.tags || "").toLowerCase(); 
        const matchesTeacher = !teacherSearch || currentTeacher.includes(teacherSearch);
        return matchesSearch && matchesTopic && matchesAge && matchesTeacher;
    });

    displayResources(filtered);
}

// 6. Listeners
document.getElementById('searchInput').addEventListener('input', applyFilters);
document.getElementById('topicFilter').addEventListener('change', applyFilters);
document.getElementById('ageFilter').addEventListener('change', applyFilters);
document.getElementById('teacherFilter').addEventListener('input', applyFilters);

window.addEventListener('DOMContentLoaded', loadAndDisplay);