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
        allResources = [];
        querySnapshot.forEach((doc) => {
            allResources.push({ id: doc.id, ...doc.data() });
        });
        render();
    } catch (e) { console.error(e); }
}

function render() {
    const list = document.getElementById("resourceList");
    list.innerHTML = allResources.map(res => `
        <div style="border:1px solid #ccc; padding:10px; margin:10px 0;">
            <h3>${res.title || 'No Title'}</h3>
            <button class="edit-btn" data-docid="${res.id}">Edit</button>
            <button class="delete-btn" data-docid="${res.id}">Delete</button>
        </div>
    `).join('');

    // Attach Edit
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.onclick = async () => {
            const id = btn.getAttribute('data-docid');
            const item = allResources.find(r => r.id === id);
            const newTitle = prompt("New Title:", item.title);
            if (newTitle) {
                await updateDoc(doc(db, "resources", id), { title: newTitle });
                loadAndDisplay();
            }
        };
    });

    // Attach Delete
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = async () => {
            const id = btn.getAttribute('data-docid');
            if (confirm("Delete?")) {
                await deleteDoc(doc(db, "resources", id));
                loadAndDisplay();
            }
        };
    });
}

window.onload = loadAndDisplay;