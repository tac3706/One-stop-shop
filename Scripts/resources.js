// 1. Imports
// FIXED: Cleaned up duplicate imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, collection, getDocs, doc, deleteDoc, updateDoc, arrayUnion, increment 
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
        allResources = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
        applyFilters();
    } catch (error) {
        console.error("Database error:", error);
        list.innerHTML = "<p>Error loading resources.</p>";
    }
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
                    const feedback = res.feedback || []; // Use 'feedback' to match handleFeedback function
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

                            ${feedbackList.length > 0 ? `
                            <div class="feedback-display" style="background: #f4f4f4; padding: 8px; border-radius: 4px; margin: 10px auto; max-width: 80%; font-size: 0.85em; text-align: left; border: 1px solid #ddd;">
                                ${feedbackList.map(f => `
                                    <p style="border-bottom:1px dotted #ccc; margin:5px 0; padding-bottom:3px;">
                                        <b>${f.date}:</b> ${f.text}
                                    </p>
                                `).join('')}
                            </div>
                    ` :     ''}

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

// 5. Shared Click Handler for Buttons
document.addEventListener("click", async (e) => {
    // --- EDIT BUTTON ---
    if (e.target.classList.contains("edit-btn")) {
        const password = prompt("Enter the admin password to edit this resource:");
        if (password !== "Go3706") {
            alert("Incorrect password. Edit denied.");
            return;
        }
        const card = e.target.closest(".resource-item");
        if (card.querySelector(".edit-panel")) return;

        const docId = card.dataset.id;
        const item = allResources.find(r => r.id === docId);
        const allowedTopics = ["grammar","vocabulary","reading","writing","speaking","listening","phonics","exam prep","business english","general"];
        const allowedAges = ["children","teens","adults","all"];

        const panel = document.createElement("div");
        panel.className = "edit-panel";
        panel.style = "margin: 15px auto; padding: 15px; background: #f9f9f9; border: 1px solid #ccc; border-radius: 8px; max-width: 400px; text-align: center;";

        panel.innerHTML = `
            <strong>Edit Resource:</strong><br>
            <input type="text" class="edit-title" value="${item.title}" style="width:90%; margin:5px 0;"><br>
            <input type="text" class="edit-teacher" value="${item.teacher || item.tags || ""}" style="width:90%; margin:5px 0;"><br>
            <select class="edit-topic" style="width:90%; margin:5px 0;">
                ${allowedTopics.map(t => `<option value="${t}" ${t === (item.topic || "").toLowerCase() ? "selected" : ""}>${t.charAt(0).toUpperCase() + t.slice(1)}</option>`).join("")}
            </select><br>
            <select class="edit-age" style="width:90%; margin:5px 0;">
                ${allowedAges.map(a => `<option value="${a}" ${a === (item.ageGroup || "").toLowerCase() ? "selected" : ""}>${a.charAt(0).toUpperCase() + a.slice(1)}</option>`).join("")}
            </select><br>
            <button class="save-btn" style="background:green; color:white; border:none; padding:8px 20px; margin-top:10px; cursor:pointer; border-radius:4px;">Save Changes</button>
            <button class="cancel-btn" style="background:#888; color:white; border:none; padding:8px 20px; margin-left:10px; cursor:pointer; border-radius:4px;">Cancel</button>
        `;
        card.appendChild(panel);
    }

    // --- SAVE BUTTON ---
    if (e.target.classList.contains("save-btn")) {
        const card = e.target.closest(".resource-item");
        const docId = card.dataset.id;
        try {
            await updateDoc(doc(db, "resources", docId), {
                title: card.querySelector(".edit-title").value,
                teacher: card.querySelector(".edit-teacher").value,
                topic: card.querySelector(".edit-topic").value,
                ageGroup: card.querySelector(".edit-age").value
            });
            loadAndDisplay();
        } catch (err) { alert("Error saving: " + err.message); }
    }

    // --- CANCEL BUTTON ---
    if (e.target.classList.contains("cancel-btn")) {
        e.target.closest(".edit-panel")?.remove();
    }

// ... existing code ...
    // --- DELETE BUTTON ---
    if (e.target.classList.contains("delete-btn")) {
        const docId = e.target.closest(".resource-item").dataset.id;
        const password = prompt("Enter the admin password to delete this resource:");

        if (password === "Go3706") { // Replace with your desired password
            if (confirm("Delete this resource?")) {
                await deleteDoc(doc(db, "resources", docId));
                loadAndDisplay();
            }
        } else if (password !== null) {
            alert("Incorrect password. Deletion denied.");
        }
    }
});

// 6. Filter Logic
function applyFilters() {
    const searchTerm = document.getElementById("searchInput")?.value.toLowerCase() || "";
    const topic = document.getElementById("topicFilter")?.value.toLowerCase() || "";
    const age = document.getElementById("ageFilter")?.value.toLowerCase() || "";
    const teacherSearch = document.getElementById("teacherFilter")?.value.toLowerCase() || "";
    const langFilter = document.getElementById("languageFilter")?.value || "";
    const favOnly = document.getElementById("favOnlyFilter")?.checked || false;

    const filtered = allResources.filter(res => {
        const teacherText = String(res.teacher || "").toLowerCase();
        
        return (res.title || "").toLowerCase().includes(searchTerm) &&
               (!topic || String(res.topic || "").toLowerCase() === topic) &&
               (!age || String(res.ageGroup || "").toLowerCase() === age) &&
               (!teacherSearch || teacherText.includes(teacherSearch)) &&
               (!langFilter || res.language === langFilter) &&
               (!favOnly || (res.favoritesCount > 0)); // Only show if favCount > 0
    });
    displayResources(filtered);
}

window.addEventListener("DOMContentLoaded", () => {
    loadAndDisplay();
    
    // Listen for changes on ALL filter elements
    ["searchInput", "topicFilter", "ageFilter", "teacherFilter", "languageFilter", "favOnlyFilter"].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        
        const eventType = (el.type === "checkbox" || el.tagName === "SELECT") ? "change" : "input";
        el.addEventListener(eventType, applyFilters);
    });

    // Setup Click Listeners for Favorite/Feedback buttons
    document.getElementById("resourceList").addEventListener("click", (e) => {
        const item = e.target.closest(".resource-item");
        if (!item) return;
        const docId = item.dataset.id;

        if (e.target.classList.contains("fav-btn")) {
            handleFavorite('resources', docId);
        } else if (e.target.classList.contains("feed-btn")) {
            handleFeedback('resources', docId);
        }
    });
});

// Function to handle Favoriting
async function handleFavorite(col, id) {
    const docRef = doc(db, col, id);
    await updateDoc(docRef, { favoritesCount: increment(1) });
    alert("⭐️ Added to favorites!");
    location.reload();
}

// Function to handle Feedback
async function handleFeedback(col, id) {
    const text = prompt("Enter your feedback:");
    if(!text) return;
    const docRef = doc(db, col, id);
    await updateDoc(docRef, {
        feedback: arrayUnion({ text, date: new Date().toLocaleDateString() })
    });
    alert("✅ Feedback added!");
    location.reload();
}