// Движок правил русских шашек (8x8, дамки летающие, взятие обязательно и продолжается,
// пока у той же шашки есть следующий прыжок). Используется на фронтенде для подсветки
// доступных ходов — зеркальная копия логики лежит в backend/game-move/index.py,
// который является источником истины при валидации хода.

export type CPiece = 'w' | 'b' | 'W' | 'B' | null;
export type CBoard = CPiece[][];
export type Side = 'white' | 'black';

export interface CMove {
  from: [number, number];
  to: [number, number];
  captured?: [number, number];
}

const DIRS: [number, number][] = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

const inBounds = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8;
export const isWhitePiece = (p: CPiece) => p === 'w' || p === 'W';
export const isBlackPiece = (p: CPiece) => p === 'b' || p === 'B';
export const isKingPiece = (p: CPiece) => p === 'W' || p === 'B';
const sameSide = (p: CPiece, side: Side) => (side === 'white' ? isWhitePiece(p) : isBlackPiece(p));
const enemySide = (p: CPiece, side: Side) => (side === 'white' ? isBlackPiece(p) : isWhitePiece(p));

export function initialCheckersBoard(): CBoard {
  const board: CBoard = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) board[row][col] = 'b';
    }
  }
  for (let row = 5; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) board[row][col] = 'w';
    }
  }
  return board;
}

function manCaptures(board: CBoard, row: number, col: number, side: Side): CMove[] {
  const moves: CMove[] = [];
  for (const [dr, dc] of DIRS) {
    const mr = row + dr, mc = col + dc;
    const tr = row + 2 * dr, tc = col + 2 * dc;
    if (inBounds(tr, tc) && inBounds(mr, mc) && enemySide(board[mr][mc], side) && board[tr][tc] === null) {
      moves.push({ from: [row, col], to: [tr, tc], captured: [mr, mc] });
    }
  }
  return moves;
}

function manSimpleMoves(board: CBoard, row: number, col: number, side: Side): CMove[] {
  const moves: CMove[] = [];
  const dr = side === 'white' ? -1 : 1;
  for (const dc of [-1, 1]) {
    const r = row + dr, c = col + dc;
    if (inBounds(r, c) && board[r][c] === null) moves.push({ from: [row, col], to: [r, c] });
  }
  return moves;
}

function kingMoves(board: CBoard, row: number, col: number, side: Side): { simple: CMove[]; captures: CMove[] } {
  const simple: CMove[] = [];
  const captures: CMove[] = [];
  for (const [dr, dc] of DIRS) {
    let r = row + dr, c = col + dc;
    while (inBounds(r, c) && board[r][c] === null) {
      simple.push({ from: [row, col], to: [r, c] });
      r += dr; c += dc;
    }
    if (inBounds(r, c) && enemySide(board[r][c], side)) {
      const capR = r, capC = c;
      let lr = r + dr, lc = c + dc;
      while (inBounds(lr, lc) && board[lr][lc] === null) {
        captures.push({ from: [row, col], to: [lr, lc], captured: [capR, capC] });
        lr += dr; lc += dc;
      }
    }
  }
  return { simple, captures };
}

export function getPieceMoves(board: CBoard, row: number, col: number, side: Side): { simple: CMove[]; captures: CMove[] } {
  const piece = board[row][col];
  if (!piece || !sameSide(piece, side)) return { simple: [], captures: [] };
  if (isKingPiece(piece)) return kingMoves(board, row, col, side);
  return { simple: manSimpleMoves(board, row, col, side), captures: manCaptures(board, row, col, side) };
}

export function getAllLegalMoves(board: CBoard, side: Side, forcedPiece?: [number, number] | null): CMove[] {
  const allCaptures: CMove[] = [];
  const allSimple: CMove[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece || !sameSide(piece, side)) continue;
      if (forcedPiece && (forcedPiece[0] !== r || forcedPiece[1] !== c)) continue;
      const { simple, captures } = getPieceMoves(board, r, c, side);
      allCaptures.push(...captures);
      allSimple.push(...simple);
    }
  }
  if (allCaptures.length > 0) return allCaptures;
  return forcedPiece ? [] : allSimple;
}

export function applyMove(board: CBoard, move: CMove): { board: CBoard; promoted: boolean } {
  const newBoard = board.map((row) => [...row]);
  const [fr, fc] = move.from;
  const [tr, tc] = move.to;
  let piece = newBoard[fr][fc];
  newBoard[fr][fc] = null;
  let promoted = false;
  if (piece === 'w' && tr === 0) { piece = 'W'; promoted = true; }
  else if (piece === 'b' && tr === 7) { piece = 'B'; promoted = true; }
  newBoard[tr][tc] = piece;
  if (move.captured) {
    const [cr, cc] = move.captured;
    newBoard[cr][cc] = null;
  }
  return { board: newBoard, promoted };
}

export function countPieces(board: CBoard, side: Side): number {
  let n = 0;
  for (const row of board) for (const p of row) if (sameSide(p, side)) n++;
  return n;
}

export function hasAnyMoves(board: CBoard, side: Side): boolean {
  return getAllLegalMoves(board, side).length > 0;
}