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
        allPrintables = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
        applyPrintableFilters();
    } catch (error) {
        list.innerHTML = "<p>Error loading library.</p>";
    }
}

// 2. Display Data
function displayPrintables(data) {
    const list = document.getElementById("printableList");
    list.innerHTML = "";

    data.forEach(res => {
        const teacherDisplay = res.teacher || res.tags || "Staff";
        const topicDisplay = res.topic ? res.topic.charAt(0).toUpperCase() + res.topic.slice(1) : "General";
        const ageDisplay = res.ageGroup ? res.ageGroup.charAt(0).toUpperCase() + res.ageGroup.slice(1) : "All";
        const favCount = res.favoritesCount || 0;
        const feedbackList = res.feedback || [];

        const card = document.createElement("div");
        card.className = "resource-item";
        card.style = "margin-bottom:20px; border-bottom:1px solid #eee; padding-bottom:15px; text-align:center;";

        // FIX: Combined all buttons into one block so they don't overwrite each other
        card.innerHTML = `
            <h3>${res.title || "Untitled"}</h3>
            <p>👤 Teacher: ${teacherDisplay}</p>
            <p>🏷️ Topic: ${topicDisplay} | 🎂 Age: ${ageDisplay}</p>
            
            <div style="margin-top:10px;">
                <a href="${res.url}" target="_blank" class="back-button" style="background:#4CAF50; color:white; display:inline-block; padding:5px 15px; text-decoration:none; border-radius:3px;">📥 Download</a>
                <button class="edit-btn" data-id="${res.id}" style="background:#2196F3; color:white; border:none; padding:5px 15px; cursor:pointer; border-radius:3px; margin-left:10px;">Edit</button>
                <button class="delete-btn" style="background:red; color:white; border:none; padding:5px 15px; cursor:pointer; border-radius:3px; margin-left:10px;">Delete</button>
            </div>

            <div class="card-actions" style="margin-top:10px;">
                <button class="fav-action-btn" style="cursor:pointer; background:none; border:1px solid #ccc; border-radius:5px; padding:5px 10px;">⭐ ${favCount}</button>
                <button class="feed-action-btn" style="cursor:pointer; background:none; border:1px solid #ccc; border-radius:5px; padding:5px 10px; margin-left:5px;">💬 Feedback (${feedbackList.length})</button>
            </div>
            <div class="comments-preview" style="font-size: 0.8em; color: #666; margin-top: 5px;">
                ${feedbackList.slice(-2).map(c => `<p><b>${c.date}:</b> ${c.text}</p>`).join('')}
            </div>
        `;

        // Favorite Button Logic
        card.querySelector('.fav-action-btn').onclick = () => handleFavorite('printables', res.id);
        
        // Feedback Button Logic
        card.querySelector('.feed-action-btn').onclick = () => handleFeedback('printables', res.id);

        // Edit Button Logic
        card.querySelector('.edit-btn').onclick = () => {
            const password = prompt("Enter the admin password to edit this printable:");
            if (password !== "Go3706") {
                alert("Incorrect password. Edit denied.");
                return;
            }
            if (card.querySelector(".edit-panel")) return;
            const allowedTopics = ["grammar","vocabulary","reading","writing","speaking","listening","phonics","exam prep","business english","general"];
            const allowedAges = ["children","teens","adults","all"];

            const panel = document.createElement("div");
            panel.className = "edit-panel";
            panel.style = "margin: 15px auto; padding: 15px; background: #f9f9f9; border: 1px solid #ccc; border-radius: 8px; max-width: 400px; text-align: center;";
            panel.innerHTML = `
                <strong>Edit Mode:</strong><br>
                <input type="text" class="edit-title" value="${res.title}" style="width:90%; margin:5px 0;"><br>
                <input type="text" class="edit-teacher" value="${teacherDisplay}" style="width:90%; margin:5px 0;"><br>
                <select class="edit-topic" style="width:90%; margin:5px 0;">
                    ${allowedTopics.map(t => `<option value="${t}" ${t === (res.topic || "").toLowerCase() ? "selected" : ""}>${t.charAt(0).toUpperCase() + t.slice(1)}</option>`).join("")}
                </select><br>
                <select class="edit-age" style="width:90%; margin:5px 0;">
                    ${allowedAges.map(a => `<option value="${a}" ${a === (res.ageGroup || "").toLowerCase() ? "selected" : ""}>${a.charAt(0).toUpperCase() + a.slice(1)}</option>`).join("")}
                </select><br>
                <button class="save-btn" style="background:green; color:white; border:none; padding:8px 20px; margin-top:10px; cursor:pointer; border-radius:4px;">Save Changes</button>
                <button class="cancel-btn" style="background:#888; color:white; border:none; padding:8px 20px; margin-left:10px; cursor:pointer; border-radius:4px;">Cancel</button>
            `;
            card.appendChild(panel);
        };

        // Delete Button Logic
        card.querySelector('.delete-btn').onclick = async () => {
            const password = prompt("Enter the admin password to delete this printable:");
            if (password === "Go3706") {
                if (confirm("Are you sure? This cannot be undone.")) {
                    await deleteDoc(doc(db, "printables", res.id));
                    loadPrintables();
                }
            } else if (password !== null) {
                alert("Incorrect password. Deletion denied.");
            }
        };

        list.appendChild(card);
    });
}

// 3. Global listener for Save/Cancel
document.addEventListener("click", async (e) => {
    if (e.target.classList.contains("save-btn")) {
        const card = e.target.closest(".resource-item");
        const docId = card.querySelector(".edit-btn").dataset.id;
        try {
            await updateDoc(doc(db, "printables", docId), {
                title: card.querySelector(".edit-title").value,
                teacher: card.querySelector(".edit-teacher").value,
                topic: card.querySelector(".edit-topic").value,
                ageGroup: card.querySelector(".edit-age").value
            });
            loadPrintables();
        } catch (err) { 
            alert("Error saving: " + err.message); 
        }
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

// FIXED: Removed duplicate 'const filtered' and added language sorting
    const filtered = allPrintables.filter(res => {
        return (res.title || "").toLowerCase().includes(searchTerm) &&
               (!topic || (res.topic || "").toLowerCase() === topic) &&
               (!age || (res.ageGroup || "").toLowerCase() === age) &&
               (!teacherSearch || String(res.teacher || "").toLowerCase().includes(teacherSearch)) &&
               (!langFilter || res.language === langFilter);
    });
    displayPrintables(filtered);
}

// 5. Setup
window.addEventListener("DOMContentLoaded", () => {
    loadPrintables();
    ["searchInput", "topicFilter", "ageFilter", "teacherFilter", "languageFilter"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("input", applyPrintableFilters);
        if (el) el.addEventListener("change", applyPrintableFilters);
    });
});

// 6. Interactive Helpers
async function handleFavorite(col, id) {
    const docRef = doc(db, col, id);
    await updateDoc(docRef, { favoritesCount: increment(1) });
    alert("⭐️ Added to favorites!");
    loadPrintables(); // Refresh UI without full page reload
}

async function handleFeedback(col, id) {
    const text = prompt("Enter your feedback:");
    if(!text) return;
    const docRef = doc(db, col, id);
    await updateDoc(docRef, {
        feedback: arrayUnion({ text, date: new Date().toLocaleDateString() })
    });
    alert("✅ Feedback added!");
    loadPrintables(); // Refresh UI
}