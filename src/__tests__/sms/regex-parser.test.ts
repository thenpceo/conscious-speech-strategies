import { describe, it, expect } from "vitest";
import { parseMessageRegex, normalizeDate } from "@/lib/sms/regex-parser";

describe("normalizeDate", () => {
  it("returns ISO date unchanged", () => {
    expect(normalizeDate("2026-03-04")).toBe("2026-03-04");
  });

  it("converts M/D/YYYY to ISO", () => {
    expect(normalizeDate("3/4/2026")).toBe("2026-03-04");
  });

  it("converts MM/DD/YYYY to ISO", () => {
    expect(normalizeDate("12/25/2026")).toBe("2026-12-25");
  });

  it("handles 2-digit year", () => {
    expect(normalizeDate("3/4/26")).toBe("2026-03-04");
  });

  it("defaults to current year when no year given", () => {
    const currentYear = new Date().getFullYear().toString();
    expect(normalizeDate("3/4")).toBe(`${currentYear}-03-04`);
  });
});

describe("parseMessageRegex", () => {
  describe("hours parsing", () => {
    it("parses 'Hours: X at School' format", () => {
      const result = parseMessageRegex("Hours: 3.5 at Gulf Coast Prep");
      expect(result.type).toBe("hours");
      if (result.type === "hours") {
        expect(result.data.hours).toBe(3.5);
        expect(result.data.schoolName).toBe("Gulf Coast Prep");
      }
    });

    it("parses 'Logged X hours at School' format", () => {
      const result = parseMessageRegex("Logged 4 hours at Pinellas Charter");
      expect(result.type).toBe("hours");
      if (result.type === "hours") {
        expect(result.data.hours).toBe(4);
        expect(result.data.schoolName).toBe("Pinellas Charter");
      }
    });

    it("parses hours with date and description", () => {
      const result = parseMessageRegex(
        "Hours: 3.5 at Gulf Coast Prep, 3/4/2026 - tutoring sessions"
      );
      expect(result.type).toBe("hours");
      if (result.type === "hours") {
        expect(result.data.hours).toBe(3.5);
        expect(result.data.date).toBe("2026-03-04");
        expect(result.data.description).toBe("tutoring sessions");
      }
    });

    it("defaults to today when no date given", () => {
      const result = parseMessageRegex("Hours: 2 at Bay Point");
      expect(result.type).toBe("hours");
      if (result.type === "hours") {
        expect(result.data.date).toBe(new Date().toISOString().split("T")[0]);
      }
    });

    it("includes confirm prompt in reply", () => {
      const result = parseMessageRegex("Hours: 3 at Gulf Coast Prep");
      expect(result.reply).toContain("Reply Y to confirm");
    });
  });

  describe("session parsing", () => {
    it("parses 'Session with Student: G1 X/Y' format", () => {
      const result = parseMessageRegex(
        "Session with John Smith: G1 8/10, G2 6/10"
      );
      expect(result.type).toBe("session");
      if (result.type === "session") {
        expect(result.data.studentName).toBe("John Smith");
        expect(result.data.goals).toHaveLength(2);
        expect(result.data.goals[0]).toEqual({
          goalNumber: 1,
          correct: 8,
          total: 10,
          notes: undefined,
        });
        expect(result.data.goals[1]).toEqual({
          goalNumber: 2,
          correct: 6,
          total: 10,
          notes: undefined,
        });
      }
    });

    it("parses three goals", () => {
      const result = parseMessageRegex(
        "Session with Sarah Johnson: G1 8/10, G2 6/10, G3 9/10"
      );
      expect(result.type).toBe("session");
      if (result.type === "session") {
        expect(result.data.goals).toHaveLength(3);
      }
    });

    it("capitalizes student names", () => {
      const result = parseMessageRegex(
        "session with john smith: G1 8/10"
      );
      expect(result.type).toBe("session");
      if (result.type === "session") {
        expect(result.data.studentName).toBe("John Smith");
      }
    });

    it("returns unknown when no goals are found", () => {
      const result = parseMessageRegex("Session with John Smith");
      expect(result.type).toBe("unknown");
      expect(result.reply).toContain("couldn't parse the goal data");
    });

    it("includes confirm prompt in reply", () => {
      const result = parseMessageRegex(
        "Session with John Smith: G1 8/10"
      );
      expect(result.reply).toContain("Reply Y to confirm");
    });
  });

  describe("unknown messages", () => {
    it("returns help for unrecognized text", () => {
      const result = parseMessageRegex("Hello there!");
      expect(result.type).toBe("unknown");
      expect(result.reply).toContain("Sessions:");
      expect(result.reply).toContain("Hours:");
    });

    it("returns help for empty string", () => {
      const result = parseMessageRegex("");
      expect(result.type).toBe("unknown");
    });
  });
});
