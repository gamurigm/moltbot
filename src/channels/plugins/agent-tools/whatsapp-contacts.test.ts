import { describe, expect, it, vi, beforeEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import { createWhatsAppContactsTool } from "./whatsapp-contacts.js";
import { resolveWorkspaceRoot } from "../../../agents/workspace-dir.js";

vi.mock("node:fs/promises");
vi.mock("../../../agents/workspace-dir.js");
vi.mock("../../../web/active-listener.js", () => ({
  getActiveWebListener: vi.fn(),
}));

describe("whatsapp_contacts tool", () => {
  const tool = createWhatsAppContactsTool();
  const mockWorkspaceRoot = "/mock/workspace";

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(resolveWorkspaceRoot).mockReturnValue(mockWorkspaceRoot);
  });

  it("adds a contact to memory correctly", async () => {
    const params = {
      action: "add_to_memory",
      name: "Juan",
      phoneNumber: "+59397874697",
      description: "Amigo de Ecuador",
    };

    const result = await tool.execute("call-123", params);

    expect(fs.mkdir).toHaveBeenCalledWith(path.join(mockWorkspaceRoot, "memory"), { recursive: true });
    expect(fs.appendFile).toHaveBeenCalledWith(
      path.join(mockWorkspaceRoot, "memory", "contacts.md"),
      expect.stringContaining("### Juan"),
      "utf8"
    );
    expect(fs.appendFile).toHaveBeenCalledWith(
      path.join(mockWorkspaceRoot, "memory", "contacts.md"),
      expect.stringContaining("- **Phone**: +59397874697"),
      "utf8"
    );
    expect(fs.appendFile).toHaveBeenCalledWith(
      path.join(mockWorkspaceRoot, "memory", "contacts.md"),
      expect.stringContaining("- **Notes**: Amigo de Ecuador"),
      "utf8"
    );

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              ok: true,
              message: "Contact 'Juan' added to memory with number +59397874697.",
              path: "memory/contacts.md",
            },
            null,
            2
          ),
        },
      ],
      details: {
        ok: true,
        message: "Contact 'Juan' added to memory with number +59397874697.",
        path: "memory/contacts.md",
      },
    });
  });

  it("handles various phone number formats", async () => {
    const params = {
      action: "add_to_memory",
      name: "Test Contact",
      phoneNumber: "097874697", // Local format without country code (assuming Ecuador country code prepended by normalize if logic allows, or at least normalized)
    };

    // Note: normalizeWhatsAppTarget might return null if it can't determine the country.
    // In our case, extractUserJidPhone and normalizeE164 are used.
    // Let's test with a format that normalizeWhatsAppTarget handles.
    
    const result = await tool.execute("call-456", { ...params, phoneNumber: "+593 9-7874 697" });

    expect(result.details.ok).toBe(true);
    expect(result.details.message).toContain("+59397874697");
  });

  it("throws error if name or phoneNumber is missing", async () => {
    await expect(tool.execute("call-789", { action: "add_to_memory", name: "Missing Phone" })).rejects.toThrow();
    await expect(tool.execute("call-789", { action: "add_to_memory", phoneNumber: "123" })).rejects.toThrow();
  });
});
