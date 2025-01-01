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

import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import Wheel from '@/components/game/Wheel';
import PuzzleBoard from '@/components/game/PuzzleBoard';
import PlayerCards from '@/components/game/PlayerCards';
import LetterPanel from '@/components/game/LetterPanel';
import JollyDialog from '@/components/game/JollyDialog';
import SolvePanel from '@/components/game/SolvePanel';
import { Zap, HelpCircle, Keyboard } from 'lucide-react';

const GamePage = () => {
  const {
    turnPhase,
    setTurnPhase,
    handleWheelResult,
    startSolving,
    players,
    currentPlayerIndex,
    message,
    isExpressMode,
    getActiveWheel,
    gamePhase,
    nextRound,
    currentRound,
    rounds,
    jollyUsed
  } = useGameStore();

  const [panelsVisible, setPanelsVisible] = useState(false);

  const currentPlayer = players[currentPlayerIndex];
  const wheel = getActiveWheel();
  const isRoundEnd = gamePhase === 'round-end';
  const isSpinning = turnPhase === 'spinning';
  const awaitingAction = turnPhase === 'awaiting-action';
  const choosingConsonant = turnPhase === 'consonant-guess';
  const choosingVowel = turnPhase === 'vowel-guess';
  const expressGuessing = turnPhase === 'express-guess';
  const jollyPrompt = turnPhase === 'jolly-prompt';
  const solvingInteractive = turnPhase === 'solving-interactive';

  const currentPhrase = useGameStore((s) => s.currentPhrase);
  const revealedLetters = useGameStore((s) => s.revealedLetters);
  const usedVowels = useGameStore((s) => s.usedVowels);

  // Check if all vowels in the phrase are already bought/revealed
  const allVowelsBought = (() => {
    if (!currentPhrase) return false;
    const phraseVowels = [...new Set(
      [...currentPhrase.phrase].filter(c => c !== ' ')
        .map(c => c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase())
        .filter(c => ['A','E','I','O','U'].includes(c))
    )];
    return phraseVowels.every(v => revealedLetters.includes(v) || usedVowels.includes(v));
  })();

  const canBuyVowel = (awaitingAction || expressGuessing) && currentPlayer && currentPlayer.roundScore >= 500 && !allVowelsBought;

  // Wheel is moved down (but full size) when not awaiting action and not spinning
  const wheelShrunk = !awaitingAction && !isSpinning && !isRoundEnd && !solvingInteractive;
  const showLetterPanel = choosingConsonant || choosingVowel || expressGuessing;

  // Delay panels fade-in when they become visible
  useEffect(() => {
    if (wheelShrunk && (showLetterPanel || expressGuessing)) {
      const timer = setTimeout(() => setPanelsVisible(true), 350);
      return () => clearTimeout(timer);
    } else {
      setPanelsVisible(false);
    }
  }, [wheelShrunk, showLetterPanel, expressGuessing]);

  // Sopprimi scrollbar a livello di pagina quando la ruota è traslata e può uscire dal viewport
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    if (wheelShrunk) {
      const prevHtmlOverflow = html.style.overflow;
      const prevBodyOverflow = body.style.overflow;
      const prevHtmlOverscroll = (html.style as any).overscrollBehavior;
      const prevBodyOverscroll = (body.style as any).overscrollBehavior;
      html.style.overflow = 'hidden';
      body.style.overflow = 'hidden';
      (html.style as any).overscrollBehavior = 'none';
      (body.style as any).overscrollBehavior = 'none';
      return () => {
        html.style.overflow = prevHtmlOverflow || '';
        body.style.overflow = prevBodyOverflow || '';
        (html.style as any).overscrollBehavior = prevHtmlOverscroll || '';
        (body.style as any).overscrollBehavior = prevBodyOverscroll || '';
      };
    }
  }, [wheelShrunk]);

  const onWheelResult = (value: number | string, index: number) => {
    handleWheelResult(value, index);
  };

  const letterMode = choosingVowel ? 'vowel' : expressGuessing ? 'express' : 'consonant';

  return (
    <div className={`min-h-screen flex flex-col p-2 sm:p-4 gap-3 w-full max-w-full ${wheelShrunk ? 'overflow-y-hidden' : ''} overflow-x-hidden`}>
      {/* Player cards */}
      <PlayerCards />

      {/* Message banner */}
      {message && (
        <div className="message-banner animate-fade-in text-sm sm:text-base">
          {message}
        </div>
      )}

      {/* Round info */}
      <div className="text-center text-xs font-display text-muted-foreground">
        Round {currentRound + 1}/{rounds.length} — {rounds[currentRound]?.type === 'express' ? '⚡ Express' : 'Normale'}
        {isExpressMode && <span className="text-accent ml-2">⚡ MODALITÀ EXPRESS</span>}
      </div>

      {/* Puzzle Board */}
      <PuzzleBoard />

      {/* Letter Panel between board and wheel */}
      {!isRoundEnd && !solvingInteractive && showLetterPanel && (
        <div className="w-full max-w-2xl mx-auto px-3">
          {expressGuessing && (
            <div className="text-center p-2 rounded-lg border border-accent bg-accent/10 mb-2" style={{ opacity: panelsVisible ? 1 : 0, transition: 'opacity 0.4s ease-in-out' }}>
              <Zap className="w-5 h-5 text-accent mx-auto mb-1" />
              <div className="font-display text-sm text-accent">Modalità Express</div>
              <div className="text-xs text-muted-foreground">Scegli una consonante! Se sbagli = Bancarotta</div>
              <button onClick={() => startSolving()} className="gold-button text-xs mt-2 px-3 py-1">
                Risolvi
              </button>
            </div>
          )}
          {expressGuessing && (
            <div className="flex gap-2 mb-2" style={{ opacity: panelsVisible ? 1 : 0, transition: 'opacity 0.4s ease-in-out' }}>
              <button
                onClick={() => setTurnPhase('vowel-guess')}
                disabled={!canBuyVowel}
                className="gold-button flex-1 text-sm py-2 flex items-center justify-center gap-1"
              >
                <Keyboard className="w-4 h-4" />
                Vocale (500)
              </button>
            </div>
          )}
          <div style={{ opacity: panelsVisible ? 1 : 0, transition: 'opacity 0.4s ease-in-out' }}>
            <LetterPanel mode={letterMode} />
          </div>
        </div>
      )}

      {/* Interactive Solve Panel */}
      {solvingInteractive && <SolvePanel />}

      {/* Round end overlay */}
      {isRoundEnd && (
        <div className="text-center py-4">
          <button onClick={nextRound} className="gold-button text-lg">
            {currentRound + 1 < rounds.length ? 'Prossimo Round →' : 'Risultati Finali'}
          </button>
        </div>
      )}

      {/* Game area: Wheel only, moved down when shrunk */}
      {!isRoundEnd && !solvingInteractive && (
        <div className="w-full max-w-2xl mx-auto relative">
          {/* Action buttons above wheel when full size */}
          {awaitingAction && (
            <div className="flex flex-col gap-2 mb-2 pt-3">
              <div className="text-center font-display text-primary text-sm">
                Turno di {currentPlayer?.name} — Trascina la ruota per girarla!
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setTurnPhase('vowel-guess')}
                  disabled={!canBuyVowel}
                  className="gold-button flex-1 text-sm py-2 flex items-center justify-center gap-1"
                >
                  <Keyboard className="w-4 h-4" />
                  Vocale (500)
                </button>
                <button
                  onClick={() => startSolving()}
                  className="gold-button flex-1 text-sm py-2 flex items-center justify-center gap-1"
                >
                  <HelpCircle className="w-4 h-4" />
                  Risolvi
                </button>
              </div>
            </div>
          )}

          <div className="relative flex justify-center">
            {/* Wheel container with translate animation */}
            <div
              style={{
                transform: wheelShrunk ? 'translateY(32px)' : 'translateY(0)',
                transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                flexShrink: 0,
                paddingTop: awaitingAction ? '1rem' : '0',
              }}
            >
              <Wheel
                segments={wheel}
                onResult={onWheelResult}
                disabled={!awaitingAction && !isSpinning}
                jollyClaimed={players.some(p => p.hasJolly)}
                jollyUsed={jollyUsed}
              />
            </div>
          </div>
        </div>
      )}

      {/* Jolly Dialog */}
      {jollyPrompt && <JollyDialog />}
    </div>
  );
};

export default GamePage;
