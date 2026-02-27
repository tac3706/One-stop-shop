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

    // DYNAMIC TAG FETCHING: Get every unique value currently in the database
    const existingTopics = [...new Set(allResources.map(r => (r.topic || "").toLowerCase()))].filter(Boolean);
    const existingAges = [...new Set(allResources.map(r => (r.ageGroup || "").toLowerCase()))].filter(Boolean);
    const existingLangs = [...new Set(allResources.map(r => (r.language || "").toLowerCase()))].filter(Boolean);

    // Merge with defaults and sort
    const allowedTopics = [...new Set(["grammar", "vocabulary", "reading", "writing", "speaking", "listening", "phonics", "exam prep", "business english", "general", ...existingTopics])].sort();
    const allowedAges = [...new Set(["children", "teens", "adults", "all", ...existingAges])].sort();
    const allowedLangs = [...new Set(["english", "spanish", "german", "french", ...existingLangs])].sort();

    const panel = document.createElement("div");
    panel.className = "edit-panel";
    panel.style = "margin: 15px auto; padding: 15px; background: #f9f9f9; border: 1px solid #ccc; border-radius: 8px; max-width: 400px; text-align: center;";

    panel.innerHTML = `
        <strong>Edit Resource:</strong><br>
        Title: <input type="text" class="edit-title" value="${item.title}" style="width:90%; margin:5px 0;"><br>
        Teacher: <input type="text" class="edit-teacher" value="${item.teacher || ""}" style="width:90%; margin:5px 0;"><br>
        
        Topic: <select class="edit-topic" style="width:90%; margin:5px 0;">
            ${allowedTopics.map(t => `<option value="${t}" ${t === (item.topic || "").toLowerCase() ? "selected" : ""}>${t.charAt(0).toUpperCase() + t.slice(1)}</option>`).join("")}
        </select><br>
        
        Age: <select class="edit-age" style="width:90%; margin:5px 0;">
            ${allowedAges.map(a => `<option value="${a}" ${a === (item.ageGroup || "").toLowerCase() ? "selected" : ""}>${a.charAt(0).toUpperCase() + a.slice(1)}</option>`).join("")}
        </select><br>

        Language: <select class="edit-lang" style="width:90%; margin:5px 0;">
            ${allowedLangs.map(l => `<option value="${l}" ${l === (item.language || "").toLowerCase() ? "selected" : ""}>${l.charAt(0).toUpperCase() + l.slice(1)}</option>`).join("")}
        </select><br>
        
        <button class="save-btn" style="background:green; color:white; border:none; padding:8px 20px; margin-top:10px; cursor:pointer; border-radius:4px;">Save Changes</button>
        <button class="cancel-btn" style="background:#888; color:white; border:none; padding:8px 20px; margin-left:10px; cursor:pointer; border-radius:4px;">Cancel</button>
    `;
    card.appendChild(panel);
}

// --- Update the SAVE logic as well ---
if (e.target.classList.contains("save-btn")) {
    const card = e.target.closest(".resource-item");
    const docId = card.dataset.id;
    try {
        await updateDoc(doc(db, "resources", docId), {
            title: card.querySelector(".edit-title").value.trim(),
            teacher: card.querySelector(".edit-teacher").value.trim(),
            topic: card.querySelector(".edit-topic").value,
            ageGroup: card.querySelector(".edit-age").value,
            language: card.querySelector(".edit-lang").value // Now saved correctly
        });
        loadAndDisplay();
    } catch (err) { alert("Error saving: " + err.message); }
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