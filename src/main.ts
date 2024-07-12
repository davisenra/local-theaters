import { createScanScreeningsCommand } from "./cli";
import { program } from "commander";
import { JardinsScanner } from "./scanners/jardins";
import { MetropolisScanner } from "./scanners/metropolis";

(async () => {
  await program
    .addCommand(
      createScanScreeningsCommand(process.stdout, process.stderr, [
        new JardinsScanner(),
        new MetropolisScanner(),
      ]),
    )
    .parseAsync();
})();
