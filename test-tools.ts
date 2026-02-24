import { createOpenClawCodingTools } from "./src/agents/pi-tools.js";
import { loadConfig } from "./src/config/config.js";

const cfg = loadConfig();
const tools = createOpenClawCodingTools({
  config: cfg,
  senderIsOwner: true,
  workspaceDir: process.cwd(),
});

console.log("Tools found:", tools.length);
console.log("Tool names:", tools.map(t => t.name).join(", "));
