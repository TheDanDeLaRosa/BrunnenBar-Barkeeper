/*
 * BrunnenBar — Whisky recommender, interface
 * =========================================================================
 * Vanilla JS, no build step, no dependencies. Loads as plain script tags so
 * the page also works opened straight off disk or on an iPad behind the bar.
 *
 * The bottles come from the live Menu API through the shared loader in
 * ../assets/menu-source.js, which is the only file in the project allowed to
 * talk to it. Nothing about the shelf is written into this app. If the card
 * cannot be reached, the page says so and shows the last answer this browser
 * itself received, with its age, and never a copy that shipped with the app.
 * =========================================================================
 */
(function () {
  'use strict';

  var SOURCE = window.BBMenuSource;
  var ENGINE = window.BBWhiskyEngine;
  var QUESTIONS = window.BBWhiskyQuestions.QUESTIONS;
  var UI = window.BBWhiskyQuestions.UI;
  var VALUE_EN = window.BBWhiskyQuestions.VALUE_EN;
  var CARD_URL = 'https://brunnenbar.com/cocktailkarte/';

  // Rank at or under which a bottle is called a favourite on its card.
  var LOVED_RANK = 10;

  /* Preview mode. Explicitly asked for with ?demo=1, loud on every screen,
   * and never reached by a failed fetch. It exists so the app can be looked
   * at before the shelf carries its profiles, and for nothing else. */
  var DEMO = /[?&]demo=1\b/.test(window.location.search);

  var state = {
    lang: 'de',
    screen: 'loading',
    step: 0,
    answers: {},
    seed: Math.floor(Math.random() * 100000),
    showAll: false,
    pool: [],
    questions: [],
    stale: null,       // {ageMs} when this is the last response, not a fresh one
    failed: false
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

  /* A field off the row itself, English where the card has it and German
   * where it does not, decided per field so a half translated bottle shows
   * English where it can instead of reverting wholesale. */
  function F(item, key) { return SOURCE.field(item, key, state.lang) || ''; }

  /* The same idea one level down, inside the whisky profile. */
  function P(item, key) {
    var p = ENGINE.profileOf(item) || {};
    if (state.lang === 'en') {
      var en = p[key + '_en'];
      if (typeof en === 'string' ? en : (en && en.length)) return en;
    }
    return p[key];
  }

  /* A single card value such as an origin or a cask, for the places where
   * one value is quoted on its own and there is no parallel English array to
   * read it out of. */
  function V(value) {
    if (state.lang !== 'en' || value == null) return value;
    return VALUE_EN[value] || value;
  }

  /* A profile value ready to show. English from the card where the card has
   * it, otherwise the German value put through the small translation table,
   * so a bottle nobody translated still reads as English where it can. */
  function LV(item, key) {
    var v = P(item, key);
    if (Array.isArray(v)) return v.map(V).join(' · ');
    return V(v) || '';
  }

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

  function humanAge(ms) {
    var mins = Math.round(ms / 60000);
    if (mins < 90) return fill(t().ageMinutes, { n: Math.max(1, mins) });
    var hours = Math.round(mins / 60);
    if (hours < 36) return fill(t().ageHours, { n: hours });
    return fill(t().ageDays, { n: Math.round(hours / 24) });
  }

  // ------------------------------------------------------------ questions --

  /* The flow the shelf can actually answer. The engine decides which
   * questions and which answers survive, this only turns the price bands it
   * hands back into something a guest can read. */
  function buildQuestions(pool) {
    return ENGINE.tailor(pool, QUESTIONS).map(function (cut) {
      var q = cut.q;
      if (!cut.bands) {
        return cut.options ? shallow(q, { options: cut.options }) : q;
      }
      var byValue = {};
      q.options.forEach(function (o) { byValue[o.value] = o; });
      return shallow(q, {
        type: 'single',
        options: cut.bands.map(function (b) {
          var tpl = byValue[b.value] || byValue['3'];
          return {
            value: b.value,
            label: {
              de: fill(tpl.label.de, { x: SOURCE.formatPrice(b.max) }),
              en: fill(tpl.label.en, { x: SOURCE.formatPrice(b.max) })
            },
            hint: tpl.hint
          };
        })
      });
    });
  }

  function shallow(base, over) {
    var out = {};
    Object.keys(base).forEach(function (k) { out[k] = base[k]; });
    Object.keys(over).forEach(function (k) { out[k] = over[k]; });
    return out;
  }

  function isAnswered(q) {
    var v = state.answers[q.id];
    return q.type === 'multi' ? Array.isArray(v) && v.length > 0 : v != null && v !== '';
  }

  function render() {
    stage.innerHTML = '';
    if (DEMO) stage.appendChild(el('p', { class: 'notice demo', text: t().demo }));
    if (state.screen === 'loading') stage.appendChild(renderLoading());
    else if (state.screen === 'error') stage.appendChild(renderError());
    else if (state.screen === 'intro') stage.appendChild(renderIntro());
    else if (state.screen === 'quiz') stage.appendChild(renderQuiz());
    else stage.appendChild(renderResults());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // -------------------------------------------------------- plain screens --

  function renderLoading() {
    return el('section', { class: 'intro' }, [
      el('h1', { text: t().title }),
      el('hr', { class: 'rule' }),
      el('p', { class: 'lede', text: t().loading })
    ]);
  }

  function renderError() {
    var noShelf = !state.failed;
    return el('section', { class: 'intro' }, [
      el('h1', { text: t().title }),
      el('hr', { class: 'rule' }),
      el('p', { class: 'lede', text: noShelf ? t().noData : t().offlineFail }),
      el('p', { class: 'q-sub', text: noShelf ? t().noDataSub : '' }),
      el('div', {}, [
        el('a', { class: 'link-card', href: CARD_URL, target: '_blank', rel: 'noopener', text: t().fullCard })
      ])
    ]);
  }

  // --------------------------------------------------------------- intro --

  function renderIntro() {
    var frag = document.createDocumentFragment();
    if (state.stale) {
      frag.appendChild(el('p', {
        class: 'notice', text: fill(t().offline, { x: humanAge(state.stale.ageMs) })
      }));
    }
    frag.appendChild(el('section', { class: 'intro' }, [
      el('h1', { text: t().title }),
      el('hr', { class: 'rule' }),
      el('p', { class: 'lede', text: t().lede }),
      el('button', {
        class: 'btn btn-primary', text: t().start,
        onClick: function () {
          // A shelf too small to ask anything about still deserves an answer.
          state.screen = state.questions.length ? 'quiz' : 'results';
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
    var qs = state.questions;
    var q = qs[state.step];
    if (!q) { state.step = Math.max(0, qs.length - 1); q = qs[state.step]; }
    if (!q) return renderResults();

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
      nav.appendChild(el('button', {
        class: 'btn btn-ghost', type: 'button', text: t().back,
        onClick: function () { state.step--; render(); }
      }));
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
        disabled: !q.optional && !isAnswered(q),
        onClick: advance
      }));
    }
    nav.appendChild(right);
    frag.appendChild(nav);

    return frag;
  }

  function renderOptions(q) {
    var multi = q.type === 'multi';
    var current = state.answers[q.id];
    var wrap = el('div', {
      class: 'options' + (q.options.length > 4 ? ' cols-2' : ''),
      role: multi ? 'group' : 'radiogroup',
      'aria-label': L(q.title)
    });
    q.options.forEach(function (opt) {
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
          el('span', { class: 'option-label', text: L(opt.label) }),
          opt.hint && el('span', { class: 'option-hint', text: L(opt.hint) })
        ])
      ]));
    });
    return wrap;
  }

  /* Five stops for peat, where the cocktail app has six for strength. The
   * theme takes the stop count as a variable, so this is a two line override
   * in styles.css rather than a second copy of the grid. */
  function renderScale(q) {
    var current = state.answers[q.id];
    var wrap = el('div', { class: 'scale', role: 'radiogroup', 'aria-label': L(q.title) });
    q.options.forEach(function (opt, i) {
      wrap.appendChild(el('button', {
        class: 'scale-stop', type: 'button',
        'aria-pressed': current === opt.value ? 'true' : 'false',
        onClick: function () { choose(q, opt.value); }
      }, [
        pipRow(i, q.options.length - 1),
        el('span', { class: 'scale-label', text: L(opt.label) })
      ]));
    });
    return wrap;
  }

  /* Filled pips read as intensity no matter how the grid wraps, which a
   * single rising bar does not once it breaks onto a second row. */
  function pipRow(on, total) {
    var pips = el('span', { class: 'pips', 'aria-hidden': 'true' });
    for (var n = 1; n <= total; n++) {
      pips.appendChild(el('i', { class: n <= on ? 'pip on' : 'pip' }));
    }
    return pips;
  }

  function choose(q, value) {
    if (q.type === 'multi') {
      var list2 = Array.isArray(state.answers[q.id]) ? state.answers[q.id].slice() : [];
      var picked = q.options.filter(function (o) { return o.value === value; })[0];
      var exclusive = q.options.filter(function (o) { return o.exclusive; })
        .map(function (o) { return o.value; });

      if (picked && picked.exclusive) {
        // "Leave it to us" replaces every other pick, and toggles off again.
        list2 = list2.indexOf(value) === -1 ? [value] : [];
      } else {
        var at = list2.indexOf(value);
        if (at === -1) list2.push(value); else list2.splice(at, 1);
        list2 = list2.filter(function (v) { return exclusive.indexOf(v) === -1; });
      }
      state.answers[q.id] = list2;
      render();
      return;
    }
    state.answers[q.id] = value;
    advance();
  }

  function advance() {
    if (state.step >= state.questions.length - 1) {
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

  function reasonText(r) {
    var copy = t().reasons[r.key];
    if (!copy) return null;
    var x = r.x;
    if (r.key === 'notes') {
      x = String(r.x).split(', ').map(function (n) { return t().noteNames[n] || n; })
        .join(state.lang === 'de' ? ' und ' : ' and ');
    }
    if (r.key === 'origin' || r.key === 'cask') x = V(r.x);
    return fill(copy, { x: x });
  }

  /* A runner up earns its place by being different, so label it with the
   * difference rather than with "also a good fit". */
  function contrastLabel(item) {
    var c = item.contrast;
    if (!c) return t().alsoGood;
    var copy = t().contrast[c.kind];
    if (!copy) return t().alsoGood;
    var x = c.value;
    if (c.kind === 'note') x = t().noteCompare[c.value] || c.value;
    else x = V(c.value);
    return fill(copy, { x: x });
  }

  function metaRow(key, value, cls) {
    if (!value) return null;
    return el('div', { class: 'meta-row' }, [
      el('span', { class: 'meta-key', text: key }),
      typeof value === 'string'
        ? el('span', { class: 'meta-val' + (cls ? ' ' + cls : ''), text: value })
        : value
    ]);
  }

  /* The bottle photo, where the card has one. Roughly half the rows do not,
   * so a missing image is the normal case and never a gap in the layout.
   *
   * A plain path, an http address, or an image inlined as a data URI is
   * followed. Anything carrying some other scheme is not. The value comes
   * from the card rather than from this app, and a scheme nobody expected has
   * no business being handed to the browser even where it would be inert.
   * An inlined image is allowed because the single file preview build has no
   * second file to point at, and an image is inert either way.
   *
   * The alt text is the bottle's name. A screen reader that has just read
   * the name in the heading does not need it twice, so the image is marked
   * decorative there instead, which is what an empty alt means. */
  function shotOf(item) {
    var url = item && item.image;
    if (typeof url !== 'string' || !url) return null;
    // A plain path, an http address, or an inlined image. Anything else has
    // brought its own scheme along and is refused.
    if (/^[a-z][a-z0-9+.\-]*:/i.test(url)
        && !/^https?:/i.test(url)
        && !/^data:image\//i.test(url)) return null;
    return el('img', {
      class: 'shot', src: url, alt: '', loading: 'lazy', decoding: 'async',
      width: '900', height: '900'
    });
  }

  function renderCard(item, rank) {
    var d = item.bottle;
    var p = ENGINE.profileOf(d) || {};
    var hero = rank === 0;
    var peat = ENGINE.peatOf(d);

    var badges = el('div', { class: 'badges' });
    if (peat != null && peat >= ENGINE.SMOKE_VISIBLE) {
      badges.appendChild(el('span', { class: 'badge smoke', text: t().badgeSmoke }));
    }
    if (p.level === 'einstieg') {
      badges.appendChild(el('span', { class: 'badge start', text: t().badgeStart }));
    }
    if (p.level === 'rarität') {
      badges.appendChild(el('span', { class: 'badge rare', text: t().badgeRare }));
    }
    if (typeof d.popularity_rank === 'number' && d.popularity_rank <= LOVED_RANK) {
      badges.appendChild(el('span', { class: 'badge loved', text: t().badgeLoved }));
    }
    /* Six of the fifteen bottles sit behind hidden_on_card so the printed
     * card can stay short while the app still recommends the whole back bar.
     * Either flag means the same thing to a guest, that they will not find it
     * on the paper in front of them, so either one earns the badge. */
    if (d.on_printed_menu === false || d.hidden_on_card === true) {
      badges.appendChild(el('span', { class: 'badge off', text: t().notOnCard }));
    }

    /* Two fields on the row are deliberately not shown.
     *
     * `menu_class` is the bar's own star and dog grading by margin. It is an
     * internal number and a guest must never see it, in any form, including
     * as an ordering they could reverse engineer.
     *
     * `recommended` marks the leader of a section on the website. Here it
     * would sit next to our actual recommendation and argue with it, so the
     * app leaves it alone rather than putting two golden claims on one
     * screen. */

    /* The badges stay below the photo row rather than beside it. Squeezed
     * into the space left over next to a bottle they wrap one to a line and
     * the card starts to look like a list of warnings. */
    var head = el('div', { class: 'card-head-body' }, [
      el('div', { class: 'card-top' }, [
        el('h3', { text: F(d, 'name') }),
        el('span', { class: 'match', text: fill(t().match, { n: item.match }) })
      ])
    ]);

    var photo = shotOf(d);
    var children = [
      el('p', { class: 'card-rank', text: hero ? t().topPick : contrastLabel(item) }),
      photo ? el('div', { class: 'card-head' }, [photo, head]) : head,
      badges.childNodes.length ? badges : null,
      F(d, 'description') && el('p', { class: 'note', text: F(d, 'description') })
    ];

    if (hero && F(d, 'bartender_note')) {
      children.push(el('p', { class: 'house-note', text: F(d, 'bartender_note') }));
    }

    var meta = el('div', { class: 'meta' }, [
      metaRow(t().keyOrigin, LV(d, 'origin'))
    ].filter(Boolean));

    if (hero) {
      var age = ENGINE.ageOf(d);
      [
        metaRow(t().keyKind, LV(d, 'kind')),
        metaRow(t().keyCask, LV(d, 'cask')),
        metaRow(t().keyAge, age != null ? fill(t().ageYears, { n: age })
          : (p.age_years === null ? t().ageNas : '')),
        metaRow(t().keyAbv, typeof p.abv === 'number'
          ? String(p.abv).replace('.', ',') + ' %' : ''),
        peat != null ? el('div', { class: 'meta-row' }, [
          el('span', { class: 'meta-key', text: t().keySmoke }),
          el('span', { class: 'meta-val' }, [
            pipRow(peat, 4),
            el('span', { class: 'pip-label', text: t().peatNames[peat] || '' })
          ])
        ]) : null,
        metaRow(t().keyServe, LV(d, 'serve'))
      ].forEach(function (row) { if (row) meta.appendChild(row); });
    }

    var prices = SOURCE.priceList(d);
    if (prices.length) {
      meta.appendChild(el('div', { class: 'meta-row' }, [
        el('span', { class: 'meta-key', text: t().keyPrice }),
        el('span', { class: 'meta-val price', text: prices.join(' · ') })
      ]));
    }
    if (meta.childNodes.length) children.push(meta);

    if (hero) {
      var why = el('ul', { class: 'why' });
      item.reasons.forEach(function (r) {
        var txt = reasonText(r);
        if (txt) why.appendChild(el('li', { text: txt }));
      });
      if (why.childNodes.length) children.push(why);
    }

    return el('article', { class: 'card' + (hero ? ' hero' : ' alt') }, children.filter(Boolean));
  }

  function renderResults() {
    var res = ENGINE.recommend(state.pool, state.answers, {
      seed: state.seed,
      limit: state.showAll ? 8 : 3
    });

    var frag = document.createDocumentFragment();
    if (state.stale) {
      // Prices move. A guest reading an old one has to know it is old.
      frag.appendChild(el('p', {
        class: 'notice', text: fill(t().offline, { x: humanAge(state.stale.ageMs) })
      }));
    }
    frag.appendChild(el('div', { class: 'results-head' }, [
      el('h2', { text: res.items.length ? t().results : t().empty }),
      (res.items.length ? t().resultsSub : t().emptySub)
        ? el('p', { text: res.items.length ? t().resultsSub : t().emptySub })
        : null
    ].filter(Boolean)));

    if (res.relaxed === 'origin') frag.appendChild(el('p', { class: 'notice', text: t().loosenedOrigin }));
    if (res.relaxed === 'level') frag.appendChild(el('p', { class: 'notice', text: t().loosenedLevel }));
    if (res.smokeGap) frag.appendChild(el('p', { class: 'notice', text: t().smokeGap }));

    res.items.forEach(function (item, i) { frag.appendChild(renderCard(item, i)); });

    var actions = el('div', { class: 'results-actions' });
    if (!state.showAll && res.total > res.items.length) {
      actions.appendChild(el('button', {
        class: 'btn btn-ghost', type: 'button', text: t().moreOptions,
        onClick: function () { state.showAll = true; render(); }
      }));
    }
    actions.appendChild(el('button', {
      class: 'btn btn-primary', type: 'button', text: t().restart,
      onClick: function () { state.screen = 'intro'; render(); }
    }));
    actions.appendChild(el('a', {
      class: 'btn btn-ghost', href: CARD_URL, target: '_blank', rel: 'noopener', text: t().fullCard
    }));
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
          state.questions = buildQuestions(state.pool);
          renderChrome();
          render();
        }
      }));
    });
  }

  // ---------------------------------------------------------------- load --

  function adopt(menu) {
    state.pool = ENGINE.bottles(SOURCE.allItems(menu));
    state.questions = buildQuestions(state.pool);
    state.screen = state.pool.length ? 'intro' : 'error';
    render();
  }

  /* Preview only, and only when the address bar asked for it. The file is
   * fetched on demand rather than shipped in the page, so there is no copy
   * of a menu sitting in the app waiting to be used as a fallback. */
  function loadDemo() {
    var s = document.createElement('script');
    s.src = 'data/demo-menu.js';
    s.onload = function () { adopt(window.BBWhiskyDemo.menu); };
    s.onerror = function () { state.failed = true; state.screen = 'error'; render(); };
    document.head.appendChild(s);
  }

  function loadLive() {
    SOURCE.loadMenu().then(function (out) {
      if (out.fromCache) state.stale = { ageMs: out.ageMs };
      adopt(out.menu);
    }, function () {
      state.failed = true;
      state.screen = 'error';
      render();
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
  render();
  if (DEMO) loadDemo(); else loadLive();
})();
