import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, collection, getDocs, doc, deleteDoc, updateDoc, arrayUnion, increment 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// 3. Load Data & Dynamically Build Filters
async function loadAndDisplay() {
    const list = document.getElementById("resourceList");
    if (!list) return;
    list.innerHTML = "<p>Loading library...</p>";

    try {
        const querySnapshot = await getDocs(collection(db, "resources"));
        allResources = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));

        // Update dropdown filters automatically based on DB content
        populateFilterDropdown("topicFilter", "topic");
        populateFilterDropdown("ageFilter", "ageGroup");
        populateFilterDropdown("languageFilter", "language");

        applyFilters();
    } catch (error) {
        console.error("Database error:", error);
        list.innerHTML = "<p>Error loading resources.</p>";
    }
}

// Helper to fill dropdowns with unique tags from the database
function populateFilterDropdown(elementId, fieldName) {
    const select = document.getElementById(elementId);
    if (!select) return;
    
    const uniqueValues = [...new Set(allResources.map(res => res[fieldName]?.trim().toLowerCase()).filter(Boolean))].sort();
    
    const originalLabel = select.options[0].text; // Keep "All Topics", etc.
    select.innerHTML = `<option value="">${originalLabel}</option>`;
    
    uniqueValues.forEach(val => {
        const displayVal = val.charAt(0).toUpperCase() + val.slice(1);
        select.innerHTML += `<option value="${val}">${displayVal}</option>`;
    });
}

// 4. Display Logic
function displayResources(filteredData) {
    const list = document.getElementById("resourceList");
    const countDisplay = document.getElementById("resultCount");
    if (!list) return;

    list.innerHTML = "";
    if (countDisplay) countDisplay.innerText = `Showing ${filteredData.length} resources`;

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
            <h2 class="topic-header" style="cursor:pointer; background:#f0f0f0; padding:10px; border-radius:5px; text-align:center;">
                ▶ ${topic.toUpperCase()} (${topicItems.length})
            </h2>
            <div class="topic-content" style="display:none; padding:10px;">
                ${topicItems.map(res => {
                    const favCount = res.favoritesCount || 0;
                    const feedbackList = res.feedback || [];
                    const langDisplay = res.language ? res.language.toUpperCase() : "N/A";
                    
                    return `
                        <div class="resource-item" data-id="${res.id}" style="margin-bottom:20px; border-bottom:1px solid #eee; padding-bottom:15px; text-align:center;">
                            <h3>${res.title || "Untitled"}</h3>
                            <p>👤 Teacher: ${res.teacher || "Staff"} | 🌐 Lang: ${langDisplay}</p>
                            <p>🏷️ Topic: ${res.topic || "General"} | 🎂 Age: ${res.ageGroup || "All"}</p>

                            <div class="card-actions" style="margin-top:10px;">
                                <button class="fav-action-btn" style="cursor:pointer; background:none; border:1px solid #ccc; border-radius:5px; padding:5px 10px;">⭐ ${favCount}</button>
                                <button class="feed-action-btn" style="cursor:pointer; background:none; border:1px solid #ccc; border-radius:5px; padding:5px 10px; margin-left:5px;">💬 Feedback (${feedbackList.length})</button>
                            </div>

                            <div style="margin-top:10px;">
                                <a href="${res.url}" target="_blank" style="background:#4CAF50; color:white; display:inline-block; padding:5px 15px; text-decoration:none; border-radius:3px;">🔗 Open</a>
                                <button class="edit-btn" style="background:#2196F3; color:white; border:none; padding:5px 15px; cursor:pointer; border-radius:4px; margin-left:5px;">Edit</button>
                                <button class="delete-btn" style="background:red; color:white; border:none; padding:5px 15px; cursor:pointer; border-radius:4px; margin-left:5px;">Delete</button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        section.querySelector("h2").onclick = () => {
            const content = section.querySelector(".topic-content");
            content.style.display = content.style.display === "none" ? "block" : "none";
        };
        list.appendChild(section);
    });
}

// 5. Shared Click Handler
document.addEventListener("click", async (e) => {
    // --- EDIT BUTTON ---
    if (e.target.classList.contains("edit-btn")) {
        const password = prompt("Admin password:");
        if (password !== "Go3706") return alert("Incorrect password.");
        
const card = e.target.closest(".resource-item");
    if (card.querySelector(".edit-panel")) return;

    const docId = card.dataset.id;
    const item = allResources.find(r => r.id === docId);

    // Fields we handle with specific UI (datalists/inputs)
    const standardFields = ['title', 'teacher', 'topic', 'ageGroup', 'language', 'url'];
    // Fields we don't want to edit (IDs, timestamps, feedback arrays)
    const hiddenFields = ['id', 'createdAt', 'feedback', 'favoritesCount', 'storagePath'];

    const panel = document.createElement("div");
    panel.className = "edit-panel";
    panel.style = "margin: 15px auto; padding: 15px; background: #f9f9f9; border: 1px solid #ccc; border-radius: 8px; max-width: 400px; text-align: left;";

    let panelHTML = `<strong>Edit Resource:</strong><br>`;

    // 1. Add Standard Inputs
    panelHTML += `
        <label>Title:</label><input type="text" class="edit-field" data-key="title" value="${item.title || ''}" style="width:90%; margin:5px 0;"><br>
        <label>Teacher:</label><input type="text" class="edit-field" data-key="teacher" value="${item.teacher || ''}" style="width:90%; margin:5px 0;"><br>
        <label>Topic:</label><input type="text" class="edit-field" data-key="topic" list="topicSuggestions" value="${item.topic || ''}" style="width:90%; margin:5px 0;"><br>
        <label>Age:</label><input type="text" class="edit-field" data-key="ageGroup" list="ageSuggestions" value="${item.ageGroup || ''}" style="width:90%; margin:5px 0;"><br>
        <label>Language:</label><input type="text" class="edit-field" data-key="language" list="langSuggestions" value="${item.language || ''}" style="width:90%; margin:5px 0;"><br>
    `;

    // 2. DYNAMICALLY ADD EXTRA FIELDS found in Firebase
    Object.keys(item).forEach(key => {
        if (!standardFields.includes(key) && !hiddenFields.includes(key)) {
            panelHTML += `
                <label>${key.charAt(0).toUpperCase() + key.slice(1)}:</label>
                <input type="text" class="edit-field" data-key="${key}" value="${item[key]}" style="width:90%; margin:5px 0;"><br>
            `;
        }
    });

    panelHTML += `
        <div style="text-align:center;">
            <button class="save-btn" style="background:green; color:white; border:none; padding:8px 20px; margin-top:10px; cursor:pointer; border-radius:4px;">Save</button>
            <button class="cancel-btn" style="background:#888; color:white; border:none; padding:8px 20px; margin-left:10px; cursor:pointer; border-radius:4px;">Cancel</button>
        </div>
    `;
    
    panel.innerHTML = panelHTML;
    card.appendChild(panel);
}

// --- Updated SAVE Logic to collect all fields ---
if (e.target.classList.contains("save-btn")) {
    const card = e.target.closest(".resource-item");
    const docId = card.dataset.id;
    const updatedData = {};
    
    // Collect every input value based on its data-key attribute
    card.querySelectorAll(".edit-field").forEach(input => {
        const key = input.getAttribute("data-key");
        updatedData[key] = input.value.trim();
    });

    try {
        await updateDoc(doc(db, "resources", docId), updatedData);
        loadAndDisplay();
    } catch (err) { alert("Error: " + err.message); }
}

    if (e.target.classList.contains("cancel-btn")) e.target.closest(".edit-panel")?.remove();

    if (e.target.classList.contains("delete-btn")) {
        const docId = e.target.closest(".resource-item").dataset.id;
        if (prompt("Admin password:") === "Go3706" && confirm("Delete?")) {
            await deleteDoc(doc(db, "resources", docId));
            loadAndDisplay();
        }
    }

    if (e.target.classList.contains("fav-action-btn")) handleFavorite('resources', e.target.closest(".resource-item").dataset.id);
    if (e.target.classList.contains("feed-action-btn")) handleFeedback('resources', e.target.closest(".resource-item").dataset.id);
});

function applyFilters() {
    const searchTerm = document.getElementById("searchInput")?.value.toLowerCase() || "";
    const topic = document.getElementById("topicFilter")?.value.toLowerCase() || "";
    const age = document.getElementById("ageFilter")?.value.toLowerCase() || "";
    const teacherSearch = document.getElementById("teacherFilter")?.value.toLowerCase() || "";
    const langFilter = document.getElementById("languageFilter")?.value || "";
    const favOnly = document.getElementById("favOnlyFilter")?.checked || false;

    const filtered = allResources.filter(res => {
        return (res.title || "").toLowerCase().includes(searchTerm) &&
               (!topic || String(res.topic || "").toLowerCase() === topic) &&
               (!age || String(res.ageGroup || "").toLowerCase() === age) &&
               (!teacherSearch || String(res.teacher || "").toLowerCase().includes(teacherSearch)) &&
               (!langFilter || String(res.language || "").toLowerCase() === langFilter) &&
               (!favOnly || (res.favoritesCount > 0));
    });
    displayResources(filtered);
}

window.addEventListener("DOMContentLoaded", () => {
    loadAndDisplay();
    ["searchInput", "topicFilter", "ageFilter", "teacherFilter", "languageFilter", "favOnlyFilter"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener(el.tagName === "SELECT" || el.type === "checkbox" ? "change" : "input", applyFilters);
    });
});

async function handleFavorite(col, id) {
    await updateDoc(doc(db, col, id), { favoritesCount: increment(1) });
    loadAndDisplay();
}

async function handleFeedback(col, id) {
    const text = prompt("Enter feedback:");
    if(!text) return;
    await updateDoc(doc(db, col, id), {
        feedback: arrayUnion({ text, date: new Date().toLocaleDateString() })
    });
    loadAndDisplay();
}