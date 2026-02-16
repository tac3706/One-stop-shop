import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, collection, getDocs, doc, deleteDoc, updateDoc 
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

async function loadPrintables() {
    const list = document.getElementById("printableList");
    if (!list) return;
    list.innerHTML = "<p>Loading printables...</p>";

    try {
        const querySnapshot = await getDocs(collection(db, "printables"));
        allPrintables = [];
        querySnapshot.forEach((docSnap) => {
            allPrintables.push({ id: docSnap.id, ...docSnap.data() });
        });
        applyPrintableFilters();
    } catch (error) {
        console.error("Error:", error);
        list.innerHTML = "<p>Error loading library.</p>";
    }
}

function displayPrintables(data) {
    const list = document.getElementById("printableList");
    list.innerHTML = "";

    if (data.length === 0) {
        list.innerHTML = "<p>No matching printables found.</p>";
        return;
    }

    data.forEach(res => {
        const teacherDisplay = res.teacher || res.tags || "Staff";
        const topicDisplay = res.topic ? res.topic.charAt(0).toUpperCase() + res.topic.slice(1) : "General";
        const ageDisplay = res.ageGroup ? res.ageGroup.charAt(0).toUpperCase() + res.ageGroup.slice(1) : "All";

        const card = document.createElement("div");
        card.className = "resource-item";
        card.style = "margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;";

        card.innerHTML = `
            <h3>${res.title || "Untitled"}</h3>
            <p>👤 Teacher: ${teacherDisplay}</p>
            <p>🏷️ Topic: ${topicDisplay} | 🎂 Age: ${ageDisplay}</p>
            
            <div style="margin-top:10px;">
                <a href="${res.url}" target="_blank" class="back-button" 
                   style="background:#4CAF50; color:white; display:inline-block; padding:5px 15px; text-decoration:none; border-radius:3px;">
                   📥 Download PDF
                </a>
                
                <button class="edit-btn" data-id="${res.id}" style="background:#2196F3; color:white; border:none; padding:5px 15px; cursor:pointer; border-radius:3px; margin-left:10px;">Edit</button>
                <button class="delete-btn" data-id="${res.id}" style="background:red; color:white; border:none; padding:5px 15px; cursor:pointer; border-radius:3px; margin-left:10px;">Delete</button>
            </div>
        `;

        // EDIT BUTTON LOGIC
        card.querySelector('.edit-btn').onclick = () => {
            if (card.querySelector(".edit-panel")) return;

            const allowedTopics = ["grammar","vocabulary","reading","writing","speaking","listening","phonics","exam prep","business english","general"];
            const allowedAges = ["children","teens","adults"];

            function buildSelect(options, selected) {
                return `
                    <select class="edit-select">
                        ${options.map(opt => `
                            <option value="${opt}" ${opt === (selected || "").toLowerCase() ? "selected" : ""}>
                                ${opt.charAt(0).toUpperCase() + opt.slice(1)}
                            </option>
                        `).join("")}
                    </select>
                `;
            }

            const panel = document.createElement("div");
            panel.className = "edit-panel";
            panel.style = "margin-top:10px; background:#f9f9f9; padding:10px; border-radius:5px;";

            panel.innerHTML = `
                <strong>Edit Mode:</strong><br>
                Title: <input type="text" class="edit-title" value="${res.title || ""}" style="width:100%"><br>
                Teacher: <input type="text" class="edit-teacher" value="${teacherDisplay}" style="width:100%"><br>
                Topic: ${buildSelect(allowedTopics, res.topic)}
                Age: ${buildSelect(allowedAges, res.ageGroup)}<br><br>
                <button class="save-btn" style="background:green; color:white; border:none; padding:5px 10px; cursor:pointer;">Save</button>
                <button class="cancel-btn" style="margin-left:10px; padding:5px 10px; cursor:pointer;">Cancel</button>
            `;
            card.appendChild(panel);
        };

        // DELETE BUTTON LOGIC
        card.querySelector('.delete-btn').onclick = async () => {
            if (confirm("Are you sure you want to delete this printable?")) {
                try {
                    await deleteDoc(doc(db, "printables", res.id));
                    loadPrintables();
                } catch (err) { alert("Error deleting."); }
            }
        };

        list.appendChild(card);
    });
}

function applyPrintableFilters() {
    const searchTerm = document.getElementById("searchInput").value.toLowerCase();
    const topic = document.getElementById("topicFilter").value.toLowerCase();
    const age = document.getElementById("ageFilter").value.toLowerCase();
    const teacherSearch = document.getElementById("teacherFilter").value.toLowerCase();

    const filtered = allPrintables.filter(res => {
        const matchesSearch = (res.title || "").toLowerCase().includes(searchTerm);
        const matchesTopic = !topic || (res.topic || "").toLowerCase() === topic;
        const matchesAge = !age || (res.ageGroup || "").toLowerCase() === age;
        
        const rawTeacher = res.teacher || res.tags || "";
        const matchesTeacher = !teacherSearch || String(rawTeacher).toLowerCase().includes(teacherSearch);

        return matchesSearch && matchesTopic && matchesAge && matchesTeacher;
    });

    displayPrintables(filtered);
}

// SHARED EVENT LISTENER FOR DYNAMIC BUTTONS (SAVE/CANCEL)
document.addEventListener("click", async (e) => {
    if (e.target.classList.contains("save-btn")) {
        const card = e.target.closest(".resource-item");
        const docId = card.querySelector(".edit-btn").dataset.id;
        const newTitle = card.querySelector(".edit-title").value.trim();
        const newTeacher = card.querySelector(".edit-teacher").value.trim();
        const selects = card.querySelectorAll(".edit-select");

        try {
            await updateDoc(doc(db, "printables", docId), {
                title: newTitle,
                teacher: newTeacher,
                topic: selects[0].value.toLowerCase(),
                ageGroup: selects[1].value.toLowerCase()
            });
            loadPrintables();
        } catch (err) {
            alert("Error updating.");
        }
    }

    if (e.target.classList.contains("cancel-btn")) {
        e.target.closest(".edit-panel")?.remove();
    }
});

window.addEventListener("DOMContentLoaded", () => {
    loadPrintables();
    ["searchInput", "topicFilter", "ageFilter", "teacherFilter"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener(id.includes("Filter") ? "change" : "input", applyPrintableFilters);
    });
});