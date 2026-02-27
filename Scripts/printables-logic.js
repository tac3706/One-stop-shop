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
function displayPrintables(data) {
    const list = document.getElementById("printableList");
    if (!list) return;
    list.innerHTML = "";

    data.forEach(res => {
        const teacherDisplay = res.teacher || "Staff";
        const feedbackList = res.feedback || [];
        const langDisplay = res.language ? res.language.toUpperCase() : "N/A";

        const card = document.createElement("div");
        card.className = "resource-item";
        card.dataset.id = res.id;
        card.style = "margin-bottom:20px; border-bottom:1px solid #eee; padding-bottom:15px; text-align:center;";

        card.innerHTML = `
            <h3>${res.title || "Untitled"}</h3>
            <p>👤 Teacher: ${teacherDisplay} | 🌐 Lang: ${langDisplay}</p>
            <p>🏷️ Topic: ${res.topic || "General"} | 🎂 Age: ${res.ageGroup || "All"}</p>
            
            <div style="margin-top:10px;">
                <a href="${res.url}" target="_blank" style="background:#4CAF50; color:white; display:inline-block; padding:5px 15px; text-decoration:none; border-radius:3px;">📥 Download</a>
                <button class="edit-btn" style="background:#2196F3; color:white; border:none; padding:5px 15px; cursor:pointer; border-radius:3px; margin-left:10px;">Edit</button>
                <button class="delete-btn" style="background:red; color:white; border:none; padding:5px 15px; cursor:pointer; border-radius:3px; margin-left:10px;">Delete</button>
            </div>

            <div class="card-actions" style="margin-top:10px;">
                <button class="fav-action-btn" style="cursor:pointer; background:none; border:1px solid #ccc; border-radius:5px; padding:5px 10px;">⭐ ${res.favoritesCount || 0}</button>
                <button class="feed-action-btn" style="cursor:pointer; background:none; border:1px solid #ccc; border-radius:5px; padding:5px 10px; margin-left:5px;">💬 Feedback (${feedbackList.length})</button>
            </div>
        `;

        // Click Listeners
        card.querySelector('.fav-action-btn').onclick = () => handleFavorite('printables', res.id);
        card.querySelector('.feed-action-btn').onclick = () => handleFeedback('printables', res.id);
        
        card.querySelector('.delete-btn').onclick = async () => {
            if (prompt("Admin password:") === "Go3706" && confirm("Delete?")) {
                await deleteDoc(doc(db, "printables", res.id));
                loadPrintables();
            }
        };

        card.querySelector('.edit-btn').onclick = () => {
            const password = prompt("Enter the admin password to edit:");
            if (password !== "Go3706") return alert("Incorrect password.");
            if (card.querySelector(".edit-panel")) return;

const standardFields = ['title', 'teacher', 'topic', 'ageGroup', 'language', 'url'];
    const hiddenFields = ['id', 'createdAt', 'feedback', 'favoritesCount', 'storagePath'];

    const panel = document.createElement("div");
    panel.className = "edit-panel";
    panel.style = "margin: 15px auto; padding: 15px; background: #f9f9f9; border: 1px solid #ccc; border-radius: 8px; max-width: 400px; text-align: left;";

    let html = `<strong>Edit Printable:</strong><br>`;
    
    // Standard inputs (re-using the same loop logic for simplicity)
    const allKeys = [...new Set([...standardFields, ...Object.keys(res)])];
    
    allKeys.forEach(key => {
        if (hiddenFields.includes(key)) return;
        const val = res[key] || "";
        const listAttr = key === 'topic' ? 'list="topicSuggestions"' : 
                         key === 'ageGroup' ? 'list="ageSuggestions"' : 
                         key === 'language' ? 'list="langSuggestions"' : '';

        html += `<label>${key}:</label><br>
                 <input type="text" class="edit-field" data-key="${key}" ${listAttr} value="${val}" style="width:90%; margin:5px 0;"><br>`;
    });

    html += `<button class="save-btn" style="background:green; color:white; padding:5px 15px; margin-top:10px;">Save</button>
             <button class="cancel-btn" style="background:#888; color:white; padding:5px 15px; margin-left:5px;">Cancel</button>`;
    
    panel.innerHTML = html;
    card.appendChild(panel);
};

        list.appendChild(card);
    });
}

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