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

// 1. Load Data & Build Filters
async function loadPrintables() {
    const list = document.getElementById("printableList");
    if (!list) return;
    list.innerHTML = "<p>Loading printables...</p>";
    try {
        const querySnapshot = await getDocs(collection(db, "printables"));
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
// --- Replace your existing displayPrintables function ---
function displayPrintables(data) {
    const list = document.getElementById("printableList");
    if (!list) return;
    list.innerHTML = "";

    data.forEach(res => {
        const card = document.createElement("div");
        card.className = "resource-item";
        card.dataset.id = res.id; // Crucial for identifying the document
        card.style = "margin-bottom:20px; border-bottom:1px solid #eee; padding-bottom:15px; text-align:center;";

        card.innerHTML = `
            <h3>${res.title || "Untitled"}</h3>
            <p>👤 Teacher: ${res.teacher || "Staff"} | 🌐 Lang: ${res.language ? res.language.toUpperCase() : "N/A"}</p>
            <p>🏷️ Topic: ${res.topic || "General"} | 🎂 Age: ${res.ageGroup || "All"}</p>
            
            <div style="margin-top:10px;">
                <a href="${res.url}" target="_blank" style="background:#4CAF50; color:white; display:inline-block; padding:5px 15px; text-decoration:none; border-radius:3px;">📥 Download</a>
                <button class="edit-btn" data-id="${res.id}" style="background:#2196F3; color:white; border:none; padding:5px 15px; cursor:pointer; border-radius:3px; margin-left:10px;">Edit</button>
                <button class="delete-btn" style="background:red; color:white; border:none; padding:5px 15px; cursor:pointer; border-radius:3px; margin-left:10px;">Delete</button>
            </div>
            <div class="card-actions" style="margin-top:10px;">
                <button class="fav-action-btn">⭐ ${res.favoritesCount || 0}</button>
                <button class="feed-action-btn">💬 Feedback (${(res.feedback || []).length})</button>
            </div>
        `;

        // Handle Edit Button Click
        card.querySelector('.edit-btn').onclick = () => {
            if (prompt("Admin password:") !== "Go3706") return alert("Incorrect password.");
            if (card.querySelector(".edit-panel")) return;

            const hiddenFields = ['id', 'createdAt', 'feedback', 'favoritesCount', 'storagePath', 'url'];
            const panel = document.createElement("div");
            panel.className = "edit-panel";
            panel.style = "margin:15px auto; padding:15px; background:#f9f9f9; border:1px solid #ccc; border-radius:8px; max-width:400px; text-align:left;";

            let html = `<strong>Edit Printable:</strong><br>`;
            Object.keys(res).forEach(key => {
                if (hiddenFields.includes(key)) return;
                const listAttr = key === 'topic' ? 'list="topicSuggestions"' : 
                                 key === 'ageGroup' ? 'list="ageSuggestions"' : 
                                 key === 'language' ? 'list="langSuggestions"' : '';

                html += `<label style="font-size:0.8em; color:gray;">${key.toUpperCase()}:</label><br>
                         <input type="text" class="edit-field" data-key="${key}" ${listAttr} value="${res[key] || ""}" style="width:90%; margin:5px 0;"><br>`;
            });

            html += `<div style="text-align:center;">
                        <button class="save-btn" style="background:green; color:white; padding:8px 20px; border:none; border-radius:4px; cursor:pointer;">Save</button>
                        <button class="cancel-btn" style="background:#888; color:white; padding:8px 20px; margin-left:10px; border:none; border-radius:4px; cursor:pointer;">Cancel</button>
                     </div>`;
            panel.innerHTML = html;
            card.appendChild(panel);
        };
        
        list.appendChild(card);
    });
}

// --- CLEANED UP GLOBAL LISTENER (Remove the duplicate one you have) ---
document.addEventListener("click", async (e) => {
    if (e.target.classList.contains("save-btn")) {
        const card = e.target.closest(".resource-item");
        const docId = card.dataset.id; // Fetch from card, not the button
        const updatedData = {};
        
        card.querySelectorAll(".edit-field").forEach(input => {
            updatedData[input.getAttribute("data-key")] = input.value.trim();
        });

        try {
            await updateDoc(doc(db, "printables", docId), updatedData);
            alert("Updated!");
            loadPrintables();
        } catch (err) { alert("Error: " + err.message); }
    }
    if (e.target.classList.contains("cancel-btn")) e.target.closest(".edit-panel")?.remove();
});

// 3. Global listener for Save/Cancel inside Edit Panels
document.addEventListener("click", async (e) => {
    if (e.target.classList.contains("save-btn")) {
        const card = e.target.closest(".resource-item");
        const docId = card.dataset.id;
        try {
            await updateDoc(doc(db, "printables", docId), {
                title: card.querySelector(".edit-title").value.trim(),
                teacher: card.querySelector(".edit-teacher").value.trim(),
                topic: card.querySelector(".edit-topic").value,
                ageGroup: card.querySelector(".edit-age").value,
                language: card.querySelector(".edit-lang").value
            });
            alert("Updated successfully!");
            loadPrintables();
        } catch (err) { alert("Error saving: " + err.message); }
    }
    
    if (e.target.classList.contains("cancel-btn")) {
        e.target.closest(".edit-panel")?.remove();
    }
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