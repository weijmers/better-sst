export enum gameTypes {
  FIXTURE = "FIXTURE",
  RESULT = "RESULT",
}

export type GameType = `${gameTypes}`;

export type GameEntity = {
  identifier: string;
  date: string;
  type: GameType;
  time: string;
  dateTime: string;
  countryCode: string;
  division: number;
  homeTeam: TeamEntity;
  awayTeam: TeamEntity;
  odds?: OddsEntity[];
  lastUpdatedAt: string;
  // DynamoDB specifies TTL in epoch seconds 
  expiresAt?: number;
}

export type GameDTO = Omit<GameEntity, "type" | "lastUpdatedAt" | "expiresAt">;

export type TeamEntity = {
  identifier: string;
  name: string;
}

export type OddsEntity = {
  identifier: string;
  home: number;
  draw: number;
  away: number;
}