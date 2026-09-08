/*
 * BrunnenBar — Whisky recommendation engine
 * =========================================================================
 * Pure scoring against the live Menu API payload. No DOM, no interface code,
 * so it can be unit tested in node (see test/whiskey-engine.test.js).
 *
 * Three tiers of rule, the same shape the cocktail app uses:
 *   HARD  Budget, an outright no to smoke, and anything the guest ruled out.
 *         Never relaxed. Ever.
 *   GATE  Region, and protecting a first whisky from the heavy end of the
 *         shelf. Relaxed only if nothing survives, and the page then says so.
 *   SOFT  Everything else, scored and summed.
 *
 * What counts as a bottle this app may recommend is decided by the data and
 * never by a section name. A whisky carries peat, origin or tasting notes, a
 * beer and a cocktail do not. That is not a stylistic preference. Jack
 * Daniel's is profiled in the Spirituosen section rather than in Whisk(e)y,
 * and six more bottles sit behind `hidden_on_card` so the printed card can
 * stay short, so anything that filtered on the section title would quietly
 * lose almost half the shelf.
 * =========================================================================
 */
(function (root) {
  'use strict';

  /* The profile, flat on the item the way the card carries it, next to
   * `brand` and alongside the agave fields.
   *
   * Each entry is the list of names the card might use for one thing, first
   * match wins. Two of them genuinely carry two names.
   *
   * The region arrived as `origin` and was later normalised into `region`,
   * and a payload may carry either or both. The tasting notes are
   * `flavour_tags`, the same name the cocktail export uses, and were `notes`
   * in the first draft. Accepting both spellings costs one array each and
   * means neither a republish nor a rename can empty the shelf. */
  var FIELDS = {
    peat: ['peat'],
    origin: ['region', 'origin'],
    notes: ['flavour_tags', 'notes'],
    cask: ['cask'],
    level: ['whisky_level'],
    serve: ['whisky_serve', 'serve_style'],
    kind: ['whisky_kind'],
    expression: ['whisky_expression'],
    age_years: ['whisky_age_years', 'age_years'],
    abv: ['abv'],
    brand: ['brand']
  };

  /* Carrying any one of these is what makes a row a whisky. */
  var PROFILE_FIELDS = ['peat', 'origin', 'notes'];

  /* A tasting tag that duplicates an axis the app already scores on its own.
   * Smoke has the whole peat scale behind it, so counting it a second time as
   * a flavour would let every peated malt win twice for one property. */
  var DOUBLE_COUNTED = ['rauchig', 'smoky'];

  var W = {
    peatExact: 26,
    peatNear: 10,
    peatOff2: -16,
    peatFar: -34,
    notes: 34,
    origin: 20,
    cask: 16,
    serve: 14,
    level: 18,
    popularity: 3
  };

  /* The guest handing the choice back to us. Not a tasting note. */
  var NO_PREFERENCE = 'barkeeper';

  /* The shelf read as a ladder, so an answer one rung away still counts for
   * something and an answer three rungs away does not. */
  var LEVELS = ['einstieg', 'klassiker', 'kenner', 'rarität'];

  /* Where a first whisky is allowed to come from. A beginner handed a cask
   * strength Islay does not come back, so this is a gate rather than a
   * score. It is relaxed only when the alternative is showing nothing. */
  var BEGINNER_OK = ['einstieg', 'klassiker'];

  /* Peat at or above this is smoke a guest will notice across the room. A
   * guest who said no smoke never sees one of these. */
  var SMOKE_VISIBLE = 2;

  /* How far apart two ages have to be before it is worth telling a guest
   * that one bottle is older, and how far apart two prices have to be
   * before "cheaper" is an honest word for it. */
  var AGE_GAP = 3;
  var PRICE_GAP = 1.25;

  function asArray(v) { return Array.isArray(v) ? v : (v == null || v === '' ? [] : [v]); }

  function num(v) { return typeof v === 'number' && isFinite(v) ? v : null; }

  // ------------------------------------------------------------- the data --

  function has(v) {
    if (v == null || v === '') return false;
    return Array.isArray(v) ? v.length > 0 : true;
  }

  /* The first spelling of `key` that this row actually carries. */
  function raw(item, key, suffix) {
    var names = FIELDS[key] || [key];
    for (var i = 0; i < names.length; i++) {
      var v = item[names[i] + (suffix || '')];
      if (has(v)) return v;
    }
    return undefined;
  }

  /* One view over the flat fields, so the rest of the file reads a profile
   * and does not care how the card spells it. Returns null for anything that
   * is not a whisky, which is what keeps beer, wine and cocktails out. */
  function profileOf(item) {
    if (!item) return null;
    var carries = false;
    for (var i = 0; i < PROFILE_FIELDS.length; i++) {
      if (raw(item, PROFILE_FIELDS[i]) !== undefined) { carries = true; break; }
    }
    if (!carries) return null;

    var p = {};
    Object.keys(FIELDS).forEach(function (key) {
      p[key] = raw(item, key);
      var en = raw(item, key, '_en');
      if (en !== undefined) p[key + '_en'] = en;
    });

    // Smoke is scored on its own scale, so it never counts twice as a note.
    if (Array.isArray(p.notes)) p.notes = p.notes.filter(notDoubleCounted);
    if (Array.isArray(p.notes_en)) p.notes_en = p.notes_en.filter(notDoubleCounted);
    return p;
  }

  function notDoubleCounted(tag) {
    return DOUBLE_COUNTED.indexOf(String(tag).toLowerCase()) === -1;
  }

  function isWhisky(item) { return !!profileOf(item); }

  function bottles(items) { return (items || []).filter(isWhisky); }

  /* The cheapest pour on the row. A guest who set a ceiling can always order
   * the small glass, so that is the price the ceiling is measured against.
   * Read from `prices` only, never from a number written into the app. */
  function priceOf(item) {
    var rows = (item && item.prices) || [];
    var low = null;
    for (var i = 0; i < rows.length; i++) {
      var p = num(rows[i] && rows[i].price);
      if (p != null && (low == null || p < low)) low = p;
    }
    if (low == null) low = num(item && item.price);
    return low;
  }

  function peatOf(item) {
    var p = profileOf(item);
    return p ? num(p.peat) : null;
  }

  function ageOf(item) {
    var p = profileOf(item);
    return p ? num(p.age_years) : null;
  }

  /* Distinct values a field actually carries across the shelf. A question
   * whose field has fewer than two of them cannot tell two bottles apart, so
   * the app drops it rather than asking something it cannot use. This is
   * what lets the app grow as the Menu API grows, without a release. */
  function coverage(pool) {
    var fields = ['peat', 'origin', 'cask', 'notes', 'serve', 'level'];
    var seen = {};
    fields.forEach(function (f) { seen[f] = {}; });
    var prices = {};

    (pool || []).forEach(function (item) {
      var p = profileOf(item) || {};
      fields.forEach(function (f) {
        var v = p[f];
        if (Array.isArray(v)) {
          v.forEach(function (one) { if (one !== '' && one != null) seen[f][String(one)] = true; });
        } else if (v !== '' && v != null) {
          seen[f][String(v)] = true;
        }
      });
      var price = priceOf(item);
      if (price != null) prices[String(price)] = true;
    });

    var out = {};
    fields.forEach(function (f) { out[f] = Object.keys(seen[f]).length; });
    out.price = Object.keys(prices).length;
    return out;
  }

  function answerable(pool, question) {
    if (!question || !question.needs) return true;
    var cov = coverage(pool);
    return (cov[question.needs] || 0) >= 2;
  }

  /* The distinct values a field carries, in the order the card lists them,
   * because the order of the card is the display order and this app does not
   * resort it either. */
  function valuesOf(pool, field) {
    var seen = {}, out = [];
    (pool || []).forEach(function (item) {
      var v = (profileOf(item) || {})[field];
      (Array.isArray(v) ? v : [v]).forEach(function (one) {
        if (one === '' || one == null) return;
        if (!seen[one]) { seen[one] = true; out.push(one); }
      });
    });
    return out;
  }

  /* The question flow the shelf can actually answer.
   *
   * Two cuts. A question whose field carries fewer than two values is
   * dropped, and an answer nothing on the shelf carries is dropped with it.
   * Offering Campbeltown when there is no Campbeltown behind the bar sends a
   * guest down a corridor that ends in an apology, and an apology we could
   * have avoided by not asking.
   *
   * The intensity scale is exempt on purpose. It asks how much smoke someone
   * wants, not which bottles exist, and "no smoke at all" has to stay
   * sayable even on a shelf where nothing is unpeated.
   *
   * The price question comes back with the bands attached, since only the
   * page knows how to write a price in the guest's language. */
  function tailor(pool, questions) {
    var bands = priceBands(pool);
    var cov = coverage(pool);

    return (questions || []).map(function (q) {
      if (q.needs === 'price') return bands.length >= 2 ? { q: q, bands: bands } : null;
      if ((cov[q.needs] || 0) < 2) return null;
      if (q.type === 'scale') return { q: q };

      /* Options come from the card, not from a list in this repository.
       *
       * The written options are a table of labels and hints for the values we
       * expected, nothing more. Whatever the card actually carries is what
       * gets offered, so a region spelled Highland rather than Highlands, or
       * a Kentucky nobody wrote down here, still reaches a guest with its own
       * name on the button instead of vanishing. Known values keep the order
       * they were written in, because their hints were written to read that
       * way, and anything new follows in card order. */
      var live = valuesOf(pool, q.needs);
      var known = {}, exclusive = [];
      (q.options || []).forEach(function (o) {
        if (o.exclusive) exclusive.push(o); else known[o.value] = o;
      });

      var options = (q.options || []).filter(function (o) {
        return !o.exclusive && live.indexOf(o.value) !== -1;
      });
      live.forEach(function (v) {
        if (!known[v]) options.push({ value: v, label: { de: v, en: v } });
      });
      if (options.length < 2) return null;
      return { q: q, options: options.concat(exclusive) };
    }).filter(Boolean);
  }

  /* Three price bands cut at the thirds of what is actually on the shelf.
   * Every ceiling is a real price from the card, so the label a guest reads
   * is a number they will also see on a bottle. Returns the two ceilings and
   * an open top band, or fewer when the shelf does not spread that far. */
  function priceBands(pool) {
    var prices = (pool || []).map(priceOf).filter(function (p) { return p != null; })
      .sort(function (a, b) { return a - b; });
    if (prices.length < 3) return [];
    var lower = prices[Math.floor(prices.length / 3)];
    var upper = prices[Math.floor((2 * prices.length) / 3)];
    var bands = [{ value: '1', max: lower }];
    if (upper > lower) bands.push({ value: '2', max: upper });
    if (prices[prices.length - 1] > upper) bands.push({ value: '3', max: null });
    return bands.length >= 2 ? bands : [];
  }

  function ceilingFor(pool, answer) {
    if (!answer) return null;
    var bands = priceBands(pool);
    for (var i = 0; i < bands.length; i++) {
      if (bands[i].value === answer) return bands[i].max;
    }
    return null;
  }

  // -------------------------------------------------------------- the rules --

  /* HARD. A bottle failing any of these is never shown, at any cost.
   *
   * Both unknowns below take the cautious reading on purpose. A guest who
   * said no smoke and is handed a bottle whose smoke nobody recorded has a
   * ruined pour in front of them, and a guest who set a ceiling and is handed
   * a bottle with no price has a surprise on the bill. Missing data is not a
   * reason to gamble with either. */
  function passesHard(item, a, ceiling) {
    var p = profileOf(item);
    if (!p) return false;

    var ruledOut = asArray(a.allergens);
    for (var i = 0; i < ruledOut.length; i++) {
      if ((item.allergens || []).indexOf(ruledOut[i]) !== -1) return false;
    }

    if (a.peat === '0') {
      var peat = num(p.peat);
      if (peat == null || peat >= SMOKE_VISIBLE) return false;
    }

    if (ceiling != null) {
      var price = priceOf(item);
      if (price == null || price > ceiling) return false;
    }

    return true;
  }

  function passesOriginGate(item, a) {
    var want = asArray(a.origin);
    if (!want.length) return true;
    var p = profileOf(item) || {};
    return want.indexOf(p.origin) !== -1;
  }

  function passesBeginnerGate(item, a) {
    if (a.level !== 'einstieg') return true;
    var p = profileOf(item) || {};
    return BEGINNER_OK.indexOf(p.level) !== -1;
  }

  // ------------------------------------------------------------- contrast --

  /* Why take this one INSTEAD of the top pick. A runner up is only useful if
   * it says how it differs, so each is labelled by its single most
   * perceptible difference, most perceptible first:
   *   1. more or less smoke, which is what a guest notices first
   *   2. a different corner of the world
   *   3. a cask the top pick did not see
   *   4. noticeably older or younger
   *   5. noticeably cheaper or dearer
   *   6. a tasting note the top pick does not have
   * Returns null when nothing separates them, and the page then says they
   * both fit rather than inventing a difference. */
  function contrastOf(hero, alt) {
    if (!hero || !alt) return null;
    var h = profileOf(hero) || {};
    var b = profileOf(alt) || {};

    var hPeat = num(h.peat), bPeat = num(b.peat);
    if (hPeat != null && bPeat != null) {
      if (bPeat - hPeat >= 1) return { kind: 'smokier' };
      if (hPeat - bPeat >= 1) return { kind: 'gentler' };
    }

    if (b.origin && h.origin && b.origin !== h.origin) {
      return { kind: 'origin', value: b.origin };
    }

    var hCask = asArray(h.cask);
    var newCask = asArray(b.cask).filter(function (c) { return hCask.indexOf(c) === -1; });
    if (newCask.length) return { kind: 'cask', value: newCask[0] };

    var hAge = num(h.age_years), bAge = num(b.age_years);
    if (hAge != null && bAge != null) {
      if (bAge - hAge >= AGE_GAP) return { kind: 'older' };
      if (hAge - bAge >= AGE_GAP) return { kind: 'younger' };
    }

    var hPrice = priceOf(hero), bPrice = priceOf(alt);
    if (hPrice != null && bPrice != null && hPrice > 0 && bPrice > 0) {
      if (bPrice / hPrice >= PRICE_GAP) return { kind: 'dearer' };
      if (hPrice / bPrice >= PRICE_GAP) return { kind: 'cheaper' };
    }

    var hNotes = asArray(h.notes);
    var newNotes = asArray(b.notes).filter(function (n) { return hNotes.indexOf(n) === -1; });
    if (newNotes.length) return { kind: 'note', value: newNotes[0] };

    return null;
  }

  /* Deterministic 0..1 jitter. Keeps ties from always resolving the same way,
   * so two guests at one table get different bottles, while a single guest
   * paging back and forth sees a stable list. */
  function jitter(key, seed) {
    var h = 2166136261;
    var s = String(key) + '|' + String(seed);
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return (h % 1000) / 1000;
  }

  function keyOf(item) {
    return (item.pos_sku || '') + '|' + (item.name || '');
  }

  // ------------------------------------------------------------ the ranking --

  /**
   * @param {Array}  pool     bottles, ie. rows carrying a `whisky` profile
   * @param {Object} answers  {level, peat, notes[], origin[], cask[], serve,
   *                           budget, allergens[]}
   * @param {Object} [opts]   {seed, limit}
   * @returns {{items:Array, relaxed:string|null, total:number}}
   */
  function recommend(pool, answers, opts) {
    opts = opts || {};
    var a = answers || {};
    var seed = opts.seed == null ? 0 : opts.seed;
    var limit = opts.limit == null ? 3 : opts.limit;
    var shelf = bottles(pool);

    var ceiling = ceilingFor(shelf, a.budget);
    var hardPool = shelf.filter(function (d) { return passesHard(d, a, ceiling); });

    // Loosen the gates only as far as we must to have something to say, and
    // give back which one gave way so the page can admit it.
    var relaxed = null;
    var ranked = hardPool.filter(function (d) {
      return passesOriginGate(d, a) && passesBeginnerGate(d, a);
    });
    if (!ranked.length) {
      ranked = hardPool.filter(function (d) { return passesBeginnerGate(d, a); });
      if (ranked.length) relaxed = 'origin';
    }
    if (!ranked.length) {
      ranked = hardPool.slice();
      if (ranked.length) relaxed = 'level';
    }

    var wantNotes = asArray(a.notes).filter(function (n) { return n !== NO_PREFERENCE; });
    var wantCask = asArray(a.cask);
    var wantOrigin = asArray(a.origin);
    /* No note asked for means the guest left it to the bar, so let the house
     * actually choose. The jitter widens and two people at one table get
     * different bottles instead of both being handed the same one. */
    var freeRein = wantNotes.length === 0;

    var scored = ranked.map(function (item) {
      var p = profileOf(item) || {};
      var score = 0, maxScore = 0, reasons = [];

      // — smoke, the axis people actually argue about —
      if (a.peat != null && a.peat !== '') {
        var peat = num(p.peat);
        maxScore += W.peatExact;
        if (peat != null) {
          var delta = Math.abs(peat - Number(a.peat));
          if (delta === 0) {
            score += W.peatExact;
            reasons.push({ key: peat === 0 ? 'peat_none' : 'peat_exact', weight: W.peatExact });
          } else if (delta === 1) {
            score += W.peatNear;
            reasons.push({ key: 'peat_near', weight: W.peatNear });
          } else if (delta === 2) {
            score += W.peatOff2;
          } else {
            score += W.peatFar;
          }
        }
      }

      // — tasting notes, share of what the guest asked for that this has —
      if (wantNotes.length) {
        maxScore += W.notes;
        var have = asArray(p.notes);
        var hits = wantNotes.filter(function (n) { return have.indexOf(n) !== -1; });
        if (hits.length) {
          score += W.notes * (hits.length / wantNotes.length);
          reasons.push({ key: 'notes', weight: W.notes * hits.length, x: hits.join(', ') });
        }
      }

      // — where it is from — a gate as well, so this mostly writes the reason
      if (wantOrigin.length) {
        maxScore += W.origin;
        if (wantOrigin.indexOf(p.origin) !== -1) {
          score += W.origin;
          reasons.push({ key: 'origin', weight: W.origin, x: p.origin });
        }
      }

      // — the cask, which does more than the age statement —
      if (wantCask.length) {
        maxScore += W.cask;
        var casks = asArray(p.cask);
        var caskHits = wantCask.filter(function (c) { return casks.indexOf(c) !== -1; });
        if (caskHits.length) {
          score += W.cask * (caskHits.length / wantCask.length);
          reasons.push({ key: 'cask', weight: W.cask * caskHits.length, x: caskHits[0] });
        }
      }

      // — how they drink it —
      if (a.serve) {
        maxScore += W.serve;
        if (asArray(p.serve).indexOf(a.serve) !== -1) {
          score += W.serve;
          reasons.push({ key: 'serve', weight: W.serve });
        }
      }

      // — what the glass is for tonight, one rung away still counts —
      if (a.level) {
        maxScore += W.level;
        var want = LEVELS.indexOf(a.level);
        var has = LEVELS.indexOf(p.level);
        if (want !== -1 && has !== -1) {
          var rungs = Math.abs(want - has);
          if (rungs === 0) {
            score += W.level;
            reasons.push({ key: 'level', weight: W.level });
          } else if (rungs === 1) {
            score += W.level / 2;
            reasons.push({ key: 'level', weight: W.level / 2 });
          }
        }
      }

      /* Among otherwise equal bottles, let the one people actually order edge
       * ahead. This is the only place the till touches the ranking, and it is
       * deliberately small. It breaks ties, it does not decide matches. */
      var rank = num(item.popularity_rank);
      if (rank != null && rank < 9999) {
        score += W.popularity * (1 - Math.min(rank, 200) / 200);
      }

      if (ceiling != null) reasons.push({ key: 'budget', weight: 1 });

      score += jitter(keyOf(item), seed) * (freeRein ? 14 : 2);

      var pct = maxScore > 0 ? Math.round((100 * score) / maxScore) : 50;
      reasons.sort(function (x, y) { return y.weight - x.weight; });

      return {
        bottle: item,
        score: score,
        match: Math.max(35, Math.min(99, pct)),
        reasons: reasons.slice(0, 3)
      };
    });

    scored.sort(function (x, y) { return y.score - x.score; });
    var items = scored.slice(0, limit);
    items.forEach(function (item, i) {
      item.contrast = i === 0 ? null : contrastOf(items[0].bottle, item.bottle);
    });

    /* The other half of the smoke rule. Smoke nobody wants is thrown out by
     * a hard rule, and smoke somebody wanted and we cannot supply is said out
     * loud instead of quietly handed over as if it were what they asked for. */
    var smokeGap = false;
    if (a.peat != null && a.peat !== '' && items.length) {
      var top = num((profileOf(items[0].bottle) || {}).peat);
      smokeGap = top != null && Math.abs(top - Number(a.peat)) >= 2;
    }

    return { items: items, relaxed: relaxed, smokeGap: smokeGap, total: scored.length };
  }

  var api = {
    PROFILE_FIELDS: PROFILE_FIELDS,
    FIELDS: FIELDS,
    DOUBLE_COUNTED: DOUBLE_COUNTED,
    NO_PREFERENCE: NO_PREFERENCE,
    LEVELS: LEVELS,
    SMOKE_VISIBLE: SMOKE_VISIBLE,
    WEIGHTS: W,
    profileOf: profileOf,
    isWhisky: isWhisky,
    bottles: bottles,
    priceOf: priceOf,
    peatOf: peatOf,
    ageOf: ageOf,
    coverage: coverage,
    answerable: answerable,
    valuesOf: valuesOf,
    tailor: tailor,
    priceBands: priceBands,
    ceilingFor: ceilingFor,
    passesHard: passesHard,
    contrastOf: contrastOf,
    recommend: recommend
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.BBWhiskyEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
