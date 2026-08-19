/*
 * BrunnenBar — recommendation engine
 * =========================================================================
 * Pure scoring against the bar's own export. No DOM, no interface code, so
 * it can be unit tested in node (see test/engine.test.js).
 *
 * Three tiers of rule:
 *   HARD  Allergens and "never pour me this spirit". Never relaxed. Ever.
 *   GATE  Zero proof and shots. Relaxed only if nothing survives, and the
 *         page then tells the guest that something was loosened.
 *   SOFT  Everything else, scored and summed.
 *
 * Drinks with available:false never reach this file - tools/build-menu.js
 * drops them at build time.
 * =========================================================================
 */
(function (root) {
  'use strict';

  var W = {
    moment: 20,
    strengthExact: 28,
    strengthNear: 10,
    strengthOff2: -18,
    strengthFar: -40,
    spiritBase: 30,
    spiritSupport: 14,
    flavour: 34,
    serve: 18,
    catchAll: -22
  };

  /* Serve styles grouped the way a guest thinks about them, rather than the
   * way a bartender writes them on a spec. */
  var SERVE_GROUPS = {
    lang: ['Highball', 'Built', 'Sling', 'Muddled', 'Julep'],
    kurz: ['Stirred'],
    schaum: ['Sour', 'Shaken', 'Fizz'],
    spritzig: ['Spritz'],
    frozen: ['Frozen'],
    heiss: ['Hot'],
    shot: ['Shot']
  };

  // Drinks that are an offer to build something, not a drink in themselves.
  var CATCH_ALL = "Bartender's Choice";

  /* The guest explicitly handing the choice back to us. Not a flavour tag. */
  var NO_PREFERENCE = 'barkeeper';

  /* Ingredients too common to tell two drinks apart. Naming one of these as
   * the difference would be true but useless. */
  var GENERIC_ING = [
    'Zucker', 'Eis', 'Soda', 'Mineralwasser', 'Limette', 'Zitrone',
    'Angostura', 'Salz', 'nach Absprache'
  ];

  /* Serve groups a guest would recognise as a shape, for the runner-up hook. */
  var SERVE_CONTRAST = { lang: 'longer', kurz: 'shorter', spritzig: 'sparkling', schaum: 'shaken' };

  /* Why take this one INSTEAD of the top pick. Runner-ups are only useful if
   * they say how they differ, so each is labelled by its single most
   * distinguishing feature, cheapest and most concrete first:
   *   1. an ingredient the top pick does not have, rarest one wins
   *   2. noticeably stronger or lighter
   *   3. a different shape in the glass
   *   4. a flavour the top pick does not have
   * Returns null when nothing separates them, and the page falls back to a
   * generic label rather than inventing a difference.
   */
  function contrastOf(hero, alt, ingFreq) {
    if (!hero || !alt) return null;

    var heroIng = hero.ing || [];
    var unique = (alt.ing || []).filter(function (i) {
      return heroIng.indexOf(i) === -1 && GENERIC_ING.indexOf(i) === -1;
    });
    if (unique.length) {
      // The rarest one across the whole card carries the most character.
      unique.sort(function (a, b) {
        return (ingFreq[a] || 0) - (ingFreq[b] || 0) || (a < b ? -1 : 1);
      });
      return { kind: 'ingredient', value: unique[0] };
    }

    var delta = alt.strength - hero.strength;
    if (delta >= 1) return { kind: 'stronger' };
    if (delta <= -1) return { kind: 'lighter' };

    var heroServe = serveGroupOf(hero.serve);
    var altServe = serveGroupOf(alt.serve);
    if (altServe && altServe !== heroServe && SERVE_CONTRAST[altServe]) {
      return { kind: SERVE_CONTRAST[altServe] };
    }

    var heroFlav = hero.flavours || [];
    var newFlav = (alt.flavours || []).filter(function (f) { return heroFlav.indexOf(f) === -1; });
    if (newFlav.length) return { kind: 'flavour', value: newFlav[0] };

    return null;
  }

  function asArray(v) { return Array.isArray(v) ? v : (v == null || v === '' ? [] : [v]); }

  function serveGroupOf(serve) {
    for (var g in SERVE_GROUPS) {
      if (Object.prototype.hasOwnProperty.call(SERVE_GROUPS, g) &&
          SERVE_GROUPS[g].indexOf(serve) !== -1) return g;
    }
    return null;
  }

  /* Deterministic 0..1 jitter. Keeps ties from always resolving the same
   * way, so two guests at one table get different suggestions, while any
   * single guest paging back and forth sees a stable list. */
  function jitter(id, seed) {
    var h = 2166136261;
    var s = String(id) + '|' + String(seed);
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return (h % 1000) / 1000;
  }

  /* HARD rules. A drink failing any of these is never shown, at any cost. */
  function passesHard(d, a) {
    var avoidAllergens = asArray(a.allergens);
    for (var i = 0; i < avoidAllergens.length; i++) {
      if ((d.allergens || []).indexOf(avoidAllergens[i]) !== -1) return false;
    }
    var avoid = asArray(a.avoid);
    if (avoid.length) {
      if (avoid.indexOf(d.base) !== -1) return false;
      var sp = d.spirits || [];
      for (var j = 0; j < sp.length; j++) {
        if (avoid.indexOf(sp[j]) !== -1) return false;
      }
    }
    return true;
  }

  function passesZeroProofGate(d, a) {
    return a.strength === '0' ? d.alcoholFree : !d.alcoholFree;
  }

  function passesShotGate(d, a) {
    return (a.moment === 'shots') === (d.serve === 'Shot');
  }

  /**
   * @param {Array}  menu     from data/menu.js
   * @param {Object} answers  {moment, strength, spirit[], avoid[], flavours[],
   *                           serve, allergens[]}
   * @param {Object} [opts]   {seed, limit}
   * @returns {{items:Array, relaxed:string|null, total:number}}
   */
  function recommend(menu, answers, opts) {
    opts = opts || {};
    var a = answers || {};
    var seed = opts.seed == null ? 0 : opts.seed;
    var limit = opts.limit == null ? 3 : opts.limit;

    var hardPool = menu.filter(function (d) { return passesHard(d, a); });

    // Loosen the gates only as far as we must to have something to say.
    var relaxed = null;
    var pool = hardPool.filter(function (d) {
      return passesZeroProofGate(d, a) && passesShotGate(d, a);
    });
    if (!pool.length) {
      pool = hardPool.filter(function (d) { return passesZeroProofGate(d, a); });
      if (pool.length) relaxed = 'shot';
    }
    if (!pool.length) {
      pool = hardPool.slice();
      if (pool.length) relaxed = 'strength';
    }

    var prefs = asArray(a.spirit);
    var wantFlavours = asArray(a.flavours).filter(function (f) { return f !== NO_PREFERENCE; });
    /* No flavour asked for means the guest left it to the bar, so let the
     * house actually choose: widen the jitter so two people at one table get
     * different suggestions instead of both being handed the top seller. */
    var freeRein = wantFlavours.length === 0;
    var maxSold = 1;
    menu.forEach(function (d) { if (d.sold > maxSold) maxSold = d.sold; });

    var scored = pool.map(function (d) {
      var score = 0, maxScore = 0, reasons = [];

      // — moment in the evening — "Ganzer Abend" fits wherever you are —
      if (a.moment && a.moment !== 'shots') {
        maxScore += W.moment;
        var m = d.moments || [];
        if (m.indexOf(a.moment) !== -1 || m.indexOf('Ganzer Abend') !== -1) {
          score += W.moment;
          reasons.push({ key: 'moment', weight: W.moment, x: a.moment });
        }
      }

      // — strength —
      if (a.strength != null && a.strength !== '') {
        maxScore += W.strengthExact;
        var delta = Math.abs(d.strength - Number(a.strength));
        if (delta === 0) {
          score += W.strengthExact;
          reasons.push({ key: d.alcoholFree ? 'zero' : 'strength_exact', weight: W.strengthExact, x: d.strengthLabel });
        } else if (delta === 1) {
          score += W.strengthNear;
          reasons.push({ key: 'strength_near', weight: W.strengthNear, x: d.strengthLabel });
        } else if (delta === 2) {
          score += W.strengthOff2;
        } else {
          score += W.strengthFar;
        }
      }

      // — preferred spirit —
      if (prefs.length) {
        maxScore += W.spiritBase;
        if (prefs.indexOf(d.base) !== -1) {
          score += W.spiritBase;
          reasons.push({ key: 'spirit', weight: W.spiritBase, x: d.base });
        } else {
          var sp = d.spirits || [];
          for (var k = 0; k < sp.length; k++) {
            if (prefs.indexOf(sp[k]) !== -1) {
              score += W.spiritSupport;
              reasons.push({ key: 'spirit', weight: W.spiritSupport, x: sp[k] });
              break;
            }
          }
        }
      }

      // — flavour — share of what the guest asked for that this drink has —
      if (wantFlavours.length) {
        maxScore += W.flavour;
        var hits = wantFlavours.filter(function (f) { return (d.flavours || []).indexOf(f) !== -1; });
        if (hits.length) {
          score += W.flavour * (hits.length / wantFlavours.length);
          reasons.push({ key: 'flavour', weight: W.flavour * hits.length, x: hits.join(', ') });
        }
      }

      // — how it is served —
      if (a.serve) {
        maxScore += W.serve;
        if (serveGroupOf(d.serve) === a.serve) {
          score += W.serve;
          reasons.push({ key: 'serve', weight: W.serve, x: a.serve });
        }
      }

      // An offer to build something is a fallback, never a recommendation.
      if (d.serve === CATCH_ALL) score += W.catchAll;

      /* Among otherwise equal drinks, let the proven one edge ahead. This is
       * the only place sales figures touch the ranking, and it is deliberately
       * small: it breaks ties, it does not decide matches. */
      score += 3 * (d.sold / maxSold);

      if (asArray(a.allergens).length || asArray(a.avoid).length) {
        reasons.push({ key: 'safe', weight: 1 });
      }

      score += jitter(d.id, seed) * (freeRein ? 14 : 2);

      var pct = maxScore > 0 ? Math.round((100 * score) / maxScore) : 50;
      reasons.sort(function (x, y) { return y.weight - x.weight; });

      return {
        drink: d,
        score: score,
        match: Math.max(35, Math.min(99, pct)),
        reasons: reasons.slice(0, 3)
      };
    });

    scored.sort(function (x, y) { return y.score - x.score; });
    var items = scored.slice(0, limit);

    // How often each ingredient appears across the whole card, so the
    // runner-up hook can pick the rarest distinguishing one.
    var ingFreq = {};
    menu.forEach(function (d) {
      (d.ing || []).forEach(function (i) { ingFreq[i] = (ingFreq[i] || 0) + 1; });
    });
    items.forEach(function (item, i) {
      item.contrast = i === 0 ? null : contrastOf(items[0].drink, item.drink, ingFreq);
    });

    return { items: items, relaxed: relaxed, total: scored.length };
  }

  var api = {
    recommend: recommend,
    passesHard: passesHard,
    serveGroupOf: serveGroupOf,
    NO_PREFERENCE: NO_PREFERENCE,
    contrastOf: contrastOf,
    SERVE_GROUPS: SERVE_GROUPS,
    WEIGHTS: W
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.BBEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
