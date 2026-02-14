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
  const searchTerm = searchInput.value.toLowerCase();
  const topicValue = topicFilter.value;
  const ageValue = ageFilter.value;
  const typeValue = typeFilter.value;
  const teacherValue = teacherFilter ? teacherFilter.value : "";

  const filtered = resources.filter(r => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchTerm) ||
      r.tags.join(" ").toLowerCase().includes(searchTerm);

    const matchesTopic = !topicValue || r.topic === topicValue;
    const matchesAge = !ageValue || r.ageGroup === ageValue;
    const matchesType = !typeValue || r.type === typeValue;
    const matchesTeacher = !teacherValue || r.tags.includes(teacherValue);

    return matchesSearch && matchesTopic && matchesAge && matchesType && matchesTeacher;
  });

  displayResources(filtered);
}

// --- EVENT LISTENERS ---
searchInput.addEventListener("input", applyFilters);
topicFilter.addEventListener("change", applyFilters);
ageFilter.addEventListener("change", applyFilters);
typeFilter.addEventListener("change", applyFilters);
if (teacherFilter) teacherFilter.addEventListener("change", applyFilters);

// --- INITIAL DISPLAY ---
displayResources(resources);