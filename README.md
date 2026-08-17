# Der digitale Barkeeper — BrunnenBar

A cocktail recommender for [brunnenbar.com](https://brunnenbar.com). It asks a
guest the questions we'd ask across the bar, then recommends three drinks
**from our actual card** and explains why it picked them.

Bilingual (DE/EN), mobile-first, no build step, no dependencies, no tracking.

---

## Running it

Open `index.html` in a browser. That's it — it works from the file system, off
a USB stick, or on an iPad behind the bar.

To serve it locally:

```bash
npx http-server . -p 8080
```

To run the tests:

```bash
node test/engine.test.js
```

---

## Putting it on the website

Everything is static. Upload the whole folder somewhere under the site, e.g.
`brunnenbar.com/barkeeper/`, and link it from the navigation next to the
Cocktailkarte.

**WordPress:** upload the folder via FTP/file manager, then either link to it
directly or embed it in a page with a Custom HTML block:

```html
<iframe src="/barkeeper/" style="width:100%;height:900px;border:0"
        title="Der digitale Barkeeper"></iframe>
```

The link back to the full card lives in one place — `CARD_URL` at the top of
`assets/app.js`. Change it there if the menu page ever moves.

---

## Changing the menu

**`data/cocktails.js` is the only file you need to touch.** Every field is
documented at the top of that file. To add a drink, copy an existing block and
change the values. To pull a drink off the card, delete its block.

The important fields:

| Field | What it does |
|---|---|
| `strength` | `0` alcohol-free · `1` light · `2` balanced · `3` spirit-forward |
| `base` / `also` | Which spirits are in it. **`also` matters** — a guest who says "nothing bitter" must not be shown a Boulevardier, and that only works if Campari is listed in `also`. |
| `flags` | `egg`, `dairy`, `nuts`, `coffee`. These are the allergen filters. |
| `profile` | The ten taste axes, `0`–`4`. This is what the matching actually runs on. |
| `house` | `true` for our own creations — they get surfaced to guests who ask for something new. |
| `adventure` | `0` everyone knows it … `3` for the curious drinker. |
| `occasion` | When in the evening it fits. |

After any edit, run `node test/engine.test.js`. The tests check that every
drink is fully filled in, that no allergen can leak through a filter, and that
all 2,520 reachable answer combinations still return a recommendation.

### Getting the taste profile right

The `profile` numbers are the whole engine. Rate each drink **as it tastes in
the glass**, not by what's in the bottle:

- A Whisky Sour is `boozy: 3`, but its `sour` is `4` — the acid is what you
  taste first.
- A Negroni is `bitter: 4`. An Aperol Sour is only `bitter: 2` — same family,
  very different intensity.
- `fresh` means "wakes you up" (citrus, mint, cucumber), not "recently made".

If a drink starts showing up in the wrong recommendations, its profile is
almost always the reason.

---

## How the matching works

`assets/engine.js` is pure scoring logic with no interface code, which is why
it can be unit tested. Three tiers of rule:

1. **Hard rules — never relaxed, under any circumstances.** Allergen
   exclusions and "don't pour me this spirit". If a guest excludes nuts, no
   amount of otherwise-perfect matching will surface the Amaretto Sour.
2. **Gates — relaxed only as a last resort.** Alcohol-free and shots. Asking
   for a round of alcohol-free shots matches nothing on our card, so the
   engine loosens the *shot* requirement, keeps the drink alcohol-free, and
   tells the guest on screen that it adjusted something.
3. **Soft scoring.** Occasion, strength, preferred spirit, flavour direction,
   texture, and familiar-vs-new, summed and normalised into the match
   percentage.

"Surprise me" works by weighting a per-visit random seed, so two guests at the
same table get different answers, but paging back and forth through your own
answers doesn't reshuffle the results.

---

## A note on the data

Built from `Cocktail Recipes.xlsx` (All Recipes + Print Out sheets), 43 drinks
plus the three alcohol-free builds for Singapore Sling, Italian Stallion and
Porn Star Martini.

Guest-facing ingredient lists deliberately **omit pour sizes** — the exact
specs stay in the bar's spreadsheet, not on the public website.

Two things worth a second look from the bar team:

- The spreadsheet has one malformed row between *Lemon Drop Shot* and *London
  Mule* (`Ron Zacapa 23 Rum, 20ml`) with no cocktail name attached. It isn't
  in the site data. If it belongs to a drink, tell me which one.
- **Allergen flags were inferred from ingredients** and need a real check
  before this goes live. Currently flagged: `egg` (Eiweiß), `dairy`
  (RumChata, Milch), `nuts` (Amaretto, Frangelico, Mandelsirup), `coffee`
  (Espresso, Kahlúa). Drinks using Fee Foamer are treated as egg-free.
  The interface tells guests to confirm allergies in person regardless.

---

## Files

```
index.html            the page
assets/styles.css     all styling
assets/engine.js      scoring logic (pure, testable)
assets/app.js         interface and question flow
assets/favicon.svg
data/cocktails.js     ← the menu. Edit this one.
data/questions.js     the questions and all DE/EN copy
test/engine.test.js   run with: node test/engine.test.js
```
