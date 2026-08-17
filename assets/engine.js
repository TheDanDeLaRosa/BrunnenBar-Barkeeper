/*
 * BrunnenBar — recommendation engine
 * =========================================================================
 * Pure scoring. No DOM, no globals beyond the export — so it can be unit
 * tested in node (see test/engine.test.js).
 *
 * Two kinds of rule:
 *   HARD  — allergens and "never pour me this spirit". Never relaxed. Ever.
 *   GATE  — zero-proof and shots. Relaxed only if nothing at all survives,
 *           and the UI then tells the guest we loosened something.
 *   SOFT  — everything else, scored and summed.
 * =========================================================================
 */
(function (root) {
  'use strict';

  var W = {
    occasion: 18,
    strengthExact: 26,
    strengthNear: 8,
    strengthFarPenalty: -34,
    spiritBase: 30,
    spiritSupport: 12,
    flavour: 40,
    texture: 20,
    textureAdjacent: 7,
    adventure: 18,
    house: 9,
    hotPenalty: -35
  };

  // How each flavour answer reads onto the profile axes.
  var FLAVOUR_MAP = {
    citrus: { sour: 3, fresh: 3, fruity: 1, sweet: -1, creamy: -1 },
    bitter: { bitter: 4, herbal: 1, boozy: 1, sweet: -1 },
    herbal: { herbal: 4, fresh: 2, bitter: 0.5 },
    fruity: { fruity: 4, sweet: 1, sour: 1, bitter: -1 },
    rich: { creamy: 3, sweet: 3, bitter: 0.5, sour: -2, fresh: -1 },
    smoky: { smoky: 3, spicy: 3, boozy: 1 },
    spirit: { boozy: 4, sweet: -1, fruity: -1, sour: -1, creamy: -1 }
  };

  // Textures that are "close enough" to earn a partial credit.
  var TEXTURE_NEIGHBOURS = {
    long: ['sparkling'],
    sparkling: ['long'],
    short: ['frothy'],
    frothy: ['short'],
    hot: [],
    shot: []
  };

  function asArray(v) { return Array.isArray(v) ? v : (v == null || v === '' ? [] : [v]); }

  /* Deterministic 0..1 jitter so "surprise me" varies between visits but a
   * given (id, seed) pair always scores the same — results stay stable while
   * the guest pages back and forth through their answers. */
  function jitter(id, seed) {
    var h = 2166136261;
    var s = String(id) + '|' + String(seed);
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return (h % 1000) / 1000;
  }

  /* HARD rules — a drink failing any of these is never shown, at any cost. */
  function passesHard(c, a) {
    var flags = asArray(a.avoidFlags);
    for (var i = 0; i < flags.length; i++) {
      if ((c.flags || []).indexOf(flags[i]) !== -1) return false;
    }
    var avoid = asArray(a.avoid);
    if (avoid.length) {
      if (avoid.indexOf(c.base) !== -1) return false;
      var also = c.also || [];
      for (var j = 0; j < also.length; j++) {
        if (avoid.indexOf(also[j]) !== -1) return false;
      }
    }
    return true;
  }

  function passesZeroProofGate(c, a) {
    return a.strength === '0' ? c.strength === 0 : c.strength !== 0;
  }

  function passesShotGate(c, a) {
    var wantsShot = a.occasion === 'shot';
    var isShot = c.texture === 'shot';
    return wantsShot === isShot;
  }

  function flavourScore(c, flavour) {
    var map = FLAVOUR_MAP[flavour];
    if (!map) return { points: 0, max: 0 };
    var raw = 0, maxRaw = 0;
    for (var dim in map) {
      if (!Object.prototype.hasOwnProperty.call(map, dim)) continue;
      var w = map[dim];
      raw += (c.profile[dim] || 0) * w;
      if (w > 0) maxRaw += 4 * w;
    }
    return { points: maxRaw ? (W.flavour * raw) / maxRaw : 0, max: W.flavour };
  }

  function adventureScore(c, want) {
    // want: '0' known classic · '2' something new · '3' bartender's call
    if (want === '0') return c.adventure <= 1 ? W.adventure - c.adventure * 5 : -12;
    if (want === '2') return c.adventure >= 2 ? W.adventure : c.adventure * 4 - 6;
    return 0; // '3' — deliberately neutral, the jitter does the choosing
  }

  /**
   * @param {Array}  cocktails  the menu
   * @param {Object} answers    {occasion, strength, spirit[], avoid[], flavour, texture, adventure, avoidFlags[]}
   * @param {Object} [opts]     {seed, limit}
   * @returns {{items: Array, relaxed: string|null, total: number}}
   */
  function recommend(cocktails, answers, opts) {
    opts = opts || {};
    var a = answers || {};
    var seed = opts.seed == null ? 0 : opts.seed;
    var limit = opts.limit == null ? 6 : opts.limit;

    var hardPool = cocktails.filter(function (c) { return passesHard(c, a); });

    // Apply gates, loosening only as far as we must to have anything to say.
    var relaxed = null;
    var pool = hardPool.filter(function (c) {
      return passesZeroProofGate(c, a) && passesShotGate(c, a);
    });
    if (!pool.length) {
      pool = hardPool.filter(function (c) { return passesZeroProofGate(c, a); });
      relaxed = pool.length ? 'shot' : null;
    }
    if (!pool.length) {
      pool = hardPool.slice();
      relaxed = pool.length ? 'strength' : null;
    }

    var prefs = asArray(a.spirit);
    var scored = pool.map(function (c) {
      var score = 0;
      var maxScore = 0;
      var reasons = [];

      // — occasion —
      maxScore += W.occasion;
      if (a.occasion && (c.occasion || []).indexOf(a.occasion) !== -1) {
        score += W.occasion;
        reasons.push({ key: 'occasion', weight: W.occasion });
      }

      // — strength —
      if (a.strength != null && a.strength !== '') {
        maxScore += W.strengthExact;
        var delta = Math.abs(c.strength - Number(a.strength));
        if (delta === 0) {
          score += W.strengthExact;
          reasons.push({ key: c.strength === 0 ? 'zero' : 'strength_exact', weight: W.strengthExact });
        } else if (delta === 1) {
          score += W.strengthNear;
          reasons.push({ key: 'strength_near', weight: W.strengthNear });
        } else {
          score += W.strengthFarPenalty;
        }
      }

      // — preferred spirit —
      if (prefs.length) {
        maxScore += W.spiritBase;
        if (prefs.indexOf(c.base) !== -1) {
          score += W.spiritBase;
          reasons.push({ key: 'spirit', weight: W.spiritBase, x: c.base });
        } else {
          var also = c.also || [];
          for (var k = 0; k < also.length; k++) {
            if (prefs.indexOf(also[k]) !== -1) {
              score += W.spiritSupport;
              reasons.push({ key: 'spirit', weight: W.spiritSupport, x: also[k] });
              break;
            }
          }
        }
      }

      // — flavour direction —
      if (a.flavour) {
        var f = flavourScore(c, a.flavour);
        score += f.points;
        maxScore += f.max;
        if (f.points > f.max * 0.55) {
          reasons.push({ key: 'flavour', weight: f.points, x: a.flavour });
        }
      }

      // — texture —
      if (a.texture) {
        maxScore += W.texture;
        if (c.texture === a.texture) {
          score += W.texture;
          reasons.push({ key: 'texture', weight: W.texture });
        } else if ((TEXTURE_NEIGHBOURS[a.texture] || []).indexOf(c.texture) !== -1) {
          score += W.textureAdjacent;
        }
      }

      // — familiar vs. new —
      if (a.adventure) {
        maxScore += W.adventure;
        var adv = adventureScore(c, a.adventure);
        score += adv;
        if (adv > 0) {
          reasons.push({ key: a.adventure === '0' ? 'classic' : 'newish', weight: adv });
        }
      }

      // A house drink is worth surfacing when the guest is open to new things.
      if (c.house && a.adventure !== '0') {
        score += W.house;
        maxScore += W.house;
        reasons.push({ key: 'house', weight: W.house });
      }

      // Hot drinks are wrong unless actually asked for.
      if (c.texture === 'hot' && a.texture !== 'hot' && a.occasion !== 'nightcap') {
        score += W.hotPenalty;
      }

      // Acknowledge the exclusions we honoured.
      if (asArray(a.avoidFlags).length || asArray(a.avoid).length) {
        reasons.push({ key: 'safe', weight: 1 });
      }

      // Tie-break, and the actual engine of "surprise me".
      score += jitter(c.id, seed) * (a.adventure === '3' ? W.adventure : 1.5);

      var pct = maxScore > 0 ? Math.round((100 * score) / maxScore) : 0;
      reasons.sort(function (x, y) { return y.weight - x.weight; });

      return {
        cocktail: c,
        score: score,
        match: Math.max(35, Math.min(99, pct)),
        reasons: reasons.slice(0, 3)
      };
    });

    scored.sort(function (x, y) { return y.score - x.score; });

    return { items: scored.slice(0, limit), relaxed: relaxed, total: scored.length };
  }

  var api = {
    recommend: recommend,
    passesHard: passesHard,
    FLAVOUR_MAP: FLAVOUR_MAP,
    WEIGHTS: W
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.BBEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
