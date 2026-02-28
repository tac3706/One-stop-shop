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
// --- ADD FIELD BUTTON ---
    if (e.target.classList.contains("add-field-btn")) {
        const newFieldName = prompt("Enter the name for the new field (e.g., Level, Duration, Notes):");
        if (!newFieldName) return;
        
        const cleanKey = newFieldName.trim().replace(/\s+/g, '_'); // Replace spaces with underscores for DB safety
        const container = e.target.closest(".edit-panel").querySelector(".new-fields-container");
        
        const newFieldHTML = `
            <div style="margin-top:10px; border-left:3px solid #673AB7; padding-left:10px;">
                <label style="font-size:0.8em; color:#673AB7; font-weight:bold;">${cleanKey.toUpperCase()} (New):</label><br>
                <input type="text" class="edit-field" data-key="${cleanKey}" placeholder="Enter value..." style="width:90%; margin:5px 0;">
            </div>
        `;
        container.insertAdjacentHTML('beforeend', newFieldHTML);
    }

    // --- EDIT BUTTON ---
    if (e.target.classList.contains("edit-btn")) {
        const password = prompt("Admin password:");
        if (password !== "Go3706") return alert("Incorrect password.");
        
const card = e.target.closest(".resource-item");
    if (card.querySelector(".edit-panel")) return;

    const docId = card.dataset.id;
    // FIND THE ITEM SAFELY
    const item = allResources.find(r => String(r.id) === String(docId));
    
    if (!item) {
        console.log("Searching for:", docId, "Type:", typeof docId);
        console.log("Available IDs:", allResources.map(r => r.id));
        return alert("Error: Could not find resource data. Try refreshing the page.");
    }

    const standardFields = ['title', 'teacher', 'topic', 'ageGroup', 'language', 'url'];
    const hiddenFields = ['id', 'createdAt', 'feedback', 'favoritesCount', 'storagePath'];

    const panel = document.createElement("div");
    panel.className = "edit-panel";
    panel.style = "margin: 15px auto; padding: 15px; background: #f9f9f9; border: 1px solid #ccc; border-radius: 8px; max-width: 400px; text-align: left;";

    let panelHTML = `<strong>Edit Resource:</strong><br>`;
    panelHTML += `<div class="existing-fields">`; // Wrap existing fields

    // Loop through EVERY key present in the document to ensure old/unexpected fields show up
    Object.keys(item).forEach(key => {
        if (hiddenFields.includes(key)) return;

        const val = item[key] || "";
        const isStandard = standardFields.includes(key);
        const listAttr = key === 'topic' ? 'list="topicSuggestions"' : 
                         key === 'ageGroup' ? 'list="ageSuggestions"' : 
                         key === 'language' ? 'list="langSuggestions"' : '';

        panelHTML += `
            <label style="font-size:0.8em; color:gray;">${key.toUpperCase()}:</label><br>
            <input type="text" class="edit-field" data-key="${key}" ${listAttr} value="${val}" style="width:90%; margin:5px 0;"><br>
        `;
    });

panelHTML += `</div>`; // Close existing-fields
panelHTML += `<div class="new-fields-container"></div>`; // Where new fields will appear

// Add the "Add Custom Field" button
panelHTML += `
    <button type="button" class="add-field-btn" style="background:#673AB7; color:white; border:none; padding:5px 10px; margin:10px 0; cursor:pointer; border-radius:4px; font-size:0.8em;">➕ Add Custom Field</button>
    <div style="text-align:center; border-top:1px solid #ccc; pt-10px;">
        <button class="save-btn" style="background:green; color:white; border:none; padding:8px 20px; margin-top:10px; cursor:pointer; border-radius:4px;">Save All Changes</button>
        <button class="cancel-btn" style="background:#888; color:white; border:none; padding:8px 20px; margin-left:10px; cursor:pointer; border-radius:4px;">Cancel</button>
    </div>
`;
    
    panel.innerHTML = panelHTML;
    card.appendChild(panel);
}

// --- Updated SAVE Logic to collect all fields ---
// --- Use this logic ONLY for the Save Button in resources.js ---
if (e.target.classList.contains("save-btn")) {
    const card = e.target.closest(".resource-item");
    const docId = card.dataset.id; // Make sure your card has: <div class="resource-item" data-id="${res.id}">
    
    if (!docId) return alert("Error: No Document ID found for this file.");

    const updatedData = {};
    card.querySelectorAll(".edit-field").forEach(input => {
        const key = input.getAttribute("data-key");
        const val = input.value.trim();
        if (key) updatedData[key] = val;
    });

    try {
        const collectionName = window.location.href.includes("printables") ? "printables" : "resources";
        await updateDoc(doc(db, collectionName, docId), updatedData);
        alert("Resource Updated!");
        loadAndDisplay(); // Refresh the list
    } catch (err) { 
        console.error("Firebase Update Error:", err);
        alert("Error: " + err.message); 
    }
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