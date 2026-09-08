/*
 * BrunnenBar Tequila — interface
 * =========================================================================
 * Vanilla JS, no build step, no dependencies, plain script tags, so the page
 * works opened straight off disk and on an iPad behind the bar.
 *
 * Unlike the cocktail app, this one reads the live Menu API on every visit
 * through assets/menu-source.js, which is what the brief asks for. Nothing
 * about the card is bundled with this app. That means three states the
 * cocktail app never had to draw, and all three are drawn here rather than
 * left to a spinner. Loading, the card not coming through at all, and the
 * card coming from this browser's own last response, which is shown with
 * its age against it.
 * =========================================================================
 */
(function () {
  'use strict';

  var SOURCE = window.BBMenuSource;
  var AGAVE = window.BBAgave;
  var ENGINE = window.BBTequilaEngine;
  var QUESTIONS = window.BBTequilaQuestions.QUESTIONS;
  var UI = window.BBTequilaQuestions.UI;
  var CARD_URL = 'https://brunnenbar.com/cocktailkarte/';

  // Rank at or under which the card calls something a bestseller.
  var BESTSELLER_RANK = 10;

  /* How many things a guest has to have asked about before a match
   * percentage says anything. Answer one question and everything that
   * matches it scores the same, which is three cards reading 99 per cent. */
  var MATCH_MIN_DIMENSIONS = 2;

  var state = {
    lang: 'de',
    screen: 'loading',       // loading | error | intro | quiz | results
    step: 0,
    answers: {},
    seed: Math.floor(Math.random() * 100000),
    showAll: false,
    items: [],               // derived agave items, card order
    stale: null,             // {ageMs} when this is the browser's last response
    error: null
  };

  var stage = document.getElementById('stage');
  var liveRegion = document.getElementById('live');

  // ------------------------------------------------------------- helpers --

  function t() { return UI[state.lang]; }
  function L(obj) { return obj ? obj[state.lang] : ''; }
  function fill(str, vars) {
    return String(str).replace(/\{(\w+)\}/g, function (m, k) {
      return vars && vars[k] != null ? vars[k] : m;
    });
  }
  /* English where the card has it, German where it does not, decided per
   * field so a half translated item does not revert wholesale. */
  function f(item, key) { return SOURCE.field(item, key, state.lang); }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k === 'class') node.className = v;
        else if (k === 'text') node.textContent = v;
        else if (k.slice(0, 2) === 'on') node.addEventListener(k.slice(2).toLowerCase(), v);
        else node.setAttribute(k, v === true ? '' : v);
      });
    }
    (children || []).forEach(function (c) {
      if (c == null || c === false) return;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  }

  function announce(msg) { if (liveRegion) liveRegion.textContent = msg; }

  /* What is still reachable given the answers so far.
   *
   * Only the neat-or-mixed answer comes before the questions that build
   * themselves, and it halves the card. A guest who said "pur" should not be
   * offered a flavour only a cocktail has, or a budget stop only a cocktail
   * sits under. The engine's own gate decides, so there is one implementation
   * of what "pur" means rather than two that drift.
   *
   * The engine may still relax that gate when nothing neat survives the hard
   * rules. That is a different job. This decides what to ask, not what to
   * offer in the end. */
  function reachableItems() {
    return state.items.filter(function (d) {
      return ENGINE.passesServeGate(d, state.answers);
    });
  }

  /* Recomputed rather than cached, because the questions that build
   * themselves appear and disappear with the answers before them. */
  function activeQuestions() {
    var pool = reachableItems();
    return QUESTIONS.filter(function (q) {
      return !(q.skipIf && q.skipIf(state.answers, pool));
    });
  }

  function optionsOf(q) {
    return q.optionsFrom ? q.optionsFrom(reachableItems(), state.lang) : q.options;
  }

  /* Static copy is a {de, en} pair, generated copy is already a string. */
  function txt(v) { return typeof v === 'string' ? v : L(v); }

  function isAnswered(q) {
    var v = state.answers[q.id];
    return q.type === 'multi' ? Array.isArray(v) && v.length > 0 : v != null && v !== '';
  }

  function ageText(ms) {
    var min = Math.round(ms / 60000);
    if (min < 5) return t().ageJustNow;
    if (min < 90) return fill(t().ageMinutes, { n: min });
    var hours = Math.round(min / 60);
    if (hours < 36) return fill(t().ageHours, { n: hours });
    return fill(t().ageDays, { n: Math.round(hours / 24) });
  }

  function render() {
    stage.innerHTML = '';
    var view = {
      loading: renderLoading, error: renderError, intro: renderIntro,
      quiz: renderQuiz, results: renderResults
    }[state.screen];
    stage.appendChild(view());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ------------------------------------------------------------ the load --

  function load(force) {
    state.screen = 'loading';
    state.error = null;
    render();
    SOURCE.loadMenu({ force: !!force }).then(function (res) {
      state.items = AGAVE.agaveItems(res.menu, SOURCE);
      state.stale = res.fromCache ? { ageMs: res.ageMs } : null;
      state.screen = 'intro';
      render();
    }, function (err) {
      /* No bundled copy to fall back on, on purpose. A card that shipped
       * with the app is wrong the moment a price changes and wrong
       * silently, so the honest answer here is to say so and point at the
       * bar. */
      state.error = err;
      state.screen = 'error';
      render();
    });
  }

  function renderLoading() {
    return el('section', { class: 'intro' }, [
      el('h1', { text: t().title }),
      el('hr', { class: 'rule' }),
      el('p', { class: 'lede', text: t().loading })
    ]);
  }

  function renderError() {
    return el('section', { class: 'intro' }, [
      el('h1', { text: t().errorTitle }),
      el('hr', { class: 'rule' }),
      el('p', { class: 'lede', text: t().errorSub }),
      el('button', { class: 'btn btn-primary', type: 'button', text: t().retry,
        onClick: function () { load(true); } }),
      el('div', {}, [
        el('a', { class: 'link-card', href: CARD_URL, target: '_blank', rel: 'noopener', text: t().fullCard })
      ])
    ]);
  }

  // --------------------------------------------------------------- intro --

  function renderIntro() {
    var frag = document.createDocumentFragment();
    if (state.stale) {
      frag.appendChild(el('p', { class: 'notice',
        text: fill(t().stale, { age: ageText(state.stale.ageMs) }) }));
    }

    if (!state.items.length) {
      frag.appendChild(el('section', { class: 'intro' }, [
        el('h1', { text: t().nothingAgave }),
        el('hr', { class: 'rule' }),
        el('p', { class: 'lede', text: t().nothingAgaveSub }),
        el('div', {}, [
          el('a', { class: 'link-card', href: CARD_URL, target: '_blank', rel: 'noopener', text: t().fullCard })
        ])
      ]));
      return frag;
    }

    frag.appendChild(el('section', { class: 'intro' }, [
      el('h1', { text: t().title }),
      el('hr', { class: 'rule' }),
      el('p', { class: 'lede', text: t().lede }),
      el('button', {
        class: 'btn btn-primary', text: t().start,
        onClick: function () {
          state.screen = 'quiz';
          state.step = 0;
          state.answers = {};
          state.showAll = false;
          state.seed = Math.floor(Math.random() * 100000);
          render();
        }
      }),
      el('div', {}, [
        el('a', { class: 'link-card', href: CARD_URL, target: '_blank', rel: 'noopener', text: t().fullCard })
      ])
    ]));
    return frag;
  }

  // ---------------------------------------------------------------- quiz --

  function renderQuiz() {
    var qs = activeQuestions();
    var q = qs[state.step];
    if (!q) { state.step = Math.max(0, qs.length - 1); q = qs[state.step]; }

    var frag = document.createDocumentFragment();

    var pct = ((state.step + 1) / qs.length) * 100;
    frag.appendChild(el('div', { class: 'progress' }, [
      el('div', { class: 'progress-track' }, [
        el('div', { class: 'progress-fill', style: 'width:' + pct + '%' })
      ]),
      el('p', { class: 'progress-label', text: fill(t().step, { n: state.step + 1, total: qs.length }) })
    ]));

    frag.appendChild(el('h2', { class: 'q-title', text: L(q.title) }));
    if (q.sub) frag.appendChild(el('p', { class: 'q-sub', text: L(q.sub) }));
    frag.appendChild(q.type === 'scale' ? renderScale(q) : renderOptions(q));

    var nav = el('div', { class: 'nav' });
    if (state.step > 0) {
      nav.appendChild(el('button', { class: 'btn btn-ghost', type: 'button', text: t().back,
        onClick: function () { state.step--; render(); } }));
    }
    var right = el('div', { class: 'nav-right' });
    if (q.optional) {
      right.appendChild(el('button', {
        class: 'btn-quiet', type: 'button', text: t().skip,
        onClick: function () {
          state.answers[q.id] = q.type === 'multi' ? [] : '';
          advance();
        }
      }));
    }
    if (q.type === 'multi') {
      right.appendChild(el('button', {
        class: 'btn btn-primary', type: 'button', text: t().next,
        disabled: !q.optional && !isAnswered(q), onClick: advance
      }));
    }
    nav.appendChild(right);
    frag.appendChild(nav);
    return frag;
  }

  function renderOptions(q) {
    var opts = optionsOf(q);
    var multi = q.type === 'multi';
    var current = state.answers[q.id];
    var wrap = el('div', {
      class: 'options' + (opts.length > 4 ? ' cols-2' : ''),
      role: multi ? 'group' : 'radiogroup', 'aria-label': L(q.title)
    });
    opts.forEach(function (opt) {
      var selected = multi
        ? Array.isArray(current) && current.indexOf(opt.value) !== -1
        : current === opt.value;
      wrap.appendChild(el('button', {
        class: 'option' + (opt.wide ? ' option-wide' : ''), type: 'button',
        'aria-pressed': selected ? 'true' : 'false',
        onClick: function () { choose(q, opt.value); }
      }, [
        el('span', { class: 'option-mark', 'aria-hidden': 'true' }),
        el('span', { class: 'option-body' }, [
          el('span', { class: 'option-label', text: txt(opt.label) }),
          opt.hint && el('span', { class: 'option-hint', text: txt(opt.hint) })
        ])
      ]));
    });
    return wrap;
  }

  /* Filled pips read as intensity however the grid wraps, which a single
   * rising bar stops doing the moment a label breaks onto two lines. */
  function renderScale(q) {
    var opts = optionsOf(q);
    var current = state.answers[q.id];
    var wrap = el('div', { class: 'scale', role: 'radiogroup', 'aria-label': L(q.title) });
    opts.forEach(function (opt, i) {
      var pips = el('span', { class: 'pips', 'aria-hidden': 'true' });
      for (var n = 0; n < opts.length; n++) {
        pips.appendChild(el('i', { class: n <= i ? 'pip on' : 'pip' }));
      }
      wrap.appendChild(el('button', {
        class: 'scale-stop', type: 'button',
        'aria-pressed': current === opt.value ? 'true' : 'false',
        onClick: function () { choose(q, opt.value); }
      }, [pips, el('span', { class: 'scale-label', text: txt(opt.label) })]));
    });
    return wrap;
  }

  function choose(q, value) {
    if (q.type === 'multi') {
      var opts = optionsOf(q);
      var listNow = Array.isArray(state.answers[q.id]) ? state.answers[q.id].slice() : [];
      var picked = opts.filter(function (o) { return o.value === value; })[0];
      var exclusive = opts.filter(function (o) { return o.exclusive; })
        .map(function (o) { return o.value; });

      if (picked && picked.exclusive) {
        // Handing the choice back replaces every other pick, and toggles off.
        listNow = listNow.indexOf(value) === -1 ? [value] : [];
      } else {
        var at = listNow.indexOf(value);
        if (at === -1) listNow.push(value); else listNow.splice(at, 1);
        listNow = listNow.filter(function (v) { return exclusive.indexOf(v) === -1; });
      }
      state.answers[q.id] = listNow;
      render();
      return;
    }
    state.answers[q.id] = value;
    advance();
  }

  function advance() {
    var qs = activeQuestions();
    if (state.step >= qs.length - 1) {
      state.screen = 'results';
      state.showAll = false;
      render();
      announce(t().results);
    } else {
      state.step++;
      render();
    }
  }

  // ------------------------------------------------------------- results --

  /* The card carries its own English ingredient list, matched to the German
   * one by position, so an ingredient read back to a guest is the bar's own
   * word for it and never ours. */
  function ingIn(d, ing) {
    if (state.lang !== 'en') return ing;
    var at = d.ing.indexOf(ing);
    var en = (d.item.ingredients_en) || [];
    return at !== -1 && en[at] ? en[at] : ing;
  }

  function reasonText(r, d) {
    if (r.key === 'kind') return fill(t().reasons.kind, { x: t().kindNames[r.x] || r.x });
    if (r.key === 'expression') {
      return fill(t().reasons.expression, { x: t().expressionNames[r.x] || r.x });
    }
    if (r.key === 'character') {
      var names = String(r.x).split(', ').map(function (c) {
        return t().characterNames[c] || c;
      }).join(t().and);
      /* Name the ingredient the character was read off, so a guest can check
       * the claim against the ingredient list on the same card. */
      var from = (r.from || []).filter(Boolean).map(function (i) { return ingIn(d, i); });
      if (!from.length) return fill(t().reasons.character, { x: names });
      return fill(t().reasons.characterFrom, { x: names, from: from.join(', ') });
    }
    var copy = t().reasons[r.key];
    return copy ? fill(copy, { x: r.x }) : null;
  }

  /* A runner up earns its place by being different, so it is labelled with
   * the difference rather than with "also a good fit". */
  function contrastLabel(row) {
    var c = row.contrast;
    if (!c) return t().alsoGood;
    var copy = t().contrast[c.kind];
    if (!copy) return t().alsoGood;
    var x = c.value;
    if (c.kind === 'expression') x = t().expressionNames[c.value] || c.value;
    if (c.kind === 'character') x = t().characterCompare[c.value] || c.value;
    /* The region phrase is looked up whole where we have a word for it,
     * because German will not take a preposition and a free text slot. */
    if (c.kind === 'region') {
      var whole = t().regionContrast[c.value];
      if (whole) return whole;
    }
    if (c.kind === 'ingredient') x = ingIn(row.drink, c.value);
    return fill(copy, { x: x });
  }

  /* Years only where they divide exactly, months otherwise. Thirty months is
   * thirty months, and rounding it to "three years" would be a small lie
   * about the one number a guest asked for. */
  function agedText(months) {
    return (months >= 24 && months % 12 === 0)
      ? fill(t().agedYears, { n: months / 12 })
      : fill(t().agedMonths, { n: months });
  }

  /* German decimal comma, and no trailing zero on a whole number. 38 % reads
   * like a bottle label, 38,0 % reads like a spreadsheet. */
  function abvText(n) {
    var s = (Math.round(n * 10) / 10).toFixed(1).replace(/\.0$/, '').replace('.', ',');
    return s + ' %';
  }

  function styleText(d) {
    var parts = [];
    if (d.expression) parts.push(t().expressionNames[d.expression] || d.expression);
    parts.push(t().kindNames[d.kind] || d.kind);
    return parts.join(' ');
  }

  function renderCard(row, rank, showMatch) {
    var d = row.drink;
    var item = d.item;
    var hero = rank === 0;

    var badges = el('div', { class: 'badges' });
    if (d.brand) badges.appendChild(el('span', { class: 'badge accent', text: d.brand }));
    // The card's own leader for its section, shown the way the website shows
    // it. A marker the bar set, never something this app worked out.
    if (d.recommended) badges.appendChild(el('span', { class: 'badge accent', text: t().leaderBadge }));
    if (d.rank <= BESTSELLER_RANK) badges.appendChild(el('span', { class: 'badge accent', text: t().bestseller }));
    if (d.kind === 'mezcal') badges.appendChild(el('span', { class: 'badge good', text: t().smokyBadge }));
    /* Only a card that says so outright earns this. Unknown is not a yes,
     * and it is the first thing an agave drinker looks for. */
    if (d.additiveFree === true) badges.appendChild(el('span', { class: 'badge good', text: t().cleanBadge }));
    if (d.pour) badges.appendChild(el('span', { class: 'badge good', text: t().neatBadge }));
    if (item.on_printed_menu === false) badges.appendChild(el('span', { class: 'badge quiet', text: t().notOnCard }));

    /* The card's own photo, linked rather than copied, so a new bottle shot
     * is live without an app update. `image` is a URL or null, so the frame
     * is omitted entirely rather than filled with a placeholder. */
    function shot(small) {
      if (!d.image) return null;
      return el('figure', { class: 'shot' + (small ? ' shot-sm' : '') }, [
        el('img', { src: d.image, alt: '', loading: 'lazy', decoding: 'async' })
      ]);
    }

    var head = [
      el('p', { class: 'card-rank', text: hero ? t().topPick : contrastLabel(row) }),
      el('div', { class: 'card-top' }, [
        el('h3', { text: f(item, 'name') }),
        // Only shown once the guest has said enough for it to separate one
        // suggestion from another. See `dimensions` in the engine.
        showMatch
          ? el('span', { class: 'match', text: fill(t().match, { n: row.match }) })
          : null
      ])
    ];

    /* The favourite gets the full frame above its name. A runner up gets a
     * thumbnail beside it, big enough to recognise a bottle by and small
     * enough that three suggestions do not read as a catalogue. */
    var children = hero
      ? [shot(false)].concat(head)
      : [d.image
          ? el('div', { class: 'card-lead' }, [shot(true), el('div', { class: 'card-lead-body' }, head)])
          : el('div', {}, head)];

    children = children.concat([
      badges.childNodes.length ? badges : null,
      f(item, 'description') && el('p', { class: 'note', text: f(item, 'description') })
    ]);

    if (hero && f(item, 'bartender_note')) {
      children.push(el('p', { class: 'house-note', text: f(item, 'bartender_note') }));
    }

    var meta = el('div', { class: 'meta' });
    function metaRow(key, val) {
      meta.appendChild(el('div', { class: 'meta-row' }, [
        el('span', { class: 'meta-key', text: key }),
        el('span', { class: 'meta-val', text: val })
      ]));
    }
    metaRow(t().styleLabel, styleText(d));
    // Shown as the card writes it, unless we have a word of our own for it.
    if (d.region) metaRow(t().regionLabel, t().regionNames[d.region.key] || d.region.text);
    if (d.agedMonths != null && d.agedMonths > 0) metaRow(t().agedLabel, agedText(d.agedMonths));
    if (d.abv != null) metaRow(t().abvLabel, abvText(d.abv));
    if (!d.pour) {
      var ings = f(item, 'ingredients') || [];
      if (ings.length) metaRow(t().ingredients, ings.join(' · '));
    }
    // Every size the card lists, formatted the German way, never a number
    // written into this app.
    var prices = SOURCE.priceList(item);
    if (prices.length) {
      meta.appendChild(el('div', { class: 'meta-row' }, [
        el('span', { class: 'meta-key', text: t().priceLabel }),
        el('span', { class: 'meta-val price', text: prices.join('   ') })
      ]));
    }
    children.push(meta);

    if (hero) {
      var why = el('ul', { class: 'why' });
      row.reasons.forEach(function (r) {
        var line = reasonText(r, d);
        if (line) why.appendChild(el('li', { text: line }));
      });
      if (why.childNodes.length) children.push(why);
    }

    return el('article', { class: 'card' + (hero ? ' hero' : ' alt') }, children);
  }

  function renderResults() {
    var res = ENGINE.recommend(state.items, state.answers, {
      seed: state.seed, limit: state.showAll ? 8 : 3
    });

    var frag = document.createDocumentFragment();
    if (state.stale) {
      frag.appendChild(el('p', { class: 'notice',
        text: fill(t().stale, { age: ageText(state.stale.ageMs) }) }));
    }

    frag.appendChild(el('div', { class: 'results-head' }, [
      el('h2', { text: res.items.length ? t().results : t().empty }),
      (res.items.length ? t().resultsSub : t().emptySub)
        ? el('p', { text: res.items.length ? t().resultsSub : t().emptySub })
        : null
    ].filter(Boolean)));

    if (res.relaxed === 'serve') {
      frag.appendChild(el('p', { class: 'notice', text: t().loosened }));
    }

    /* One decision for the whole result, so two cards never disagree about
     * whether a percentage is worth printing. */
    var showMatch = res.dimensions >= MATCH_MIN_DIMENSIONS;
    res.items.forEach(function (row, i) { frag.appendChild(renderCard(row, i, showMatch)); });

    var actions = el('div', { class: 'results-actions' });
    if (!state.showAll && res.total > res.items.length) {
      actions.appendChild(el('button', { class: 'btn btn-ghost', type: 'button', text: t().moreOptions,
        onClick: function () { state.showAll = true; render(); } }));
    }
    actions.appendChild(el('button', { class: 'btn btn-primary', type: 'button', text: t().restart,
      onClick: function () { state.screen = 'intro'; render(); } }));
    actions.appendChild(el('a', { class: 'btn btn-ghost', href: CARD_URL,
      target: '_blank', rel: 'noopener', text: t().fullCard }));
    frag.appendChild(actions);
    frag.appendChild(el('p', { class: 'foot', text: t().footer }));
    return frag;
  }

  // ------------------------------------------------------------- chrome ---

  function renderChrome() {
    var host = document.getElementById('lang-toggle');
    host.innerHTML = '';
    ['de', 'en'].forEach(function (code) {
      host.appendChild(el('button', {
        type: 'button', text: code.toUpperCase(),
        'aria-pressed': state.lang === code ? 'true' : 'false',
        'aria-label': code === 'de' ? 'Deutsch' : 'English',
        onClick: function () {
          state.lang = code;
          document.documentElement.lang = code;
          try { localStorage.setItem('bb-lang', code); } catch (e) { /* private mode */ }
          renderChrome();
          render();
        }
      }));
    });
  }

  // ---------------------------------------------------------------- init --

  try {
    var saved = localStorage.getItem('bb-lang');
    if (saved === 'de' || saved === 'en') state.lang = saved;
    else if ((navigator.language || '').slice(0, 2).toLowerCase() !== 'de') state.lang = 'en';
  } catch (e) { /* private mode, stay on the German default */ }

  document.documentElement.lang = state.lang;
  renderChrome();
  load(false);
})();
