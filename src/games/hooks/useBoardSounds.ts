import { useEffect, useRef } from 'react';
import { boardSounds } from '../utils/boardSounds';
import { GameRoomDetail } from '../utils/gameRooms';

interface BoardInfo {
  pieces: number;
  check: boolean;
}

export function useBoardSounds(room: GameRoomDetail | null, userId: number | undefined, getInfo: (state: Record<string, unknown>) => BoardInfo) {
  const prevRef = useRef<{ pieces: number; turn: boolean; status: string; key: string } | null>(null);

  useEffect(() => {
    if (!room || !userId || !room.state) return;
    const info = getInfo(room.state as Record<string, unknown>);
    const key = JSON.stringify(room.state);
    const myTurn = room.current_turn_user_id === userId;
    const prev = prevRef.current;
    if (prev && prev.key !== key) {
      if (room.status === 'finished' && prev.status !== 'finished') {
        if (!room.winner_id) boardSounds.draw();
        else if (room.winner_id === userId) boardSounds.win();
        else boardSounds.lose();
      } else if (info.check) boardSounds.check();
      else if (info.pieces < prev.pieces) boardSounds.capture();
      else boardSounds.move();
      if (room.status === 'playing' && myTurn && !prev.turn) setTimeout(boardSounds.myTurn, 350);
    } else if (prev && prev.status !== 'finished' && room.status === 'finished') {
      if (!room.winner_id) boardSounds.draw();
      else if (room.winner_id === userId) boardSounds.win();
      else boardSounds.lose();
    }
    prevRef.current = { pieces: info.pieces, turn: myTurn, status: room.status, key };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room]);
}
