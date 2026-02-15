import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage, ref, deleteObject } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

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
const storage = getStorage(app);
const list = document.getElementById("printableList");

async function loadAndDisplay() {
    list.innerHTML = "<p>Loading materials...</p>";
    const querySnapshot = await getDocs(collection(db, "printables"));
    const printablesData = [];
    querySnapshot.forEach((document) => {
        // We include the ID so we know which one to delete later
        printablesData.push({ id: document.id, ...document.data() });
    });
    displayPrintables(printablesData);
}

function displayPrintables(filteredData) {
    list.innerHTML = "";
    const topics = [...new Set(filteredData.map(p => p.topic))];

    topics.forEach(topic => {
        const section = document.createElement("div");
        const topicFiles = filteredData.filter(p => p.topic === topic);
        
        const header = document.createElement("h2");
        header.textContent = `▶ ${topic.toUpperCase()} (${topicFiles.length})`;
        header.style.cursor = "pointer";
        header.className = "topic-header";
        
        const content = document.createElement("div");
        content.style.display = "none";

        topicFiles.forEach(file => {
            const div = document.createElement("div");
            div.className = "resource-item";
            div.innerHTML = `
                <h3>${file.title}</h3>
                <p>Teacher: ${file.teacher}</p>
                <div style="display: flex; gap: 10px;">
                    <a href="${file.url}" target="_blank" class="back-button" style="background-color: #4CAF50; margin:0;">📥 Download</a>
                    <button class="delete-btn" data-id="${file.id}" data-path="${file.storagePath}" style="background-color: #ff4444; color: white; border: none; border-radius: 5px; cursor: pointer; padding: 5px 10px;">🗑 Delete</button>
                </div>
                <hr>
            `;
            content.appendChild(div);
        });

        header.addEventListener("click", () => {
            const isHidden = content.style.display === "none";
            content.style.display = isHidden ? "block" : "none";
            header.textContent = (isHidden ? "▼ " : "▶ ") + topic.toUpperCase() + ` (${topicFiles.length})`;
        });

        section.appendChild(header);
        section.appendChild(content);
        list.appendChild(section);
    });

    // Add click events to all delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            const path = e.target.getAttribute('data-path');
            
            // 1. Ask for the secret password
            const adminKey = prompt("Enter Admin Password to delete:");

            if (adminKey === null) return; // User cancelled

            if (confirm("Are you sure you want to delete this resource?")) {
                try {
                    // Note: Firebase Client SDK doesn't support custom headers easily for delete.
                    // So for a simple "Teacher Site," we do a local check first:
                    if (adminKey !== "YourSecretPassword123") {
                        alert("Incorrect Password!");
                        return;
                    }

                    // 2. Proceed with deletion
                    await deleteDoc(doc(db, "printables", id));
                    
                    if (path) {
                        const fileRef = ref(storage, path);
                        await deleteObject(fileRef);
                    }
                    
                    alert("Deleted successfully!");
                    loadAndDisplay(); 
                } catch (error) {
                    console.error("Error deleting:", error);
                    alert("Delete failed. You might not have permission.");
                }
            }
        });
    });
}

loadAndDisplay();