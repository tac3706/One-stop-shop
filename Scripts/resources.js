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
          // Check for 'teacher' (new) or 'tags' (old)
          const rawTeacher = res.teacher || res.tags || "Staff";
          const tagText = Array.isArray(rawTeacher) ? rawTeacher.join(", ") : rawTeacher;

          return `
            <div class="resource-item"
                 data-id="${res.id}"
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
                        style="background:#2196F3; color:white; border:none;
                               padding:5px 10px; cursor:pointer; border-radius:3px;">
                  Edit
                </button>

                <button class="delete-btn"
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

    section.querySelector("h2").addEventListener("click", () => {
      const content = section.querySelector(".topic-content");
      content.style.display = content.style.display === "none" ? "block" : "none";
    });

    list.appendChild(section);
  });
}

// Delegated Event Listener for Buttons
// Delegated Event Listener for Buttons
document.addEventListener("click", async (e) => {

  const editBtn = e.target.closest(".edit-btn");
  const deleteBtn = e.target.closest(".delete-btn");

  // =========================
  // EDIT
  // =========================
  if (editBtn) {
    const resourceItem = editBtn.closest(".resource-item");
    const docId = resourceItem?.dataset.id;
    const item = allResources.find(r => r.id === docId);
    if (!item) return;

    // Prevent double editor
    if (resourceItem.querySelector(".edit-panel")) return;

    const allowedTopics = ["grammar","vocabulary","reading","writing","speaking","listening","phonics","exam prep","business english","general"];
    const allowedAges = ["children","teens","adults"];
    const allowedTypes = ["pdf","video","image","powerpoint","website","printable","interactive"];

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

    const editPanel = document.createElement("div");
    editPanel.className = "edit-panel";
    editPanel.style.marginTop = "10px";

    editPanel.innerHTML = `
      <div style="margin-top:10px;">
        Title:<br>
        <input type="text" class="edit-title" value="${item.title || ""}"><br><br>

        Teacher:<br>
        <input type="text" class="edit-teacher" value="${item.teacher || item.tags || ""}"><br><br>

        Topic:<br>
        ${buildSelect(allowedTopics, item.topic)}<br><br>

        Age:<br>
        ${buildSelect(allowedAges, item.ageGroup)}<br><br>

        Type:<br>
        ${buildSelect(allowedTypes, item.type)}<br><br>

        <button class="save-btn">Save</button>
        <button class="cancel-btn" style="margin-left:10px;">Cancel</button>
      </div>
    `;

    resourceItem.appendChild(editPanel);
    editBtn.style.display = "none";
  }

  // =========================
  // SAVE
  // =========================
  if (e.target.classList.contains("save-btn")) {

    const resourceItem = e.target.closest(".resource-item");
    const docId = resourceItem?.dataset.id;

    const newTitle = resourceItem.querySelector(".edit-title").value.trim();
    const newTeacher = resourceItem.querySelector(".edit-teacher").value.trim().toLowerCase();

    const selects = resourceItem.querySelectorAll(".edit-select");

    try {
      await updateDoc(doc(db, "resources", docId), {
        title: newTitle,
        teacher: newTeacher,
        topic: selects[0].value.toLowerCase(),
        ageGroup: selects[1].value.toLowerCase(),
        type: selects[2].value.toLowerCase()
      });

      loadAndDisplay();

    } catch (error) {
      console.error("Update Error:", error);
      alert("Error updating.");
    }
  }

  // =========================
  // CANCEL
  // =========================
  if (e.target.classList.contains("cancel-btn")) {
    const resourceItem = e.target.closest(".resource-item");
    resourceItem.querySelector(".edit-panel")?.remove();
    resourceItem.querySelector(".edit-btn").style.display = "inline-block";
  }

  // =========================
  // DELETE (unchanged)
  // =========================
  if (deleteBtn) {
    const resourceItem = deleteBtn.closest(".resource-item");
    const docId = resourceItem?.dataset.id;
    if (docId && confirm("Are you sure?")) {
      try {
        await deleteDoc(doc(db, "resources", docId));
        loadAndDisplay();
      } catch (error) {
        console.error("Delete Error:", error);
      }
    }
  }
});
