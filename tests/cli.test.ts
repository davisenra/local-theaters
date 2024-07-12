import { expect, it } from "vitest";
import { createScanScreeningsCommand } from "../src/cli";
import { describe } from "node:test";
import { Scanner } from "../src/scanners/scanner.interface";
import { DayOfWeek, Screening } from "../src/types";
import { Writable } from "node:stream";

class MockScanner implements Scanner {
  getTheaterName(): string {
    return "Mock Theater";
  }

  public async scan(): Promise<Screening[]> {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    return [
      {
        theater: { name: "Mock Theater" },
        movie: { title: "Foo", duration: "99" },
        date: today,
        dayOfWeek: DayOfWeek.Friday,
        time: "18pm",
      },
      {
        theater: { name: "Mock 2 Theater" },
        movie: { title: "Bar", duration: "180" },
        date: tomorrow,
        dayOfWeek: DayOfWeek.Saturday,
        time: "18pm",
      },
    ];
  }
}

class MemoryStream extends Writable {
  public buffer: string;

  constructor() {
    super();
    this.buffer = "";
  }

  _write(chunk: any, encoding: string, callback: () => void) {
    this.buffer += chunk.toString();
    callback();
  }
}

describe("cli commands", () => {
  it("can scan local theaters", async () => {
    const scanners = [new MockScanner()];
    const stdout = new MemoryStream();
    const stderr = new MemoryStream();

    await createScanScreeningsCommand(stdout, stderr, scanners)
      .exitOverride()
      .parseAsync(["pnpm", "cli", "scan"]);

    // cli outputs chalk styled text, not worth testing everything

    expect(stderr.buffer).toHaveLength(0);
    expect(stdout.buffer).toContain(`- 99' [Mock Theater]`);
    expect(stdout.buffer).toContain(`- 180' [Mock 2 Theater]`);
  });

  it("only shows today screenings if --today option is passed", async () => {
    const scanners = [new MockScanner()];
    const stdout = new MemoryStream();
    const stderr = new MemoryStream();

    await createScanScreeningsCommand(stdout, stderr, scanners)
      .exitOverride()
      .parseAsync(["pnpm", "cli", "scan", "--today"]);

    // cli outputs chalk styled text, not worth testing everything

    expect(stderr.buffer).toHaveLength(0);
    expect(stdout.buffer).toContain(`- 99' [Mock Theater]`);
    expect(stdout.buffer).not.toContain(`- 180' [Mock 2 Theater]`);
  });
});
