// ======================
// Firebase Setup
// ======================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  deleteDoc,
  updateDoc
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

let allResources = [];

// ======================
// Helpers
// ======================
function formatDisplay(value) {
  if (!value) return "General";
  return value
    .toString()
    .toLowerCase()
    .split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const allowedTopics = ["grammar","vocabulary","reading","writing","speaking","listening","phonics","exam prep","business english","general"];
const allowedTypes = ["pdf","video","image","powerpoint","website","printable","interactive"];
const allowedAges = ["children","teens","adults"];

// ======================
// Load Data
// ======================
async function loadAndDisplay() {
  const list = document.getElementById("resourceList");
  if (!list) return;

  list.innerHTML = "<p>Loading...</p>";

  try {
    const snapshot = await getDocs(collection(db, "resources"));
    allResources = [];
    snapshot.forEach(docSnap => {
      allResources.push({ id: docSnap.id, ...docSnap.data() });
    });
    applyFilters();
  } catch (err) {
    console.error(err);
    list.innerHTML = "<p>Error loading data.</p>";
  }
}

// ======================
// Display
// ======================
function displayResources(data) {
  const list = document.getElementById("resourceList");
  const countDisplay = document.getElementById("resultCount");
  if (!list) return;

  list.innerHTML = "";
  if (countDisplay) countDisplay.innerText = `Showing ${data.length} resources`;

  if (data.length === 0) {
    list.innerHTML = "<p>No resources found.</p>";
    return;
  }

  const topics = [...new Set(data.map(r => r.topic || "general"))];

  topics.forEach(topic => {
    const topicItems = data.filter(r => (r.topic || "general") === topic);

    const section = document.createElement("div");
    section.innerHTML = `
      <h2 style="cursor:pointer; background:#f0f0f0; padding:10px; border-radius:5px;">
        ▶ ${formatDisplay(topic)} (${topicItems.length})
      </h2>
      <div class="topic-content" style="display:none; padding:10px;">
        ${topicItems.map(res => `
          <div class="resource-item" data-id="${res.id}" style="margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">
            <h3>${res.title || "Untitled"}</h3>
            <p>👤 Teacher: ${res.teacher || "Staff"}</p>
            <p>🏷️ Topic: ${formatDisplay(res.topic)} | 🎂 Age: ${formatDisplay(res.ageGroup)}</p>
            <a href="${res.url}" target="_blank" style="background:#4CAF50;color:white;padding:5px 15px;border-radius:3px;text-decoration:none;">
              🔗 Open
            </a>
            <div style="margin-top:10px;">
              <button class="edit-btn">Edit</button>
              <button class="delete-btn" style="margin-left:10px;background:red;color:white;">Delete</button>
            </div>
          </div>
        `).join("")}
      </div>
    `;

    section.querySelector("h2").onclick = () => {
      const content = section.querySelector(".topic-content");
      content.style.display = content.style.display === "none" ? "block" : "none";
    };

    list.appendChild(section);
  });
}

// ======================
// Delegated Buttons
// ======================
document.addEventListener("click", async (e) => {

  const editBtn = e.target.closest(".edit-btn");
  const deleteBtn = e.target.closest(".delete-btn");

  if (editBtn) {
    const parent = editBtn.closest(".resource-item");
    const id = parent?.dataset.id;
    const item = allResources.find(r => r.id === id);
    if (!item) return;

    const newTitle = prompt("Edit Title:", item.title);
    if (newTitle === null) return;

    const newTopic = prompt(`Topic:\n${allowedTopics.join(", ")}`, item.topic);
    if (!allowedTopics.includes(newTopic?.toLowerCase().trim())) return alert("Invalid topic.");

    const newType = prompt(`Type:\n${allowedTypes.join(", ")}`, item.type);
    if (!allowedTypes.includes(newType?.toLowerCase().trim())) return alert("Invalid type.");

    const newAge = prompt(`Age:\n${allowedAges.join(", ")}`, item.ageGroup);
    if (!allowedAges.includes(newAge?.toLowerCase().trim())) return alert("Invalid age.");

    await updateDoc(doc(db, "resources", id), {
      title: newTitle,
      topic: newTopic.toLowerCase().trim(),
      type: newType.toLowerCase().trim(),
      ageGroup: newAge.toLowerCase().trim()
    });

    loadAndDisplay();
  }

  if (deleteBtn) {
    const parent = deleteBtn.closest(".resource-item");
    const id = parent?.dataset.id;
    if (id && confirm("Delete this resource?")) {
      await deleteDoc(doc(db, "resources", id));
      loadAndDisplay();
    }
  }
});

// ======================
// Filters
// ======================
function applyFilters() {
  const search = document.getElementById("searchInput")?.value.toLowerCase() || "";
  const topic = document.getElementById("topicFilter")?.value || "";
  const age = document.getElementById("ageFilter")?.value || "";
  const type = document.getElementById("typeFilter")?.value || "";
  const teacher = document.getElementById("teacherFilter")?.value.toLowerCase() || "";

  const filtered = allResources.filter(r =>
    (r.title || "").toLowerCase().includes(search) &&
    (!topic || r.topic === topic) &&
    (!age || r.ageGroup === age) &&
    (!type || r.type === type) &&
    (r.teacher || "").toLowerCase().includes(teacher)
  );

  displayResources(filtered);
}

window.addEventListener("DOMContentLoaded", loadAndDisplay);
