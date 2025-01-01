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

import { useGameStore } from '@/store/gameStore';
import { Crown } from 'lucide-react';

const JesterHatIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    {/* Left tip */}
    <path d="M3 16 Q1 6 8 12" fill="#e74c3c" />
    {/* Right tip */}
    <path d="M21 16 Q23 6 16 12" fill="#2980b9" />
    {/* Center tip */}
    <path d="M8 14 Q12 2 16 14" fill="#27ae60" />
    {/* Brim */}
    <ellipse cx="12" cy="16" rx="9" ry="3" fill="#d4a017" />
    {/* Bells */}
    <circle cx="5" cy="10" r="1.2" fill="#f1c40f" />
    <circle cx="12" cy="5" r="1.2" fill="#f1c40f" />
    <circle cx="19" cy="10" r="1.2" fill="#f1c40f" />
  </svg>
);

const PlayerCards = () => {
  const players = useGameStore((s) => s.players);
  const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex);

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 px-1">
      {players.map((player, idx) => (
        <div
          key={player.id}
          className={`player-card flex-shrink-0 min-w-[120px] sm:min-w-[140px] ${
            idx === currentPlayerIndex ? 'player-card-active' : ''
          }`}
        >
          <div className="flex items-center gap-1 mb-1">
            {idx === currentPlayerIndex && <Crown className="w-4 h-4 text-primary" />}
            <span className="font-display text-sm truncate">{player.name}</span>
            {player.hasJolly && (
              <JesterHatIcon className="w-5 h-5" />
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            Round: <span className="text-primary font-bold">{player.roundScore}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Totale: <span className="font-bold text-foreground">{player.totalScore}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PlayerCards;
