import { describe, it, expect, vi } from "vitest";
import { lookupProfileByPhone } from "@/lib/sms/phone-lookup";

function mockSupabase(profiles: { id: string; name: string; phone: string | null }[] | null, error?: { message: string }) {
  return {
    from: () => ({
      select: () => ({
        or: () =>
          Promise.resolve({
            data: profiles,
            error: error || null,
          }),
      }),
    }),
  } as unknown as Parameters<typeof lookupProfileByPhone>[0];
}

describe("lookupProfileByPhone", () => {
  it("returns found=true for a matching phone number", async () => {
    const result = await lookupProfileByPhone(
      mockSupabase([{ id: "user-1", name: "Rachel", phone: "+18135551234" }]),
      "+18135551234"
    );
    expect(result.found).toBe(true);
    expect(result.userId).toBe("user-1");
    expect(result.userName).toBe("Rachel");
  });

  it("returns found=false for unknown number", async () => {
    const result = await lookupProfileByPhone(
      mockSupabase([]),
      "+10000000000"
    );
    expect(result.found).toBe(false);
    expect(result.reply).toContain("don't recognize");
  });

  it("returns found=false with error on DB failure", async () => {
    const result = await lookupProfileByPhone(
      mockSupabase(null, { message: "connection failed" }),
      "+18135551234"
    );
    expect(result.found).toBe(false);
    expect(result.reply).toContain("System error");
  });

  it("handles multiple profile matches", async () => {
    const result = await lookupProfileByPhone(
      mockSupabase([
        { id: "user-1", name: "Rachel", phone: "+18135551234" },
        { id: "user-2", name: "Sarah", phone: "+18135551234" },
      ]),
      "+18135551234"
    );
    expect(result.found).toBe(true);
    // Should return the exact match or first result
    expect(result.userId).toBeDefined();
  });
});
