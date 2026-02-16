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
        allPrintables = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        applyPrintableFilters();
    } catch (error) {
        console.error("Error:", error);
    }
}

function displayPrintables(data) {
    const list = document.getElementById("printableList");
    list.innerHTML = "";
    data.forEach(res => {
        const card = document.createElement("div");
        card.className = "resource-item";
        card.style = "margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;";
        card.innerHTML = `
            <h3>${res.title || "Untitled"}</h3>
            <p>👤 Teacher: ${res.teacher || res.tags || "Staff"}</p>
            <p>🏷️ Topic: ${res.topic} | 🎂 Age: ${res.ageGroup}</p>
            <div style="margin-top:10px;">
                <a href="${res.url}" target="_blank" class="back-button" style="background:#4CAF50; color:white; display:inline-block; padding:5px 15px; text-decoration:none; border-radius:3px;">📥 Download</a>
                <button class="edit-btn" data-id="${res.id}" style="background:#2196F3; color:white; border:none; padding:5px 15px; cursor:pointer; border-radius:3px; margin-left:10px;">Edit</button>
                <button class="delete-btn" data-id="${res.id}" style="background:red; color:white; border:none; padding:5px 15px; cursor:pointer; border-radius:3px; margin-left:10px;">Delete</button>
            </div>
        `;
        
        card.querySelector('.delete-btn').onclick = async () => {
            if(confirm("Delete this printable?")) {
                await deleteDoc(doc(db, "printables", res.id));
                loadPrintables();
            }
        };

        card.querySelector('.edit-btn').onclick = () => openEditModal("printables", res.id);
        list.appendChild(card);
    });
}

function openEditModal(coll, id) {
    const item = allPrintables.find(p => p.id === id);
    const modal = document.createElement('div');
    modal.className = "explanation-box";
    modal.style = "position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:white; padding:20px; border:2px solid #333; z-index:1000; width:90%; max-width:400px; box-shadow: 0 4px 15px rgba(0,0,0,0.3);";
    
    modal.innerHTML = `
        <h3>Edit Printable</h3>
        <label>Title:</label><input id="editTitle" value="${item.title}" style="width:100%; margin-bottom:10px;">
        <label>Teacher:</label><input id="editTeacher" value="${item.teacher || item.tags || ''}" style="width:100%; margin-bottom:10px;">
        <label>Topic:</label>
        <select id="editTopic" style="width:100%; margin-bottom:10px;">
            <option value="grammar" ${item.topic === 'grammar' ? 'selected' : ''}>Grammar</option>
            <option value="vocabulary" ${item.topic === 'vocabulary' ? 'selected' : ''}>Vocabulary</option>
            <option value="reading" ${item.topic === 'reading' ? 'selected' : ''}>Reading</option>
            <option value="writing" ${item.topic === 'writing' ? 'selected' : ''}>Writing</option>
            <option value="general" ${item.topic === 'general' ? 'selected' : ''}>General</option>
        </select>
        <label>Age Group:</label>
        <select id="editAge" style="width:100%; margin-bottom:10px;">
            <option value="children" ${item.ageGroup === 'children' ? 'selected' : ''}>Children</option>
            <option value="teens" ${item.ageGroup === 'teens' ? 'selected' : ''}>Teens</option>
            <option value="adults" ${item.ageGroup === 'adults' ? 'selected' : ''}>Adults</option>
        </select>
        <button id="saveBtn" style="background:#4CAF50; color:white; width:100%; padding:10px; border:none; border-radius:5px; cursor:pointer;">Save Changes</button>
        <button onclick="this.parentElement.remove()" style="background:#ccc; width:100%; margin-top:5px; padding:10px; border:none; border-radius:5px; cursor:pointer;">Cancel</button>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#saveBtn').onclick = async () => {
        await updateDoc(doc(db, coll, id), {
            title: document.getElementById('editTitle').value,
            teacher: document.getElementById('editTeacher').value,
            topic: document.getElementById('editTopic').value,
            ageGroup: document.getElementById('editAge').value
        });
        modal.remove();
        loadPrintables();
    };
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