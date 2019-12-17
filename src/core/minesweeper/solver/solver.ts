import { GameCommandOpenRespStatus, GameStateEnum, MineSweeperController } from "../game";
import { solveMinesweeper } from "./index";

export async function* generatorSolver(minesweeper: MineSweeperController, level: number) {
    while (true) {
        if (minesweeper.state === GameStateEnum.Init) {
            await minesweeper.newGame(level);
        }
        const { marked, open } = solveMinesweeper(minesweeper.field);
        if (marked.length) {
            minesweeper.markCell(...marked);
        }
        if (open.length) {
            const resp = await minesweeper.openCell(...open);
            if (resp) {
                switch (resp.status) {
                    case GameCommandOpenRespStatus.WIN:
                        return resp.message
                }
            }
            yield resp && resp.status
        }
    }
}
