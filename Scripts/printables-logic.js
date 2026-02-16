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
  apiKey: "YOUR_CONFIG",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let allPrintables = [];

const allowedTopics = ["grammar","vocabulary","reading","writing","speaking","listening","phonics","exam prep","business english","general"];
const allowedTypes = ["pdf","video","image","powerpoint","website","printable","interactive"];
const allowedAges = ["children","teens","adults"];

function formatDisplay(value) {
  if (!value) return "";
  return value.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}

function buildDropdown(options, selected) {
  return `
    <select>
      ${options.map(opt => `
        <option value="${opt}" ${opt === selected ? "selected" : ""}>
          ${formatDisplay(opt)}
        </option>
      `).join("")}
    </select>
  `;
}

async function loadPrintables() {
  const snapshot = await getDocs(collection(db, "printables"));
  allPrintables = [];

  snapshot.forEach(docSnap => {
    allPrintables.push({ id: docSnap.id, ...docSnap.data() });
  });

  displayPrintables(allPrintables);
}

function displayPrintables(data) {
  const list = document.getElementById("printableList");
  list.innerHTML = "";

  data.forEach(res => {
    const card = document.createElement("div");
    card.className = "resource-item";
    card.dataset.id = res.id;

    card.innerHTML = `
      <h3>${res.title}</h3>
      <p>
        Teacher: ${formatDisplay(res.teacher)}<br>
        Topic: ${formatDisplay(res.topic)}<br>
        Age: ${formatDisplay(res.ageGroup)}<br>
        Type: ${formatDisplay(res.type)}
      </p>

      <a href="${res.url}" target="_blank">Download</a>

      <div class="view-buttons">
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
      </div>

      <div class="edit-panel" style="display:none; margin-top:10px;">
        Title:<br>
        <input type="text" class="edit-title" value="${res.title}"><br><br>

        Teacher:<br>
        <input type="text" class="edit-teacher" value="${res.teacher || ""}"><br><br>

        Topic:<br>
        ${buildDropdown(allowedTopics, res.topic)}<br><br>

        Age:<br>
        ${buildDropdown(allowedAges, res.ageGroup)}<br><br>

        Type:<br>
        ${buildDropdown(allowedTypes, res.type)}<br><br>

        <button class="save-btn">Save</button>
        <button class="cancel-btn">Cancel</button>
      </div>
    `;

    list.appendChild(card);
  });
}

document.addEventListener("click", async (e) => {

  const card = e.target.closest(".resource-item");
  if (!card) return;

  const id = card.dataset.id;

  if (e.target.classList.contains("edit-btn")) {
    card.querySelector(".edit-panel").style.display = "block";
    card.querySelector(".view-buttons").style.display = "none";
  }

  if (e.target.classList.contains("cancel-btn")) {
    card.querySelector(".edit-panel").style.display = "none";
    card.querySelector(".view-buttons").style.display = "block";
  }

  if (e.target.classList.contains("save-btn")) {

    const newTitle = card.querySelector(".edit-title").value.trim();
    const newTeacher = card.querySelector(".edit-teacher").value.trim().toLowerCase();

    const selects = card.querySelectorAll("select");

    await updateDoc(doc(db, "printables", id), {
      title: newTitle,
      teacher: newTeacher,
      topic: selects[0].value.toLowerCase(),
      ageGroup: selects[1].value.toLowerCase(),
      type: selects[2].value.toLowerCase()
    });

    loadPrintables();
  }

  if (e.target.classList.contains("delete-btn")) {
    if (confirm("Delete this printable?")) {
      await deleteDoc(doc(db, "printables", id));
      loadPrintables();
    }
  }
});

window.addEventListener("DOMContentLoaded", loadPrintables);
