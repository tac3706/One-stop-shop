import { resources } from "../Data/resources.js";

// DOM Elements
const list = document.getElementById("resourceList");
const searchInput = document.getElementById("searchInput");
const topicFilter = document.getElementById("topicFilter");
const ageFilter = document.getElementById("ageFilter");
const typeFilter = document.getElementById("typeFilter");

// Optional: Teacher filter dropdown (add in resources.html)
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

    // Section header
    const header = document.createElement("h2");
    const topicResources = filteredResources.filter(r => r.topic === topic);
    header.textContent = `${topic} (${topicResources.length})`;
    header.style.cursor = "pointer";

    // Section content (hidden initially)
    const content = document.createElement("div");
    content.style.display = "none";

    topicResources.forEach(resource => {
      const div = document.createElement("div");
      div.innerHTML = `
        <h3>${resource.title}</h3>
        <p>Type: ${resource.type}</p>
        <p>Topic: <input value="${resource.topic}" /></p>
        <p>Age: <input value="${resource.ageGroup}" /></p>
        <p>Tags: <input value="${resource.tags.join(", ")}" /></p>
        <button>Save</button>
        <a href="${resource.url}" target="_blank">Open</a>
        <hr>
      `;

      // Save button functionality (local save)
      const saveButton = div.querySelector("button");
      saveButton.addEventListener("click", () => {
        resource.topic = div.querySelector("input:nth-of-type(1)").value;
        resource.ageGroup = div.querySelector("input:nth-of-type(2)").value;
        resource.tags = div.querySelector("input:nth-of-type(3)").value
          .split(",")
          .map(t => t.trim());
        alert("Saved locally!");
      });

      content.appendChild(div);
    });

    // Toggle section display
    header.addEventListener("click", () => {
      content.style.display = content.style.display === "none" ? "block" : "none";
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
