import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, collection, getDocs, doc, deleteDoc, updateDoc, arrayUnion, increment, deleteField 
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
        allPrintables = querySnapshot.docs.map(docSnap => ({ 
            firebaseId: docSnap.id, 
            ...docSnap.data() 
        }));

        populateFilterDropdown("topicFilter", "topic");
        populateFilterDropdown("languageFilter", "language");
        populateExtraFields(); 
        applyPrintableFilters();
    } catch (error) { 
        console.error("Load Error:", error);
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

function populateExtraFields() {
    const fieldSelector = document.getElementById("extraFieldSelector");
    if (!fieldSelector) return;

    const staticFields = ['topic', 'language', 'title', 'url', 'id', 'docid', 'favoritescount', 'feedback', 'createdat', 'storagepath', 'firebaseid'];

    let extraKeys = [];
    allPrintables.forEach(res => {
        Object.keys(res).forEach(key => {
            const lowKey = key.toLowerCase();
            if (!staticFields.includes(lowKey) && !extraKeys.includes(lowKey)) {
                extraKeys.push(lowKey);
            }
        });
    });

    const currentField = fieldSelector.value;
    fieldSelector.innerHTML = '<option value="">Search by Extra Field...</option>';
    extraKeys.sort().forEach(key => {
        fieldSelector.innerHTML += `<option value="${key}">${key.toUpperCase()}</option>`;
    });
    fieldSelector.value = currentField;
}

// Handle Extra Field Dropdowns
document.getElementById("extraFieldSelector")?.addEventListener("change", (e) => {
    const fieldName = e.target.value;
    const valueSelector = document.getElementById("extraValueSelector");
    
    if (!fieldName) {
        valueSelector.innerHTML = '<option value="">Select Value...</option>';
        valueSelector.disabled = true;
        applyPrintableFilters();
        return;
    }

    const values = [...new Set(allPrintables.map(res => res[fieldName])
        .filter(val => val !== undefined && val !== ""))].sort();

    valueSelector.innerHTML = `<option value="">All ${fieldName.toUpperCase()}s</option>`;
    values.forEach(v => {
        valueSelector.innerHTML += `<option value="${v}">${v}</option>`;
    });
    valueSelector.disabled = false;
    applyPrintableFilters();
});

document.getElementById("extraValueSelector")?.addEventListener("change", applyPrintableFilters);

// 2. Display Data
function displayPrintables(data) {
    const list = document.getElementById("printableList");
    if (!list) return;
    list.innerHTML = "";

    data.forEach(res => {
        const card = document.createElement("div");
        card.className = "resource-item";
        // FIX: Match the firebaseId property from load function
        card.dataset.id = res.firebaseId; 
        card.style = "margin-bottom:20px; border-bottom:1px solid #eee; padding-bottom:15px; text-align:center;";

        card.innerHTML = `
            <h3>${res.title || "Untitled"}</h3>
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

// 3. Shared Click Handler
document.addEventListener("click", async (e) => {
    const card = e.target.closest(".resource-item");
    if (!card) return; 

    const docId = card.dataset.id;

    // --- DELETE FIELD ---
    if (e.target.classList.contains("remove-field-key-btn")) {
        const keyToDelete = e.target.dataset.key;
        if (!confirm(`Permanently delete the field "${keyToDelete}"?`)) return;
        try {
            const updateObj = {};
            updateObj[keyToDelete] = deleteField(); 
            await updateDoc(doc(db, "printables", docId), updateObj); // FIX: collection name
            alert(`Field removed.`);
            e.target.closest(".field-row").remove();
            loadPrintables(); 
        } catch (err) { alert("Error: " + err.message); }
        return;
    }

    // --- ADD FIELD ---
    if (e.target.classList.contains("add-field-btn")) {
        const newFieldName = prompt("New field name:");
        if (!newFieldName) return;
        const cleanKey = newFieldName.trim().replace(/\s+/g, '_').toLowerCase();
        const container = card.querySelector(".new-fields-container");
        container.insertAdjacentHTML('beforeend', `
            <div class="field-row" style="margin-top:10px; border-left:3px solid #673AB7; padding-left:10px;">
                <label style="font-size:0.8em; color:#673AB7;">${cleanKey.toUpperCase()}:</label><br>
                <input type="text" class="edit-field" data-key="${cleanKey}" style="width:90%; margin:5px 0;">
            </div>
        `);
        return;
    }

    // --- EDIT BUTTON ---
    if (e.target.classList.contains("edit-btn")) {
        if (prompt("Admin password:") !== "Go3706") return alert("Incorrect password.");
        if (card.querySelector(".edit-panel")) return;

        const item = allPrintables.find(r => r.firebaseId === docId);
        if (!item) return alert("Error: Could not find data.");

        const hiddenFields = ['firebaseId', 'id', 'createdAt', 'feedback', 'favoritesCount', 'storagePath'];
        const panel = document.createElement("div");
        panel.className = "edit-panel";
        panel.style = "margin:15px auto; padding:15px; background:#f9f9f9; border:1px solid #ccc; border-radius:8px; text-align:left;";

        let html = `<strong>Edit Printable:</strong><br><div class="existing-fields">`;
        Object.keys(item).forEach(key => {
            if (hiddenFields.includes(key)) return;
            html += `
                <div class="field-row" style="margin-bottom:10px;">
                    <div style="display:flex; justify-content:space-between;">
                        <label style="font-size:0.8em; color:gray;">${key.toUpperCase()}:</label>
                        <button type="button" class="remove-field-key-btn" data-key="${key}" style="color:red; border:none; background:none; cursor:pointer;">×</button>
                    </div>
                    <input type="text" class="edit-field" data-key="${key}" value="${item[key] || ""}" style="width:95%;">
                </div>`;
        });

        html += `</div><div class="new-fields-container"></div>
            <button class="add-field-btn" style="background:#673AB7; color:white; border:none; padding:5px; margin:10px 0; cursor:pointer; border-radius:4px;">➕ Add Field</button>
            <div style="text-align:center; border-top:1px solid #ccc; padding-top:10px;">
                <button class="save-btn" style="background:green; color:white; padding:8px 20px; border:none; border-radius:4px; cursor:pointer;">Save</button>
                <button class="cancel-btn" style="background:#888; color:white; padding:8px 20px; margin-left:10px; border:none; border-radius:4px; cursor:pointer;">Cancel</button>
            </div>`;
        panel.innerHTML = html;
        card.appendChild(panel);
        return;
    }

    // --- SAVE BUTTON ---
    if (e.target.classList.contains("save-btn")) {
        const updatedData = {};
        card.querySelectorAll(".edit-field").forEach(input => {
            updatedData[input.getAttribute("data-key")] = input.value.trim();
        });
        try {
            await updateDoc(doc(db, "printables", docId), updatedData); // FIX: collection name
            alert("Saved!");
            loadPrintables();
        } catch (err) { alert("Save Error: " + err.message); }
    }

    if (e.target.classList.contains("cancel-btn")) card.querySelector(".edit-panel")?.remove();
    
    if (e.target.classList.contains("delete-btn")) {
        if (prompt("Admin password:") === "Go3706" && confirm("Delete entire file?")) {
            await deleteDoc(doc(db, "printables", docId)); // FIX: collection name
            loadPrintables();
        }
    }
    if (e.target.classList.contains("fav-action-btn")) handleFavorite('printables', docId);
    if (e.target.classList.contains("feed-action-btn")) handleFeedback('printables', docId);
});

// 4. Filtering Logic
function applyPrintableFilters() {
    const searchTerm = document.getElementById("searchInput")?.value.toLowerCase() || "";
    const topic = document.getElementById("topicFilter")?.value.toLowerCase() || "";
    const langFilter = document.getElementById("languageFilter")?.value.toLowerCase() || "";
    const favOnly = document.getElementById("favOnlyFilter")?.checked || false;

    const extraField = document.getElementById("extraFieldSelector")?.value;
    const extraValue = document.getElementById("extraValueSelector")?.value.toLowerCase();

    let filtered = allPrintables.filter(res => {
        const matchesStatic = 
            (res.title || "").toLowerCase().includes(searchTerm) &&
            (!topic || String(res.topic || "").toLowerCase() === topic) &&
            (!langFilter || String(res.language || "").toLowerCase() === langFilter) &&
            (!favOnly || (res.favoritesCount > 0));

        let matchesExtra = true;
        if (extraField && extraValue) {
            matchesExtra = String(res[extraField] || "").toLowerCase() === extraValue;
        }
        return matchesStatic && matchesExtra;
    });

    if (favOnly) {
        filtered.sort((a, b) => (b.favoritesCount || 0) - (a.favoritesCount || 0));
    }
    displayPrintables(filtered);
}

window.addEventListener("DOMContentLoaded", () => {
    loadPrintables();
    ["searchInput", "topicFilter", "languageFilter", "favOnlyFilter"].forEach(id => {
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