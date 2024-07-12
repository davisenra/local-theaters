import { it, expect } from "vitest";
import { describe } from "node:test";
import { MetropolisScanner } from "../../src/scanners/metropolis";

describe("Metropolis scanner", () => {
  it("can scan metropolis theater", async () => {
    const sut = new MetropolisScanner();
    const screenings = await sut.scan();

    expect(screenings.length).toBeGreaterThan(0);
    screenings.forEach((scr) => {
      expect(scr).toBeTypeOf("object");
    });
  });
});
