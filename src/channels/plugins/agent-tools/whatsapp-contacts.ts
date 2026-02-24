import { Type } from "@sinclair/typebox";
import fs from "node:fs/promises";
import path from "node:path";
import type { ChannelAgentTool } from "../types.js";
import { getActiveWebListener } from "../../../web/active-listener.js";
import { jsonResult } from "../../../agents/tools/common.js";
import { normalizeWhatsAppTarget } from "../../../whatsapp/normalize.js";
import { resolveWorkspaceRoot } from "../../../agents/workspace-dir.js";

export function createWhatsAppContactsTool(): ChannelAgentTool {
  return {
    label: "WhatsApp Contacts",
    name: "whatsapp_contacts",
    description: "Search for WhatsApp contacts or add a new contact to the agent's memory.",
    parameters: Type.Object({
      action: Type.Unsafe<"search" | "add_to_memory">({
        type: "string",
        enum: ["search", "add_to_memory"],
        default: "search",
      }),
      query: Type.Optional(Type.String({ description: "Search query for contact names (for 'search')." })),
      name: Type.Optional(Type.String({ description: "Name of the contact (for 'add_to_memory')." })),
      phoneNumber: Type.Optional(Type.String({ description: "Phone number of the contact (for 'add_to_memory')." })),
      description: Type.Optional(Type.String({ description: "Optional description or notes for the contact (for 'add_to_memory')." })),
      limit: Type.Optional(Type.Number({ description: "Maximum number of contacts to return.", default: 20 })),
    }),
    execute: async (_toolCallId: string, params: Record<string, unknown>) => {
      const { action = "search", query, name, phoneNumber, description, limit = 20 } = params as {
        action?: "search" | "add_to_memory";
        query?: string;
        name?: string;
        phoneNumber?: string;
        description?: string;
        limit?: number;
      };

      console.log("[WhatsAppContacts] Tool called with params:", JSON.stringify(params));

      // Infer action if not explicitly set but name/phone are provided

      // Infer action if not explicitly set but name/phone are provided
      const effectiveAction = action === "search" && name && phoneNumber ? "add_to_memory" : action;

      if (effectiveAction === "add_to_memory") {
        if (!name || !phoneNumber) {
          throw new Error("Both 'name' and 'phoneNumber' are required to add a contact to memory.");
        }

        const normalized = normalizeWhatsAppTarget(phoneNumber);
        if (!normalized) {
          throw new Error(`Invalid phone number format: ${phoneNumber}`);
        }

        const workspaceRoot = resolveWorkspaceRoot();
        const memoryDir = path.join(workspaceRoot, "memory");
        const contactsFile = path.join(memoryDir, "contacts.md");

        await fs.mkdir(memoryDir, { recursive: true });

        const entry = [
          `### ${name}`,
          `- **Phone**: ${normalized}`,
          description ? `- **Notes**: ${description}` : null,
          `- **Added**: ${new Date().toISOString()}`,
          "",
        ].filter(Boolean).join("\n");

        await fs.appendFile(contactsFile, entry, "utf8");

        return jsonResult({
          ok: true,
          message: `Contact '${name}' added to memory with number ${normalized}.`,
          path: "memory/contacts.md",
        });
      }

      const listener = getActiveWebListener();
      if (!listener) {
        throw new Error("WhatsApp is not currently running or active.");
      }

      if (typeof listener.getContacts !== "function") {
        throw new Error("WhatsApp contact listing is not supported in the current version.");
      }

      const allContacts = listener.getContacts();
      let matches = allContacts;

      if (query && typeof query === "string") {
        const lowerQuery = query.toLowerCase();
        matches = allContacts.filter((contact) => {
          const nameC = (contact.name || contact.notify || contact.verifiedName || "").toLowerCase();
          return nameC.includes(lowerQuery) || contact.jid.includes(lowerQuery);
        });
      }

      // Sort by name if available
      matches.sort((a, b) => {
        const nameA = a.name || a.notify || a.verifiedName || "";
        const nameB = b.name || b.notify || b.verifiedName || "";
        return nameA.localeCompare(nameB);
      });

      const results = matches.slice(0, limit).map((c) => ({
        jid: c.jid,
        name: c.name || c.notify || c.verifiedName || "Unknown",
        type: c.jid.endsWith("@g.us") ? "group" : "contact",
      }));

      return jsonResult({
        contacts: results,
        total: matches.length,
        hint: query ? `Showing top ${results.length} matches for "${query}".` : `Showing ${results.length} of ${allContacts.length} total contacts.`,
      });
    },
  };
}
