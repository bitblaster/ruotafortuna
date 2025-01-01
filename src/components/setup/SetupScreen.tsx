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
import { Phrase, Player, RoundConfig, Preset } from '@/types/game';
import { Plus, Trash2, Save, Play, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const SetupScreen = () => {
  const initGame = useGameStore((s) => s.initGame);
  const startRound = useGameStore((s) => s.startRound);

  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [playerNames, setPlayerNames] = useState<string[]>(['Giocatore 1', 'Giocatore 2']);
  const [rounds, setRounds] = useState<RoundConfig[]>([{ type: 'normale', category: '' }]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetName, setPresetName] = useState('');
  const [hideCalledLetters, setHideCalledLetters] = useState(false);

  useEffect(() => {
    fetch('/phrases.json')
      .then((r) => r.json())
      .then((data: Phrase[]) => setPhrases(data))
      .catch(() => toast.error('Errore caricamento frasi'));

    const saved = localStorage.getItem('gamePresets');
    if (saved) setPresets(JSON.parse(saved));
  }, []);

  const categories = [...new Set(phrases.map((p) => p.category))];

  // Set default category for rounds without one
  useEffect(() => {
    if (categories.length > 0) {
      setRounds((prev) =>
        prev.map((r) => (r.category === '' ? { ...r, category: '__any__' } : r))
      );
    }
  }, [phrases]);

  const addPlayer = () => {
    if (playerNames.length >= 6) return toast.error('Massimo 6 giocatori!');
    setPlayerNames([...playerNames, `Giocatore ${playerNames.length + 1}`]);
  };

  const removePlayer = (idx: number) => {
    if (playerNames.length <= 1) return;
    setPlayerNames(playerNames.filter((_, i) => i !== idx));
  };

  const addRound = () => {
    setRounds([...rounds, { type: 'normale', category: '__any__' }]);
  };

  const removeRound = (idx: number) => {
    if (rounds.length <= 1) return;
    setRounds(rounds.filter((_, i) => i !== idx));
  };

  const updateRound = (idx: number, field: keyof RoundConfig, value: string) => {
    const updated = [...rounds];
    updated[idx] = { ...updated[idx], [field]: value };
    setRounds(updated);
  };

  const savePreset = () => {
    if (!presetName.trim()) return toast.error('Inserisci un nome per il preset!');
    const preset: Preset = { name: presetName, playerNames, rounds, hideCalledLetters };
    const updated = [...presets.filter((p) => p.name !== presetName), preset];
    setPresets(updated);
    localStorage.setItem('gamePresets', JSON.stringify(updated));
    toast.success('Preset salvato!');
  };

  const loadPreset = (preset: Preset) => {
    const names: string[] = [];
    for (let i = 0; i < preset.playerNames.length; i++) {
      names.push(preset.playerNames[i] || `Giocatore ${i + 1}`);
    }
    setPlayerNames(names);
    setRounds(preset.rounds);
    setHideCalledLetters(preset.hideCalledLetters ?? false);
    toast.success(`Preset "${preset.name}" caricato!`);
  };

  const deletePreset = (name: string) => {
    const updated = presets.filter((p) => p.name !== name);
    setPresets(updated);
    localStorage.setItem('gamePresets', JSON.stringify(updated));
  };

  const startGame = () => {
    if (phrases.length === 0) return toast.error('Nessuna frase disponibile!');
    if (playerNames.some((n) => !n.trim())) return toast.error('Tutti i giocatori devono avere un nome!');

    const players: Player[] = playerNames.map((name, i) => ({
      id: i + 1,
      name: name.trim(),
      roundScore: 0,
      totalScore: 0,
      hasJolly: false,
    }));

    initGame(players, rounds, phrases, hideCalledLetters);
    startRound();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
      <h1 className="game-title text-4xl sm:text-6xl mb-8">La Ruota della Fortuna</h1>

      <div className="w-full max-w-lg space-y-6">
        {/* Players */}
        <section className="rounded-xl p-4 border border-border" style={{ background: 'hsl(222 40% 12%)' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Giocatori
            </h2>
            <button onClick={addPlayer} className="text-primary hover:text-primary/80 transition-colors">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-2">
            {playerNames.map((name, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <Input
                  value={name}
                  onChange={(e) => {
                    const updated = [...playerNames];
                    updated[idx] = e.target.value;
                    setPlayerNames(updated);
                  }}
                  className="bg-secondary border-border"
                  placeholder={`Giocatore ${idx + 1}`}
                />
                {playerNames.length > 1 && (
                  <button onClick={() => removePlayer(idx)} className="text-destructive hover:text-destructive/80">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Rounds */}
        <section className="rounded-xl p-4 border border-border" style={{ background: 'hsl(222 40% 12%)' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg">Round</h2>
            <button onClick={addRound} className="text-primary hover:text-primary/80 transition-colors">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-2">
            {rounds.map((round, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <span className="text-xs font-display text-muted-foreground w-6">{idx + 1}.</span>
                <Select value={round.type} onValueChange={(v) => updateRound(idx, 'type', v)}>
                  <SelectTrigger className="w-28 bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normale">Normale</SelectItem>
                    <SelectItem value="express">Express</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={round.category} onValueChange={(v) => updateRound(idx, 'category', v)}>
                  <SelectTrigger className="flex-1 bg-secondary border-border">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__any__">Qualsiasi</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {rounds.length > 1 && (
                  <button onClick={() => removeRound(idx)} className="text-destructive hover:text-destructive/80">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Options */}
        <section className="rounded-xl p-4 border border-border" style={{ background: 'hsl(222 40% 12%)' }}>
          <h2 className="font-display text-lg mb-3">Opzioni</h2>
          <div className="flex items-center justify-between">
            <Label htmlFor="hide-letters" className="text-sm text-foreground cursor-pointer">
              Nascondi lettere già chiamate
            </Label>
            <Switch
              id="hide-letters"
              checked={hideCalledLetters}
              onCheckedChange={setHideCalledLetters}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Come nel gioco reale: i giocatori non vedono quali lettere sono state già chiamate.
          </p>
        </section>

        <section className="rounded-xl p-4 border border-border" style={{ background: 'hsl(222 40% 12%)' }}>
          <h2 className="font-display text-lg mb-3">Preset</h2>
          <div className="flex gap-2 mb-3">
            <Input
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Nome preset"
              className="bg-secondary border-border"
            />
            <button onClick={savePreset} className="gold-button text-sm px-3 py-1 flex items-center gap-1">
              <Save className="w-4 h-4" /> Salva
            </button>
          </div>
          {presets.length > 0 && (
            <div className="space-y-1">
              {presets.map((preset) => (
                <div key={preset.name} className="flex items-center justify-between p-2 rounded bg-secondary/50">
                  <button onClick={() => loadPreset(preset)} className="text-sm text-foreground hover:text-primary transition-colors">
                    {preset.name} ({preset.playerNames.length}g, {preset.rounds.length}r)
                  </button>
                  <button onClick={() => deletePreset(preset.name)} className="text-destructive/60 hover:text-destructive">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <button onClick={startGame} className="gold-button w-full text-xl flex items-center justify-center gap-3 py-4">
          <Play className="w-6 h-6" /> Inizia Partita
        </button>
      </div>
    </div>
  );
};

export default SetupScreen;
