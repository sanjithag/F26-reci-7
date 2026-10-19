import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { mergeIntervals, type Interval } from '../src/intervals';

// Recitation Part 2 (groups) and problem set Task 2.
// Read the spec in src/intervals/mergeIntervals.ts, then check your progress
// with `npm run mutants:intervals`.
//
// Label every property with its pattern, on the line above its `it(`:
//   // Pattern: invariant. The output is sorted.
// (invariant, algebraic, metamorphic, differential, or conditional)

// A first attempt at a generator. It has a problem: run the tests and read
// the counterexample.
const interval: fc.Arbitrary<Interval> = fc
  .tuple(fc.integer(), fc.integer())
  .map(([start, end]) => (start <= end ? [start, end] : [end, start]));
const intervalList = fc.array(interval);

describe('mergeIntervals', () => {
  // Pattern: invariant. Every input interval lies inside some output interval.
  it('every input interval lies inside some output interval', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const out = mergeIntervals(xs);
        const uncovered = xs.filter(([s, e]) => !out.some(([a, b]) => a <= s && e <= b));
        expect(uncovered).toEqual([]);
      }),
    );
  });

  // Add your properties here. Aim for at least one of each pattern:
  // invariant, algebraic, metamorphic, differential, conditional.

  //   The result is sorted by start, and consecutive intervals neither
  //  *     overlap nor touch: result[i][1] < result[i + 1][0].
  //  *     [1, 3] and [3, 5] touch at 3, so they merge into [1, 5].
  //  *     [1, 2] and [3, 4] leave a gap (2 < x < 3), so they stay separate.
  it('intervals are sorted, do not overlap or touch, and merge if touching', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const out = mergeIntervals(xs);
        for (let i = 0; i < out.length - 1; i++) {
          expect(out[i][0]).toBeLessThan(out[i + 1][0]);
          expect(out[i][1]).toBeLessThan(out[i + 1][0]);
        }

        xs.forEach(([start, end]) => {
          expect(out.some(([a, b]) => a <= start && end <= b)).toBe(true);
        });
      })
    );
  });
});
