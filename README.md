# BrunnenBar — Recommenders

Two apps for [brunnenbar.com](https://brunnenbar.com), sharing one look and one
data source. The **cocktail recommender** is at the repository root, the
**whisky recommender** is in `whiskey/`. A tequila one is planned alongside
them. The shared house style lives in `assets/brunnenbar-theme.css` and is
documented in `docs/design-system.md`.

Most of this README is about the cocktail app. The whisky app has its own
section near the bottom.

---

## The cocktail recommender

It asks a guest the questions we'd ask across the bar, then recommends drinks
**from our actual card**, with a plain-language reason for each.

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
That is real signal, so the four options map to it one for one.

The framing took three attempts. Asking a guest to place themselves on the
evening's timeline reads like a survey no matter how it is worded, because it
asks about the guest when the data is about the drink. The question now asks
what the drink has to **do** — make you hungry, carry the next hour, round
things off — which is both what a bartender actually thinks about and exactly
what the field encodes.

An earlier idea was to ask how big a night it is, one drink versus a long
session. The data does not support it. Nothing in the export says whether a
drink suits a long session, and the closest honest proxies, strength and
long-versus-short, are already their own questions.

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
assets/brunnenbar-theme.css  the shared house style, used by every app
assets/menu-source.js        the ONLY file allowed to talk to the Menu API
assets/favicon.svg

index.html                   the cocktail app
assets/styles.css            what is true of the cocktail app alone
assets/engine.js             cocktail scoring (pure, testable)
assets/app.js                cocktail interface and question flow
data/cocktails.json          ← THE SOURCE OF TRUTH. Replace this to update the card.
data/menu.js                 generated by tools/build-menu.js — do not edit
data/questions.js            the cocktail questions and all interface copy
tools/build-menu.js          node tools/build-menu.js

whiskey/index.html           the whisky app
whiskey/assets/styles.css    what is true of the whisky app alone
whiskey/assets/engine.js     whisky scoring (pure, testable)
whiskey/assets/app.js        whisky interface and question flow
whiskey/data/questions.js    the whisky questions and all interface copy
whiskey/data/demo-menu.js    preview bottles, ?demo=1 only, never a fallback

test/engine.test.js          node test/engine.test.js
test/menu-source.test.js     node test/menu-source.test.js
test/whiskey-engine.test.js  node test/whiskey-engine.test.js

docs/design-system.md                    the house style, in words
docs/menu-api-felder-fuer-die-app.md     fields the cocktail app still needs
docs/whisky-api-felder-fuer-die-app.md   fields the whisky app still needs
```

The test suite checks that the built menu matches the export exactly, that no
unavailable drink can leak through, that every question value corresponds to
real data, that allergen and spirit exclusions are absolute, that no runner-up
label makes a false claim, and that every reachable answer combination returns
a recommendation.


---

# The whisky recommender

`whiskey/index.html`. Same seven question rhythm as the cocktail app, same
look, different subject. It recommends bottles from the shelf rather than
drinks from the card, which changes three things.

**It reads the live Menu API, not a bundled export.** The cocktail app still
runs on `data/menu.js` while the fields in
`docs/menu-api-felder-fuer-die-app.md` are outstanding. The whisky app never
does that. It goes through `assets/menu-source.js`, and when the card cannot
be reached it shows the last response that browser itself received with its
age, exactly as the Menu API brief requires.

**A bottle is a whisky because it carries `peat`, `origin` or `notes`.** Never
because of the section it sits in. That is not a stylistic preference. Jack
Daniel's is profiled in Spirituosen rather than in Whisk(e)y, and six of the
fifteen bottles sit behind `hidden_on_card` so the printed card can stay
short, so a section filter would drop almost half the shelf in silence. The
fields are documented in `docs/whisky-api-felder-fuer-die-app.md` and are in
the Menu API today.

**It shows the back bar.** `hidden_on_card` means off the printed card, not
off limits, so those six bottles are recommended with a badge saying a guest
will not find them on the paper. The seat's data sheet asks apps to hide them
and Dan decided otherwise, which is why `menu-source.js` hides nothing by
default and offers `cardItems` to any app that wants the other reading.

**The questionnaire builds itself from the data.** A question whose field
carries fewer than two different values is dropped before a guest sees it,
because it could not tell two bottles apart. The answers are the values the
card actually carries, not a list in this repository, so a region spelled
Highland rather than Highlands still reaches a guest with its own name on the
button, and nobody is offered Campbeltown when there is no Campbeltown behind
the bar. The written options are a table of labels and hints, nothing more. As
the Menu API grows fields, questions appear on their own with no release.

Today that gives four questions, smoke and taste and region and price.
`cask` and `whisky_level` would make it seven.

## What it will and won't do

The three tiers are the same as the cocktail app, with whisky's own contents.

**Hard rules, never relaxed.** A guest who says no smoke never sees anything
at peat 2 or above. A guest who sets a price ceiling never sees anything over
it. In both cases missing data counts against the bottle, because the safe
reading of maybe smoky is smoky and of maybe expensive is expensive.

**Gates, relaxed only as a last resort and always said out loud.** Region, and
keeping a first whisky away from the heavy end of the shelf. Region gives way
first. Whichever gave way, the results page says so.

**Everything else is scored.** Tasting notes, cask, how they drink it, what the
glass is for, and how far the smoke is from what was asked for. Sales figures
break ties and nothing more.

There is a fourth thing the app does that the cocktail app has no need for. If
we cannot supply the smoke a guest asked for, the page says so rather than
quietly handing over something gentler as though it were the answer.

## Looking at it before the data exists

The data exists, but it only reaches a browser once the website seat
republishes menu.json to page 217. Until that lands:

```bash
open whiskey/index.html?demo=1     # the real fifteen, gold warning on every screen
node test/whiskey-engine.test.js   # 55 tests
```

`whiskey/data/demo-menu.js` mirrors the real shelf, with the real peat and
origin values and invented prices and tasting notes. It is a preview, not a
data source. It is fetched only when the address bar asks for it, it is never
reached by a failed load, and it goes in the bin the day the publish lands.
