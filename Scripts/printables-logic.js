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

let allPrintables = [];

function formatDisplay(value) {
  if (!value) return "General";
  return value.toLowerCase().split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

const allowedTopics = ["grammar","vocabulary","reading","writing","speaking","listening","phonics","exam prep","business english","general"];
const allowedTypes = ["pdf","video","image","powerpoint","website","printable","interactive"];
const allowedAges = ["children","teens","adults"];

async function loadPrintables() {
  const list = document.getElementById("printableList");
  if (!list) return;

  list.innerHTML = "<p>Loading...</p>";

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
      <p>👤 Teacher: ${res.teacher}</p>
      <p>🏷️ Topic: ${formatDisplay(res.topic)} | 🎂 Age: ${formatDisplay(res.ageGroup)}</p>
      <a href="${res.url}" target="_blank">📥 Download</a>
      <button class="edit-btn">Edit</button>
      <button class="delete-btn" style="background:red;color:white;">Delete</button>
    `;

    list.appendChild(card);
  });
}

document.addEventListener("click", async (e) => {

  const editBtn = e.target.closest(".edit-btn");
  const deleteBtn = e.target.closest(".delete-btn");

  if (editBtn) {
    const parent = editBtn.closest(".resource-item");
    const id = parent?.dataset.id;
    const item = allPrintables.find(p => p.id === id);
    if (!item) return;

    const newTitle = prompt("Edit Title:", item.title);
    if (newTitle === null) return;

    const newTopic = prompt(`Topic:\n${allowedTopics.join(", ")}`, item.topic);
    if (!allowedTopics.includes(newTopic?.toLowerCase().trim())) return alert("Invalid topic.");

    const newType = prompt(`Type:\n${allowedTypes.join(", ")}`, item.type);
    if (!allowedTypes.includes(newType?.toLowerCase().trim())) return alert("Invalid type.");

    const newAge = prompt(`Age:\n${allowedAges.join(", ")}`, item.ageGroup);
    if (!allowedAges.includes(newAge?.toLowerCase().trim())) return alert("Invalid age.");

    await updateDoc(doc(db, "printables", id), {
      title: newTitle,
      topic: newTopic.toLowerCase().trim(),
      type: newType.toLowerCase().trim(),
      ageGroup: newAge.toLowerCase().trim()
    });

    loadPrintables();
  }

  if (deleteBtn) {
    const parent = deleteBtn.closest(".resource-item");
    const id = parent?.dataset.id;
    if (id && confirm("Delete this printable?")) {
      await deleteDoc(doc(db, "printables", id));
      loadPrintables();
    }
  }
});

window.addEventListener("DOMContentLoaded", loadPrintables);
