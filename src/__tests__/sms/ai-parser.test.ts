import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Anthropic SDK before importing the module
vi.mock("@anthropic-ai/sdk", () => {
  const mockCreate = vi.fn();
  return {
    default: class MockAnthropic {
      messages = { create: mockCreate };
    },
    __mockCreate: mockCreate,
  };
});

// Import after mock
import { parseMessageAI } from "@/lib/sms/ai-parser";

// Access the mock
async function getMockCreate() {
  const mod = await import("@anthropic-ai/sdk");
  return (mod as unknown as { __mockCreate: ReturnType<typeof vi.fn> })
    .__mockCreate;
}

describe("parseMessageAI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = "test-key";
  });

  it("parses a session from AI response", async () => {
    const mockCreate = await getMockCreate();
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            type: "session",
            studentName: "John Smith",
            date: "2026-03-16",
            goals: [{ goalNumber: 1, correct: 8, total: 10 }],
            notes: "Good progress",
          }),
        },
      ],
    });

    const { result, method, confidence } = await parseMessageAI({
      text: "Session with John Smith: G1 8/10. Good progress",
    });

    expect(result.type).toBe("session");
    expect(method).toBe("ai");
    expect(confidence).toBeGreaterThan(0.5);
    if (result.type === "session") {
      expect(result.data.studentName).toBe("John Smith");
      expect(result.data.goals[0].correct).toBe(8);
    }
  });

  it("parses hours from AI response", async () => {
    const mockCreate = await getMockCreate();
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            type: "hours",
            schoolName: "Gulf Coast Prep",
            date: "2026-03-16",
            hours: 3.5,
            description: "speech sessions",
          }),
        },
      ],
    });

    const { result, method } = await parseMessageAI({
      text: "Hours: 3.5 at Gulf Coast Prep - speech sessions",
    });

    expect(result.type).toBe("hours");
    expect(method).toBe("ai");
    if (result.type === "hours") {
      expect(result.data.hours).toBe(3.5);
      expect(result.data.schoolName).toBe("Gulf Coast Prep");
    }
  });

  it("falls back to regex on AI timeout", async () => {
    const mockCreate = await getMockCreate();
    mockCreate.mockRejectedValueOnce(new Error("AbortError"));

    const { result, method } = await parseMessageAI({
      text: "Session with John Smith: G1 8/10",
      timeoutMs: 1,
    });

    // Should fall back to regex parser
    expect(method).toBe("regex");
    expect(result.type).toBe("session");
  });

  it("falls back to regex on malformed AI JSON", async () => {
    const mockCreate = await getMockCreate();
    mockCreate.mockResolvedValueOnce({
      content: [{ type: "text", text: "This is not JSON" }],
    });

    const { result, method } = await parseMessageAI({
      text: "Session with John Smith: G1 8/10",
    });

    expect(method).toBe("regex");
    expect(result.type).toBe("session");
  });

  it("falls back to regex on empty AI response", async () => {
    const mockCreate = await getMockCreate();
    mockCreate.mockResolvedValueOnce({
      content: [{ type: "text", text: "" }],
    });

    const { result, method } = await parseMessageAI({
      text: "Session with John Smith: G1 8/10",
    });

    expect(method).toBe("regex");
  });

  it("returns unknown for image-only failure", async () => {
    const mockCreate = await getMockCreate();
    mockCreate.mockRejectedValueOnce(new Error("API error"));

    const { result, method } = await parseMessageAI({
      imageUrl: "https://example.com/whiteboard.jpg",
    });

    expect(result.type).toBe("unknown");
    expect(method).toBe("vision");
    expect(result.reply).toContain("trouble processing that image");
  });

  it("uses vision method for image input", async () => {
    const mockCreate = await getMockCreate();
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            type: "session",
            studentName: "Sarah Johnson",
            date: "2026-03-16",
            goals: [{ goalNumber: 1, correct: 7, total: 10 }],
          }),
        },
      ],
    });

    const { result, method } = await parseMessageAI({
      imageUrl: "https://example.com/whiteboard.jpg",
      text: "Here's the whiteboard",
    });

    expect(result.type).toBe("session");
    expect(method).toBe("vision");
  });
});
