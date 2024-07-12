import { Screening } from "../types";

export interface Scanner {
  getTheaterName(): string;
  scan(): Promise<Screening[]>;
}
