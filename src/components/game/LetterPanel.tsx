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
import { VOWELS, CONSONANTS } from '@/lib/wheelConfig';
import { normalizeChar } from '@/lib/boardLayout';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface LetterPanelProps {
  mode: string;
}

const LetterPanel = ({ mode }: LetterPanelProps) => {
  const usedConsonants = useGameStore((s) => s.usedConsonants);
  const usedVowels = useGameStore((s) => s.usedVowels);
  const revealedLetters = useGameStore((s) => s.revealedLetters);
  const guessConsonant = useGameStore((s) => s.guessConsonant);
  const buyVowel = useGameStore((s) => s.buyVowel);
  const players = useGameStore((s) => s.players);
  const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex);
  const hideCalledLetters = useGameStore((s) => s.hideCalledLetters);

  const [vowelConfirm, setVowelConfirm] = useState<string | null>(null);

  const currentPlayer = players[currentPlayerIndex];
  const allUsed = [...usedConsonants, ...usedVowels, ...revealedLetters];

  const isUsed = (letter: string) => allUsed.includes(normalizeChar(letter));

  const handleLetterClick = (letter: string) => {
    const norm = normalizeChar(letter);
    if (isUsed(letter)) {
      if (hideCalledLetters) {
        // Player doesn't know it's used — treat as a wrong guess, turn passes
        toast.error(`${letter} già chiamata! Turno perso.`);
        // Trigger next player via the store
        if (VOWELS.includes(norm)) {
          // Vowel already used — still costs 500
          if (currentPlayer.roundScore < 500) {
            toast.error('Punteggio insufficiente per comprare una vocale! (min. 500)');
            return;
          }
          buyVowel(letter); // will find 0 new, turn stays but points lost
        } else {
          guessConsonant(letter); // will find 0 new since already revealed
        }
      }
      return;
    }

    if (VOWELS.includes(norm)) {
      if (mode === 'consonant' || mode === 'express') {
        toast.error('Devi scegliere una consonante!');
        return;
      }
      if (currentPlayer.roundScore < 500) {
        toast.error('Punteggio insufficiente per comprare una vocale! (min. 500)');
        return;
      }
      setVowelConfirm(letter);
    } else {
      if (mode === 'vowel')
        toast.error('Devi scegliere una vocale!');
      else
        guessConsonant(letter);
    }
  };

  const confirmVowel = () => {
    if (vowelConfirm) {
      buyVowel(vowelConfirm);
      setVowelConfirm(null);
    }
  };

  const showConsonants = mode === 'consonant' || mode === 'express';
  const showVowels = mode === 'vowel';

  // When hiding called letters, all buttons look available
  const getLetterClass = (letter: string, isVowel: boolean) => {
    const used = isUsed(letter);
    if (hideCalledLetters) {
      return `letter-btn letter-btn-available${isVowel ? ' letter-btn-vowel' : ''}`;
    }
    return `letter-btn ${used ? 'letter-btn-used' : `letter-btn-available${isVowel ? ' letter-btn-vowel' : ''}`}`;
  };

  const isDisabledLetter = (letter: string) => {
    if (hideCalledLetters) return false; // all clickable
    return isUsed(letter);
  };

  return (
    <div className="space-y-3">
      {(showVowels || mode === 'vowel') && (
        <div>
          <div className="text-xs uppercase tracking-widest text-accent font-display mb-1">Vocali</div>
          <div className="flex gap-1 flex-wrap">
            {VOWELS.map((v) => (
              <button
                key={v}
                onClick={() => handleLetterClick(v)}
                disabled={isDisabledLetter(v)}
                className={getLetterClass(v, true)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      )}

      {showConsonants && (
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-display mb-1">Consonanti</div>
          <div className="flex gap-1 flex-wrap">
            {CONSONANTS.map((c) => (
              <button
                key={c}
                onClick={() => handleLetterClick(c)}
                disabled={isDisabledLetter(c)}
                className={getLetterClass(c, false)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Show all letters as reference when not in active mode */}
      {!showConsonants && !showVowels && !hideCalledLetters && (
        <>
          <div>
            <div className="text-xs uppercase tracking-widest text-accent font-display mb-1">Vocali</div>
            <div className="flex gap-1 flex-wrap">
              {VOWELS.map((v) => (
                <div key={v} className={getLetterClass(v, true)}>
                  {v}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-display mb-1">Consonanti</div>
            <div className="flex gap-1 flex-wrap">
              {CONSONANTS.map((c) => (
                <div key={c} className={getLetterClass(c, false)}>
                  {c}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <AlertDialog open={vowelConfirm !== null} onOpenChange={(open) => !open && setVowelConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Comprare la vocale {vowelConfirm}?</AlertDialogTitle>
            <AlertDialogDescription>
              Costerà 500 punti dal punteggio del round. Punteggio attuale: {currentPlayer?.roundScore}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={confirmVowel}>Conferma (-500)</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LetterPanel;
