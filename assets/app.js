/*
 * BrunnenBar — Cocktail recommender
 * =========================================================================
 * Vanilla JS, no build step, no dependencies. Loads as plain script tags so
 * the page also works opened straight off disk or on an iPad behind the bar.
 * =========================================================================
 */
(function () {
  'use strict';

  /* Filled in once the live menu has been read. There is no bundled copy to
   * fall back on, by design: a copy that shipped with the app is wrong the
   * moment a price changes, and wrong silently. */
  var MENU = [];
  var ING_EN = {};
  var QUESTIONS = window.BBQuestions.QUESTIONS;
  var BBEngine = window.BBEngine;
  var UI = window.BBQuestions.UI;
  var CARD_URL = 'https://brunnenbar.com/cocktailkarte/';

  // Rank at or under which a drink is called a bestseller on its card.
  var BESTSELLER_RANK = 10;

  var state = {
    lang: 'de',
    screen: 'intro',
    step: 0,
    answers: {},
    seed: Math.floor(Math.random() * 100000),
    showAll: false
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
  /* Every guest-facing string comes from the export in both languages, and
   * each falls back to German on its own. A drink translated only halfway
   * shows English where it has it rather than reverting wholesale. */
  function pick(d, en, de) { return (state.lang === 'en' && d[en]) || d[de]; }
  function ingList(d) {
    var list = state.lang === 'en' && d.ingEn.length ? d.ingEn : d.ing;
    return list.join(' · ');
  }
  function glassOf(d) { return pick(d, 'glassEn', 'glass'); }
  function taglineOf(d) { return pick(d, 'taglineEn', 'tagline'); }
  function noteOf(d) { return pick(d, 'noteEn', 'note'); }

  function euro(n) {
    return n == null ? '' : n.toFixed(2).replace('.', ',') + ' €';
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

  /* The options a question can still offer, given what has been answered.
   * Derived from the menu, so nothing here needs updating when the card
   * changes. */
  function liveOptions(q) {
    var values = BBEngine.liveOptions(
      MENU, state.answers, q.id, q.options.map(function (o) { return o.value; }));
    return q.options.filter(function (o) { return values.indexOf(o.value) !== -1; });
  }

  /* Recomputed rather than cached, because answering one question changes how
   * many are left. Two reasons a question drops out. Some are ruled out
   * outright, the way a round of shots is not asked how it should turn up.
   * The rest fall away when the card can no longer tell the answers apart, so
   * nobody is asked to choose between options that all lead to the same
   * drinks. */
  function activeQuestions() {
    return QUESTIONS.filter(function (q) {
      if (q.skipIf && q.skipIf(state.answers)) return false;
      return BBEngine.canDiscriminate(
        MENU, state.answers, q.id, q.options.map(function (o) { return o.value; }));
    });
  }

  /* Answers can go stale when an earlier one is changed. Going back and
   * choosing zero proof takes away the spirit question, and going back and
   * choosing a round of shots takes away four of the flavours. Left alone,
   * the old pick keeps scoring from behind a question the guest can no longer
   * see, which is the worst kind of wrong because there is nothing on screen
   * to explain the result.
   *
   * So anything that is no longer on offer is dropped. Repeated because
   * dropping one answer can take another out of reach, and capped because a
   * fixed point is not worth an unbounded loop. */
  function pruneAnswers() {
    for (var pass = 0; pass < 3; pass++) {
      var changed = false;
      QUESTIONS.forEach(function (q) {
        var v = state.answers[q.id];
        if (v == null || v === '' || (Array.isArray(v) && !v.length)) return;

        if (q.skipIf && q.skipIf(state.answers)) {
          state.answers[q.id] = Array.isArray(v) ? [] : '';
          changed = true;
          return;
        }

        var live = liveOptions(q).map(function (o) { return o.value; });
        if (Array.isArray(v)) {
          var kept = v.filter(function (x) { return live.indexOf(x) !== -1; });
          if (kept.length !== v.length) { state.answers[q.id] = kept; changed = true; }
        } else if (live.indexOf(v) === -1) {
          state.answers[q.id] = '';
          changed = true;
        }
      });
      if (!changed) return;
    }
  }

  function isAnswered(q) {
    var v = state.answers[q.id];
    return q.type === 'multi' ? Array.isArray(v) && v.length > 0 : v != null && v !== '';
  }

  function announce(msg) { if (liveRegion) liveRegion.textContent = msg; }

  /* When the page sits in an iframe on the website, tell the parent how tall
   * it needs to be. Without this the results page scrolls inside a fixed
   * frame, which on a phone means two scrollbars fighting each other.
   * Silent and harmless when the page is opened directly. */
  function reportHeight() {
    if (window.parent === window) return;
    try {
      /* Measure the content, not the document. scrollHeight can never report
       * less than the frame it is sitting in, so using it lets the frame grow
       * on the results page and then never shrink back for the next guest. */
      var shell = document.querySelector('.shell');
      var h = shell ? shell.getBoundingClientRect().height : document.body.scrollHeight;
      window.parent.postMessage({ type: 'bb-height', height: Math.ceil(h) }, '*');
    } catch (e) { /* a parent on another origin that refuses, nothing to do */ }
  }

  function render() {
    pruneAnswers();
    stage.innerHTML = '';
    if (state.screen === 'intro') stage.appendChild(renderIntro());
    else if (state.screen === 'quiz') stage.appendChild(renderQuiz());
    else stage.appendChild(renderResults());
    window.scrollTo({ top: 0, behavior: 'smooth' });
    reportHeight();
    // Again once the entry animation has settled and the height is final.
    setTimeout(reportHeight, 500);
  }

  // --------------------------------------------------------------- intro --

  function renderIntro() {
    return el('section', { class: 'intro' }, [
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
    ]);
  }

  // ---------------------------------------------------------------- quiz --

  function renderQuiz() {
    var qs = activeQuestions();
    var q = qs[state.step];

    // Going back and changing the strength answer can invalidate the index.
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
    var options = liveOptions(q);
    var wrap = el('div', {
      class: 'options' + (options.length > 4 ? ' cols-2' : ''),
      role: multi ? 'group' : 'radiogroup',
      'aria-label': L(q.title)
    });
    options.forEach(function (opt) {
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

  /* The export's field notes ask for a strength slider. A row of labelled
   * stops does the same job and stays reachable by keyboard and screen
   * reader, which a drag-only control would not. */
  function renderScale(q) {
    var current = state.answers[q.id];
    var wrap = el('div', { class: 'scale', role: 'radiogroup', 'aria-label': L(q.title) });
    q.options.forEach(function (opt, i) {
      // Filled pips read as intensity no matter how the grid wraps, which a
      // single rising bar does not once it breaks onto a second row.
      var pips = el('span', { class: 'pips', 'aria-hidden': 'true' });
      for (var n = 1; n < q.options.length; n++) {
        pips.appendChild(el('i', { class: n <= i ? 'pip on' : 'pip' }));
      }
      wrap.appendChild(el('button', {
        class: 'scale-stop', type: 'button',
        'aria-pressed': current === opt.value ? 'true' : 'false',
        onClick: function () { choose(q, opt.value); }
      }, [
        pips,
        el('span', { class: 'scale-label', text: L(opt.label) })
      ]));
    });
    return wrap;
  }

  function choose(q, value) {
    if (q.type === 'multi') {
      var list = Array.isArray(state.answers[q.id]) ? state.answers[q.id].slice() : [];
      var picked = q.options.filter(function (o) { return o.value === value; })[0];
      var exclusive = q.options.filter(function (o) { return o.exclusive; })
        .map(function (o) { return o.value; });

      if (picked && picked.exclusive) {
        // "Leave it to us" replaces every other pick, and toggles off again.
        list = list.indexOf(value) === -1 ? [value] : [];
      } else {
        var at = list.indexOf(value);
        if (at === -1) list.push(value); else list.splice(at, 1);
        list = list.filter(function (v) { return exclusive.indexOf(v) === -1; });
      }
      state.answers[q.id] = list;
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

  function reasonText(r) {
    var copy = t().reasons[r.key];
    if (!copy) return null;
    var x = r.x;
    if (r.key === 'spirit') x = t().spiritNames[r.x] || r.x;
    if (r.key === 'moment') x = t().momentNames[r.x] || r.x;
    if (r.key === 'flavour') {
      x = String(r.x).split(', ').map(function (f) {
        return t().flavourNames[f] || f;
      }).join(state.lang === 'de' ? ' und ' : ' and ');
    }
    return fill(copy, { x: x });
  }

  /* A runner-up earns its place by being different, so label it with the
   * difference rather than with "also a good fit". */
  function contrastLabel(item) {
    var c = item.contrast;
    if (!c) return t().alsoGood;
    var copy = t().contrast[c.kind];
    if (!copy) return t().alsoGood;
    var x = c.value;
    if (c.kind === 'flavour') x = t().flavourCompare[c.value] || c.value;
    if (c.kind === 'ingredient' && state.lang === 'en') x = ING_EN[c.value] || c.value;
    return fill(copy, { x: x });
  }

  function renderCard(item, rank) {
    var d = item.drink;
    var hero = rank === 0;

    var badges = el('div', { class: 'badges' });
    if (d.section === 'Signature Cocktails') badges.appendChild(el('span', { class: 'badge house', text: t().house }));
    if (d.alcoholFree) badges.appendChild(el('span', { class: 'badge zero', text: t().zeroProof }));
    if (d.rank <= BESTSELLER_RANK) badges.appendChild(el('span', { class: 'badge best', text: t().bestseller }));
    if (!d.onPrintedMenu) badges.appendChild(el('span', { class: 'badge off', text: t().notOnCard }));

    var children = [
      el('p', { class: 'card-rank', text: hero ? t().topPick : contrastLabel(item) }),
      el('div', { class: 'card-top' }, [
        el('h3', { text: d.name }),
        el('span', { class: 'match', text: fill(t().match, { n: item.match }) })
      ]),
      badges.childNodes.length ? badges : null,
      taglineOf(d) && el('p', { class: 'note', text: taglineOf(d) })
    ];

    if (hero && noteOf(d)) {
      children.push(el('p', { class: 'bartender-note', text: noteOf(d) }));
    }

    var meta = el('div', { class: 'meta' }, [
      el('div', { class: 'meta-row' }, [
        el('span', { class: 'meta-key', text: t().ingredients }),
        el('span', { class: 'meta-val', text: ingList(d) })
      ])
    ]);
    if (hero) {
      meta.appendChild(el('div', { class: 'meta-row' }, [
        el('span', { class: 'meta-key', text: t().served }),
        el('span', { class: 'meta-val', text: glassOf(d) })
      ]));
    }
    if (d.price != null) {
      meta.appendChild(el('div', { class: 'meta-row' }, [
        el('span', { class: 'meta-key', text: t().priceLabel }),
        el('span', { class: 'meta-val price', text: euro(d.price) })
      ]));
    }
    children.push(meta);

    if (hero) {
      var why = el('ul', { class: 'why' });
      item.reasons.forEach(function (r) {
        var txt = reasonText(r);
        if (txt) why.appendChild(el('li', { text: txt }));
      });
      if (why.childNodes.length) children.push(why);
    }

    return el('article', { class: 'card' + (hero ? ' hero' : ' alt') }, children);
  }

  /* Say which rule was bent, not that one was.
   *
   * "We relaxed one preference" told a guest nothing, so asking for alcohol
   * free shots and being handed a Mojito read as a bug rather than as the
   * honest answer it is. Name the thing we could not do.
   *
   * The alcohol case is the one that matters most. The engine drops the zero
   * proof gate only as a last resort, and a guest who asked for none must be
   * told in plain words that what they are looking at is not. */
  function loosenedMessage(relaxed) {
    if (!relaxed) return null;
    var wantedZeroProof = state.answers.strength === '0';
    if (relaxed === 'shot') {
      return wantedZeroProof ? t().loosenedShot : t().loosenedNoShot;
    }
    return wantedZeroProof ? t().loosenedAlcohol : t().loosened;
  }

  function renderResults() {
    var res = BBEngine.recommend(MENU, state.answers, {
      seed: state.seed,
      limit: state.showAll ? 8 : 3
    });

    var frag = document.createDocumentFragment();
    frag.appendChild(el('div', { class: 'results-head' }, [
      el('h2', { text: res.items.length ? t().results : t().empty }),
      (res.items.length ? t().resultsSub : t().emptySub)
        ? el('p', { text: res.items.length ? t().resultsSub : t().emptySub })
        : null
    ].filter(Boolean)));

    var loosened = loosenedMessage(res.relaxed);
    if (loosened) frag.appendChild(el('div', { class: 'notice', text: loosened }));

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
  boot();

  // ---------------------------------------------------------------- boot --

  function bootMessage(title, detail) {
    stage.innerHTML = '';
    stage.appendChild(el('section', { class: 'intro' }, [
      el('h1', { text: title }),
      el('hr', { class: 'rule' }),
      detail ? el('p', { class: 'lede', text: detail }) : null,
      el('div', {}, [
        el('a', { class: 'link-card', href: CARD_URL, target: '_blank', rel: 'noopener',
                  text: t().fullCard })
      ])
    ]));
    reportHeight();
    setTimeout(reportHeight, 500);
  }

  /* Reads the one source, reshapes it, and only then shows a question. The
   * English half of the ingredient map is built from the same payload, so
   * there is no second translation table to fall out of step with the card. */
  /* What the questions can actually offer, read off the questions themselves
   * so the two can never drift apart. */
  function vocabulary() {
    function vals(id) {
      var q = QUESTIONS.filter(function (x) { return x.id === id; })[0];
      return q ? q.options.map(function (o) { return o.value; }) : [];
    }
    return {
      moment: vals('moment').concat([BBEngine.MOMENT_ANY]),
      flavour_tags: vals('flavours'),
      /* Every shape the engine knows, plus the catch all. Not the question's
       * four options: Frozen and Hot are deliberately not offered, and those
       * drinks are still perfectly recommendable, just not askable by shape. */
      serve_style: Object.keys(BBEngine.SERVE_GROUPS).reduce(function (acc, g) {
        return acc.concat(BBEngine.SERVE_GROUPS[g]);
      }, [BBEngine.CATCH_ALL])
    };
  }

  function boot() {
    bootMessage(t().title, t().loading);

    window.BBMenuSource.loadMenu().then(function (out) {
      var items = window.BBMenuSource.scoreableItems(out.menu);
      MENU = items.map(window.BBMenuAdapt.adapt);

      ING_EN = {};
      MENU.forEach(function (d) {
        d.ing.forEach(function (de, i) { if (d.ingEn[i]) ING_EN[de] = d.ingEn[i]; });
      });

      /* Say it out loud rather than quietly scoring nothing. A question whose
       * field is missing everywhere is a question that cannot mean anything,
       * and that has to be visible on the first load, not discovered later. */
      var check = window.BBMenuAdapt.report(items, vocabulary());
      if (check.missing.length) {
        console.warn('[BrunnenBar] Menu API is missing fields the questions score against:',
          check.missing.join(', '),
          '\nAffected drinks, first few per field:',
          check.missing.reduce(function (acc, f) {
            acc[f] = check.gaps[f].slice(0, 5); return acc;
          }, {}));
      }
      if (check.unreachable.length) {
        console.warn('[BrunnenBar] Values no question can offer, so these drinks ' +
          'cannot be reached that way:', check.unknown);
      }
      state.dataNotice = check.ok ? null : check;
      state.stale = out.fromCache ? out : null;

      if (!MENU.length) {
        bootMessage(t().title, t().noMenu);
        return;
      }
      render();
    }, function (err) {
      console.error('[BrunnenBar]', err);
      bootMessage(t().title, t().offline);
    });
  }
})();
