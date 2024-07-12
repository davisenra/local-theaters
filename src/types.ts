export enum DayOfWeek {
  Monday = "Monday",
  Tuesday = "Tuesday",
  Wednesday = "Wednesday",
  Thursday = "Thursday",
  Friday = "Friday",
  Saturday = "Saturday",
  Sunday = "Sunday",
}

export type Theater = {
  name: string;
};

export type Movie = {
  title: string;
  duration: number | string;
};

export type Screening = {
  theater: Theater;
  movie: Movie;
  time: string;
  date: Date;
  dayOfWeek: DayOfWeek;
};
