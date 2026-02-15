// 1. Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, collection, getDocs, doc, deleteDoc, updateDoc 
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
        allResources = [];

        querySnapshot.forEach((docSnap) => {
            allResources.push({ id: docSnap.id, ...docSnap.data() });
        });

        applyFilters();

    } catch (error) {
        console.error("Database error:", error);
        list.innerHTML = "<p>Error loading resources. Check Firebase rules.</p>";
    }
}

// 4. Display Logic
function displayResources(filteredData) {

    const list = document.getElementById("resourceList");
    const countDisplay = document.getElementById("resultCount");
    if (!list) return;

    list.innerHTML = "";

    if (countDisplay) {
        countDisplay.innerText = `Showing ${filteredData.length} resources`;
    }

    if (filteredData.length === 0) {
        list.innerHTML = "<p>No resources found.</p>";
        return;
    }

    const topics = [...new Set(
        filteredData.map(res => String(res.topic || "general").toLowerCase())
    )];

    topics.forEach(topic => {

        const topicItems = filteredData.filter(res =>
            String(res.topic || "general").toLowerCase() === topic
        );

        const section = document.createElement("div");
        section.style.marginBottom = "15px";

        section.innerHTML = `
            <h2 class="topic-header" 
                style="cursor:pointer; background:#f0f0f0; padding:10px; border-radius:5px;">
                ▶ ${topic.toUpperCase()} (${topicItems.length})
            </h2>
            <div class="topic-content" style="display:none; padding:10px;">
                ${topicItems.map(res => {

                    const tagText = Array.isArray(res.tags)
                        ? res.tags.join(", ")
                        : (res.tags || "Staff");

                    return `
                        <div class="resource-item" 
                             style="margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">
                            
                            <h3>${res.title || "Untitled"}</h3>
                            <p>👤 Teacher: ${tagText}</p>
                            <p>🏷️ Topic: ${res.topic || "General"} | 🎂 Age: ${res.ageGroup || "All"}</p>

                            <a href="${res.url}" target="_blank"
                               style="background:#4CAF50; color:white; display:inline-block;
                                      padding:5px 15px; text-decoration:none; border-radius:3px;">
                               🔗 Open
                            </a>

                            <div style="margin-top:10px;">
                                <button class="edit-btn"
                                        data-id="${res.id}"
                                        style="background:#2196F3; color:white; border:none;
                                               padding:5px 10px; cursor:pointer; border-radius:3px;">
                                    Edit Any Field
                                </button>

                                <button class="delete-btn"
                                        data-id="${res.id}"
                                        style="background:red; color:white; border:none;
                                               padding:5px 10px; cursor:pointer; margin-left:10px;
                                               border-radius:3px;">
                                    Delete
                                </button>
                            </div>
                        </div>
                    `;
                }).join("")}
            </div>
        `;

        // Toggle topic open/close
        section.querySelector("h2").onclick = () => {
            const content = section.querySelector(".topic-content");
            content.style.display =
                content.style.display === "none" ? "block" : "none";
        };

        // Edit Buttons
        section.querySelectorAll(".edit-btn").forEach(btn => {
            btn.onclick = async (e) => {

                const docId = e.currentTarget.getAttribute("data-id");
                const item = allResources.find(r => r.id === docId);
                if (!item) return;

                let updatedData = {};
                let cancelled = false;

                for (const key in item) {
                    if (key === "id" || key === "createdAt") continue;

                    let value = item[key];
                    if (Array.isArray(value)) {
                        value = value.join(", ");
                    }

                    const newValue = prompt(`Edit ${key}:`, value);
                    if (newValue === null) {
                        cancelled = true;
                        break;
                    }

                    updatedData[key] = newValue;
                }

                if (!cancelled) {
                    try {
                        const docRef = doc(db, "resources", docId);
                        await updateDoc(docRef, updatedData);
                        alert("Updated successfully!");
                        loadAndDisplay();
                    } catch (error) {
                        console.error("Update Error:", error);
                        alert("Error updating. Check Firestore rules.");
                    }
                }
            };
        });

        // Delete Buttons
        section.querySelectorAll(".delete-btn").forEach(btn => {
            btn.onclick = async (e) => {

                const docId = e.currentTarget.getAttribute("data-id");

                if (confirm("Are you sure?")) {
                    try {
                        await deleteDoc(doc(db, "resources", docId));
                        loadAndDisplay();
                    } catch (error) {
                        console.error("Delete Error:", error);
                    }
                }
            };
        });

        list.appendChild(section);
    });
}

// 5. Filter Logic
function applyFilters() {

    const searchInput = document.getElementById("searchInput");
    const topicFilter = document.getElementById("topicFilter");
    const ageFilter = document.getElementById("ageFilter");
    const typeFilter = document.getElementById("typeFilter");
    const teacherFilter = document.getElementById("teacherFilter");

    const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
    const topic = topicFilter ? topicFilter.value.toLowerCase() : "";
    const age = ageFilter ? ageFilter.value : "";
    const typeValue = typeFilter ? typeFilter.value : "";
    const teacherSearch = teacherFilter ? teacherFilter.value.toLowerCase() : "";

    const filtered = allResources.filter(res => {

        const matchesSearch =
            (res.title || "").toLowerCase().includes(searchTerm);

        const matchesTopic =
            !topic || String(res.topic || "").toLowerCase() === topic;

        const matchesAge =
            !age || res.ageGroup === age;

        const matchesType =
            !typeValue || res.type === typeValue;

        const teacherText =
            Array.isArray(res.tags)
                ? res.tags.join(", ").toLowerCase()
                : String(res.tags || "").toLowerCase();

        const matchesTeacher =
            !teacherSearch || teacherText.includes(teacherSearch);

        return matchesSearch &&
               matchesTopic &&
               matchesAge &&
               matchesType &&
               matchesTeacher;
    });

    displayResources(filtered);
}

// 6. DOM Ready Setup
window.addEventListener("DOMContentLoaded", () => {

    loadAndDisplay();

    const searchInput = document.getElementById("searchInput");
    const topicFilter = document.getElementById("topicFilter");
    const ageFilter = document.getElementById("ageFilter");
    const typeFilter = document.getElementById("typeFilter");
    const teacherFilter = document.getElementById("teacherFilter");

    if (searchInput) searchInput.addEventListener("input", applyFilters);
    if (topicFilter) topicFilter.addEventListener("change", applyFilters);
    if (ageFilter) ageFilter.addEventListener("change", applyFilters);
    if (typeFilter) typeFilter.addEventListener("change", applyFilters);
    if (teacherFilter) teacherFilter.addEventListener("input", applyFilters);
});
