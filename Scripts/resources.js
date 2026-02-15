import { resources } from "../Data/resources.js";

// DOM Elements
const list = document.getElementById("resourceList");
const searchInput = document.getElementById("searchInput");
const topicFilter = document.getElementById("topicFilter");
const ageFilter = document.getElementById("ageFilter");
const typeFilter = document.getElementById("typeFilter");
const teacherFilter = document.getElementById("teacherFilter");

// Result count element
const resultCount = document.createElement("p");
resultCount.id = "resultCount";
list.parentNode.insertBefore(resultCount, list);

// --- DISPLAY FUNCTION ---
function displayResources(filteredResources) {
  list.innerHTML = "";
  resultCount.textContent = `Showing ${filteredResources.length} of ${resources.length} resources`;

  // Group by topic for collapsible sections
  const topics = [...new Set(filteredResources.map(r => r.topic))];

  topics.forEach(topic => {
    const section = document.createElement("div");
    section.style.marginBottom = "15px";

    // Section header (Clickable)
    const header = document.createElement("h2");
    const topicResources = filteredResources.filter(r => r.topic === topic);
    header.textContent = `▶ ${topic.toUpperCase()} (${topicResources.length})`;
    header.style.cursor = "pointer";
    header.style.padding = "10px";
    header.style.backgroundColor = "#e3f2fd";
    header.style.borderRadius = "8px";

    // Section content (hidden initially)
    const content = document.createElement("div");
    content.style.display = "none";
    content.style.padding = "10px 20px";

    topicResources.forEach(resource => {
      const div = document.createElement("div");
      div.className = "resource-item";
      div.style.textAlign = "left";
      div.innerHTML = `
        <h3>${resource.title}</h3>
        <p><strong>Type:</strong> ${resource.type} | <strong>Age:</strong> ${resource.ageGroup}</p>
        <p><strong>Tags:</strong> ${resource.tags.join(", ")}</p>
        <a href="${resource.url}" target="_blank" class="back-button" style="background-color: #4CAF50; margin-top: 5px;">🔗 Open Resource</a>
        <hr style="border: 0.5px solid #ddd; margin: 15px 0;">
      `;
      content.appendChild(div);
    });

    // Toggle logic for opening/closing topics
    header.addEventListener("click", () => {
      const isHidden = content.style.display === "none";
      content.style.display = isHidden ? "block" : "none";
      header.textContent = (isHidden ? "▼ " : "▶ ") + `${topic.toUpperCase()} (${topicResources.length})`;
    });

    section.appendChild(header);
    section.appendChild(content);
    list.appendChild(section);
  });
}

// --- FILTER FUNCTION ---
function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const topic = document.getElementById('topicFilter').value;
    const age = document.getElementById('ageFilter').value;
    const type = document.getElementById('typeFilter').value;
    // NEW: Get the teacher name from the text input
    const teacherSearch = document.getElementById('teacherFilter').value.toLowerCase();

    const filtered = allResources.filter(res => {
        const matchesSearch = res.title.toLowerCase().includes(searchTerm);
        const matchesTopic = !topic || res.topic === topic;
        const matchesAge = !age || res.ageGroup === age;
        const matchesType = !type || res.type === type;
        // NEW: Check if the teacher name includes what was typed
        const matchesTeacher = !teacherSearch || (res.teacher && res.teacher.toLowerCase().includes(teacherSearch));
        
        return matchesSearch && matchesTopic && matchesAge && matchesType && matchesTeacher;
    });

    displayResources(filtered);
}

// --- EVENT LISTENERS ---
searchInput.addEventListener("input", applyFilters);
topicFilter.addEventListener("change", applyFilters);
ageFilter.addEventListener("change", applyFilters);
typeFilter.addEventListener("change", applyFilters);
if (teacherFilter) teacherFilter.addEventListener("input", applyFilters);

// --- INITIAL DISPLAY ---
displayResources(resources);