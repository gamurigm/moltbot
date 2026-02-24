import { Type } from "@sinclair/typebox";
import fs from "node:fs/promises";
import path from "node:path";
import { resolveWorkspaceRoot } from "../workspace-dir.js";
import { type AnyAgentTool, jsonResult, readStringParam } from "./common.js";

const FILESYSTEM_ACTIONS = ["ls", "cat", "write", "rm", "mkdir", "stat"] as const;

export function createFilesystemTool(options?: { workspaceDir?: string }): AnyAgentTool {
  const workspaceRoot = resolveWorkspaceRoot(options?.workspaceDir);

  const resolvePath = (filePath: string) => {
    const resolved = path.resolve(workspaceRoot, filePath);
    if (!resolved.startsWith(workspaceRoot)) {
      throw new Error(`Path is outside of workspace: ${filePath}`);
    }
    return resolved;
  };

  return {
    label: "Filesystem",
    name: "filesystem",
    description: "Manage files and directories in the workspace (ls, cat, write, rm, mkdir, stat).",
    parameters: Type.Object({
      action: Type.Unsafe<"ls" | "cat" | "write" | "rm" | "mkdir" | "stat">({
        type: "string",
        enum: ["ls", "cat", "write", "rm", "mkdir", "stat"],
      }),
      path: Type.String({ description: "Target file or directory path relative to workspace." }),
      content: Type.Optional(Type.String({ description: "Content to write (for 'write' action)." })),
      recursive: Type.Optional(Type.Boolean({ description: "Optional recursive flag for 'rm' or 'mkdir'." })),
    }),
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const action = readStringParam(params, "action", { required: true });
      const targetPath = readStringParam(params, "path", { required: true });
      const fullPath = resolvePath(targetPath);

      try {
        switch (action) {
          case "ls": {
            const entries = await fs.readdir(fullPath, { withFileTypes: true });
            const result = entries.map((entry) => ({
              name: entry.name,
              type: entry.isDirectory() ? "directory" : entry.isFile() ? "file" : "other",
            }));
            return jsonResult({ path: targetPath, entries: result });
          }
          case "cat": {
            const content = await fs.readFile(fullPath, "utf8");
            return {
              content: [{ type: "text", text: content }],
              details: { path: targetPath, size: content.length },
            };
          }
          case "write": {
            const content = readStringParam(params, "content", { allowEmpty: true }) ?? "";
            await fs.mkdir(path.dirname(fullPath), { recursive: true });
            await fs.writeFile(fullPath, content, "utf8");
            return jsonResult({ ok: true, path: targetPath, size: content.length });
          }
          case "rm": {
            const recursive = typeof params.recursive === "boolean" ? params.recursive : false;
            await fs.rm(fullPath, { recursive, force: true });
            return jsonResult({ ok: true, path: targetPath });
          }
          case "mkdir": {
            const recursive = typeof params.recursive === "boolean" ? params.recursive : true;
            await fs.mkdir(fullPath, { recursive });
            return jsonResult({ ok: true, path: targetPath });
          }
          case "stat": {
            const stats = await fs.stat(fullPath);
            return jsonResult({
              path: targetPath,
              size: stats.size,
              isDirectory: stats.isDirectory(),
              isFile: stats.isFile(),
              mtime: stats.mtime,
              birthtime: stats.birthtime,
            });
          }
          default:
            throw new Error(`Unknown action: ${action}`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(`Filesystem action '${action}' failed on '${targetPath}': ${message}`);
      }
    },
  };
}
