import { it, expect } from "vitest";
import { describe } from "node:test";
import { JardinsScanner } from "../../src/scanners/jardins";

describe("Jardins scanner", () => {
  it("can scan cine jardins theater", async () => {
    const sut = new JardinsScanner();
    const screenings = await sut.scan();

    expect(screenings.length).toBeGreaterThan(0);
    screenings.forEach((scr) => {
      expect(scr).toBeTypeOf("object");
    });
  });
});
