# BrunnenBar — Cocktail recommender

A cocktail recommender for [brunnenbar.com](https://brunnenbar.com). It asks a
guest the questions we'd ask across the bar, then recommends drinks **from our
actual card**, with a plain-language reason for each.

Driven entirely by the bar's own export: 125 available drinks, real sales
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
3. **Soft scoring.** Moment, strength, spirit, flavour and serve style,
   summed and normalised into the match percentage.

**`available: false` drinks never reach the engine at all** — they're dropped
at build time, per the export's own field note ("nicht empfehlen"). Gin Basil
stays out of the app for as long as there's no basil.

### What sales figures do and don't do

`units_sold` no longer steers the ranking. It survives in exactly two places:
the `Bestseller` badge on the top 10, and a small always-on tie-break that
lets a proven drink edge ahead of an equally good match. It breaks ties, it
does not decide matches.

There used to be a "Bewährt oder was Neues?" question that ranked by sales
directly. It was removed along with its scoring, rather than left as an
unreachable code path.

### Barkeeper's Choice

The flavour question carries one option that clears every other pick:
*Barkeeper's Choice*. It is not a flavour tag — it is the sentinel
`BBEngine.NO_PREFERENCE`, which the engine reads as "no flavour asked for".

When a guest hands the choice back, the engine widens its tie-break jitter
considerably, so two people at the same table get genuinely different
suggestions rather than both being handed the current top seller. Hard rules
still apply in full: free rein never overrides an allergen or a rejected
spirit.

### Serve styles the question does not offer

*Frozen* and *Hot* are deliberately absent from the "how should it turn up"
question. Those drinks are still on the menu and can still be recommended when
a guest expresses no serve preference — there is simply no way to ask for them
by name. To bring them back, restore the two options in `data/questions.js`;
the engine already groups both styles.

### Where the English comes from

Nothing is machine-translated. Every English string is the bar's own, taken
from the `_en` fields in the export, and the term map used for single-word
labels like *"Something with Cucumber"* is generated from those same fields at
build time. There is no second, hand-maintained translation table to fall out
of sync.

### Runner-ups say how they differ

"Also a good fit" tells a guest nothing. Each runner-up is instead labelled by
the single thing that separates it from the top pick — *"Was mit Ananas"*,
*"Was Kräftigeres"*, *"Was Längeres"* — chosen in this order:

1. an ingredient the top pick does not have (the **rarest** such ingredient
   across the whole card, since that carries the most character; generic
   things like Zucker, Soda and Limette are never named)
2. noticeably stronger or lighter
3. a different shape in the glass
4. a flavour the top pick does not have

If nothing separates them it falls back to "Passt ebenfalls" rather than
inventing a difference. A test walks every pair of drinks on the card and
asserts the claim is actually true of that pair.

### Why the first question asks what it asks

The export's `moment` field records **when in the evening** a drink fits, and
nothing else. 46 drinks are openers, 36 are closers, 24 are openers *only*.
That is real signal and worth asking about, so the four options map to it one
for one.

What changed is only the framing. "Where are you in the evening" reads like a
survey question; "first drink or last" is something a guest recognises about
themselves instantly, and the aperitif-versus-nightcap distinction is exactly
what the field encodes.

A tempting alternative is to ask how big a night it is — one and done versus a
long session. The data does not support it. Nothing in the export says whether
a drink suits a long session, and the closest honest proxies, strength and
long-versus-short, are already their own questions. Asking it would mean
inventing a mapping and asking the same thing twice.

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

**3. `Don Julio Anejo Manhattan` is tagged `Spaeter Abend`,** not
`Später Abend`, so it matched no question option and was unreachable through
the late-night path. The build now repairs the spelling and says so on every
run, but it is worth fixing in the export. The same drink's `moment_en` is
correct, so this is a German-side typo only.

**4. Export v3 introduced three one-off flavour tags.** `Don Julio Anejo
Manhattan` is tagged `kraeftig`, `holzig` and `bitter-suess`, none of which
match the vocabulary the other 124 drinks use, and all three are ASCII
transliterations while the established tags carry umlauts (`süß`,
`kräuterig/frisch`). Worth a look:

| Tag | Probably should be |
|---|---|
| `kraeftig` | dropped — it duplicates the strength scale, where the drink is already `4 stark` |
| `bitter-suess` | the existing `bitter` + `süß` |
| `holzig` | genuinely new and useful. If you want guests to be able to *ask* for woody drinks, it needs a question option too |

The interface has copy for all three so nothing shows as a raw slug, and the
build now warns whenever a tag arrives without any. Same drink also spells its
tequila `Don Julio Anejo` without the ñ; the build matches on a normalised key
so this no longer costs the drink its spirit, but the card spelling is worth
fixing.

**5. Nine drinks still have draft recipes** (`recipe_status: ENTWURF`) awaiting
the Barchef. They are live in the app because `available: true`. Scotch Sour in
particular has an open question about which Talisker is actually used.

**6. The card is fully bilingual now.** The export carries German and English
side by side, and the app uses it everywhere a guest can see: taglines,
bartender notes, ingredients and glassware.

Two rules the build enforces, because both failure modes are silent ones:

- **Parallel arrays must stay in step.** `ingredients_guest` and
  `ingredients_guest_en` are matched by position, so if one gains an entry and
  the other doesn't, the wrong English word lands against the wrong
  ingredient. The build refuses to derive anything from a drink whose arrays
  disagree, and says which drink.
- **One ingredient, one English word.** The German-to-English term map is
  derived from the export rather than kept by hand, so it cannot drift from
  the card. If the same German ingredient is ever given two different English
  words, the build names it.

Every English field falls back to its German counterpart on its own, so a
half-translated export degrades per drink instead of breaking.

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
real data, that allergen and spirit exclusions are absolute, that no runner-up
label makes a false claim, and that every reachable answer combination returns
a recommendation.
