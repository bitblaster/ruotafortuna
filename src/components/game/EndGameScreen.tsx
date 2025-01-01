/*
 * Copyright (C) 2026 Bitblaster
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import confetti from 'canvas-confetti';
import { Trophy, Medal, RotateCcw } from 'lucide-react';

const EndGameScreen = () => {
  const players = useGameStore((s) => s.players);
  const resetGame = useGameStore((s) => s.resetGame);
  const firedRef = useRef(false);

  const sorted = [...players].sort((a, b) => b.totalScore - a.totalScore);
  const winner = sorted[0];

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#d4a017', '#f59e0b', '#fbbf24'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#d4a017', '#f59e0b', '#fbbf24'],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-8">
      <div className="text-center">
        <Trophy className="w-16 h-16 text-primary mx-auto mb-4" />
        <h1 className="game-title text-5xl mb-2">Partita Terminata!</h1>
        <p className="text-xl font-display text-primary">
          {winner?.name} vince con {winner?.totalScore} punti!
        </p>
      </div>

      <div className="w-full max-w-md space-y-3">
        {sorted.map((player, idx) => (
          <div
            key={player.id}
            className={`player-card flex items-center gap-3 ${idx === 0 ? 'player-card-active animate-pulse-gold' : ''}`}
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-display text-lg" style={{
              background: idx === 0 ? 'linear-gradient(135deg, hsl(42 100% 45%), hsl(42 100% 55%))' : 'hsl(222 30% 20%)',
              color: idx === 0 ? 'hsl(222 47% 8%)' : 'hsl(45 30% 96%)',
            }}>
              {idx === 0 ? <Medal className="w-5 h-5" /> : idx + 1}
            </div>
            <div className="flex-1">
              <div className="font-display text-lg">{player.name}</div>
            </div>
            <div className="font-display text-2xl text-primary">{player.totalScore}</div>
          </div>
        ))}
      </div>

      <button onClick={resetGame} className="gold-button flex items-center gap-2">
        <RotateCcw className="w-5 h-5" />
        Nuova Partita
      </button>
    </div>
  );
};

export default EndGameScreen;
