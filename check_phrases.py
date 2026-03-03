#!/usr/bin/env python3
import json
import re

# Limiti di caratteri per ciascuna riga del tabellone
ROW_LIMITS = [12, 14, 14, 12]

# Funzione per suddividere la frase in "parole" tenendo conto degli apostrofi
# Le parole unite da apostrofo devono stare insieme
# Es: "l'amico" -> una sola parola
# Es: "c'era una volta" -> ["c'era", "una", "volta"]
def split_words(phrase):
    # Considera come parola tutto ciò che non è spazio, includendo apostrofi
    # ma non separa le parole unite da apostrofo
    return re.findall(r"\b\w+(?:'\w+)*\b", phrase)

# Funzione che prova a disporre le parole sulle righe
# Restituisce True se la frase può essere disposta correttamente, False altrimenti
def check_phrase(words):
    row = 0
    row_len = 0
    for word in words:
        word_len = len(word)
        # Se la parola è più lunga della riga, impossibile
        if word_len > ROW_LIMITS[row]:
            return False
        # Se la parola non ci sta nella riga corrente, passa alla riga successiva
        if row_len + (word_len if row_len == 0 else word_len + 1) > ROW_LIMITS[row]:
            row += 1
            if row >= 4:
                return False
            row_len = 0
        # Aggiungi la parola alla riga
        row_len += word_len if row_len == 0 else word_len + 1  # +1 per lo spazio
    return True

def main():
    with open('public/phrases.json', 'r', encoding='utf-8') as f:
        phrases = json.load(f)
    for item in phrases:
        phrase = item.get('phrase', '')
        id_ = item.get('id', '')
        words = split_words(phrase)
        if not check_phrase(words):
            print(f"{id_}\t{phrase}")

if __name__ == "__main__":
    main()

