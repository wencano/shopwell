import { describe, expect, it } from "vitest";
import { formatAud } from "@/lib/format";

describe("formatAud", () => {
  it("formats cents as AUD", () => {
    expect(formatAud(5295)).toMatch(/52\.95/);
  });
});
