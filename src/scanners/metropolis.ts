import * as cheerio from "cheerio";
import { Scanner } from "./scanner.interface";
import { useHtmlCache } from "../filesystem";
import { DayOfWeek, type Screening } from "../types";

class MetropolisScanner implements Scanner {
  private readonly url = "https://cinema.ufes.br/programa-semana";

  public getTheaterName(): string {
    return "Cine Metrópolis";
  }

  public async scan(): Promise<Screening[]> {
    const html = await this.fetchHtml();

    return this.parseHtml(html);
  }

  private async fetchHtml(): Promise<string> {
    return await useHtmlCache("metropolis", async () => {
      const response = await fetch(this.url);

      if (!response.ok) {
        throw new Error(`Failed to fetch Metropolis screenings: ${response.statusText}`);
      }

      return await response.text();
    });
  }

  private parseHtml(html: string): Screening[] {
    const $ = cheerio.load(html);
    const screeningsTable = $("table");
    const rows = screeningsTable.find("tr");

    if (rows.length === 0) {
      throw new Error("Failed to find any screenings");
    }

    const lastThursday = this.getLastThursday();

    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(lastThursday);
      date.setDate(lastThursday.getDate() + i);
      dates.push(date);
    }

    const weekScreeningsMap = [
      { day: DayOfWeek.Thursday, date: dates[0] },
      { day: DayOfWeek.Friday, date: dates[1] },
      { day: DayOfWeek.Saturday, date: dates[2] },
      { day: DayOfWeek.Sunday, date: dates[3] },
      { day: DayOfWeek.Monday, date: dates[4] },
      { day: DayOfWeek.Tuesday, date: dates[5] },
      { day: DayOfWeek.Wednesday, date: dates[6] },
    ];

    const screenings: Screening[] = [];

    rows.each((_, rowEl) => {
      const cells = $(rowEl).find("td");

      cells.each((dayIndex, cell) => {
        const cellContents = $(cell).find("p");

        if (!this.isImptyCell(cellContents)) {
          const { title, duration } = this.parseScreeningTitleAndDuration(cellContents);

          const screening: Screening = {
            theater: { name: this.getTheaterName() },
            movie: { title, duration },
            time: cellContents.first().text(),
            date: weekScreeningsMap[dayIndex].date,
            dayOfWeek: weekScreeningsMap[dayIndex].day,
          };

          screenings.push(screening);
        }
      });
    });

    screenings.sort((a, b) => a.date.getTime() - b.date.getTime());

    return screenings;
  }

  private isImptyCell(el: cheerio.Cheerio<cheerio.Element>): boolean {
    if (el.length === 0) {
      return true;
    }

    if (el.length === 1) {
      return true;
    }

    const innerContent = el.contents().text();

    if (innerContent.trim() === "-") {
      return true;
    }

    return false;
  }

  private getLastThursday(): Date {
    const today = new Date();
    const day = today.getDay();
    const hours = today.getHours();
    const diff = day >= 4 ? day - 4 : 7 - (4 - day);
    const lastThursday = new Date(today);
    lastThursday.setDate(today.getDate() - diff);

    // If today is Thursday we want last week's Thursday
    if (day === 4 && hours >= 13) {
      lastThursday.setDate(today.getDate());
    } else if (day === 4) {
      lastThursday.setDate(today.getDate() - 7);
    }

    lastThursday.setHours(0, 0, 0, 0);

    return lastThursday;
  }

  private parseScreeningTitleAndDuration(cellContents: cheerio.Cheerio<cheerio.Element>) {
    const lastContentText = cellContents.last().text().replace(/\s\s+/g, " ");

    const durationMatch = lastContentText.match(/(\d+)'(?!\s*\+.*$)/);
    let duration = 0;
    let title = lastContentText;

    if (durationMatch) {
      duration = parseInt(durationMatch[1], 10);
      title = lastContentText.slice(0, durationMatch.index).trim();
    } else {
      const edgeCaseMatch = lastContentText.match(/(\d+)'/);
      if (edgeCaseMatch) {
        duration = parseInt(edgeCaseMatch[1], 10);
        title = lastContentText.replace(edgeCaseMatch[0], "").trim();
      }
    }

    return { title, duration };
  }
}

export { MetropolisScanner };
