import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { matchGuess } from '../src/wordle';

// Recitation Part 1: follow along with your TA, filling in the todos below.
// Problem set Task 1: keep adding properties until `npm run mutants:wordle`
// kills every mutant. Read the spec in src/wordle/matchGuess.ts.
//
// Label every property with its pattern, on the line above its `it(`:
//   // Pattern: invariant. The result always has exactly five colors.
// (invariant, algebraic, metamorphic, differential, or conditional)

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Step 1: a generator for five-letter uppercase words.
// const word = ...

const wordFrom = (letters: string) =>
  fc.array(fc.constantFrom(...letters), { minLength: 5, maxLength: 5 }).map(cs => cs.join(''));
const word = wordFrom(ALPHABET);

const uniqueWord = fc
  .uniqueArray(fc.constantFrom(...ALPHABET), {
    minLength: 5,
    maxLength: 5,
  })
  .map(letters => letters.join(''));

// pattern: invariant. the result always has exactly five colors.
it('returns exactly five colors', () => {
  fc.assert(
    fc.property(word, word, (secret, guess) => {
      expect(matchGuess(secret, guess)).toHaveLength(5);
    }),
  );
});

// pattern: invariant. the result always only has green, yellow, or black.
it('only uses the colors G, Y, B', () => {
  fc.assert(
    fc.property(word, word, (secret, guess) => {
      for (const c of matchGuess(secret, guess)) expect (['G', 'Y', 'B']).toContain(c);
    }),
  );
});

// pattern: conditional. if the guess is secret, every color is green.
it('guessing the secret gives all greens', () => {
  fc.assert(
    fc.property(word, w => {
      expect(matchGuess(w, w)).toEqual(['G', 'G', 'G', 'G', 'G']);
    }),
  );
});

// pattern: invariant. no letter is credited (G or Y) more times than the secret contains it.
it('never credits a letter more times than the secret contains it', () => {
  fc.assert(
    fc.property(word, word, (secret, guess) => {
      const result = matchGuess(secret, guess);
      for (const letter of new Set(guess)) {
        const credited = [...guess].filter((c, i) => c === letter && result[i] !== 'B').length;
        const inSecret = [...secret].filter(c => c === letter).length;
        expect(credited).toBeLessThanOrEqual(inSecret);
      }
    }),
  );
});

// Pattern: conditional. Rotating five distinct letters gives all yellows.
it('guessing common letters gives yellow letters', () => {
  
  fc.assert(
    fc.property(uniqueWord, secret => {
      const guess = secret.slice(1) + secret[0];

      expect(matchGuess(secret, guess)).toEqual(['Y', 'Y', 'Y', 'Y', 'Y']);
    }),
  );
});

// Pattern: invariant. An earlier misplaced copy cannot consume a later green's letter.
it('reserves matching letters for greens before assigning yellows', () => {
  const uniqueWord = fc.uniqueArray(fc.constantFrom(...ALPHABET), {
    minLength: 2,
    maxLength: 2,
  }).map(letters => letters.join(''));

  fc.assert(
    fc.property(uniqueWord, ([a, b]) => {
      
      const secret = a + a + a + b + a;
      const guess  = a + b + a + b + a;

      expect(matchGuess(secret, guess)).toEqual([
        'G', 'B', 'G', 'G', 'G',
      ]);
    }),
  );
});

describe('matchGuess', () => {
  it.todo('returns exactly five colors');
  it.todo('only uses the colors G, Y, B');
  it.todo('guessing the secret gives all greens');
  it.todo('never credits a letter more times than the secret contains it');
  it.todo('guessing common letters gives yellow letters');
});
