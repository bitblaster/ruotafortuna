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

import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import SetupScreen from '@/components/setup/SetupScreen';
import GamePage from '@/pages/GamePage';
import EndGameScreen from '@/components/game/EndGameScreen';

const Index = () => {
  const gamePhase = useGameStore((s) => s.gamePhase);
  const initGame = useGameStore((s) => s.initGame);
  const startRound = useGameStore((s) => s.startRound);

  // Warn before leaving during active game
  useEffect(() => {
    if (gamePhase !== 'playing' && gamePhase !== 'round-end') return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [gamePhase]);

  // Debug mode: ?id=nnn starts game with that phrase
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get('id');
    if (!idParam) return;

    const phraseId = parseInt(idParam, 10);
    if (isNaN(phraseId)) return;

    fetch('/phrases.json')
      .then((r) => r.json())
      .then((phrases) => {
        const player = { id: 1, name: 'Debug', totalScore: 0, roundScore: 0, hasJolly: false };
        const rounds = [{ type: 'normale' as const, category: '__any__' }];
        initGame([player], rounds, phrases);
        startRound(phraseId);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (gamePhase === 'game-over') {
    return <EndGameScreen />;
  }

  if (gamePhase === 'playing' || gamePhase === 'round-end') {
    return <GamePage />;
  }

  return <SetupScreen />;
};

export default Index;
