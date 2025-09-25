import React, { useEffect } from 'react';
import { create } from 'zustand';
import { AnimatePresence, motion } from 'framer-motion';
import { Settings, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
// --- TYPES AND CONSTANTS ---
const BOARD_SIZE = 6;
const MAX_DOTS = 4;
const PLAYER_ONE = 1;
const PLAYER_TWO = 2;
const AI_PLAYER = PLAYER_TWO;
const HUMAN_PLAYER = PLAYER_ONE;
type Player = typeof PLAYER_ONE | typeof PLAYER_TWO;
type CellState = { player: Player | null; dots: number };
type BoardState = CellState[][];
type GameStatus = 'FIRST_MOVE_P1' | 'FIRST_MOVE_P2' | 'PLAYING' | 'ANIMATING' | 'GAME_OVER';
interface GameState {
  board: BoardState;
  currentPlayer: Player;
  status: GameStatus;
  winner: Player | null;
  scores: { [key in Player]: number };
  turnCount: number;
}
// --- ZUSTAND STORE ---
const createInitialState = (): GameState => ({
  board: Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null).map(() => ({ player: null, dots: 0 }))),
  currentPlayer: PLAYER_ONE,
  status: 'FIRST_MOVE_P1',
  winner: null,
  scores: { [PLAYER_ONE]: 0, [PLAYER_TWO]: 0 },
  turnCount: 0,
});
const useGameStore = create<GameState>(() => createInitialState());
// --- GAME ACTIONS (outside store to avoid serializing functions) ---
const actions = {
  resetGame: () => useGameStore.setState(createInitialState()),
  makeMove: (row: number, col: number) => {
    const { status, currentPlayer, board } = useGameStore.getState();
    if (status === 'GAME_OVER' || status === 'ANIMATING') return;
    const isFirstMove = status === 'FIRST_MOVE_P1' || status === 'FIRST_MOVE_P2';
    const cell = board[row][col];
    if (isFirstMove) {
      if (cell.player !== null) return; // Can only place on empty cells
      const newBoard = board.map(r => r.map(c => ({ ...c })));
      newBoard[row][col] = { player: currentPlayer, dots: 3 };
      useGameStore.setState({ board: newBoard, status: 'ANIMATING' });
      setTimeout(() => processTurnEnd(), 100); // Short delay for piece placement animation
    } else {
      if (cell.player !== currentPlayer) return; // Can only click your own cells
      const newBoard = board.map(r => r.map(c => ({ ...c })));
      newBoard[row][col].dots++;
      useGameStore.setState({ board: newBoard, status: 'ANIMATING' });
      handleExplosions(newBoard);
    }
  },
};
const processTurnEnd = () => {
  const { board, currentPlayer, turnCount } = useGameStore.getState();
  const nextPlayer = currentPlayer === PLAYER_ONE ? PLAYER_TWO : PLAYER_ONE;
  const nextTurnCount = turnCount + 1;
  const p1Cells = board.flat().filter(c => c.player === PLAYER_ONE).length;
  const p2Cells = board.flat().filter(c => c.player === PLAYER_TWO).length;
  const totalCells = BOARD_SIZE * BOARD_SIZE;
  useGameStore.setState({ scores: { [PLAYER_ONE]: p1Cells, [PLAYER_TWO]: p2Cells } });
  // Win condition check
  if (nextTurnCount > 1) {
    if (p1Cells === totalCells) {
        useGameStore.setState({ status: 'GAME_OVER', winner: PLAYER_ONE });
        return;
    }
    if (p2Cells === totalCells) {
        useGameStore.setState({ status: 'GAME_OVER', winner: PLAYER_TWO });
        return;
    }
    if (p1Cells === 0 && p2Cells > 0) {
        useGameStore.setState({ status: 'GAME_OVER', winner: PLAYER_TWO });
        return;
    }
    if (p2Cells === 0 && p1Cells > 0) {
        useGameStore.setState({ status: 'GAME_OVER', winner: PLAYER_ONE });
        return;
    }
  }
  const isNextFirstMove = nextTurnCount < 2;
  const nextStatus: GameStatus = isNextFirstMove ? (nextPlayer === PLAYER_ONE ? 'FIRST_MOVE_P1' : 'FIRST_MOVE_P2') : 'PLAYING';
  useGameStore.setState({
    currentPlayer: nextPlayer,
    status: nextStatus,
    turnCount: nextTurnCount,
  });
};
const handleExplosions = async (initialBoard: BoardState) => {
    const explosionDelay = 150;
    let currentBoard = initialBoard.map(r => r.map(c => ({ ...c })));
    let explosionsOccurred = true;
    while (explosionsOccurred) {
        explosionsOccurred = false;
        const explosionsThisStep: { row: number, col: number }[] = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (currentBoard[r][c].dots >= MAX_DOTS) {
                    explosionsThisStep.push({ row: r, col: c });
                    explosionsOccurred = true;
                }
            }
        }
        if (explosionsOccurred) {
            await new Promise(resolve => setTimeout(resolve, explosionDelay));
            const boardAfterExplosions = currentBoard.map(r => r.map(c => ({ ...c })));
            explosionsThisStep.forEach(({ row, col }) => {
                const explodingPlayer = boardAfterExplosions[row][col].player;
                boardAfterExplosions[row][col] = { player: null, dots: 0 };
                const neighbors = [[-1, 0], [1, 0], [0, -1], [0, 1]];
                neighbors.forEach(([dr, dc]) => {
                    const nr = row + dr;
                    const nc = col + dc;
                    if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
                        boardAfterExplosions[nr][nc].player = explodingPlayer;
                        boardAfterExplosions[nr][nc].dots++;
                    }
                });
            });
            currentBoard = boardAfterExplosions;
            useGameStore.setState({ board: currentBoard });
        }
    }
    processTurnEnd();
};
// --- AI LOGIC ---
const calculateAIMove = (board: BoardState, player: Player, isFirstMove: boolean): { row: number, col: number } => {
    const opponent = player === PLAYER_ONE ? PLAYER_TWO : PLAYER_ONE;
    if (isFirstMove) {
        const emptyCells: { row: number, col: number }[] = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (board[r][c].player === null) emptyCells.push({ row: r, col: c });
            }
        }
        // Prioritize center
        const centerMoves = emptyCells.filter(m =>
            m.row > 0 && m.row < BOARD_SIZE - 1 && m.col > 0 && m.col < BOARD_SIZE - 1
        );
        if (centerMoves.length > 0) return centerMoves[Math.floor(Math.random() * centerMoves.length)];
        return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }
    let bestMove: { row: number, col: number } | null = null;
    let maxScore = -Infinity;
    const ownCells = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c].player === player) ownCells.push({ row: r, col: c });
        }
    }
    if (ownCells.length === 0) {
        // Should not happen if game logic is correct, but as a fallback:
        return {row: 0, col: 0};
    }
    ownCells.forEach(move => {
        const score = evaluateMove(board, move.row, move.col, player, opponent);
        if (score > maxScore) {
            maxScore = score;
            bestMove = move;
        }
    });
    return bestMove || ownCells[Math.floor(Math.random() * ownCells.length)];
};
const evaluateMove = (board: BoardState, row: number, col: number, player: Player, opponent: Player): number => {
    let score = 0;
    const tempBoard = board.map(r => r.map(c => ({ ...c })));
    tempBoard[row][col].dots++;
    let captures = 0;
    let chainLength = 0;
    const queue = [{ row, col }];
    const visited = new Set<string>();
    visited.add(`${row},${col}`);
    while (queue.length > 0) {
        const { row: r, col: c } = queue.shift()!;
        if (tempBoard[r][c].dots >= MAX_DOTS) {
            chainLength++;
            tempBoard[r][c].dots -= MAX_DOTS;
            if (tempBoard[r][c].dots === 0) tempBoard[r][c].player = null;
            const neighbors = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            neighbors.forEach(([dr, dc]) => {
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
                    if (tempBoard[nr][nc].player === opponent) captures++;
                    tempBoard[nr][nc].player = player;
                    tempBoard[nr][nc].dots++;
                    if (tempBoard[nr][nc].dots >= MAX_DOTS && !visited.has(`${nr},${nc}`)) {
                        queue.push({ row: nr, col: nc });
                        visited.add(`${nr},${nc}`);
                    }
                }
            });
        }
    }
    score += captures * 10; // High value for captures
    score += chainLength * 5; // Value chain reactions
    // Defensive check: does this move set up an opponent's chain reaction?
    const neighbors = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    neighbors.forEach(([dr, dc]) => {
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
            if (board[nr][nc].player === opponent && board[nr][nc].dots === MAX_DOTS - 1) {
                score -= 15; // Avoid setting up opponent
            }
        }
    });
    // Positional bonus
    const distFromCenter = Math.abs(row - (BOARD_SIZE - 1) / 2) + Math.abs(col - (BOARD_SIZE - 1) / 2);
    score += (BOARD_SIZE - distFromCenter);
    return score;
};
// --- REACT COMPONENTS ---
const PlayerInfo: React.FC = () => {
    const { currentPlayer, scores, status } = useGameStore();
    const p1Score = scores[PLAYER_ONE];
    const p2Score = scores[PLAYER_TWO];
    const getStatusText = () => {
        if (status.startsWith('FIRST_MOVE')) return "Place your first piece";
        if (status === 'PLAYING') return "Your move";
        if (status === 'ANIMATING') return "Chain reaction...";
        if (status === 'GAME_OVER') return "Game Over";
        return "";
    };
    return (
        <div className="flex justify-between items-center w-full max-w-md lg:max-w-lg p-4 text-white font-mono">
            <div className={cn("p-4 rounded-lg transition-all duration-300", currentPlayer === PLAYER_ONE && status !== 'GAME_OVER' && "animate-neon-glow-p1")}>
                <h2 className="text-lg text-player-one">Player 1 (You)</h2>
                <p className="text-3xl font-bold">{p1Score}</p>
            </div>
            <div className="text-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={status + currentPlayer}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.3 }}
                    >
                        <p className={cn("text-xl", currentPlayer === PLAYER_ONE ? "text-player-one" : "text-player-two")}>
                            {status !== 'GAME_OVER' && `Turn: ${currentPlayer === PLAYER_ONE ? 'P1' : 'P2'}`}
                        </p>
                        <p className="text-sm text-gray-400">{getStatusText()}</p>
                    </motion.div>
                </AnimatePresence>
            </div>
            <div className={cn("p-4 rounded-lg text-right transition-all duration-300", currentPlayer === PLAYER_TWO && status !== 'GAME_OVER' && "animate-neon-glow-p2")}>
                <h2 className="text-lg text-player-two">Player 2 (AI)</h2>
                <p className="text-3xl font-bold">{p2Score}</p>
            </div>
        </div>
    );
};
const Dot: React.FC<{ delay: number }> = ({ delay }) => (
    <motion.div
        className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30, delay }}
    />
);
const dotPositions = [
    [], // 0 dots
    [[0, 0]], // 1 dot
    [[-0.25, -0.25], [0.25, 0.25]], // 2 dots
    [[0, -0.3], [-0.3, 0.2], [0.3, 0.2]], // 3 dots
];
const Cell: React.FC<{ row: number; col: number }> = React.memo(({ row, col }) => {
    const { board, currentPlayer, status } = useGameStore();
    const { player, dots } = board[row][col];
    const handleClick = React.useCallback(() => {
        if (currentPlayer === HUMAN_PLAYER && status !== 'ANIMATING') {
            actions.makeMove(row, col);
        }
    }, [currentPlayer, status, row, col]);
    const scale = 0.6 + dots * 0.12;
    return (
        <div className="aspect-square flex items-center justify-center cell-bg" onClick={handleClick}>
            <AnimatePresence>
                {player && (
                    <motion.div
                        className={cn(
                            "relative rounded-full flex items-center justify-center",
                            player === PLAYER_ONE ? 'bg-player-one player1-glow' : 'bg-player-two player2-glow'
                        )}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1, width: `${scale * 100}%`, height: `${scale * 100}%` }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                        {dots < MAX_DOTS && dotPositions[dots].map(([x, y], i) => (
                            <motion.div
                                key={i}
                                className="absolute"
                                style={{
                                    transform: `translateX(${x * 25}%) translateY(${y * 25}%)`,
                                }}
                            >
                                <Dot delay={i * 0.05} />
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});
const GameBoard: React.FC = () => {
    const board = useGameStore(state => state.board);
    return (
        <div className="w-full max-w-md lg:max-w-lg aspect-square p-2 rounded-lg board-grid">
            {board.map((rowArr, r) => rowArr.map((_, c) => <Cell key={`${r}-${c}`} row={r} col={c} />))}
        </div>
    );
};
const GameOverDialog: React.FC = () => {
    const { winner, status } = useGameStore();
    const isOpen = status === 'GAME_OVER';
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && actions.resetGame()}>
            <DialogContent className="bg-[#191923] border-player-one text-white font-mono">
                <DialogHeader>
                    <DialogTitle className="text-3xl text-center text-player-one">
                        {winner === HUMAN_PLAYER ? "VICTORY!" : "DEFEAT"}
                    </DialogTitle>
                    <DialogDescription className="text-center text-gray-400 pt-2">
                        {winner === HUMAN_PLAYER ? "You have conquered the board. A masterful display of strategy!" : "The AI has bested you. Better luck next time!"}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button onClick={actions.resetGame} className="w-full bg-player-one/80 text-black font-bold hover:bg-player-one neon-button">
                        Play Again
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
export function HomePage() {
    const { status, currentPlayer, turnCount } = useGameStore();
    useEffect(() => {
        if (status !== 'ANIMATING' && currentPlayer === AI_PLAYER && status !== 'GAME_OVER') {
            const isFirstMove = status === 'FIRST_MOVE_P2';
            setTimeout(() => {
                const { board } = useGameStore.getState(); // Get latest board state
                const { row, col } = calculateAIMove(board, AI_PLAYER, isFirstMove);
                actions.makeMove(row, col);
            }, 800); // AI "thinking" time
        }
    }, [status, currentPlayer, turnCount]);
    return (
        <main className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 grainy-background">
            <div className="absolute top-4 right-4 flex gap-2">
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" onClick={() => console.log('Settings clicked')}>
                    <Settings className="h-6 w-6" />
                </Button>
            </div>
            <motion.h1
                className="text-4xl sm:text-5xl md:text-6xl font-bold text-center text-white"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <span className="text-player-one">Chroma</span>
                <span className="text-player-two">Clash</span>
            </motion.h1>
            <div className="w-full max-w-3xl flex flex-col items-center space-y-6 sm:space-y-8">
                <PlayerInfo />
                <GameBoard />
                <div className="flex items-center space-x-4">
                    <Button onClick={actions.resetGame} variant="outline" className="text-player-one border-player-one hover:bg-player-one/10 hover:text-white neon-button">
                        <RotateCw className="mr-2 h-4 w-4" /> Reset Game
                    </Button>
                </div>
            </div>
            <footer className="absolute bottom-4 text-center text-gray-500 text-sm">
                Built with ❤️ at Cloudflare
            </footer>
            <GameOverDialog />
        </main>
    );
}