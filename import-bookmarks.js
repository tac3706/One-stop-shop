const fs = require("fs");

const filePath = "./bookmarks.html";

const raw = fs.readFileSync(filePath, "utf8");

const linkRegex = /<A[^>]+HREF="([^"]+)"[^>]*>(.*?)<\/A>/gi;

let match;
let id = 1;
const resources = [];
const seenUrls = new Set();

// -------- MAIN LOOP --------
while ((match = linkRegex.exec(raw)) !== null) {
  const url = match[1];
  const title = match[2];

  if (isESLResource(title, url) && !seenUrls.has(url)) {
    seenUrls.add(url);

    resources.push({
      id: id++,
      title: clean(title),
      url: url,
      type: detectType(url),
      ageGroup: detectAge(title, url),
      topic: detectTopic(title, url),
      tags: ["Travis"]
    });
  }
}
// -------- END LOOP --------


// -------- FUNCTIONS --------
function clean(text) {
  return text.replace(/<\/?[^>]+(>|$)/g, "").trim();
}

function isESLResource(title, url) {
  const strongKeywords = [
    "esl",
    "english",
    "ielts",
    "cambridge",
    "toeic",
    "toefl",
    "phonics",
    "grammar",
    "vocabulary"
  ];

  const weakKeywords = [
    "learn",
    "teaching",
    "kids",
    "business",
    "lesson",
    "worksheet",
    "quiz"
  ];

  const combined = (title + " " + url).toLowerCase();

  const strongMatch = strongKeywords.some(k => combined.includes(k));
  const weakMatches = weakKeywords.filter(k => combined.includes(k)).length;

  return strongMatch || weakMatches >= 2;
}

function detectType(url) {
  if (url.includes("youtube.com")) return "video";
  if (url.endsWith(".pdf")) return "printable";
  if (url.includes("quiz") || url.includes("game")) return "interactive";
  return "website";
}

function detectAge(title, url) {
  const text = (title + " " + url).toLowerCase();

  if (text.includes("kids") || text.includes("children") || text.includes("phonics")) return "3-10";
  if (text.includes("ielts") || text.includes("toefl") || text.includes("business")) return "adults";
  if (text.includes("cambridge")) return "teens";
  return "all";
}

function detectTopic(title, url) {
  const text = (title + " " + url).toLowerCase();

  if (text.includes("phonics")) return "phonics";
  if (text.includes("ielts") || text.includes("cambridge")) return "exam prep";
  if (text.includes("business")) return "business english";
  if (text.includes("grammar")) return "grammar";
  if (text.includes("vocabulary")) return "vocabulary";
  return "general";
}

// -------- WRITE FILE --------
const output = `export const resources = ${JSON.stringify(resources, null, 2)};`;

fs.writeFileSync("./data/resources.js", output);

console.log("Import complete.");
console.log("Total ESL resources found:", resources.length);
