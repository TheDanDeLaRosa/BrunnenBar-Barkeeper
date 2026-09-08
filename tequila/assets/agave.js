/*
 * BrunnenBar — Agave derivation
 * =========================================================================
 * Turns a Menu API item into the handful of facts the tequila recommender
 * needs, and says nothing the data does not support.
 *
 * Pure. No DOM, no network, no state, so it can be unit tested in node
 * (see test/agave.test.js).
 *
 * WHY THIS FILE EXISTS AT ALL
 * ---------------------------
 * The cocktail app can ask "does this item have an ingredient list" and be
 * done, because a cocktail has one and a beer does not. A tequila app cannot.
 * A neat pour of Don Julio Anejo has no ingredient list either, and it is
 * exactly the thing this app is supposed to be good at recommending. So the
 * ingredient test stays, but as a CLASSIFICATION (pour or mixed drink)
 * rather than as a filter.
 *
 * WHAT IT IS ALLOWED TO READ
 * --------------------------
 * Structured fields only, never guest prose. `name`, `group` and the
 * `ingredients` lists are written by the bar as data. `description` and
 * `bartender_note` are sentences, and a sentence like "der Negroni mit
 * Tequila statt Gin" would make any keyword search lie. So prose is not
 * read here at all.
 *
 * FIELDS FIRST, NAMES SECOND
 * --------------------------
 * As of the 08.09.2026 card the Menu API carries `agave_kind`,
 * `agave_expression`, `brand`, `agave_region` and `additive_free`. Every one
 * of those is read straight off the item and the vocabularies below are only
 * consulted where a field is missing.
 *
 * The fallback is not dead code and should not be deleted. The fields live in
 * menu.json, and menu.json reaches page 217 only when the website seat
 * republishes, so a browser can and will see the older shape in between. It
 * degrades per field rather than wholesale, the same way the German and
 * English strings do.
 *
 * WHAT IT IS ALLOWED TO KNOW
 * --------------------------
 * The vocabularies below are words for SPIRITS and BRANDS, never drinks,
 * prices, section names or allergens. That distinction is the whole of the
 * data rule. A vocabulary of spirit words survives the card being
 * reorganised, renamed or reprinted, which is the point.
 *
 * Nothing here decides membership from a section title. An item called
 * "Don Julio Blanco" is an agave spirit whether it sits under Tequila,
 * under Klassiker or under a section invented next week.
 * =========================================================================
 */
(function (root) {
  'use strict';

  /* ---------------------------------------------------------- vocabulary --
   *
   * Spirit words. These mean "there is an agave distillate in this glass".
   *
   * Deliberately NOT in this list: the bare word "agave". Agave syrup is a
   * sweetener that turns up in drinks with no agave spirit anywhere near
   * them, and treating it as evidence would quietly pull half the card in.
   * See test/agave.test.js, which pins that. */
  var SPIRIT_WORDS = [
    'tequila', 'mezcal', 'mescal', 'sotol', 'raicilla', 'bacanora',
    'agavenbrand', 'agave spirit', 'destilado de agave'
  ];

  /* Brands, because "El Destilador Blanco" says agave without saying agave.
   * Each maps to the house a guest would recognise it by. Add a bottle here
   * when the bar lists one whose name carries no spirit word. */
  var BRANDS = [
    ['don julio', 'Don Julio'],
    ['casamigos', 'Casamigos'],
    ['de leon', 'DeLeon'],
    ['deleon', 'DeLeon'],
    ['astral', 'Astral'],
    ['21 seeds', '21Seeds'],
    ['el destilador', 'El Destilador'],
    ['ojo de tigre', 'Ojo de Tigre'],
    ['clase azul', 'Clase Azul'],
    ['patron', 'Patron'],
    ['herradura', 'Herradura'],
    ['espolon', 'Espolon'],
    ['tapatio', 'Tapatio'],
    ['fortaleza', 'Fortaleza'],
    ['olmeca', 'Olmeca'],
    ['jose cuervo', 'Jose Cuervo'],
    ['sierra tequila', 'Sierra'],
    ['cazcabel', 'Cazcabel'],
    ['1800', '1800']
  ];

  /* The houses the bar buys through Diageo. Recorded because Dan asked for
   * it and because a guest asking "what else is there like this" deserves a
   * straight answer about the family a bottle belongs to.
   *
   * It does NOT touch scoring, on purpose. A recommender that quietly
   * favours one supplier is worth nothing to the guest and, a week later,
   * nothing to the bar either. If the house ever wants a nudge, it belongs
   * in the tie-break next to popularity and nowhere else. */
  var PORTFOLIO = {
    'Don Julio': 'Diageo',
    'Casamigos': 'Diageo',
    'DeLeon': 'Diageo',
    'Astral': 'Diageo',
    '21Seeds': 'Diageo'
  };

  /* Category words. Read from `group` only, never from an ingredient list,
   * for the agave syrup reason above. A group is the bar's own sub-heading,
   * so "Agave Cocktails" is real evidence where a syrup is not. */
  var GROUP_WORDS = ['agave', 'agaven'];

  /* Expressions, longest first, because "extra anejo" contains "anejo" and
   * whichever matches first wins. */
  var EXPRESSIONS = [
    ['extra anejo', 'extra-anejo'],
    ['extra-anejo', 'extra-anejo'],
    ['cristalino', 'cristalino'],
    ['reposado', 'reposado'],
    // Rosado is a reposado finished in wine casks and drinks like its own
    // thing, so it stays its own answer rather than being folded in.
    ['rosado', 'rosado'],
    ['anejo', 'anejo'],
    ['blanco', 'blanco'],
    ['plata', 'blanco'],
    ['silver', 'blanco'],
    ['joven', 'blanco']
  ];

  /* The agave spirits `agave_kind` can name. Anything else the field says is
   * carried as the catch-all rather than dropped, so a category nobody has
   * thought of yet still reaches a guest. */
  var KINDS = ['tequila', 'mezcal', 'sotol', 'raicilla', 'bacanora'];

  /* `agave_region` is free text on the card, so it is shown as written and
   * only the two everyday cases get a German word. Everything else is passed
   * through untouched rather than forced into a bucket it does not fit. */
  /* The sections this app is responsible for, as a keyword rather than a
   * title, because the head barkeeper renames them as the card moves. Taken
   * from the 08.09.2026 data spec, which names "Tequila & Mezcal Neat" and
   * "Tequila Cocktails" for this app.
   *
   * This can only ADD. An item is relevant if it carries agave evidence of
   * its own OR sits in one of these sections, so renaming a section can
   * never lose a bottle, and a Margarita that moves to Klassiker keeps
   * being a Margarita. */
  var SECTION = /tequila|mezcal|mescal|agave/i;

  var REGIONS = {
    'highland': 'highland', 'los altos': 'highland', 'hochland': 'highland',
    'lowland': 'lowland', 'valles': 'lowland', 'tiefland': 'lowland'
  };

  /* Character, derived from the ingredient list and from nothing else.
   *
   * This is a stopgap and it is documented as one. The Menu API carries no
   * flavour field yet (see docs/menu-api-felder-tequila.md), so until it
   * does, the app reads the ingredients a guest can see on the card anyway.
   * Reading "Limette" as sour is not inventing a flavour, it is reading one,
   * and every reason the app prints names the ingredient it came from so a
   * guest can check the claim.
   *
   * The tag values are the cocktail card's own flavour vocabulary, so the
   * day `flavour_tags` lands, it drops straight in and this dictionary
   * stops being consulted. `tagsOf` already prefers the real field. */
  var CHARACTER = {
    'sauer/zitrus': ['limette', 'lime', 'zitrone', 'lemon', 'grapefruit', 'yuzu', 'pampelmuse'],
    'bitter': ['campari', 'wermut', 'vermouth', 'bitters', 'angostura', 'aperol', 'amaro', 'cynar'],
    'süß': ['cointreau', 'triple sec', 'curacao', 'amaretto', 'likor', 'liqueur', 'sirup',
            'syrup', 'agave', 'honig', 'honey', 'zucker', 'sugar', 'grenadine'],
    'prickelnd': ['soda', 'tonic', 'mineralwasser', 'mineral water', 'sprudel', 'prosecco',
                  'sekt', 'ginger beer', 'thomas henry', 'fever tree', 'wild berry'],
    'rauchig': ['mezcal', 'mescal'],
    'scharf': ['chili', 'tajin', 'jalapeno', 'habanero', 'pfeffer', 'pepper'],
    'fruchtig': ['maracuja', 'passion', 'ananas', 'pineapple', 'kirsch', 'cherry', 'mango',
                 'beere', 'berry', 'erdbeer', 'strawberry', 'himbeer', 'raspberry',
                 'wassermelone', 'watermelon', 'pfirsich', 'peach', 'hibiskus', 'hibiscus'],
    'salzig': ['salz', 'salt', 'tajin'],
    'kräuterig/frisch': ['koriander', 'coriander', 'minze', 'mint', 'basilikum', 'basil',
                         'gurke', 'cucumber', 'rosmarin', 'rosemary', 'thymian', 'thyme'],
    // 'eiweiss' with ss only. norm() folds the sharp s, so a second entry
    // spelled with one would be dead weight the tests reject.
    'cremig': ['eiweiss', 'egg white', 'sahne', 'cream', 'kokos', 'coconut']
  };

  /* The Menu API's own strength words, folded onto a three stop scale. The
   * English and the longer German words are accepted too, because the field
   * is free text and costs nothing to be forgiving about. Anything else,
   * including the empty string, is null and scores neutral rather than
   * being guessed at. */
  var STRENGTH = {
    // The 08.09.2026 spec's vocabulary is leicht, mittel, stark, alkoholfrei.
    // The older words are kept because they cost nothing and the card has
    // used them. Zero proof scores as itself rather than as unknown, even
    // though no agave spirit will ever be it.
    'alkoholfrei': 0, 'alcohol free': 0, 'alkoholfei': 0,
    'mild': 1, 'leicht': 1, 'light': 1,
    'mittel': 2, 'medium': 2,
    'stark': 3, 'kraftig': 3, 'bold': 3, 'strong': 3
  };

  /* Ingredients too common to tell two drinks apart. Naming one of these as
   * the difference between two recommendations would be true and useless.
   *
   * The agave spirit itself is handled separately by isAgaveWord, because on
   * this card every single item has one. "Take this one, it has tequila in
   * it" is not a reason to take anything. */
  var GENERIC_ING = [
    'eis', 'ice', 'soda', 'mineralwasser', 'mineral water', 'sprudel',
    'limette', 'lime', 'zitrone', 'lemon', 'zucker', 'sugar', 'agave', 'salz', 'salt'
  ];

  // ------------------------------------------------------------- helpers --

  /* Lower case, no diacritics, so "Anejo", "Añejo" and "ANEJO" are one
   * thing. The cocktail export spells the same bottle both ways and it cost
   * that drink its spirit once already. */
  function norm(s) {
    return String(s == null ? '' : s)
      .toLowerCase()
      .replace(/ß/g, 'ss')
      .normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  function list(v) { return Array.isArray(v) ? v : (v == null || v === '' ? [] : [v]); }

  function has(hay, needle) { return hay.indexOf(needle) !== -1; }

  /* Does this bit of text name an agave spirit. Used where naming the spirit
   * would be a non answer, since everything this app recommends has one. */
  function isAgaveWord(text) {
    var n = norm(text);
    for (var i = 0; i < SPIRIT_WORDS.length; i++) {
      if (has(n, SPIRIT_WORDS[i])) return true;
    }
    for (var j = 0; j < BRANDS.length; j++) {
      if (has(n, BRANDS[j][0])) return true;
    }
    return false;
  }

  /* Two haystacks, and the difference between them matters.
   *
   * `bottle` is the item's own name and its ingredients. It is what a bottle
   * IS, and it is the only thing allowed to decide which spirit is in the
   * glass or how it was aged.
   *
   * `shelf` adds the group. A group is the heading a bottle sits under, so it
   * is good evidence that there is agave nearby and poor evidence of anything
   * more specific. The real card calls the section "Tequila & Mezcal Neat",
   * and reading that as the bottle would make every Don Julio on it a mezcal.
   *
   * Neither reads prose. `description` and `bartender_note` are sentences. */
  function bottle(item) {
    return [item.name, item.name_en]
      .concat(list(item.ingredients), list(item.ingredients_en))
      .map(norm).join(' | ');
  }

  function shelf(item) {
    return bottle(item) + ' | ' + norm(item.group) + ' | ' + norm(item.group_en);
  }

  // ---------------------------------------------------------- derivation --

  /* A brand is a property of the bottle and never of the shelf it stands on. */
  function brandOf(item) {
    if (typeof item.brand === 'string' && item.brand) return item.brand;
    var hay = bottle(item);
    for (var i = 0; i < BRANDS.length; i++) {
      if (has(hay, BRANDS[i][0])) return BRANDS[i][1];
    }
    return '';
  }

  /* Is there an agave distillate in this glass. Four kinds of evidence, none
   * of them a section title. The card saying so outright beats all of them. */
  function isAgave(item) {
    if (!item) return false;
    if (typeof item.agave_kind === 'string' && item.agave_kind) return true;
    if (typeof item.agave_expression === 'string' && item.agave_expression) return true;
    var hay = shelf(item);
    for (var i = 0; i < SPIRIT_WORDS.length; i++) {
      if (has(hay, SPIRIT_WORDS[i])) return true;
    }
    if (brandOf(item)) return true;
    var group = norm(item.group) + ' | ' + norm(item.group_en);
    for (var j = 0; j < GROUP_WORDS.length; j++) {
      if (has(group, GROUP_WORDS[j])) return true;
    }
    return false;
  }

  /* Tequila, mezcal, or an agave spirit we can see but cannot name more
   * precisely. Mezcal wins where both appear in the same glass, because the
   * smoke is the thing a guest will notice. */
  function kindOf(item) {
    var given = matchKind(spiritFields(item).kind);
    if (given) return given;

    var hay = bottle(item);
    if (has(hay, 'mezcal') || has(hay, 'mescal')) return 'mezcal';
    if (has(hay, 'tequila')) return 'tequila';
    // Every brand in the list is a tequila house unless its own name says
    // otherwise, which the mezcal check above has already caught.
    if (brandOf(item)) return 'tequila';

    /* Last resort, the shelf, and only when the shelf holds one kind. A
     * section called "Tequila" tells you what a bottle is. A section called
     * "Tequila & Mezcal Neat" tells you nothing about which of the two this
     * one is, so it is not allowed to guess. */
    var group = norm(item.group) + ' | ' + norm(item.group_en);
    var smoky = has(group, 'mezcal') || has(group, 'mescal');
    var agaved = has(group, 'tequila');
    if (smoky && !agaved) return 'mezcal';
    if (agaved && !smoky) return 'tequila';
    return 'agave';
  }

  /* The card's own word where it has one, the bottle name where it does not.
   *
   * `agave_expression` arrives written for a person, so "Añejo" and
   * "Extra Añejo" come back as the keys `anejo` and `extra-anejo`. That is
   * the same table the name is read with, which is the point. A value the
   * table does not know is kept as its own key rather than thrown away, so a
   * new expression groups correctly and simply shows as written. */
  function expressionOf(item) {
    var given = spiritFields(item).expression;
    if (given) return matchExpression(given) || given.replace(/\s+/g, '-');
    return matchExpression(bottle(item)) || '';
    // Unknown stays unknown. "Margarita" says tequila and no more.
  }

  function matchExpression(hay) {
    for (var i = 0; i < EXPRESSIONS.length; i++) {
      if (has(hay, EXPRESSIONS[i][0])) return EXPRESSIONS[i][1];
    }
    return '';
  }

  function matchKind(hay) {
    for (var i = 0; i < KINDS.length; i++) {
      if (has(hay, KINDS[i])) return KINDS[i];
    }
    return '';
  }

  /* `agave_kind` and `agave_expression`, read whichever way round they arrive.
   *
   * Dan's own example has agave_kind "Tequila" and agave_expression "Añejo".
   * The data spec's field table glosses them the other way round. Rather than
   * pick one and be wrong half the time, the two values are recognised by
   * what they SAY. A value naming a spirit is the kind, a value naming a
   * maturation is the expression, whichever key it arrived under.
   *
   * This is a compatibility shim, not a design. It should come out once the
   * generator and the doc agree. */
  function spiritFields(item) {
    var a = norm(item.agave_kind).trim();
    var b = norm(item.agave_expression).trim();
    if (!matchKind(a) && matchExpression(a) && matchKind(b)) {
      return { kind: b, expression: a };
    }
    return { kind: a, expression: b };
  }

  /* Where the agave grew, as the card writes it, plus a key for the two
   * everyday cases so the interface can say Hochland rather than Highland. */
  function regionOf(item) {
    var raw = typeof item.agave_region === 'string' ? item.agave_region.trim() : '';
    if (!raw) return null;
    var n = norm(raw);
    var key = '';
    Object.keys(REGIONS).forEach(function (word) {
      if (!key && has(n, word)) key = REGIONS[word];
    });
    return { text: raw, key: key };
  }

  /* Additive free, unknown, or additives. Three states and not two, because
   * a card that does not say is not a card that says no. */
  function additiveFreeOf(item) {
    if (item.additive_free === true) return true;
    if (item.additive_free === false) return false;
    return null;
  }

  /* A pour or a mixed drink. One ingredient is a pour with a note against
   * it, two or more is something built. The cocktail app uses the same
   * field to decide what it can score at all, which is why this stays a
   * data test rather than a list of section names. */
  function isPour(item) {
    return list(item.ingredients).length < 2;
  }

  function strengthOf(item) {
    var key = norm(item.strength).trim();
    return Object.prototype.hasOwnProperty.call(STRENGTH, key) ? STRENGTH[key] : null;
  }

  /**
   * Character tags, and where each one came from.
   * Prefers the Menu API's own `flavour_tags` the moment that field exists,
   * and falls back to reading the ingredient list until it does.
   * @returns {{tags:string[], from:Object}} from maps tag -> the ingredient
   *   that triggered it, or '' when the field supplied it directly.
   */
  function tagsOf(item) {
    var given = list(item.flavour_tags);
    if (given.length) {
      var from = {};
      given.forEach(function (t) { from[t] = ''; });
      return { tags: given.slice(), from: from };
    }

    var ings = list(item.ingredients).concat(list(item.ingredients_en));
    var tags = [], source = {};
    Object.keys(CHARACTER).forEach(function (tag) {
      for (var i = 0; i < ings.length; i++) {
        var n = norm(ings[i]);
        for (var j = 0; j < CHARACTER[tag].length; j++) {
          if (has(n, CHARACTER[tag][j])) {
            tags.push(tag);
            source[tag] = ings[i];
            return;
          }
        }
      }
    });

    // Mezcal is smoky whether or not it is spelled out in an ingredient
    // list, which a neat pour has none of.
    if (kindOf(item) === 'mezcal' && tags.indexOf('rauchig') === -1) {
      tags.push('rauchig');
      source['rauchig'] = item.name;
    }
    return { tags: tags, from: source };
  }

  function priceOf(item) {
    var rows = list(item.prices).filter(function (p) { return typeof p.price === 'number'; });
    if (!rows.length) return typeof item.price === 'number' ? item.price : null;
    return rows.reduce(function (lo, p) { return p.price < lo ? p.price : lo; }, rows[0].price);
  }


  /* Budget stops, derived from what the card actually costs rather than from
   * three round numbers somebody typed once and never revisited.
   *
   * Two thresholds that split the agave items into roughly thirds, each
   * rounded up to a whole euro so the label reads like something a guest
   * would say. Returns fewer stops, or none at all, when the card does not
   * spread far enough to be worth asking about, and the question then does
   * not appear. */
  function budgetStops(items) {
    var prices = items.map(function (d) { return d.price; })
      .filter(function (p) { return typeof p === 'number'; })
      .sort(function (a, b) { return a - b; });
    if (prices.length < 3) return [];

    var stops = [1 / 3, 2 / 3].map(function (q) {
      return Math.ceil(prices[Math.floor((prices.length - 1) * q)]);
    });
    var top = Math.ceil(prices[prices.length - 1]);
    return stops.filter(function (v, i) {
      return stops.indexOf(v) === i && v < top;
    });
  }

  /* Is this item this app's business. Its own evidence, or the shelf it sits
   * on, and the shelf can only add. See SECTION above. */
  function isRelevant(item, sourceApi) {
    if (!item) return false;
    if (isAgave(item)) return true;
    var src = sourceApi || root.BBMenuSource;
    return !!(src && src.inSection(item, SECTION));
  }

  /**
   * One item, as the recommender wants it.
   * @param {Object} item  a Menu API item, section already carried down by
   *                       BBMenuSource.allItems
   * @returns {Object|null} null when it is not this app's business
   */
  function derive(item) {
    if (!isRelevant(item)) return null;
    var brand = brandOf(item);
    var character = tagsOf(item);
    return {
      // straight from the source, never rewritten
      item: item,
      id: (item.pos_sku || '') + '#' + item.name,
      name: item.name,
      price: priceOf(item),
      allergens: list(item.allergens),
      rank: typeof item.popularity_rank === 'number' ? item.popularity_rank : 9999,
      ing: list(item.ingredients),
      // The card's own leader for its section, one per section, shown the way
      // the website shows it. A marker, never a ranking input.
      recommended: item.recommended === true,
      image: (typeof item.image === 'string' && item.image) ? item.image : null,

      /* `menu_class` is deliberately absent. It is BarPatrol's margin and
       * popularity bucket, the spec says do not show it to a guest, and the
       * surest way to honour that is for the interface never to be handed
       * it. There is a test asserting it does not appear here. */

      // the card's own fields where it has them, the vocabularies above
      // where it does not
      kind: kindOf(item),
      expression: expressionOf(item),
      brand: brand,
      portfolio: PORTFOLIO[brand] || '',
      region: regionOf(item),
      additiveFree: additiveFreeOf(item),
      pour: isPour(item),
      strength: strengthOf(item),
      tags: character.tags,
      tagFrom: character.from
    };
  }

  /* Everything on the card that has agave in it, in the card's own order.
   * The order of sections and items is the display order and is not
   * resorted here, only filtered. */
  function agaveItems(menu, sourceApi) {
    var src = sourceApi || root.BBMenuSource;
    return src.allItems(menu)
      .filter(function (i) { return isRelevant(i, src); })
      .map(derive)
      .filter(Boolean);
  }

  var api = {
    derive: derive, agaveItems: agaveItems,
    isAgave: isAgave, isRelevant: isRelevant, spiritFields: spiritFields,
    matchKind: matchKind, matchExpression: matchExpression, kindOf: kindOf, expressionOf: expressionOf, brandOf: brandOf,
    isPour: isPour, strengthOf: strengthOf, tagsOf: tagsOf, priceOf: priceOf, norm: norm,
    isAgaveWord: isAgaveWord, regionOf: regionOf, additiveFreeOf: additiveFreeOf,
    bottle: bottle, shelf: shelf,
    budgetStops: budgetStops,
    SPIRIT_WORDS: SPIRIT_WORDS, BRANDS: BRANDS, PORTFOLIO: PORTFOLIO,
    EXPRESSIONS: EXPRESSIONS, KINDS: KINDS, REGIONS: REGIONS, SECTION: SECTION,
    CHARACTER: CHARACTER, GENERIC_ING: GENERIC_ING, STRENGTH: STRENGTH
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.BBAgave = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
