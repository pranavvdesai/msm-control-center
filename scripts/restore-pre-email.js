const fs = require("fs");
const path = require("path");

const transcript =
  "C:/Users/prana/.cursor/projects/c-Users-prana-OneDrive-Desktop/agent-transcripts/9f18d03b-4e83-4f75-8f3d-b1a0432d2bec/9f18d03b-4e83-4f75-8f3d-b1a0432d2bec.jsonl";
const projectRoot = path.join(__dirname, "..");

const STOP_MARKERS = [
  "Switching from mobile push to a weekly Saturday 5 PM email",
  "weekly-leave-report",
];

function relPath(abs) {
  const norm = abs.replace(/\\/g, "/");
  const idx = norm.toLowerCase().indexOf("msm-control-center/");
  if (idx === -1) return null;
  return norm.slice(idx + "msm-control-center/".length);
}

const files = new Map();
const lines = fs.readFileSync(transcript, "utf8").split("\n").filter(Boolean);

for (const line of lines) {
  if (line.includes("Switching from mobile push to a weekly Saturday 5 PM email")) {
    break;
  }

  let row;
  try {
    row = JSON.parse(line);
  } catch {
    continue;
  }

  const content = row.message?.content;
  if (!Array.isArray(content)) continue;

  for (const block of content) {
    if (block.type !== "tool_use" || block.name !== "Write") continue;
    const { path: filePath, contents } = block.input || {};
    if (!filePath || typeof contents !== "string") continue;

    const rel = relPath(filePath);
    if (!rel) continue;

    files.set(rel, contents);
  }
}

console.log(`Restoring ${files.size} files from transcript (pre-email snapshot)...`);

for (const [rel, contents] of files) {
  const dest = path.join(projectRoot, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, contents, "utf8");
  console.log("  wrote", rel);
}
