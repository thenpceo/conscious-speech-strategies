import { describe, it, expect } from "vitest";
import {
  CONFIRM_KEYWORDS,
  CANCEL_KEYWORDS,
  HELP_KEYWORDS,
} from "@/lib/sms/types";

describe("quick-reply keywords", () => {
  it("confirm keywords include common affirmatives", () => {
    expect(CONFIRM_KEYWORDS).toContain("y");
    expect(CONFIRM_KEYWORDS).toContain("yes");
    expect(CONFIRM_KEYWORDS).toContain("ok");
    expect(CONFIRM_KEYWORDS).toContain("1");
    expect(CONFIRM_KEYWORDS).toContain("confirm");
  });

  it("cancel keywords include common negatives", () => {
    expect(CANCEL_KEYWORDS).toContain("n");
    expect(CANCEL_KEYWORDS).toContain("no");
    expect(CANCEL_KEYWORDS).toContain("cancel");
    expect(CANCEL_KEYWORDS).toContain("x");
    expect(CANCEL_KEYWORDS).toContain("2");
  });

  it("help keywords include help and ?", () => {
    expect(HELP_KEYWORDS).toContain("help");
    expect(HELP_KEYWORDS).toContain("?");
  });

  it("confirm and cancel keywords don't overlap", () => {
    const overlap = CONFIRM_KEYWORDS.filter((k) =>
      CANCEL_KEYWORDS.includes(k)
    );
    expect(overlap).toHaveLength(0);
  });
});
