import { Command } from "commander";
import { DayOfWeek, Screening } from "./types";
import chalk from "chalk";
import { Scanner } from "./scanners/scanner.interface";
import { Writable } from "node:stream";

function createScanScreeningsCommand(
  outputStream: Writable,
  errorStream: Writable,
  scanners: Scanner[],
) {
  return new Command("scan")
    .description("Shows next screenings at local theaters")
    .option("--today", "Only show screenings for the current day")
    .action(async (_, options) => {
      const screeningsCollections = await Promise.allSettled(
        scanners.map((scanner) => scanner.scan()),
      );

      const screeningsByDay = new Map<DayOfWeek, Screening[]>(
        Object.values(DayOfWeek).map((day) => [day, []]),
      );

      screeningsCollections.forEach((result, i) => {
        if (result.status === "rejected") {
          errorStream.write(
            chalk.red(
              `Something went wrong while scanning theater: ${scanners[i].getTheaterName()}`,
            ),
          );
          errorStream.write(chalk.red(`${result.reason}`) + "\n");

          return;
        }

        result.value.forEach((screening) => {
          screeningsByDay.get(screening.dayOfWeek)?.push(screening);
        });
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const daysInOrder = [
        DayOfWeek.Thursday,
        DayOfWeek.Friday,
        DayOfWeek.Saturday,
        DayOfWeek.Sunday,
        DayOfWeek.Monday,
        DayOfWeek.Tuesday,
        DayOfWeek.Wednesday,
      ];

      daysInOrder.forEach((day) => {
        let dayScreenings = screeningsByDay.get(day) || [];

        if (options.opts().today) {
          dayScreenings = dayScreenings.filter((screening) => {
            const screeningDate = new Date(screening.date);
            screeningDate.setHours(0, 0, 0, 0);
            return screeningDate.getTime() === today.getTime();
          });
        } else {
          dayScreenings = dayScreenings.filter((screening) => screening.date >= today);
        }

        if (dayScreenings.length === 0) {
          return;
        }

        dayScreenings.sort((a, b) => a.date.getTime() - b.date.getTime());

        const dateString = `${dayScreenings[0].date.toDateString()}`;
        outputStream.write(chalk.red.bold(`${day.toString().toUpperCase()} (${dateString})\n`));

        dayScreenings.forEach((screening) => {
          outputStream.write(
            `${screening.time}: ${chalk.bold(screening.movie.title)} - ${screening.movie.duration}\' [${screening.theater.name}]\n`,
          );
        });

        outputStream.write("\n");
      });
    });
}

export { createScanScreeningsCommand };
