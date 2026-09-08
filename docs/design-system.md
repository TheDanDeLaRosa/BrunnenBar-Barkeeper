# BrunnenBar house style

Everything needed to build a second and third recommender that looks and
behaves like the cocktail one. Written so it can be pasted whole into a fresh
chat with no other context.

The cocktail app is the reference implementation. The shared look lives in one
file, `assets/brunnenbar-theme.css`, which knows nothing about cocktails. Copy
that file into the new app, link it first, and put only genuinely new rules in
a second stylesheet after it.

---

## 1. The palette

Every colour in the apps. There are no others, and nothing is hard-coded
anywhere outside the `:root` block.

### Grounds

BrunnenBar's forest green driven down to a near-black. **Every neutral carries
the same green bias.** That is the single thing holding the look together. Swap
these for grey and it becomes a generic dark theme with a gold accent bolted
on, which is exactly what it must not look like.

| Token | Hex | Used for |
|---|---|---|
| `--ink` | `#0d1712` | the page ground, and the `theme-color` meta tag |
| `--ink-2` | `#131f18` | anything raised off the page: cards, options, the language toggle |
| `--ink-3` | `#1a2a20` | hover state of a raised surface |
| `--line` | `#274235` | a border meant to be seen |
| `--line-soft` | `#1e3327` | resting borders and dividers |

### Gold

Champagne gold, taken straight off the logo and the printed card. **The only
accent.** Selection, progress, focus rings, the primary button and the marker
dots are all gold. Nothing else in the interface is allowed to be.

| Token | Hex | Used for |
|---|---|---|
| `--gold` | `#e3c87c` | selection, primary fill, progress, focus outline |
| `--gold-lit` | `#f1dda6` | hover on a gold fill |
| `--gold-deep` | `#c9a95c` | gold on light grounds and in print |
| `--on-gold` | `#10201a` | text sitting on a gold fill, never white |

Gold as a translucent wash, used for the selected state and the hero card:

```css
rgba(227, 200, 124, 0.15)   /* selected option, top of gradient */
rgba(227, 200, 124, 0.06)   /* selected option, bottom of gradient */
rgba(227, 200, 124, 0.45)   /* hero card border */
rgba(227, 200, 124, 0.11)   /* the wash behind the whole page */
rgba(227, 200, 124, 0.07)   /* hero card top wash */
```

### Green

The card's own green at full strength. Second accent only. It marks a property
worth knowing, never an action.

| Token | Hex | Used for |
|---|---|---|
| `--green` | `#35664a` | the wash in the lower left of the page |
| `--green-lit` | `#5f9d76` | notice rules, green badges |

Translucent forms: `rgba(53, 102, 74, 0.22)` for the page wash,
`rgba(95, 157, 118, 0.5)` and `rgba(95, 157, 118, 0.35)` for badge borders.

### Text

| Token | Hex | Used for |
|---|---|---|
| `--cream` | `#f2ece0` | body text and anything a guest reads closely |
| `--muted` | `#9aa89b` | secondary text, hints, ingredient lists |
| `--muted-dim` | `#6d7c70` | labels, disabled states, the quietest readable thing |

There is no red and no amber anywhere. A gate the app had to relax is reported
in green, because it is information and not a failure.

### The page wash

Two soft radial gradients, fixed so scrolling does not drag them. They are what
stop a flat near-black from looking cheap, and they are worth keeping verbatim.

```css
background-image:
  radial-gradient(90rem 40rem at 50% -18rem, rgba(227, 200, 124, 0.11), transparent 65%),
  radial-gradient(60rem 40rem at 12% 108%, rgba(53, 102, 74, 0.22), transparent 60%);
background-attachment: fixed;
```

---

## 2. Type

Two families and one rule. **Serif for every heading and every sentence a
person is saying, sans for everything else.** That split does most of the work
of making it feel like a bar rather than a form.

```css
--serif: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, "Times New Roman", serif;
--sans:  ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

Both are system stacks, so nothing is downloaded and the page renders instantly
on a phone with one bar of signal. If the bar's real brand fonts are ever
licensed for web use, they go at the front of these two lists and nothing else
changes.

Base size is **17px** with `line-height: 1.55`. That is a step up from the
usual 16, because these are read one-handed in low light.

Headings scale with the viewport instead of stepping at breakpoints:

| Element | Size |
|---|---|
| Intro title | `clamp(2.3rem, 9vw, 3.4rem)` |
| Question title | `clamp(1.6rem, 5.5vw, 2.15rem)` |
| Results title | `clamp(1.9rem, 6.5vw, 2.6rem)` |
| Hero card title | `clamp(1.5rem, 5vw, 1.95rem)` |
| Runner-up title | `1.3rem` |

Serif italic is reserved for two things: the intro lede, and the one line of
persuasion on a result card. Both are a person talking.

Small uppercase labels share one recipe. Wide tracking is what makes them read
as labels rather than shouting.

```css
font-size: 0.68rem;         /* 0.66 to 0.74 depending on the label */
letter-spacing: 0.22em;     /* 0.1em on the tightest, 0.22em on section rules */
text-transform: uppercase;
color: var(--muted-dim);
```

Prices and match percentages use `font-variant-numeric: tabular-nums` so
columns of figures line up.

---

## 3. Layout

One column, `--maxw: 46rem`, centred, on every screen size. There is no
sidebar and no second column of content, ever.

```css
.shell { max-width: var(--maxw); margin: 0 auto; padding: 1.5rem 1.15rem 4rem; }
```

**There is exactly one layout breakpoint in the whole theme: `34rem`.** Below
it, options are one per row and the intensity scale is three across. Above it,
options can be two per row and the scale is six across. Resist adding a second
breakpoint.

Radii: `--radius: 14px` for options, notices and small cards, `--radius-lg:
20px` for result cards, and `999px` for every button, badge and toggle.

Vertical rhythm in rems, roughly: `0.7` between options, `1` between cards,
`1.75` under a question subtitle, `1.9` above the navigation row, `2.25`
under a results heading, `2.5` above a section label, `3.5` above the footer.

---

## 4. Motion

One easing curve everywhere, `--ease: cubic-bezier(0.22, 0.61, 0.36, 1)`.

Screens enter with a small rise. Anything longer than half a second feels
sluggish when a guest is tapping through seven questions.

```css
.stage > * { animation: rise 0.42s var(--ease) both; }
@keyframes rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
```

Buttons and options press down one pixel on `:active`. That is the whole
feedback vocabulary on touch, since there is no hover on a phone.

`prefers-reduced-motion` kills all of it, and it is not optional:

```css
@media (prefers-reduced-motion: reduce) {
  .stage > *, * { animation: none !important; transition-duration: 0.01ms !important; }
}
```

---

## 5. Components

All of these are in the theme file already. This is what to reach for and what
the markup has to look like.

### An option

A `<button>`, never a checkbox or radio. `aria-pressed` carries the state, and
every visual selected state hangs off that attribute, so the styling cannot
disagree with what a screen reader announces.

```html
<button class="option" type="button" aria-pressed="false">
  <span class="option-mark"></span>
  <span class="option-body">
    <span class="option-label">Rauchig</span>
    <span class="option-hint">Torf und Lagerfeuer</span>
  </span>
</button>
```

Minimum height `3.6rem`, which is a thumb. Do not shrink it to fit more on
screen.

`.option-wide` inside a `.options.cols-2` grid spans the full width and is
dashed until chosen. Use it for an answer of a different kind to the ones above
it, the way the cocktail app offers Barkeeper's Choice.

### The intensity scale

Stops with pips, filled to show intensity. Zero filled means the bottom of the
range. Cocktails use six stops for strength, whiskey uses five for peat,
tequila will use it for how much agave shows.

The stop count is a variable rather than a hard-coded grid. An app with a
different number sets `--scale-cols` and `--scale-cols-sm` on its own `.scale`
and touches nothing else. The whisky app puts one stop per row on a phone,
because five labels across a 360px screen is unreadable.

```html
<div class="scale">
  <button class="scale-stop" type="button" aria-pressed="false">
    <span class="pips"><span class="pip on"></span><span class="pip"></span>…</span>
    <span class="scale-label">Mild</span>
  </button>
  …
</div>
```

A rising bar was tried first here and became unreadable the moment the labels
wrapped onto two lines. The pips survive wrapping.

### A result card

```html
<article class="card hero">
  <p class="card-rank">Unsere Empfehlung</p>
  <div class="card-top">
    <h3>Whiskey Sour</h3>
    <span class="match">94 % Match</span>
  </div>
  <div class="badges">
    <span class="badge accent">Hausklassiker</span>
    <span class="badge good">Ohne Alkohol</span>
    <span class="badge quiet">Nicht auf der Karte</span>
  </div>
  <p class="note">Zitrone, Zucker und Bourbon, so wie es sein soll.</p>
  <p class="house-note">Wir schütteln ihn mit Eiweiss, sag Bescheid wenn du das nicht möchtest.</p>
  <div class="meta">
    <div class="meta-row"><span class="meta-key">Im Glas</span><span class="meta-val">Tumbler</span></div>
    <div class="meta-row"><span class="meta-key">Preis</span><span class="meta-val price">9,70 €</span></div>
  </div>
  <ul class="why">
    <li>Passt zu deinem Wunsch nach etwas Saurem</li>
  </ul>
</article>
```

**Exactly one `.card.hero` per screen.** The gold edge is the thing that makes
the top pick obvious before a word is read, and two of them cancel out. Every
other card is a plain `.card`, or `.card.alt` to shrink the title and quieten
the note.

Badges come in three variants and no more. `.accent` in gold says the house
stands behind it. `.good` in green marks a property worth knowing. `.quiet`
marks a caveat. Anything the app needs to call these locally gets an alias in
its own stylesheet, the way the cocktail app maps `.badge.house` onto
`.accent`.

### A notice

For when the app had to bend one of its own rules to answer at all, such as
loosening a filter that would otherwise return nothing. Say it out loud rather
than silently returning something the guest did not ask for.

```html
<p class="notice">Alkoholfreie Shots haben wir gerade nicht, deshalb sind hier alkoholfreie Drinks.</p>
```

### Buttons

`.btn.btn-primary` is gold and there is one on screen at a time. `.btn.btn-ghost`
is the outlined secondary. `.btn-quiet` is an underlined text button for
anything that undoes or restarts. `a.btn` works for links.

---

## 6. Accessibility, not optional

- **Focus is always visible**, gold, 2px, offset 3px. Never remove it.
- Every interactive thing is a real `<button>` or `<a>`. No clickable divs.
- The stage is `aria-live="polite"` and there is a visually hidden
  `role="status"` paragraph for announcing what changed after a tap.
- Selected state is `aria-pressed`, and the CSS reads that attribute rather
  than a separate class, so the two cannot drift apart.
- Tap targets are `3.6rem` tall or more.
- The page works without JavaScript to the extent of a `<noscript>` block that
  links the full card. A guest is never left with a blank screen.
- Print styles exist, because guests do print these.

---

## 7. How the copy sounds

House voice, and it applies to every guest-facing string in every app.

- Warm and casual German, **du and ihr**, never Sie.
- **No hyphens, no dashes, no bullet lists, no numbered lists, no colons and
  no semicolons.** Write in sentences.
- Say what the drink does, not where the guest is. The cocktail app's opening
  question went through three drafts before landing on "Was soll der Drink
  können", because asking a guest to place themselves on the evening's timeline
  reads like a survey no matter how it is worded.
- Both languages are first class. Every string exists in German and English,
  and each falls back to German **per field**, so a half-translated entry shows
  English where it has it instead of reverting wholesale.
- Never invent a reason. If nothing separates two recommendations, say they
  both fit rather than making up a difference.

---

## 8. How the apps are built

The same shape every time, and it is deliberately plain.

- **Vanilla JavaScript, no framework, no build step, no dependencies.** Plain
  `<script>` tags exposing globals. It has to work opened straight off disk and
  on an iPad behind the bar.
- **Scoring is a separate pure file** with no DOM in it, which is the only
  reason it can be unit tested. `assets/engine.js` takes answers and a list of
  items and returns ranked results. `assets/app.js` does everything visual.
- **Tests are plain node**, `node test/engine.test.js`, no runner to install.
  Each file exports through `module.exports` when `module` exists and through a
  global otherwise, so the same file serves the browser and the tests.
- **Three tiers of rule.** Hard rules are never relaxed, allergens and outright
  rejections. Gates are relaxed only as a last resort and the guest is told on
  screen. Everything else is scored, summed and normalised into a percentage.
- **One data source, never a bundled copy.** `assets/menu-source.js` reads the
  live Menu API and is the only file that talks to it. A copy shipped with the
  app is wrong the moment a price changes, and wrong silently. The only
  fallback is the last response that browser itself received, shown with its
  age.
- **Deterministic, with a small jitter.** The same answers give the same
  advice. A per-visit seed breaks exact ties so two guests at one table do not
  always see identical ordering, and it never overturns a clear winner.

---

## 9. Starting the tequila app

The whiskey app in `whiskey/` is now the worked example. Copy its shape.

```
tequila/
  index.html                    copy, change title, description and lang links
  assets/styles.css             only what is new, keep it under 40 lines
  assets/engine.js              scoring, adapted to the new questions
  assets/app.js                 interface, largely the same shape
  data/questions.js             the new questions and all interface copy
test/tequila-engine.test.js     node test/tequila-engine.test.js
```

**Two files are linked, not copied.** The earlier version of this document
said to copy the theme and the loader into each app. That was wrong for a
single repository, because two copies drift and the one that drifts silently
is the one nobody opens. `assets/brunnenbar-theme.css` and
`assets/menu-source.js` stay where they are and every app points up at them.
The loader in particular must never be duplicated, since the whole point of it
is that exactly one file talks to the Menu API.

`index.html` head, with the two stylesheets in this order:

```html
<meta name="theme-color" content="#0d1712">
<link rel="stylesheet" href="../assets/brunnenbar-theme.css">
<link rel="stylesheet" href="assets/styles.css">
```

And `<main class="stage" id="stage">`, because the entry animation hangs off
the class and the id is only for script.

Three things worth settling before writing any of it.

**What the data can actually answer.** The cocktail app has seven questions
because the export carries seven usable fields. Ask the questions the data
supports and no more, otherwise the app invents answers. For anything the
source does not carry yet, write the field spec first, the way
`docs/whisky-api-felder-fuer-die-app.md` does.

Better still, do what the whisky app does and let the flow read the data.
`BBWhiskyEngine.tailor` drops any question whose field carries fewer than two
different values across the shelf, and any answer nothing on the shelf
carries. A field that arrives in the Menu API brings its question back on its
own, and nobody is ever offered a region the bar does not stock. That is worth
copying wholesale.

**What the hard rules are.** Cocktails have allergens. Whiskey and tequila will
have their own, budget being the obvious one. A hard rule is never scored and
never relaxed.

**How runner-ups differ.** Never label a second suggestion "also a good fit",
which tells a guest nothing. Label it by the one thing that separates it from
the top pick, such as peatier, older, or a different region, and have a test
assert the claim is actually true of that pair.
