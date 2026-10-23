# Reflection

**Sanjitha Govindan / sanjithg:**

**Recitation group members (Task 2): Veronica Pak, Sara Laman, Rebecca Sucgang, Thomas Cherian**

---

### 1. Valid but weak

Pick a property you wrote that passes on the correct implementation but
kills few or no mutants. Why is it still a *valid* property? Describe a
concrete bug (not one of our mutants) that it *would* catch.

“Returns exactly five colors” is valid because the specification needs one
color per position in a guess that has five letters. It kills none of the 
public Wordle mutants because they all return five colors as long as they 
are five letters long. It would catch an implementation that accidentally 
skips black positions and returns a shorter array.

### 2. A generator problem, not a property problem

Describe a mutant, from either task, that survived or was flaky because of
your **generator** rather than your property. What did the generator fail to
produce? How did you fix it? Paste the runner output from before and after.

`singlePass` was flaky. The generator didn't always produce a misplaced copy of 
a letter in the first few letters when the secret contains that letter only once. 
I fixed it by keeping the original count invariant and adding a targeted generator 
for two distinct letters `a` and `b`, making secret `aaaba` and guess `ababa`. 
The expected result is `G B G G G`, so every generated case checks that 
greens take priority over yellows.

Before:

```
  ~ singlePass     flaky: killed in 4/5 runs  by: never credits a letter more times than the secret contains it
      Counterexample: ["AAAPA","APAPA"]
      AssertionError: expected 2 to be less than or equal to 1
```

After:

```
  ✔ all 6 test(s) pass
  ✔ singlePass     killed  by: never credits a letter more times than the secret contains it; reserves matching letters for greens before assigning yellows
      Counterexample: ["AAUAA","AUUAA"]
      AssertionError: expected 2 to be less than or equal to 1

Mutation score: 5/5 killed (100%)
```

### 3. Reading a counterexample

Paste one counterexample that the mutation runner printed for a killed
mutant. In 2–3 sentences, explain using the *specification* why that input
exposes the bug.

```
  ✔ greensOnly     killed  by: guessing common letters gives yellow letters
      Counterexample: ["AQBPF"]
      AssertionError: expected [ 'B', 'B', 'B', 'B', 'B' ] to deeply equal [ 'Y', 'Y', 'Y', 'Y', 'Y' ]
```

The property makes the guess `QBPFA` by rotating secret `AQBPF` by one letter. 
Every letter shows up only once in the secret and is placed in a different 
position in the guess word, so the specification needs five yellows, but the mutant gives five blacks.

### 4. Your project

Name one function or module in your team's project that would benefit from
property-based testing. State two properties in English, name the pattern of
each, and describe the generator you'd need, including anything about its
inputs that a naive generator would get wrong.

One function in OpenCode that would benefit from propert-based testing is the SessionsCursor module. It encodes pagination state into a URL-safe string and parses it back.

The first property-based test would be algebraic. The test encodes a valid pagination state and then parses it to return an equivalent state. This is algebraic because using parse(make(state)) = state, so they are inverses of each other. The generator for this would be valid cursor objects with session IDs, finite timestamps, valid directions, and optionally, filters. The generator should include Unicode and empty search strings. A naive generator might produce invalid IDs or paths and non-finite timestamps.

The second property-based test would be conditional such that if a string is invalid cursor data, parsing it fails with "Invalid cursor". The generator should construct invalid Base64URL strings, Base64URL wrapping malformed JSON, and encoded JSON with invalid fields. A naive generator would use naive random strings with Base64 decoding, and random mutations to produce mostly valid cursors.