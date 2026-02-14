import { printables } from "../Data/printablesData.js";

const list = document.getElementById("printableList");

function displayPrintables(filteredData) {
    list.innerHTML = "";
    
    // Group by topic just like resources.js
    const topics = [...new Set(filteredData.map(p => p.topic))];

    topics.forEach(topic => {
        const section = document.createElement("div");
        const header = document.createElement("h2");
        const topicFiles = filteredData.filter(p => p.topic === topic);
        
        header.textContent = `${topic.toUpperCase()} (${topicFiles.length})`;
        header.style.cursor = "pointer";
        
        const content = document.createElement("div");
        content.style.display = "none";

        topicFiles.forEach(file => {
            const div = document.createElement("div");
            div.className = "resource-item";
            div.innerHTML = `
                <h3>${file.title}</h3>
                <p>Teacher: ${file.teacher} | Age: ${file.ageGroup}</p>
                <a href="${file.url}" download class="back-button" style="background-color: #4CAF50;">📥 Download ${file.type}</a>
                <hr>
            `;
            content.appendChild(div);
        });

        header.addEventListener("click", () => {
            content.style.display = content.style.display === "none" ? "block" : "none";
        });

        section.appendChild(header);
        section.appendChild(content);
        list.appendChild(section);
    });
}

// Initial load
displayPrintables(printables);