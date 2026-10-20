import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { mergeIntervals, type Interval } from '../src/intervals';

// Small endpoints make shared endpoints, nesting, and duplicates common.
const endpoint = fc.integer({ min: -20, max: 20 });
const interval: fc.Arbitrary<Interval> = fc
  .tuple(endpoint, endpoint)
  .map(([a, b]): Interval => [Math.min(a, b), Math.max(a, b)]);
const intervalList = fc.array(interval, { maxLength: 20 });
const copy = (xs: Interval[]): Interval[] => xs.map(([s, e]) => [s, e]);
const covers = (xs: Interval[], point: number): boolean =>
  xs.some(([s, e]) => s <= point && point <= e);

// Positive gaps guarantee disjointness, including gaps of one unit.
const disjointList = fc.tuple(
  endpoint,
  fc.array(fc.tuple(fc.nat(5), fc.integer({ min: 1, max: 5 })), { maxLength: 15 }),
).map(([start, pieces]): Interval[] => {
  let next = start;
  return pieces.map(([width, gap]): Interval => {
    const result: Interval = [next, next + width];
    next += width + gap;
    return result;
  });
});

const touchingPair = fc.tuple(endpoint, fc.integer({ min: 1, max: 10 }),
  fc.integer({ min: 1, max: 10 })).map(([start, left, right]): Interval[] =>
  [[start, start + left], [start + left, start + left + right]]);

describe('mergeIntervals', () => {
  // Pattern: invariant. Output intervals are valid, sorted, and neither overlap nor touch.
  it('returns valid sorted intervals with strict gaps', () => {
    fc.assert(fc.property(intervalList, xs => {
      const out = mergeIntervals(xs);
      out.forEach(([s, e], i) => {
        expect(Number.isInteger(s) && Number.isInteger(e));
        expect(s).toBeLessThanOrEqual(e);
        if (i > 0) expect(out[i - 1][1]).toBeLessThan(s);
      });
    }));
  });

  // Pattern: invariant. Touching intervals form one interval spanning both inputs.
  it('merges intervals sharing an endpoint', () => {
    fc.assert(fc.property(touchingPair, xs => {
      expect(mergeIntervals(xs)).toEqual([[xs[0][0], xs[1][1]]]);
    }));
  });

  // Pattern: invariant. Merging does not modify the input array or its intervals.
  it('preserves the input, including when an interval is extended', () => {
    fc.assert(fc.property(fc.oneof(intervalList, touchingPair), xs => {
      const before = copy(xs);
      mergeIntervals(xs);
      expect(xs).toEqual(before);
    }));
  });

  // Pattern: differential. A point-coverage oracle agrees on input and output.
  it('preserves coverage at endpoints and between endpoints', () => {
    fc.assert(fc.property(intervalList, xs => {
      const before = copy(xs);
      const out = mergeIntervals(xs);
      // All input endpoints are integers in [-20, 20]. Half steps inspect
      // every possible gap as well as endpoints; the outer points detect expansion.
      for (let twicePoint = -42; twicePoint <= 42; twicePoint++) {
        const point = twicePoint / 2;
        expect(covers(out, point)).toBe(covers(before, point));
      }
      // Also inspect output boundaries in case a defect creates distant coverage.
      for (const [s, e] of out) {
        expect(covers(before, s)).toBe(true);
        expect(covers(before, e)).toBe(true);
      }
    }));
  });

  // Pattern: metamorphic. Permuting intervals and adding duplicates preserves the result.
  it('ignores input order and duplicate intervals', () => {
    const permutedList = intervalList.chain(xs =>
      fc.shuffledSubarray(xs, { minLength: xs.length, maxLength: xs.length })
        .map(shuffled => ({ xs, shuffled })));
    fc.assert(fc.property(permutedList, ({ xs, shuffled }) => {
      const expected = mergeIntervals(copy(xs));
      expect(mergeIntervals(copy(shuffled))).toEqual(expected);
      expect(mergeIntervals([...copy(shuffled), ...copy(xs)])).toEqual(expected);
    }));
  });

  // Pattern: algebraic. Merging twice is the same as merging once (idempotence).
  it('is idempotent', () => {
    fc.assert(fc.property(intervalList, xs => {
      const once = mergeIntervals(xs);
      expect(mergeIntervals(copy(once))).toEqual(once);
    }));
  });

  // Pattern: conditional. Already-disjoint inputs are returned in sorted order unchanged.
  it('preserves already-disjoint intervals even when supplied in reverse order', () => {
    fc.assert(fc.property(disjointList, sorted => {
      const expected = copy(sorted);
      expect(mergeIntervals(copy(sorted))).toEqual(expected);
      expect(mergeIntervals(copy(sorted).reverse())).toEqual(expected);
    }));
  });
});
