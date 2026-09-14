/*
 * BrunnenBar — recommendation engine
 * =========================================================================
 * Pure scoring. No DOM, no interface code, so it can be unit tested in node
 * (see test/engine.test.js).
 *
 * Three tiers of rule:
 *   HARD  Allergens and "never pour me this spirit". Never relaxed. Ever.
 *   GATE  Zero proof and shots. Relaxed only if nothing survives, and the
 *         page then tells the guest that something was loosened.
 *   SOFT  Everything else, scored and summed.
 *
 * The drinks handed in here have already been through menu-source.js and
 * menu-adapt.js, so till articles and anything that is not a cocktail are
 * gone before this file sees them.
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
    catchAll: -22,

    /* A drink somebody built, rather than a spirit topped with something from
     * a bottle. Scored on every recommendation, whether or not the guest
     * expressed a preference, which is what stops a Jack and Cola winning a
     * question it was never really competing in. */
    craft: 16,

    /* The bar's own pick for its section, the gold star on the website. Their
     * judgement beats ours, so it settles a close call. Absent from the feed
     * means absent from the scoring, never a penalty. */
    housePick: 10,

    /* Not on the printed card. A heavy demotion rather than a filter, and the
     * difference matters: eight of the eleven shots and twelve of the fourteen
     * alcohol free drinks are off the card, so excluding them outright would
     * leave a guest asking for a round of shots with three options and a guest
     * asking for zero proof with two.
     *
     * A demotion has the property an exclusion does not. When everything in
     * reach is off the card, every candidate takes the same penalty and the
     * ranking between them is untouched, so those paths keep their full
     * choice. When the card does have something, it wins. */
    offCard: -40
  };

  /* Things poured from a bottle to lengthen a drink. Together with GENERIC_ING
   * below, what is left of an ingredient list is the part someone actually
   * made. Listed as exact strings from the card, like the spirit dictionary,
   * because a regex here matched Soda inside Sodawasser and missed Thomas
   * Henry Spicy Ginger entirely. */
  var MIXERS = [
    'Cola', 'Tonic Water', 'Thomas Henry Spicy Ginger', 'Sprite', 'Red Bull',
    'Ginger Ale', 'Ginger Beer', 'Bitter Lemon', 'Mate', 'Club Mate', 'Tonic',
    'Orangensaft', 'Wasser', 'Sodawasser', 'Tonic Water 0,0', 'Ginger Beer 0,0',
    'Fritz Kola', 'Spezi', 'Apfelsaft', 'Ananassaft', 'Maracujasaft'
  ];

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

  /* A drink tagged for the whole evening fits wherever the guest is, so the
   * question never offers it and the scoring always accepts it. Named here
   * once, because anything checking which moments are reachable has to know
   * about it or it reports a perfectly good drink as unreachable. */
  var MOMENT_ANY = 'Ganzer Abend';

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

  /* Styles where the drink is poured rather than made. Everything else on the
   * card, a sour, a spritz, anything muddled, shaken or stirred, took work by
   * definition. */
  var POURED = ['Highball', 'Built'];

  /* Did somebody make this, or did they open two bottles?
   *
   * Two tests, because neither alone is right.
   *
   * Counting ingredients alone demotes a Caipirinha, whose lime and sugar are
   * both fillers, down to the level of a Jack and Cola. So the serve style
   * decides first: anything muddled, shaken, stirred, a sour, a fizz, a spritz
   * took work whatever its shopping list looks like.
   *
   * Serve style alone is not enough either, because a Highball covers both a
   * Mojito and a Gin and Tonic. So for those, strip the fillers and the mixers
   * and count what is left. A Gin and Tonic leaves the gin. A Mojito leaves
   * the rum and the mint.
   *
   * Both tests read the data rather than a section name, so the card can be
   * reorganised without touching this. */
  function isBuilt(d) {
    var made = (d.ing || []).filter(function (x) {
      return GENERIC_ING.indexOf(x) === -1 && MIXERS.indexOf(x) === -1;
    }).length;
    if (!made) return false;                 // a placeholder, not a drink yet
    if (POURED.indexOf(d.serve) === -1) return true;
    return made >= 2;
  }

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

  /* How alike two drinks are, 0 to 1.
   *
   * Three gin and tonics is a worse answer than one gin and tonic, however
   * well each of them scores on its own. Same spirit, same shape in the glass
   * and the same bottles in it is the shape that problem takes. */
  function similarity(a, b) {
    var score = 0;
    if (a.base && a.base === b.base) score += 0.4;
    if (serveGroupOf(a.serve) && serveGroupOf(a.serve) === serveGroupOf(b.serve)) score += 0.25;

    var aIng = (a.ing || []).filter(function (x) { return GENERIC_ING.indexOf(x) === -1; });
    var bIng = (b.ing || []).filter(function (x) { return GENERIC_ING.indexOf(x) === -1; });
    if (aIng.length && bIng.length) {
      var shared = aIng.filter(function (x) { return bIng.indexOf(x) !== -1; }).length;
      score += 0.35 * (shared / Math.min(aIng.length, bIng.length));
    }
    return score;
  }

  /* The most a runner-up can be marked down for resembling something already
   * picked. Small enough that a clearly better drink still gets through, big
   * enough to break up a row of near identical ones. */
  var VARIETY = 14;

  /* Pick the best, then keep picking the best of what is left after marking
   * down whatever resembles the picks so far.
   *
   * The top recommendation is never affected: it is simply the best match, and
   * the guest asked for that. What changes is the runner-ups, which exist to
   * offer something else and are worthless when they offer the same thing
   * again with a different gin in it. */
  function pickVaried(scored, limit) {
    if (scored.length <= 1) return scored.slice(0, limit);
    var pool = scored.slice();
    var out = [pool.shift()];

    while (out.length < limit && pool.length) {
      var bestAt = 0, bestScore = -Infinity;
      for (var i = 0; i < pool.length; i++) {
        var worst = 0;
        for (var j = 0; j < out.length; j++) {
          var sim = similarity(pool[i].drink, out[j].drink);
          if (sim > worst) worst = sim;
        }
        var adjusted = pool[i].score - VARIETY * worst;
        if (adjusted > bestScore) { bestScore = adjusted; bestAt = i; }
      }
      out.push(pool.splice(bestAt, 1)[0]);
    }
    return out;
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
   * @param {Array}  menu     drinks from menu-adapt.js
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
        if (m.indexOf(a.moment) !== -1 || m.indexOf(MOMENT_ANY) !== -1) {
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

      /* — did somebody make it —
       *
       * Scored on every question, so it tells drinks apart even when a guest
       * asked for nothing in particular, which is exactly when the old ranking
       * fell apart and handed back a Cuba Libre.
       *
       * Shots need no special case. A shot is not a Highball, so the serve
       * style alone marks it as made, and every shot on the card scores this
       * equally. An exemption was written for them and turned out to be
       * unreachable, so it is not here. */
      maxScore += W.craft;
      if (isBuilt(d)) score += W.craft;

      // — the bar's own pick for its section —
      if (d.housePick) {
        maxScore += W.housePick;
        score += W.housePick;
        reasons.push({ key: 'housePick', weight: W.housePick });
      }

      // — is it actually on the card the guest is holding —
      if (!d.onPrintedMenu) score += W.offCard;

      // An offer to build something is a fallback, never a recommendation.
      if (d.serve === CATCH_ALL) score += W.catchAll;

      /* Among otherwise equal drinks, let the proven one edge ahead. This is
       * the only place sales figures touch the ranking, and it is deliberately
       * small: it breaks ties, it does not decide matches. */
      score += 3 * (d.sold / maxSold);

      if (asArray(a.allergens).length || asArray(a.avoid).length) {
        reasons.push({ key: 'safe', weight: 1 });
      }

      /* Two points of jitter was tuned when the export carried unit sales,
       * which spread the tie-break above it. The API gives a rank instead,
       * and adjacent ranks are genuinely near identical, so the same jitter
       * started overturning a real one point lead. Half a point still breaks
       * an exact tie and cannot outvote a better match. Free rein stays wide
       * on purpose, that is the guest asking to be surprised. */
      /* Free rein used to widen this to 14, which was more than any real
       * signal and made the no preference path close to random. Craft now
       * separates the drinks, so the jitter only has to vary the order among
       * the good ones. */
      score += jitter(d.id, seed) * (freeRein ? 6 : 0.5);

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
    var items = pickVaried(scored, limit);

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

  /* ------------------------------------------------------ live options ---
   *
   * An option nobody can be given is worse than no option. On the zero proof
   * path the card has nothing smoky and nothing coffee flavoured, and on a
   * round of shots it has nothing bitter and nothing sparkling, so offering
   * those taps spends a guest's attention on an answer that cannot change the
   * outcome.
   *
   * These are derived from the menu rather than listed, so they stay right
   * when the card changes and need no upkeep. */

  /* What is still reachable given the answers so far.
   *
   * Every answer narrows this, not just the hard rules and the gates. Someone
   * who says mezcal should not then be offered coffee, because the card has
   * one mezcal drink and it is a smoky sour. Scoring stays soft and is
   * untouched by this, so a near miss can still be recommended. What narrows
   * here is only what a guest is invited to ask for.
   *
   * No gate relaxing either, since the question is what a guest can be given
   * rather than what we would fall back to.
   *
   * Strength allows one step of slack because the engine scores one step as a
   * good match and only starts penalising at two. Narrowing tighter than the
   * scoring would take away options that really would have been recommended.
   */
  function poolFor(menu, answers) {
    var a = answers || {};

    /* The same ladder recommend() climbs when nothing survives. Offering
     * options from a stricter pool than the one the results will come from
     * would take away answers that really were available. Late in the evening
     * at strength 1 the card has nothing at all, and collapsing the whole
     * questionnaire there would be a worse answer than the near miss the
     * engine is about to give. */
    var rungs = [
      function (d) { return gates(d, a) && narrowed(d, a); },
      function (d) { return gates(d, a); },
      // Zero proof outlives the shot gate, exactly as in recommend(). A round
      // of alcohol free shots becomes alcohol free drinks, never a drink with
      // alcohol in it.
      function (d) { return passesHard(d, a) && passesZeroProofGate(d, a); },
      function (d) { return passesHard(d, a); }
    ];
    for (var i = 0; i < rungs.length; i++) {
      var pool = menu.filter(rungs[i]);
      if (pool.length) return pool;
    }
    return [];
  }

  function gates(d, a) {
    return passesHard(d, a) && passesZeroProofGate(d, a) && passesShotGate(d, a);
  }

  function narrowed(d, a) {
    return (function () {

      // "Ganzer Abend" fits wherever the guest is, exactly as it scores.
      if (a.moment && a.moment !== 'shots') {
        var m = d.moments || [];
        if (m.indexOf(a.moment) === -1 && m.indexOf(MOMENT_ANY) === -1) return false;
      }

      if (a.strength != null && a.strength !== '') {
        if (Math.abs(d.strength - Number(a.strength)) > 1) return false;
      }

      var wantSpirit = asArray(a.spirit);
      if (wantSpirit.length && !wantSpirit.some(function (x) {
        return (d.spirits || []).indexOf(x) !== -1;
      })) return false;

      var wantFlavour = asArray(a.flavours).filter(function (x) { return x !== NO_PREFERENCE; });
      if (wantFlavour.length && !wantFlavour.some(function (x) {
        return (d.flavours || []).indexOf(x) !== -1;
      })) return false;

      if (a.serve && serveGroupOf(d.serve) !== a.serve) return false;

      return true;
    })();
  }

  /* Which drink property each question scores against. Questions absent from
   * this map are never filtered.
   *
   * Two absences are deliberate. Strength is a scale, and a scale with holes
   * in it reads as broken rather than as helpful. Allergens is reassurance as
   * much as it is a filter, and a guest with a nut allergy should see nuts
   * acknowledged whether or not anything on the card contains them. */
  var OPTION_MATCH = {
    spirit:   function (d, v) { return (d.spirits || []).indexOf(v) !== -1; },
    avoid:    function (d, v) { return (d.spirits || []).indexOf(v) !== -1; },
    flavours: function (d, v) { return (d.flavours || []).indexOf(v) !== -1; },
    serve:    function (d, v) { return serveGroupOf(d.serve) === v; }
  };

  /**
   * The subset of a question's option values that something in the pool can
   * actually match.
   *
   * The question's own answer is cleared before the pool is worked out.
   * Without that, picking "no gin" would remove every gin drink and then take
   * the "no gin" option away underneath the guest's finger.
   *
   * Returns every value unchanged only when the question is not filtered at
   * all. When filtering leaves nothing, it returns nothing, and the question
   * is dropped by canDiscriminate rather than asked.
   *
   * Showing all of them instead was tried and was worse. Talisker Campfire is
   * the only whiskey late in the evening at that strength and it is served
   * hot, a shape the question deliberately does not offer, so every one of the
   * four answers led nowhere. An unanswerable question is not a gentler
   * failure than a missing one, it is a promise the card cannot keep.
   */
  function liveOptions(menu, answers, questionId, values) {
    var match = OPTION_MATCH[questionId];
    if (!match) return values.slice();

    var probe = Object.assign({}, answers || {});
    delete probe[questionId];

    var pool = poolFor(menu, probe);
    if (!pool.length) return [];

    /* Having just said you like mezcal, being offered "no mezcal" on the next
     * screen is absurd, and picking both would empty the pool outright. */
    var contradicts = questionId === 'avoid' ? asArray((answers || {}).spirit) : [];

    var live = values.filter(function (v) {
      // The sentinel is not a property of any drink, it is the guest handing
      // the choice back, so it is always on offer.
      if (v === NO_PREFERENCE) return true;
      if (contradicts.indexOf(v) !== -1) return false;
      return pool.some(function (d) { return match(d, v); });
    });

    var real = live.filter(function (v) { return v !== NO_PREFERENCE; });
    return real.length ? live : [];
  }

  /* A question worth asking has at least two answers that lead somewhere
   * different. One does not, and none is a dead end. */
  function canDiscriminate(menu, answers, questionId, values) {
    if (!OPTION_MATCH[questionId]) return true;
    var live = liveOptions(menu, answers, questionId, values)
      .filter(function (v) { return v !== NO_PREFERENCE; });
    return live.length >= 2;
  }

  var api = {
    recommend: recommend,
    passesHard: passesHard,
    serveGroupOf: serveGroupOf,
    poolFor: poolFor,
    liveOptions: liveOptions,
    canDiscriminate: canDiscriminate,
    NO_PREFERENCE: NO_PREFERENCE, MOMENT_ANY: MOMENT_ANY, CATCH_ALL: CATCH_ALL,
    contrastOf: contrastOf,
    SERVE_GROUPS: SERVE_GROUPS, MIXERS: MIXERS, POURED: POURED, isBuilt: isBuilt,
    similarity: similarity, VARIETY: VARIETY,
    WEIGHTS: W
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.BBEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
