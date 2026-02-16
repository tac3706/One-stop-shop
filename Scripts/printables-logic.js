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
        // DISPLAY LOGIC: Capitalize lowercase tags for a professional look
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
        card.querySelector('.edit-btn').onclick = async () => {
            const item = allPrintables.find(p => p.id === res.id);
            const newTitle = prompt("Edit Title:", item.title);
            const newTeacher = prompt("Edit Teacher:", item.teacher || item.tags);
            
            if (newTitle !== null) {
                try {
                    await updateDoc(doc(db, "printables", res.id), {
                        title: newTitle,
                        teacher: newTeacher
                    });
                    alert("Updated!");
                    loadPrintables();
                } catch (err) { alert("Error updating."); }
            }
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

window.addEventListener("DOMContentLoaded", () => {
    loadPrintables();
    ["searchInput", "topicFilter", "ageFilter", "teacherFilter"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener(id.includes("Filter") ? "change" : "input", applyPrintableFilters);
    });
});