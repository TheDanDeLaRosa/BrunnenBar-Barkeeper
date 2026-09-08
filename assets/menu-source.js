/*
 * BrunnenBar — the one source
 * =========================================================================
 * Implements the Menu API brief. There is exactly one place drinks, prices,
 * descriptions and allergens come from, and this is the only file that talks
 * to it.
 *
 * Rules from the brief, encoded here rather than left to good intentions:
 *
 *   - Read only. Nothing is ever written back.
 *   - Never ship a bundled copy of the menu as a fallback. A stale copy that
 *     shipped with the app is wrong the moment a price changes, and wrong
 *     silently. The only fallback is the last response this browser actually
 *     received, shown with its age.
 *   - Do not repair encoding. If "&amp;" turns up in the payload the pipeline
 *     is broken upstream, and quietly fixing it here would hide that.
 *   - Never render content.rendered as HTML. Only the <pre> block is read.
 *
 * Exposed as window.BBMenuSource; also loadable in node for the tests.
 * =========================================================================
 */
(function (root) {
  'use strict';

  var MENU_URL = 'https://brunnenbar.com/wp-json/wp/v2/pages/217?_fields=content';

  /* How long a fetched menu is reused before going back to the network.
   * The Menu API doc asks for at most one request an hour, on the grounds
   * that the card changes a few times a week and not a few times a minute.
   * A guest who opens the app twice in an evening therefore fetches once. */
  var MAX_AGE_MS = 60 * 60 * 1000;

  var STORE_KEY = 'bb-menu-last-good';

  var BLOCK = /<pre id="bb-menu">([\s\S]*?)<\/pre>/;

  /* The payload escapes & < > as unicode escapes so WordPress cannot alter
   * them on render. Seeing an HTML entity instead means the publishing
   * pipeline changed and the data can no longer be trusted verbatim. */
  var ENTITY_CANARY = /&(amp|lt|gt|quot|#0?39);/;

  function extract(pageJson) {
    var rendered = pageJson && pageJson.content && pageJson.content.rendered;
    if (typeof rendered !== 'string') throw new Error('Menu: no content.rendered');
    var hit = rendered.match(BLOCK);
    if (!hit) throw new Error('Menu Block nicht gefunden');
    var raw = hit[1];
    if (ENTITY_CANARY.test(raw)) {
      throw new Error(
        'Menu: HTML entities in the payload. The publishing pipeline is broken. ' +
        'Reporting rather than repairing, per the brief.');
    }
    return JSON.parse(raw);
  }

  // ---------------------------------------------------------- local store --
  // Wrapped because storage throws outright in some privacy modes.

  function readLastGood() {
    try {
      var raw = root.localStorage && root.localStorage.getItem(STORE_KEY);
      if (!raw) return null;
      var saved = JSON.parse(raw);
      if (!saved || !saved.menu || !saved.fetchedAt) return null;
      return saved;
    } catch (e) { return null; }
  }

  function writeLastGood(menu) {
    try {
      root.localStorage.setItem(STORE_KEY, JSON.stringify({
        menu: menu, fetchedAt: new Date().toISOString()
      }));
    } catch (e) { /* full, or storage disabled. Not worth failing the load. */ }
  }

  // --------------------------------------------------------------- loading --

  var inFlight = null;
  var memo = null;          // { menu, fetchedAt }

  function fresh(now) {
    return memo && (now - Date.parse(memo.fetchedAt)) < MAX_AGE_MS;
  }

  /**
   * @param {Object} [opts] {force:boolean, fetchImpl:Function, now:number}
   * @returns {Promise<{menu:Object, fetchedAt:string, fromCache:boolean, ageMs:number}>}
   *   fromCache true means the network failed and this is the last response
   *   this browser received. The interface must say so, and say how old it is.
   */
  function loadMenu(opts) {
    opts = opts || {};
    var now = opts.now == null ? Date.now() : opts.now;
    var doFetch = opts.fetchImpl || (root.fetch && root.fetch.bind(root));

    if (!opts.force && fresh(now)) {
      return Promise.resolve({
        menu: memo.menu, fetchedAt: memo.fetchedAt, fromCache: false,
        ageMs: now - Date.parse(memo.fetchedAt)
      });
    }
    if (inFlight) return inFlight;

    inFlight = Promise.resolve()
      .then(function () {
        if (!doFetch) throw new Error('Menu: no fetch available');
        return doFetch(MENU_URL, { cache: 'no-store' });
      })
      .then(function (res) {
        if (!res.ok) throw new Error('Menu HTTP ' + res.status);
        return res.json();
      })
      .then(function (page) {
        var menu = extract(page);
        memo = { menu: menu, fetchedAt: new Date(now).toISOString() };
        writeLastGood(menu);
        return { menu: menu, fetchedAt: memo.fetchedAt, fromCache: false, ageMs: 0 };
      })
      .catch(function (err) {
        // Last resort is the last response THIS browser received, never a
        // copy that shipped with the app.
        var saved = readLastGood();
        if (!saved) throw err;
        return {
          menu: saved.menu, fetchedAt: saved.fetchedAt, fromCache: true,
          ageMs: now - Date.parse(saved.fetchedAt), error: err
        };
      })
      .then(function (out) { inFlight = null; return out; },
            function (err) { inFlight = null; throw err; });

    return inFlight;
  }

  /* True when the published menu differs from the one in hand.
   *
   * `content_hash` is the field to read, because it only moves when the
   * content moves. Every build stamps a fresh `published_at` whether anything
   * changed or not, so comparing timestamps would repaint the screen under a
   * guest for nothing. Older payloads without a hash fall back to the
   * timestamp rather than claiming nothing ever changes. */
  function hasChanged(current, incoming) {
    if (!current || !incoming) return true;
    if (current.content_hash || incoming.content_hash) {
      return current.content_hash !== incoming.content_hash;
    }
    return current.published_at !== incoming.published_at;
  }

  // ------------------------------------------------------------- rendering --

  /* German price formatting, from `prices` only. Never a hard-coded number,
   * and every size is shown. */
  function formatPrice(n) {
    return typeof n === 'number' ? n.toFixed(2).replace('.', ',') + ' €' : '';
  }

  function priceList(item) {
    var rows = (item && item.prices) || [];
    return rows.map(function (p) {
      return p.size ? p.size + '  ' + formatPrice(p.price) : formatPrice(p.price);
    });
  }

  /* English where the export has it, German where it does not, decided per
   * field so a half-translated item does not revert wholesale. */
  function field(item, key, lang) {
    if (lang === 'en') {
      var en = item[key + '_en'];
      if (typeof en === 'string' ? en : (en && en.length)) return en;
    }
    return item[key];
  }

  function allItems(menu) {
    return ((menu && menu.sections) || []).reduce(function (acc, s) {
      return acc.concat((s.items || []).map(function (i) {
        // Carry the section down, since scoring and display both want it,
        // without disturbing the order the brief says not to touch.
        return Object.assign({ section: s.title, section_en: s.title_en }, i);
      }));
    }, []);
  }

  /* Nothing is filtered above, and `hidden_on_card` in particular is not a
   * reason to withhold a row. The seat's data doc reads it as a till article,
   * the Menu API brief and Dan both read it as off the printed card, and the
   * payload settles it. Every row carrying the flag is a real drink, six of
   * the fifteen profiled whiskies and two of the tequila app's own house
   * drinks among them, while the genuine till entries carry it as false.
   *
   * A helper offering the stricter reading used to live here. It went,
   * because nothing called it and because a function named for the card
   * would have looked like the safe choice to whoever wrote the fourth app,
   * right up until it dropped ten drinks without saying so. */

  /* Which items the recommender can actually score.
   *
   * Deliberately not a list of section names. The brief forbids hard-coding
   * those, and a list would rot the first time a section is renamed or added.
   * The test is the data itself: a cocktail has an ingredient list, beer and
   * wine do not. That stays true however the card is reorganised. */
  function isScoreable(item) {
    return !!(item && item.ingredients && item.ingredients.length);
  }

  function scoreableItems(menu) {
    return allItems(menu).filter(isScoreable);
  }

  var api = {
    MENU_URL: MENU_URL, MAX_AGE_MS: MAX_AGE_MS, STORE_KEY: STORE_KEY,
    loadMenu: loadMenu, extract: extract, hasChanged: hasChanged,
    formatPrice: formatPrice, priceList: priceList, field: field, allItems: allItems,
    isScoreable: isScoreable, scoreableItems: scoreableItems,
    _reset: function () { memo = null; inFlight = null; }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.BBMenuSource = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
