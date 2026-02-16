import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
    list.innerHTML = "Loading...";

    try {
        const querySnapshot = await getDocs(collection(db, "printables"));
        allPrintables = [];
        querySnapshot.forEach((docSnap) => {
            allPrintables.push({ id: docSnap.id, ...docSnap.data() });
        });
        applyPrintableFilters();
    } catch (error) {
        console.error("Error:", error);
    }
}

function displayPrintables(data) {
    const list = document.getElementById("printableList");
    list.innerHTML = "";

    if (data.length === 0) {
        list.innerHTML = "<p>No matching printables found.</p>";
        return;
    }

    data.forEach(res => {
        // Display Logic: Handle 'teacher' field and ensure lowercase tags display nicely
        const teacherDisplay = res.teacher || res.tags || "Staff";
        const topicDisplay = res.topic ? res.topic.charAt(0).toUpperCase() + res.topic.slice(1) : "General";
        const ageDisplay = res.ageGroup ? res.ageGroup.charAt(0).toUpperCase() + res.ageGroup.slice(1) : "All";

        const card = document.createElement("div");
        card.className = "resource-item";
        card.style = "margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;";

        card.innerHTML = `
            <h3>${res.title || "Untitled"}</h3>
            <p>👤 Teacher: ${teacherDisplay}</p>
            <p>🏷️ Topic: ${topicDisplay} | 🎂 Age: ${ageDisplay}</p>
            <a href="${res.url}" target="_blank" class="back-button" 
               style="background:#4CAF50; color:white; display:inline-block; padding:5px 15px; text-decoration:none; border-radius:3px;">
               📥 Download PDF
            </a>
        `;
        list.appendChild(card);
    });
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