import Image from 'next/image';
import { Game as GameEntity, Team } from "@better/core/types";
import Game from "./components/Game";

const getGames = async () => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API}`);
  return (await response.json() as GameEntity[]);
}

const Home = async () => {
  const games = await getGames();

  return (
    <>
      <h1>GAMES</h1>
      {/* <div className="text-center text-green-900">API: {process.env.NEXT_PUBLIC_API}</div> */}
      {games && games.map((g, i) => (<Game key={i} game={g} />))}
    </>
  )
}

export default Home;