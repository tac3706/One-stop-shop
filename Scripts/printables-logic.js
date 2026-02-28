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
let allPrintables = [];

// 1. Load Data
async function loadPrintables() {
    const list = document.getElementById("printableList");
    if (!list) return;
    list.innerHTML = "<p>Loading printables...</p>";
    try {
        const querySnapshot = await getDocs(collection(db, "printables"));
        // Ensure we capture the Firebase Document ID correctly
        allPrintables = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));

        populateFilterDropdown("topicFilter", "topic");
        populateFilterDropdown("ageFilter", "ageGroup");
        populateFilterDropdown("languageFilter", "language");

        applyPrintableFilters();
    } catch (error) {
        list.innerHTML = "<p>Error loading library.</p>";
    }
}

function populateFilterDropdown(elementId, fieldName) {
    const select = document.getElementById(elementId);
    if (!select) return;
    const uniqueValues = [...new Set(allPrintables.map(res => res[fieldName]?.trim().toLowerCase()).filter(Boolean))].sort();
    const originalLabel = select.options[0] ? select.options[0].text : "Select";
    select.innerHTML = `<option value="">${originalLabel}</option>`;
    uniqueValues.forEach(val => {
        select.innerHTML += `<option value="${val}">${val.charAt(0).toUpperCase() + val.slice(1)}</option>`;
    });
}

// 2. Display Data
function displayPrintables(data) {
    const list = document.getElementById("printableList");
    if (!list) return;
    list.innerHTML = "";

    data.forEach(res => {
        const card = document.createElement("div");
        card.className = "resource-item";
        card.dataset.id = res.id; 
        card.style = "margin-bottom:20px; border-bottom:1px solid #eee; padding-bottom:15px; text-align:center;";

        card.innerHTML = `
            <h3>${res.title || "Untitled"}</h3>
            <p>👤 Teacher: ${res.teacher || "Staff"} | 🌐 Lang: ${res.language ? res.language.toUpperCase() : "N/A"}</p>
            <p>🏷️ Topic: ${res.topic || "General"} | 🎂 Age: ${res.ageGroup || "All"}</p>
            
            <div style="margin-top:10px;">
                <a href="${res.url}" target="_blank" style="background:#4CAF50; color:white; display:inline-block; padding:5px 15px; text-decoration:none; border-radius:3px;">📥 Download</a>
                <button class="edit-btn" style="background:#2196F3; color:white; border:none; padding:5px 15px; cursor:pointer; border-radius:3px; margin-left:10px;">Edit</button>
                <button class="delete-btn" style="background:red; color:white; border:none; padding:5px 15px; cursor:pointer; border-radius:3px; margin-left:10px;">Delete</button>
            </div>
            <div class="card-actions" style="margin-top:10px;">
                <button class="fav-action-btn" style="cursor:pointer; background:none; border:1px solid #ccc; border-radius:5px; padding:5px 10px;">⭐ ${res.favoritesCount || 0}</button>
                <button class="feed-action-btn" style="cursor:pointer; background:none; border:1px solid #ccc; border-radius:5px; padding:5px 10px; margin-left:5px;">💬 Feedback (${(res.feedback || []).length})</button>
            </div>
        `;
        list.appendChild(card);
    });
}

// 3. Shared Click Handler (Unified)
document.addEventListener("click", async (e) => {
    const card = e.target.closest(".resource-item");
    const docId = card ? card.dataset.id : null;

    // --- ADD CUSTOM FIELD BUTTON ---
    if (e.target.classList.contains("add-field-btn")) {
        const newFieldName = prompt("Enter the name for the new field (e.g., Level, Duration):");
        if (!newFieldName) return;
        
        const cleanKey = newFieldName.trim().replace(/\s+/g, '_'); 
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

        // String conversion logic to handle numeric IDs (like 73)
        const res = allPrintables.find(r => String(r.id) === String(docId));
        if (!res) return alert("Error: Could not find printable data.");

        const hiddenFields = ['id', 'createdAt', 'feedback', 'favoritesCount', 'storagePath', 'url'];
        const panel = document.createElement("div");
        panel.className = "edit-panel";
        panel.style = "margin:15px auto; padding:15px; background:#f9f9f9; border:1px solid #ccc; border-radius:8px; max-width:400px; text-align:left;";

        let html = `<strong>Edit Printable:</strong><br><div class="existing-fields">`;
        
        Object.keys(res).forEach(key => {
            if (hiddenFields.includes(key)) return;
            const listAttr = key === 'topic' ? 'list="topicSuggestions"' : 
                             key === 'ageGroup' ? 'list="ageSuggestions"' : 
                             key === 'language' ? 'list="langSuggestions"' : '';

            html += `<label style="font-size:0.8em; color:gray;">${key.toUpperCase()}:</label><br>
                     <input type="text" class="edit-field" data-key="${key}" ${listAttr} value="${res[key] || ""}" style="width:90%; margin:5px 0;"><br>`;
        });

        html += `</div><div class="new-fields-container"></div>`;
        html += `
            <button type="button" class="add-field-btn" style="background:#673AB7; color:white; border:none; padding:5px 10px; margin:10px 0; cursor:pointer; border-radius:4px; font-size:0.8em;">➕ Add Custom Field</button>
            <div style="text-align:center; border-top:1px solid #ccc; padding-top:10px;">
                <button class="save-btn" style="background:green; color:white; padding:8px 20px; border:none; border-radius:4px; cursor:pointer;">Save All Changes</button>
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
            await updateDoc(doc(db, "printables", docId), updatedData);
            alert("Updated successfully!");
            loadPrintables();
        } catch (err) { alert("Error saving: " + err.message); }
    }

    // --- CANCEL BUTTON ---
    if (e.target.classList.contains("cancel-btn")) {
        e.target.closest(".edit-panel")?.remove();
    }

    // --- DELETE BUTTON ---
    if (e.target.classList.contains("delete-btn")) {
        if (prompt("Admin password:") === "Go3706" && confirm("Are you sure you want to delete this?")) {
            try {
                await deleteDoc(doc(db, "printables", docId));
                loadPrintables();
            } catch (err) { alert("Delete failed: " + err.message); }
        }
    }

    // --- FAV & FEEDBACK ---
    if (e.target.classList.contains("fav-action-btn")) handleFavorite('printables', docId);
    if (e.target.classList.contains("feed-action-btn")) handleFeedback('printables', docId);
});

// 4. Filtering Logic
function applyPrintableFilters() {
    const searchTerm = document.getElementById("searchInput")?.value.toLowerCase() || "";
    const topic = document.getElementById("topicFilter")?.value.toLowerCase() || "";
    const age = document.getElementById("ageFilter")?.value.toLowerCase() || "";
    const teacherSearch = document.getElementById("teacherFilter")?.value.toLowerCase() || "";
    const langFilter = document.getElementById("languageFilter")?.value || "";
    const favOnly = document.getElementById("favOnlyFilter")?.checked || false;

    const filtered = allPrintables.filter(res => {
        return (res.title || "").toLowerCase().includes(searchTerm) &&
               (!topic || String(res.topic || "").toLowerCase() === topic) &&
               (!age || String(res.ageGroup || "").toLowerCase() === age) &&
               (!teacherSearch || String(res.teacher || "").toLowerCase().includes(teacherSearch)) &&
               (!langFilter || String(res.language || "").toLowerCase() === langFilter) &&
               (!favOnly || (res.favoritesCount > 0));
    });
    displayPrintables(filtered);
}

window.addEventListener("DOMContentLoaded", () => {
    loadPrintables();
    ["searchInput", "topicFilter", "ageFilter", "teacherFilter", "languageFilter", "favOnlyFilter"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener(el.tagName === "SELECT" || el.type === "checkbox" ? "change" : "input", applyPrintableFilters);
    });
});

async function handleFavorite(col, id) {
    await updateDoc(doc(db, col, id), { favoritesCount: increment(1) });
    loadPrintables(); 
}

async function handleFeedback(col, id) {
    const text = prompt("Enter feedback:");
    if(!text) return;
    await updateDoc(doc(db, col, id), {
        feedback: arrayUnion({ text, date: new Date().toLocaleDateString() })
    });
    loadPrintables(); 
}