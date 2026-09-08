/*
 * BrunnenBar — Tequila recommendation engine
 * =========================================================================
 * Pure scoring over derived agave items (see assets/agave.js). No DOM, no
 * network, which is the only reason it can be unit tested in node.
 *
 * Three tiers, the same three the cocktail app uses:
 *
 *   HARD  Allergens, a budget the guest named, and "no smoke". Never
 *         relaxed, under any circumstances. A guest who says thirteen euro
 *         is not shown a fifteen euro pour with an apology.
 *   GATE  Pour or mixed drink. Relaxed only when nothing survives, and the
 *         page then says out loud that it was relaxed.
 *   SOFT  Expression, character and strength. Scored, summed, normalised.
 *
 * Where the data is silent the engine stays silent. An item whose strength
 * the card does not record scores neutral on strength and claims nothing,
 * rather than being guessed into a number.
 * =========================================================================
 */
(function (root) {
  'use strict';

  var W = {
    expression: 34,     // the single most useful thing to get right
    kind: 26,           // tequila against mezcal, a bigger jump than any expression
    character: 30,
    strengthExact: 22,
    strengthNear: 8,
    strengthFar: -20
  };

  /* The guest handing the choice back. Not a character tag, and the engine
   * reads it as "nothing asked for" rather than trying to match it. */
  var NO_PREFERENCE = 'barkeeper';

  /* The two non-allergen values the "leave it out" question carries. Neither
   * is an allergy but both are the same guest intent, so they ride in the
   * same answer and are split back out here rather than in the interface. */
  var NO_SMOKE = 'rauch';
  var ONLY_ADDITIVE_FREE = 'zusaetze';

  var NOT_ALLERGENS = [NO_SMOKE, ONLY_ADDITIVE_FREE];

  /* How much cheaper a runner-up has to be before "cheaper" is worth saying.
   * Forty cents is not a reason to pick a different drink. */
  var PRICE_GAP = 1.5;

  function list(v) { return Array.isArray(v) ? v : (v == null || v === '' ? [] : [v]); }

  /* Deterministic 0..1 jitter, so two guests at one table are not always
   * handed the same drink, while one guest paging back and forth sees a
   * stable list. It breaks ties and never overturns a clear winner. */
  function jitter(id, seed) {
    var h = 2166136261;
    var s = String(id) + '|' + String(seed);
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return (h % 1000) / 1000;
  }

  function allergensFrom(exclude) {
    return list(exclude).filter(function (v) { return NOT_ALLERGENS.indexOf(v) === -1; });
  }

  /* HARD. An item failing any of these is never shown, at any price, at any
   * match percentage, however empty the results would otherwise be. */
  function passesHard(d, a) {
    var avoid = allergensFrom(a.exclude);
    for (var i = 0; i < avoid.length; i++) {
      if (d.allergens.indexOf(avoid[i]) !== -1) return false;
    }
    if (list(a.exclude).indexOf(NO_SMOKE) !== -1) {
      if (d.kind === 'mezcal' || d.tags.indexOf('rauchig') !== -1) return false;
    }
    if (list(a.exclude).indexOf(ONLY_ADDITIVE_FREE) !== -1) {
      /* Three states, and only one of them passes. A card that does not say
       * is not a card that says no, and claiming otherwise about additives
       * is exactly the claim this app must not make. Cocktails carry no such
       * field at all, so this answer narrows a guest to the bottles the bar
       * has actually checked, which the question says out loud. */
      if (d.additiveFree !== true) return false;
    }
    var cap = Number(a.budget);
    if (a.budget != null && a.budget !== '' && !isNaN(cap)) {
      // A price the card does not carry cannot be shown to be within budget,
      // so it is not offered against one. Silence is not a yes.
      if (d.price == null || d.price > cap) return false;
    }
    return true;
  }

  /* GATE. Pour or mixed drink, relaxed only as a last resort. */
  function passesServeGate(d, a) {
    if (!a.serve) return true;
    return a.serve === 'pur' ? d.pour : !d.pour;
  }

  /**
   * @param {Array}  items    from BBAgave.agaveItems()
   * @param {Object} answers  {serve, agave[], strength, character[], budget, exclude[]}
   * @param {Object} [opts]   {seed, limit}
   * @returns {{items:Array, relaxed:string|null, total:number}}
   */
  function recommend(items, answers, opts) {
    opts = opts || {};
    var a = answers || {};
    var seed = opts.seed == null ? 0 : opts.seed;
    var limit = opts.limit == null ? 3 : opts.limit;

    var hardPool = items.filter(function (d) { return passesHard(d, a); });

    var relaxed = null;
    var pool = hardPool.filter(function (d) { return passesServeGate(d, a); });
    if (!pool.length && hardPool.length) { pool = hardPool.slice(); relaxed = 'serve'; }

    /* The agave question carries expressions and mezcal in one list, because
     * that is one decision for a guest even though it is two fields here. */
    var wantAgave = list(a.agave).filter(function (v) { return v !== NO_PREFERENCE; });
    var wantKinds = wantAgave.filter(function (v) { return v === 'mezcal' || v === 'tequila'; });
    var wantExpr = wantAgave.filter(function (v) { return wantKinds.indexOf(v) === -1; });

    var wantChar = list(a.character).filter(function (v) { return v !== NO_PREFERENCE; });
    /* Nothing asked for on character means the guest left it to the house,
     * so let the house actually choose. Widening the jitter is what makes
     * that a real answer instead of always handing over the top seller. */
    var freeRein = wantChar.length === 0;

    var knownRanks = items.filter(function (d) { return d.rank < 9999; })
                          .map(function (d) { return d.rank; });
    var worstRank = knownRanks.length ? Math.max.apply(null, knownRanks) : 1;

    var scored = pool.map(function (d) {
      var score = 0, maxScore = 0, reasons = [], dims = 0;

      // — which agave spirit —
      if (wantKinds.length) {
        maxScore += W.kind; dims++;
        if (wantKinds.indexOf(d.kind) !== -1) {
          score += W.kind;
          reasons.push({ key: 'kind', weight: W.kind, x: d.kind });
        }
      }
      if (wantExpr.length) {
        maxScore += W.expression; dims++;
        if (d.expression && wantExpr.indexOf(d.expression) !== -1) {
          score += W.expression;
          reasons.push({ key: 'expression', weight: W.expression, x: d.expression });
        }
        /* An item whose expression the card does not name is not penalised.
         * "Margarita" says tequila and stops there, and holding that against
         * it would be holding the card's brevity against the drink. */
      }

      // — character — the share of what was asked for that this one has —
      if (wantChar.length) {
        maxScore += W.character; dims++;
        var hits = wantChar.filter(function (t) { return d.tags.indexOf(t) !== -1; });
        if (hits.length) {
          score += W.character * (hits.length / wantChar.length);
          reasons.push({
            key: 'character', weight: W.character * hits.length,
            x: hits.join(', '), from: hits.map(function (t) { return d.tagFrom[t]; })
          });
        }
      }

      // — strength — neutral, and silent, where the card records none —
      if (a.strength != null && a.strength !== '' && d.strength != null) {
        maxScore += W.strengthExact; dims++;
        var delta = Math.abs(d.strength - Number(a.strength));
        if (delta === 0) {
          score += W.strengthExact;
          reasons.push({ key: 'strength_exact', weight: W.strengthExact, x: d.strength });
        } else if (delta === 1) {
          score += W.strengthNear;
          reasons.push({ key: 'strength_near', weight: W.strengthNear, x: d.strength });
        } else {
          score += W.strengthFar;
        }
      }

      if (list(a.exclude).length) {
        reasons.push({ key: 'safe', weight: 1 });
      }
      if (a.budget != null && a.budget !== '') {
        reasons.push({ key: 'budget', weight: 0.5, x: d.price });
      }

      /* Among otherwise equal items, let a proven one edge ahead. This is
       * the only place popularity touches the ranking and it is deliberately
       * small. 9999 means the card does not know, which scores as neutral
       * rather than as unpopular. */
      if (d.rank < 9999) score += 3 * (1 - (d.rank - 1) / Math.max(1, worstRank));

      score += jitter(d.id, seed) * (freeRein ? 14 : 2);

      var pct = maxScore > 0 ? Math.round((100 * score) / maxScore) : 50;
      reasons.sort(function (x, y) { return y.weight - x.weight; });

      return {
        drink: d, score: score,
        match: Math.max(35, Math.min(99, pct)),
        /* How many scored dimensions the guest actually asked about. A guest
         * who named one thing and got everything that matches it is not
         * looking at a 99 per cent match, they are looking at a card with one
         * question answered, and the interface hides the number rather than
         * printing the same 99 three times. */
        dimensions: dims,
        reasons: reasons.slice(0, 3)
      };
    });

    scored.sort(function (x, y) { return y.score - x.score; });
    var out = scored.slice(0, limit);

    var ingFreq = {};
    items.forEach(function (d) {
      d.ing.forEach(function (i) { ingFreq[i] = (ingFreq[i] || 0) + 1; });
    });
    var used = {};
    out.forEach(function (row, i) {
      row.contrast = i === 0 ? null : contrastOf(out[0].drink, row.drink, ingFreq, used);
      if (row.contrast) used[labelKey(row.contrast)] = true;
    });

    return { items: out, relaxed: relaxed, total: scored.length };
  }

  /* Why take THIS one instead of the favourite.
   *
   * "Passt ebenfalls" tells a guest nothing, so every runner up is labelled
   * by the single thing that separates it from the top pick. Most telling
   * first, and every branch is a claim a test can check against the pair,
   * which test/engine.test.js does for every pair on the card.
   *
   * `used` carries the labels the runner ups above this one already took. Two
   * cards both saying "Was ohne Rauch" is barely better than two both saying
   * "Passt ebenfalls", so a claim that is already on screen is skipped and
   * the next true one is used instead.
   *
   * Returns null when genuinely nothing separates them. The page then says
   * they both fit rather than inventing a difference.
   */
  function contrastOf(hero, alt, ingFreq, used) {
    if (!hero || !alt) return null;
    var options = [];

    // 1. a different agave spirit. Smoke is the biggest jump on the card.
    if (alt.kind !== hero.kind) {
      if (alt.kind === 'mezcal') options.push({ kind: 'smoky' });
      else if (hero.kind === 'mezcal') options.push({ kind: 'unsmoked' });
    }

    // 2. a different expression, where both are actually named
    if (alt.expression && hero.expression && alt.expression !== hero.expression) {
      options.push({ kind: 'expression', value: alt.expression });
    }

    // 3. a different place the agave grew, where the card names both.
    //    Highland against lowland is the first difference a guest tastes.
    if (alt.region && hero.region && alt.region.text !== hero.region.text) {
      options.push({ kind: 'region', value: alt.region.key || alt.region.text });
    }

    // 4. a pour against something built, or the other way round
    if (alt.pour !== hero.pour) options.push({ kind: alt.pour ? 'neat' : 'mixed' });

    // 5. noticeably stronger or lighter, where both are recorded
    if (alt.strength != null && hero.strength != null) {
      if (alt.strength - hero.strength >= 1) options.push({ kind: 'stronger' });
      else if (hero.strength - alt.strength >= 1) options.push({ kind: 'lighter' });
    }

    // 6. an ingredient the favourite does not have, rarest across the card
    //    first, since that carries the most character
    var unique = alt.ing.filter(function (i) {
      return hero.ing.indexOf(i) === -1 && !isGeneric(i);
    });
    unique.sort(function (x, y) {
      return ((ingFreq && ingFreq[x]) || 0) - ((ingFreq && ingFreq[y]) || 0) || (x < y ? -1 : 1);
    });
    unique.forEach(function (i) { options.push({ kind: 'ingredient', value: i }); });

    // 7. money, but only when it is enough to matter
    if (alt.price != null && hero.price != null && hero.price - alt.price >= PRICE_GAP) {
      options.push({ kind: 'cheaper' });
    }

    // 8. a character the favourite does not have
    alt.tags.filter(function (t) { return hero.tags.indexOf(t) === -1; })
      .forEach(function (t) { options.push({ kind: 'character', value: t }); });

    for (var i = 0; i < options.length; i++) {
      if (!taken(used, options[i])) return options[i];
    }
    return null;
  }

  function labelKey(c) { return c.kind + '|' + (c.value == null ? '' : c.value); }

  function taken(used, c) {
    return !!(used && used[labelKey(c)]);
  }

  function isGeneric(ing) {
    var A = root.BBAgave;
    if (!A) return false;
    if (A.isAgaveWord(ing)) return true;
    var n = A.norm(ing);
    return A.GENERIC_ING.indexOf(n) !== -1;
  }

  var api = {
    recommend: recommend, contrastOf: contrastOf, labelKey: labelKey,
    passesHard: passesHard, passesServeGate: passesServeGate,
    NO_PREFERENCE: NO_PREFERENCE, NO_SMOKE: NO_SMOKE,
    ONLY_ADDITIVE_FREE: ONLY_ADDITIVE_FREE, NOT_ALLERGENS: NOT_ALLERGENS,
    PRICE_GAP: PRICE_GAP,
    WEIGHTS: W
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.BBTequilaEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
