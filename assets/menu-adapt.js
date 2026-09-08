/*
 * BrunnenBar — the live menu, in the shape the engine scores
 * =========================================================================
 * menu-source.js reads the one source and hands back exactly what was
 * published. This turns one of those items into a drink the engine can rank,
 * and nothing else. Kept separate so the reading and the reshaping can be
 * wrong independently, and so a field rename upstream is a change to one
 * file.
 *
 * Nothing here invents a value. If a field the questions score against is
 * missing, it says so through report() rather than defaulting to something
 * plausible, because a plausible default is how a question silently stops
 * meaning anything.
 * =========================================================================
 */
(function (root) {
  'use strict';

  var spiritsOf = (root.BBSpirits || require('./spirits.js')).spiritsOf;

  var STRENGTH = [
    { de: 'alkoholfrei', en: 'alcohol free' },
    { de: 'leicht',      en: 'light' },
    { de: 'mild',        en: 'mild' },
    { de: 'mittel',      en: 'medium' },
    { de: 'kräftig',     en: 'bold' },
    { de: 'stark',       en: 'strong' }
  ];

  /* The fields the seven questions score against. Everything else is display,
   * and display degrades on its own by falling back to German or omitting a
   * line. These do not degrade, they stop the question working. */
  var SCORED_FIELDS = ['flavour_tags', 'serve_style', 'moment', 'strength_level'];

  function slug(name) {
    return String(name || '').toLowerCase()
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function arr(v) { return Array.isArray(v) ? v : []; }

  /* A drink is alcohol free only when the card says so AND rates it at zero.
   * The two disagreeing means someone changed one and not the other, and the
   * safe reading of "maybe alcoholic" is "alcoholic". */
  function alcoholFreeOf(item) {
    return !!item.alcohol_free && item.strength_level === 0;
  }

  function adapt(item) {
    var level = typeof item.strength_level === 'number' ? item.strength_level : null;
    var free = alcoholFreeOf(item);
    var sp = spiritsOf(item.ingredients, free);
    var rank = typeof item.popularity_rank === 'number' ? item.popularity_rank : 9999;

    return {
      id: item.pos_sku ? 'sku-' + item.pos_sku : slug(item.name),
      name: item.name,
      nameEn: item.name_en || item.name,
      section: item.section, sectionEn: item.section_en,

      tagline: item.description, taglineEn: item.description_en,
      note: item.bartender_note, noteEn: item.bartender_note_en,
      ing: arr(item.ingredients), ingEn: arr(item.ingredients_en),
      glass: item.glass || '', glassEn: item.glass_en || '',
      image: (typeof item.image === 'string' && item.image) ? item.image : null,

      serve: item.serve_style || '',
      strength: level,
      strengthLabel: level != null && STRENGTH[level] ? STRENGTH[level].de : '',
      strengthLabelEn: level != null && STRENGTH[level] ? STRENGTH[level].en : '',
      flavours: arr(item.flavour_tags),
      moments: arr(item.moment),
      allergens: arr(item.allergens),
      alcoholFree: free,

      price: typeof item.price === 'number' ? item.price : null,
      prices: arr(item.prices),
      rank: rank,
      /* The API carries a rank, not a unit count. The engine only ever uses
       * this to nudge a proven drink ahead of an equally good match, so a
       * monotonic stand-in does the same job. It breaks ties, it does not
       * decide matches. */
      sold: rank < 9999 ? Math.max(1, 1000 - rank) : 0,
      onPrintedMenu: item.on_printed_menu !== false,
      base: sp.base, spirits: sp.spirits
    };
  }

  /* What is missing or unusable across the whole card, with examples.
   *
   * Two different faults, both silent without this. A field absent everywhere
   * means a question cannot mean anything. A value the questions do not offer
   * means one drink is unreachable, which is worse, because everything looks
   * fine until someone asks why that drink is never suggested. A single
   * transliterated "Spaeter Abend" once cost a drink the whole late night
   * path, and the old build hid it by quietly repairing it.
   *
   * Reported, never repaired. Fixing it here would fix it for one app and
   * leave the card wrong for the till, the printed menu and the other two. */
  function report(items, vocab) {
    var gaps = {}, unknown = {};
    SCORED_FIELDS.forEach(function (f) { gaps[f] = []; });

    items.forEach(function (item) {
      SCORED_FIELDS.forEach(function (f) {
        var v = item[f];
        if (v == null || v === '' || (Array.isArray(v) && !v.length)) gaps[f].push(item.name);
      });

      if (!vocab) return;
      Object.keys(vocab).forEach(function (f) {
        var vals = Array.isArray(item[f]) ? item[f] : (item[f] ? [item[f]] : []);
        vals.forEach(function (v) {
          if (vocab[f].indexOf(v) !== -1) return;
          (unknown[f] = unknown[f] || []).push(item.name + ': "' + v + '"');
        });
      });
    });

    var missing = Object.keys(gaps).filter(function (f) { return gaps[f].length; });
    var unreachable = Object.keys(unknown);
    return {
      total: items.length, gaps: gaps, missing: missing,
      unknown: unknown, unreachable: unreachable,
      ok: !missing.length && !unreachable.length
    };
  }

  var api = { adapt: adapt, report: report, SCORED_FIELDS: SCORED_FIELDS, STRENGTH: STRENGTH };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.BBMenuAdapt = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
