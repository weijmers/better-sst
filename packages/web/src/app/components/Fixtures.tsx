"use client"

import { FaRegStar } from "react-icons/fa";
import { GameDTO } from "@better/core/types";

type FixturesProps = {
  gamesByDate: Record<string, GameDTO[]>;
}

const Fixtures = ({ gamesByDate }: FixturesProps) => {
  return (<div className="flex">
    {gamesByDate && Object.keys(gamesByDate).map((value, index) => {
      return (<Fixture key={index} date={value} index={index} games={gamesByDate[value]} />)
    })}
  </div>);
};

const Fixture = ({ date, index, games }: {
  date: string;
  index: number;
  games: GameDTO[];
}) => {
  return (<div className="border-gray-900">
    <div className="text-center text-xl">{date}</div>
    <div>
      {games && games.map((value, index) => <Game game={value} key={index} />)}
    </div>
  </div>);
};

const Game = ({ game }: {
  game: GameDTO;
}) => {
  return (
    <div className="border-gray-400 border-l-2 rounded-md my-1 cursor-pointer">
      <div className="w-96 flex flex-row p-4 rounded-md bg-gray-200
        border-gray-200 border-l-2 shadow-md
        place-content-between
        hover:border-gray-300 hover:bg-gray-100
        transition-all duration-300 ease-linear
        group">
        <div className="-rotate-90 text-gray-700">{game.dateTime.split(" ")[1]}</div>
        <div className="text-gray-700 flex-1 px-2">
          <div>{game.homeTeam.name}</div>
          <div>{game.awayTeam.name}</div>
        </div>
        <div className="w-8 text-center text-3xl my-2 px-2
          group-hover:text-yellow-500
          transition-all duration-300 ease-linear">
          <FaRegStar />
        </div>
      </div>
    </div>
  );
}

export default Fixtures;