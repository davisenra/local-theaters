import * as cheerio from "cheerio";
import { Scanner } from "./scanner.interface";
import { useHtmlCache } from "../filesystem";
import { DayOfWeek, type Screening } from "../types";

class JardinsScanner implements Scanner {
  private readonly url = "https://cinejardins.com.br/emcartaz/";

  public getTheaterName(): string {
    return "Cine Jardins";
  }

  public async scan(): Promise<Screening[]> {
    const html = await this.fetchHtml();

    return this.parseHtml(html);
  }

  private async fetchHtml(): Promise<string> {
    return await useHtmlCache("jardins", async () => {
      const response = await fetch(this.url);

      if (!response.ok) {
        throw new Error(`Failed to fetch Jardins screenings: ${response.statusText}`);
      }

      return await response.text();
    });
  }

  private parseHtml(html: string): Screening[] {
    const $ = cheerio.load(html);
    const screeningDivs = $(".amy-movie-item-back-inner");

    if (screeningDivs.length === 0) {
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

    screeningDivs.each((_, screeningDiv) => {
      const title = $(screeningDiv).find("h3.amy-movie-field-title a").first().text();
      const duration = $(screeningDiv).find(".amy-movie-field-duration").first().text();

      const sessionsBlocks = $(screeningDiv).find(".amy-cell");

      sessionsBlocks.each((dayIndex, block) => {
        const sessions = $(block).find(".amy-intro-times div");

        sessions.each((_, session) => {
          const sessionTime = $(session).text();

          const screening: Screening = {
            theater: { name: this.getTheaterName() },
            movie: { title, duration: this.convertDurationToMinutes(duration) },
            time: sessionTime,
            date: weekScreeningsMap[dayIndex].date,
            dayOfWeek: weekScreeningsMap[dayIndex].day,
          };

          screenings.push(screening);
        });
      });
    });

    screenings.sort((a, b) => a.date.getTime() - b.date.getTime());

    return screenings;
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

  private convertDurationToMinutes(duration: string) {
    const hourRegex = /(\d+)\s*hora\/horas?/i;
    const minuteRegex = /(\d+)\s*minutos?/i;

    const hoursMatch = duration.match(hourRegex);
    const minutesMatch = duration.match(minuteRegex);

    const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
    const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;

    return hours * 60 + minutes;
  }
}

export { JardinsScanner };
