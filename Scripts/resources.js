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

// 1. Load Data
async function loadAndDisplay() {
    const list = document.getElementById("resourceList");
    if (!list) return;
    list.innerHTML = "<p>Loading library...</p>";
    try {
        const querySnapshot = await getDocs(collection(db, "resources"));
        // FIX: Ensure we store the Firebase doc.id as 'id'
        allResources = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));

        populateFilterDropdown("topicFilter", "topic");
        populateFilterDropdown("ageFilter", "ageGroup");
        populateFilterDropdown("languageFilter", "language");

        applyFilters();
    } catch (error) {
        list.innerHTML = "<p>Error loading resources.</p>";
    }
}

function populateFilterDropdown(elementId, fieldName) {
    const select = document.getElementById(elementId);
    if (!select) return;
    const uniqueValues = [...new Set(allResources.map(res => res[fieldName]?.trim().toLowerCase()).filter(Boolean))].sort();
    const originalLabel = select.options[0]?.text || "Select";
    select.innerHTML = `<option value="">${originalLabel}</option>`;
    uniqueValues.forEach(val => {
        select.innerHTML += `<option value="${val}">${val.charAt(0).toUpperCase() + val.slice(1)}</option>`;
    });
}

// 2. Display Logic
function displayResources(filteredData) {
    const list = document.getElementById("resourceList");
    if (!list) return;
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
            <h2 class="topic-header" style="cursor:pointer; background:#f0f0f0; padding:10px; border-radius:5px; text-align:center;">
                ▶ ${topic.toUpperCase()} (${topicItems.length})
            </h2>
            <div class="topic-content" style="display:none; padding:10px;">
                ${topicItems.map(res => `
                    <div class="resource-item" data-id="${res.id}" style="margin-bottom:20px; border-bottom:1px solid #eee; padding-bottom:15px; text-align:center;">
                        <h3>${res.title || "Untitled"}</h3>
                        <div class="card-actions" style="margin-top:10px;">
                            <button class="fav-action-btn" style="cursor:pointer; background:none; border:1px solid #ccc; border-radius:5px; padding:5px 10px;">⭐ ${res.favoritesCount || 0}</button>
                            <button class="feed-action-btn" style="cursor:pointer; background:none; border:1px solid #ccc; border-radius:5px; padding:5px 10px; margin-left:5px;">💬 Feedback (${(res.feedback || []).length})</button>
                        </div>
                        <div style="margin-top:10px;">
                            <a href="${res.url}" target="_blank" style="background:#4CAF50; color:white; display:inline-block; padding:5px 15px; text-decoration:none; border-radius:3px;">🔗 Open</a>
                            <button class="edit-btn" style="background:#2196F3; color:white; border:none; padding:5px 15px; cursor:pointer; border-radius:4px; margin-left:5px;">Edit</button>
                            <button class="delete-btn" style="background:red; color:white; border:none; padding:5px 15px; cursor:pointer; border-radius:4px; margin-left:5px;">Delete</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        section.querySelector("h2").onclick = () => {
            const content = section.querySelector(".topic-content");
            content.style.display = content.style.display === "none" ? "block" : "none";
        };
        list.appendChild(section);
    });
}

// 3. Shared Click Handler
document.addEventListener("click", async (e) => {
    const card = e.target.closest(".resource-item");
    const docId = card ? card.dataset.id : null;

    // --- restored: ADD CUSTOM FIELD BUTTON ---
    if (e.target.classList.contains("add-field-btn")) {
        const newFieldName = prompt("Enter the name for the new field (e.g., Level, Duration):");
        if (!newFieldName) return;
        
        // This ensures the key is lowercase so filters can find it later
        const cleanKey = newFieldName.trim().replace(/\s+/g, '_').toLowerCase(); 
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
        if (prompt("Admin password:") !== "Go3706") return alert("Incorrect password.");
        if (card.querySelector(".edit-panel")) return;

        const item = allResources.find(r => r.id === docId);
        if (!item) return alert("Error: Could not find resource data.");

        const hiddenFields = ['id', 'createdAt', 'feedback', 'favoritesCount', 'storagePath'];
        const panel = document.createElement("div");
        panel.className = "edit-panel";
        panel.style = "margin:15px auto; padding:15px; background:#f9f9f9; border:1px solid #ccc; border-radius:8px; max-width:400px; text-align:left;";

        let html = `<strong>Edit Resource:</strong><br><div class="existing-fields">`;
        
        Object.keys(item).forEach(key => {
            if (hiddenFields.includes(key)) return;
            const listAttr = key === 'topic' ? 'list="topicSuggestions"' : 
                             key === 'ageGroup' ? 'list="ageSuggestions"' : 
                             key === 'language' ? 'list="langSuggestions"' : '';

            html += `<label style="font-size:0.8em; color:gray;">${key.toUpperCase()}:</label><br>
                     <input type="text" class="edit-field" data-key="${key}" ${listAttr} value="${item[key] || ""}" style="width:90%; margin:5px 0;"><br>`;
        });

        // Placeholder for newly added fields
        html += `</div><div class="new-fields-container"></div>`;
        
        html += `
            <button type="button" class="add-field-btn" style="background:#673AB7; color:white; border:none; padding:5px 10px; margin:10px 0; cursor:pointer; border-radius:4px; font-size:0.8em;">➕ Add Custom Field</button>
            <div style="text-align:center; border-top:1px solid #ccc; padding-top:10px;">
                <button class="save-btn" style="background:green; color:white; padding:8px 20px; border:none; border-radius:4px; cursor:pointer;">Save</button>
                <button class="cancel-btn" style="background:#888; color:white; padding:8px 20px; margin-left:10px; border:none; border-radius:4px; cursor:pointer;">Cancel</button>
            </div>`;
        
        panel.innerHTML = html;
        card.appendChild(panel);
    }

    // --- SAVE BUTTON ---
    if (e.target.classList.contains("save-btn")) {
        const updatedData = {};
        card.querySelectorAll(".edit-field").forEach(input => {
            const key = input.getAttribute("data-key");
            if (key) updatedData[key] = input.value.trim();
        });

        try {
            await updateDoc(doc(db, "resources", docId), updatedData);
            alert("Resource Updated!");
            loadAndDisplay();
        } catch (err) { 
            alert("Error: " + err.message); 
        }
    }

    if (e.target.classList.contains("cancel-btn")) e.target.closest(".edit-panel")?.remove();

    if (e.target.classList.contains("delete-btn")) {
        if (prompt("Admin password:") === "Go3706" && confirm("Delete?")) {
            await deleteDoc(doc(db, "resources", docId));
            loadAndDisplay();
        }
    }

    if (e.target.classList.contains("fav-action-btn")) handleFavorite('resources', docId);
    if (e.target.classList.contains("feed-action-btn")) handleFeedback('resources', docId);
});

// 4. Filtering & Sorting
function applyFilters() {
    const searchTerm = (document.getElementById("searchInput")?.value || "").toLowerCase();
    const topic = (document.getElementById("topicFilter")?.value || "").toLowerCase();
    const age = (document.getElementById("ageFilter")?.value || "").toLowerCase();
    const teacherSearch = (document.getElementById("teacherFilter")?.value || "").toLowerCase();
    const langFilter = (document.getElementById("languageFilter")?.value || "").toLowerCase();
    const favOnly = document.getElementById("favOnlyFilter")?.checked || false;

    let filtered = allResources.filter(res => {
        const resTitle = (res.title || "").toLowerCase();
        const resTopic = String(res.topic || "").toLowerCase();
        const resAge = String(res.ageGroup || "").toLowerCase();
        const resTeacher = String(res.teacher || "").toLowerCase();
        const resLang = String(res.language || "").toLowerCase();

        return resTitle.includes(searchTerm) &&
               (!topic || resTopic === topic) &&
               (!age || resAge === age) &&
               (!teacherSearch || resTeacher.includes(teacherSearch)) &&
               (!langFilter || resLang === langFilter) &&
               (!favOnly || (res.favoritesCount > 0));
    });

    // FIX: Sort by favorites (most stars first) if filter is active
    if (favOnly) {
        filtered.sort((a, b) => (b.favoritesCount || 0) - (a.favoritesCount || 0));
    }

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