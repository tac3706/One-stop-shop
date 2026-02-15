// 1. Imports
import { resources as staticResources } from "../Data/resources.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

let allResources = []; // Master list

// 3. Load Data from Both Sources
async function loadAndDisplay() {
    const list = document.getElementById("resourceList");
    list.innerHTML = "<p>Loading library...</p>";
    
    try {
        // Fetch from Firebase
        const querySnapshot = await getDocs(collection(db, "resources"));
        const dbResources = [];
        querySnapshot.forEach((doc) => {
            dbResources.push({ id: doc.id, ...doc.data() });
        });

        // COMBINE: Put static resources and database resources together
        allResources = [...staticResources, ...dbResources];

        applyFilters(); 
    } catch (error) {
        console.error("Database error:", error);
        // Fallback to just static resources if DB fails
        allResources = [...staticResources];
        applyFilters();
    }
}

// 4. Display Logic
function displayResources(filteredData) {
    const list = document.getElementById("resourceList");
    list.innerHTML = "";
    
    // Result count
    const countDisplay = document.getElementById("resultCount") || document.createElement("p");
    countDisplay.id = "resultCount";
    countDisplay.textContent = `Showing ${filteredData.length} of ${allResources.length} resources`;
    if (!document.getElementById("resultCount")) list.parentNode.insertBefore(countDisplay, list);

    if (filteredData.length === 0) {
        list.innerHTML = "<p>No resources found.</p>";
        return;
    }

    // Dynamic grouping by topic
    const topics = [...new Set(filteredData.map(res => res.topic?.toLowerCase() || "general"))];

    topics.forEach(topic => {
        const topicItems = filteredData.filter(res => (res.topic?.toLowerCase() || "general") === topic);
        const section = document.createElement("div");
        section.style.marginBottom = "15px";
        
        section.innerHTML = `
            <h2 class="topic-header" style="cursor:pointer">▶ ${topic.toUpperCase()} (${topicItems.length})</h2>
            <div class="topic-content" style="display:none">
                ${topicItems.map(res => `
                    <div class="resource-item">
                        <h3>${res.title}</h3>
                        <p>👤 Teacher: ${res.teacher || "Staff"}</p>
                        <a href="${res.url}" target="_blank" class="back-button" style="background:#4CAF50; color:white; display:inline-block; padding:5px 15px;">🔗 Open</a>
                        
                        ${res.id ? `<button class="delete-btn" data-id="${res.id}" style="background:red; color:white; border:none; padding:5px 10px; cursor:pointer; margin-left:10px;">Delete</button>` : ''}
                        <hr>
                    </div>
                `).join('')}
            </div>
        `;

        // Toggle logic
        section.querySelector('h2').addEventListener('click', () => {
            const content = section.querySelector('.topic-content');
            const isHidden = content.style.display === "none";
            content.style.display = isHidden ? "block" : "none";
            section.querySelector('h2').textContent = (isHidden ? "▼ " : "▶ ") + topic.toUpperCase() + ` (${topicItems.length})`;
        });
      // 3. Add Delete Button Listeners
              section.querySelectorAll('.delete-btn').forEach(btn => {
                  btn.addEventListener('click', async (e) => {
                      const docId = e.target.getAttribute('data-id');
                      if (confirm("Are you sure you want to delete this resource?")) {
                          try {
                              await deleteDoc(doc(db, "resources", docId));
                              alert("Resource deleted successfully!");
                              loadAndDisplay(); // Refresh the list
                          } catch (error) {
                              console.error("Delete Error:", error);
                              alert("Error deleting resource. Check your permissions.");
                          }
                      }
                  });
              });
        list.appendChild(section);
    });
}

// 5. Unified Filter Logic
function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const topic = document.getElementById('topicFilter').value.toLowerCase();
    const age = document.getElementById('ageFilter').value;
    const teacherSearch = document.getElementById('teacherFilter').value.toLowerCase();

    const filtered = allResources.filter(res => {
        const matchesSearch = res.title.toLowerCase().includes(searchTerm);
        const matchesTopic = !topic || (res.topic?.toLowerCase() === topic);
        const matchesAge = !age || res.ageGroup === age;
        const matchesTeacher = !teacherSearch || (res.teacher && res.teacher.toLowerCase().includes(teacherSearch));
        return matchesSearch && matchesTopic && matchesAge && matchesTeacher;
    });

    displayResources(filtered);
}

// 6. Listeners
document.getElementById('searchInput').addEventListener('input', applyFilters);
document.getElementById('topicFilter').addEventListener('change', applyFilters);
document.getElementById('ageFilter').addEventListener('change', applyFilters);
document.getElementById('teacherFilter').addEventListener('input', applyFilters);

window.addEventListener('DOMContentLoaded', loadAndDisplay);