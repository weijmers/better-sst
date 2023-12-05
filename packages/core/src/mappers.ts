import { GameDTO, GameEntity } from "./types";

export const mapGameEntityToGameDTO = (entity: GameEntity): GameDTO => {
  const { type, lastUpdatedAt, expiresAt, ...rest } = entity;
  return rest;
};