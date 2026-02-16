import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

async function loadAndDisplay() {
    const list = document.getElementById("resourceList");
    if (!list) return;
    list.innerHTML = "Loading...";
    try {
        const querySnapshot = await getDocs(collection(db, "resources"));
        allResources = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        applyFilters();
    } catch (e) { console.error(e); }
}

function displayResources(data) {
    const list = document.getElementById("resourceList");
    list.innerHTML = "";
    
    // Grouping logic by Topic
    const topics = [...new Set(data.map(r => (r.topic || "general").toLowerCase()))];
    
    topics.forEach(t => {
        const items = data.filter(r => (r.topic || "general").toLowerCase() === t);
        const section = document.createElement("div");
        section.innerHTML = `
            <h2 style="cursor:pointer; background:#eee; padding:10px;">▶ ${t.toUpperCase()} (${items.length})</h2>
            <div class="content" style="display:none; padding:10px;">
                ${items.map(item => `
                    <div class="resource-item" style="border-bottom:1px solid #ddd; padding:10px;">
                        <h3>${item.title}</h3>
                        <p>👤 ${item.teacher || item.tags || 'Staff'} | 🎂 ${item.ageGroup}</p>
                        <button onclick="openEditModal('resources', '${item.id}')">Edit</button>
                        <button onclick="deleteItem('resources', '${item.id}')" style="color:red">Delete</button>
                    </div>
                `).join('')}
            </div>
        `;
        section.querySelector('h2').onclick = () => {
            const c = section.querySelector('.content');
            c.style.display = c.style.display === 'none' ? 'block' : 'none';
        };
        list.appendChild(section);
    });
}

// Global functions for buttons
window.deleteItem = async (coll, id) => {
    if(confirm("Delete?")) {
        await deleteDoc(doc(db, coll, id));
        loadAndDisplay();
    }
};

window.openEditModal = (coll, id) => {
    const item = allResources.find(r => r.id === id);
    const modal = document.createElement('div');
    modal.style = "position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:white; padding:20px; border:2px solid black; z-index:10000; display:flex; flex-direction:column; gap:10px;";
    
    modal.innerHTML = `
        <h3>Edit Resource</h3>
        <input id="editTitle" value="${item.title}">
        <input id="editTeacher" value="${item.teacher || item.tags || ''}">
        <select id="editTopic">
            <option value="grammar" ${item.topic === 'grammar' ? 'selected' : ''}>Grammar</option>
            <option value="vocabulary" ${item.topic === 'vocabulary' ? 'selected' : ''}>Vocabulary</option>
            <option value="general" ${item.topic === 'general' ? 'selected' : ''}>General</option>
        </select>
        <select id="editAge">
            <option value="children" ${item.ageGroup === 'children' ? 'selected' : ''}>Children</option>
            <option value="teens" ${item.ageGroup === 'teens' ? 'selected' : ''}>Teens</option>
            <option value="adults" ${item.ageGroup === 'adults' ? 'selected' : ''}>Adults</option>
        </select>
        <button id="saveEdit">Save Changes</button>
        <button onclick="this.parentElement.remove()">Cancel</button>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('#saveEdit').onclick = async () => {
        await updateDoc(doc(db, coll, id), {
            title: document.getElementById('editTitle').value,
            teacher: document.getElementById('editTeacher').value,
            topic: document.getElementById('editTopic').value,
            ageGroup: document.getElementById('editAge').value
        });
        modal.remove();
        loadAndDisplay();
    };
};

// ... Filter Logic (Keep your current applyFilters logic here) ...
window.onload = loadAndDisplay;