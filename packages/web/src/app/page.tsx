import { GameDTO, GameEntity } from "@better/core/types";
import Fixtures from "./components/Fixtures";
// import Game from "./components/Game";

const getGames = async () => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API}/fixtures`);
  return (await response.json() as Record<string, GameDTO[]>);
}

const Home = async () => {
  const gameResponse = await getGames();

  return (
    <>
      <Fixtures gamesByDate={gameResponse} />
      {/* <div className="text-center text-green-900">API: {process.env.NEXT_PUBLIC_API}</div> */}
      {/* <div>{JSON.stringify(gameResponse)}</div> */}
      {/* {gameResponse && gameResponse.games.map((g, i) => (<Game key={i} game={g} />))} */}
    </>
  )
}

export default Home;