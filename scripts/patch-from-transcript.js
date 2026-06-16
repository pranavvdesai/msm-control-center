const fs = require("fs");
const path = require("path");

const transcript =
  "C:/Users/prana/.cursor/projects/c-Users-prana-OneDrive-Desktop/agent-transcripts/9f18d03b-4e83-4f75-8f3d-b1a0432d2bec/9f18d03b-4e83-4f75-8f3d-b1a0432d2bec.jsonl";

function relPath(abs) {
  const norm = abs.replace(/\\/g, "/");
  const idx = norm.toLowerCase().indexOf("msm-control-center/");
  if (idx === -1) return null;
  return norm.slice(idx + "msm-control-center/".length);
}

const files = new Map();
const lines = fs.readFileSync(transcript, "utf8").split("\n").filter(Boolean);

for (const line of lines) {
  if (line.includes("Switching from mobile push to a weekly Saturday 5 PM email")) break;

  let row;
  try {
    row = JSON.parse(line);
  } catch {
    continue;
  }

  const content = row.message?.content;
  if (!Array.isArray(content)) continue;

  for (const block of content) {
    if (block.type !== "tool_use") continue;
    const filePath = block.input?.path;
    if (!filePath) continue;
    const rel = relPath(filePath);
    if (!rel) continue;

    if (block.name === "Write" && typeof block.input.contents === "string") {
      files.set(rel, block.input.contents);
    } else if (
      block.name === "StrReplace" &&
      typeof block.input.old_string === "string" &&
      typeof block.input.new_string === "string"
    ) {
      const current = files.get(rel);
      if (current && current.includes(block.input.old_string)) {
        files.set(rel, current.replace(block.input.old_string, block.input.new_string));
      }
    }
  }
}

for (const target of ["src/lib/utils.ts", "src/lib/permissions.ts", "src/components/NavShell.tsx"]) {
  if (files.has(target)) {
    const dest = path.join(__dirname, "..", target);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, files.get(target), "utf8");
    console.log("patched", target, `(${files.get(target).length} chars)`);
  } else {
    console.log("missing", target);
  }
}
