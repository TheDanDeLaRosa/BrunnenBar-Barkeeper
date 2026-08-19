# Der digitale Barkeeper — BrunnenBar

A cocktail recommender for [brunnenbar.com](https://brunnenbar.com). It asks a
guest the questions we'd ask across the bar, then recommends drinks **from our
actual card**, with a plain-language reason for each.

Driven entirely by the bar's own export: 126 available drinks, real sales
figures, prices, availability and allergens. Mobile-first, no build step to
run it, no dependencies, no tracking.

---

## Running it

Open `index.html` in a browser. That's it — it works from the file system, off
a USB stick, or on an iPad behind the bar.

```bash
npx http-server . -p 8080   # or serve it locally
node test/engine.test.js    # run the tests
```

---

## Updating the menu

**`data/cocktails.json` is the source of truth.** It is the BarPatrol export,
stored verbatim. To update the card:

```bash
# 1. drop the new export in as data/cocktails.json
node tools/build-menu.js    # 2. regenerate data/menu.js
node test/engine.test.js    # 3. confirm nothing broke
```

`data/menu.js` is **generated — never edit it by hand.** The build step exists
because a browser cannot read a `.json` file off the file system without a web
server, and this page has to work when opened directly.

The build prints a report every time. Read it. It tells you:

- how many drinks were kept and how many were dropped as unavailable
- any drink whose alcohol-free flag conflicts with its strength (see below)
- any ingredient it could not resolve to a spirit family
- any section names it folded together

### What the build derives

The export carries no base-spirit field, so `tools/build-menu.js` works it out
from `ingredients_guest` using an explicit dictionary — every entry is a string
that actually appears in the data, so the list is readable and checkable. It
records two things:

- `base` — the leading spirit, for *"I feel like gin tonight"*
- `spirits` — **every** spirit in the drink, for *"no whiskey, ever"*

That second one matters. A guest who says "nothing bitter" must not be shown a
Boulevardier, and that only works because Campari is recorded even though
bourbon leads the drink.

If you add a product the dictionary doesn't know, the build says so and the
drink simply won't match a spirit preference. Add it to `SPIRIT_OF`.

---

## What the engine will and won't do

`assets/engine.js` is pure scoring with no interface code, which is why it can
be unit tested. Three tiers:

1. **Hard rules — never relaxed, under any circumstances.** Allergen
   exclusions and rejected spirits. If a guest excludes nuts, no amount of
   otherwise-perfect matching will surface the Amaretto Sour.
2. **Gates — relaxed only as a last resort.** Zero proof and shots. A round of
   *alcohol-free shots* matches nothing on the card, so the engine loosens the
   *shot* requirement, keeps the drink alcohol-free, and tells the guest on
   screen that it adjusted something.
3. **Soft scoring.** Moment, strength, spirit, flavour, serve style, and
   familiarity, summed and normalised into the match percentage.

**`available: false` drinks never reach the engine at all** — they're dropped
at build time, per the export's own field note ("nicht empfehlen"). Gin Basil
stays out of the app for as long as there's no basil.

### Familiarity runs on real sales

"Was die meisten bestellen" and "Was kaum jemand bestellt" are driven by
`units_sold` from the BarPatrol imports, not by a guess about which drinks feel
famous. The `Bestseller` badge marks the top 10.

### Predictable, not random

The same answers give the same advice. A per-visit seed exists only to break
exact ties, so two guests at one table don't always see identical ordering —
it never overturns a clear winner.

---

## Things the bar should look at

**1. Rosato Spritz has a contradictory alcohol-free flag.** It is
`alcohol_free: true`, but rated `strength 1 "leicht"`, and its recipe is
`Ramazzotti Rosato` + `Freixenet 0,0` + soda. The Prosecco was swapped for the
0,0 version, but Ramazzotti Rosato is a real aperitivo at roughly 15% ABV.
Compare the Vibrante and Floreale spritzes, which use genuinely alcohol-free
Martini aperitivos and are correctly strength 0.

The build **treats it as containing alcohol** and keeps it out of the zero-proof
results, because the safe reading of "maybe alcoholic" is "alcoholic". Fix the
JSON either way and the warning goes away.

**2. Three drink names look like typos.** Guest-facing, so your call:

| In the data | Probably |
|---|---|
| `Boulvadier` | Boulevardier |
| `Don Julio Reposado Margerita` | Margarita |
| `Gin Tonic - Hendriks` | Hendrick's |

**3. Nine drinks still have draft recipes** (`recipe_status: ENTWURF`) awaiting
the Barchef. They are live in the app because `available: true`. Scotch Sour in
particular has an open question about which Talisker is actually used.

**4. Drink descriptions are German only.** The taglines and bartender notes are
the bar's own words and are never machine-translated — the interface chrome
switches to English, the drink copy does not. If you want English taglines, they
need writing by someone in the house voice.

---

## Files

```
index.html              the page
assets/styles.css       all styling
assets/engine.js        scoring logic (pure, testable)
assets/app.js           interface and question flow
assets/favicon.svg
data/cocktails.json     ← THE SOURCE OF TRUTH. Replace this to update the card.
data/menu.js            generated by tools/build-menu.js — do not edit
data/questions.js       the questions and all interface copy
tools/build-menu.js     node tools/build-menu.js
test/engine.test.js     node test/engine.test.js
```

The test suite checks that the built menu matches the export exactly, that no
unavailable drink can leak through, that every question value corresponds to
real data, that allergen and spirit exclusions are absolute, and that all 4,752
reachable answer combinations return a recommendation.
