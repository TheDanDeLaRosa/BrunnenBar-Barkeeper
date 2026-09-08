# BrunnenBar — Agave recommender

The tequila and mezcal sibling of the cocktail recommender. It asks a guest
six short questions and recommends **from the live card**, neat pours and
agave cocktails alike, with a plain-language reason for each.

Open `tequila/index.html` in a browser. It works from the file system, off a
USB stick, or on an iPad behind the bar.

```bash
node tequila/test/agave.test.js     # the derivation
node tequila/test/engine.test.js    # the scoring
```

---

## What is different from the cocktail app

**It reads the live Menu API, on every visit.** `assets/menu-source.js` is
shared with the cocktail app and is still the only file that talks to the
source. Nothing about the card ships with this app, which is what the brief
asks for and what the cocktail app does not yet do. That buys three screens
the cocktail app never needed, and all three are drawn rather than left to a
spinner.

| State | What the guest sees |
|---|---|
| Loading | the title and one line saying the card is being fetched |
| Nothing came through | what is wrong and an invitation to the bar, never a bundled copy |
| The browser's own last response | the results, with a notice saying how old the card is |

**A neat pour has no ingredient list, and it is the whole point.** The
cocktail app decides what it can score by asking whether an item has
ingredients, because a cocktail does and a beer does not. A tequila app
cannot use that test as a filter, because a pour of Don Julio Añejo has no
ingredients either and is exactly what this app is supposed to be good at.
So the same field stays, as a *classification* rather than a filter. Fewer
than two ingredients is a pour, two or more is something built.

**It asks six questions, not seven, and one of them builds itself.** The
questions are the ones the source can answer and no more. There is no
question about region, still, age in months or additive policy, because the
card carries none of that. `docs/menu-api-felder-tequila.md` asks for it.

---

## Files

```
tequila/index.html              the page
tequila/assets/styles.css       app-specific styling only, kept under 40 lines
tequila/assets/agave.js         derivation (pure, testable)
tequila/assets/engine.js        scoring (pure, testable)
tequila/assets/app.js           interface and question flow
tequila/data/questions.js       the questions and all interface copy
tequila/test/fixture.js         a Menu API payload, TEST DATA, not the card
tequila/test/agave.test.js      node tequila/test/agave.test.js
tequila/test/engine.test.js     node tequila/test/engine.test.js

../assets/brunnenbar-theme.css  the shared look, referenced not copied
../assets/menu-source.js        the one source, referenced not copied
```

The theme and the loader are **referenced with `../`, not duplicated**. The
design system was written for three separate apps and says to copy them; in
one repository serving one website, a second copy is a second thing to keep
in step, and it would not stay in step. If the tequila app is ever deployed
on its own, that is the moment to copy them and not before.

---

## What the app derives, and from what

`assets/agave.js` reads **structured fields only** — `name`, `group` and the
two `ingredients` lists. It never reads `description` or `bartender_note`,
because those are sentences, and a sentence like *"der Negroni mit Tequila
statt Gin"* would make any keyword search lie.

| Derived | From | Notes |
|---|---|---|
| is it agave at all | spirit words and brand names | never a section title |
| `kind` | tequila, mezcal, or agave | mezcal wins where both appear |
| `expression` | blanco, reposado, añejo, extra añejo, cristalino | empty where the card does not name one |
| `brand` and `portfolio` | a brand list | Diageo houses are recorded, see below |
| `pour` | the ingredient count | under two ingredients is a pour |
| `strength` | the card's own strength word | `null` where the card is silent |
| `tags` | the ingredient list | `flavour_tags` wins the day it exists |
| `price` | the cheapest size in `prices` | never a number written into the app |

**The vocabularies are words for spirits and brands, never drinks, prices,
section names or allergens.** That distinction is the whole of the data rule.
A vocabulary of spirit words survives the card being reorganised, renamed or
reprinted, which is the point. A test renames every section in the fixture
and asserts nothing changes.

### The trap this is built around

Agave syrup is in half the drinks on the card and in none of them is it a
spirit. The bare word `agave` is deliberately **not** evidence of an agave
spirit, only of sweetness, and a Gin Sour with agave syrup in it is not a
tequila. There is a test for exactly that, because it is the single most
tempting shortcut in this file.

### Diageo

`Don Julio`, `Casamigos`, `DeLeón`, `Astral` and `21Seeds` are recorded as
Diageo houses. The brand shows on the card as a badge, which is the expert
touch a guest actually notices.

**The portfolio does not touch scoring, on purpose.** A recommender that
quietly favours one supplier is worth nothing to the guest and, a week later,
nothing to the bar either. If the house ever wants a nudge, it belongs in the
tie-break next to popularity and nowhere else, and it should be one line that
somebody chose to write.

---

## Three tiers of rule

1. **Hard, never relaxed.** Allergens, a budget the guest named, and "no
   smoke". A guest who says eleven euro is not shown a thirteen euro pour
   with an apology, and an item whose price the card does not carry is never
   offered against a budget at all. Silence is not a yes.
2. **One gate, relaxed only as a last resort.** Neat against mixed. If
   nothing neat survives the hard rules, the app offers mixed drinks and
   **says on screen that it did**.
3. **Soft scoring.** Expression, kind, character and strength, summed and
   normalised into the match percentage.

### Where the data is silent, the app is silent

An item whose expression the card does not name is **not penalised** for the
card being brief. A Margarita says tequila and stops there, and holding that
against it would be holding the card's brevity against the drink. Same for
strength. Neither is guessed at, and neither is claimed on screen.

### Runner-ups say how they differ

"Passt ebenfalls" tells a guest nothing, so each runner-up is labelled by the
single thing that separates it from the favourite, in this order.

1. smoke, the biggest jump on the card
2. a different expression, where both are actually named
3. a pour against something built
4. noticeably stronger or lighter, where both are recorded
5. an ingredient the favourite does not have, the rarest across the card
6. cheaper, but only by €1.50 or more
7. a character the favourite does not have

If nothing separates them it falls back to "Passt ebenfalls" rather than
inventing a difference. A test walks every pair on the card and asserts the
claim is true of that pair.

Naming the **spirit** is never a difference. Every item this app recommends
has agave in it, so "take this one, it has tequila in it" is not a reason to
take anything, and `isAgaveWord` keeps it out of the running.

### Predictable, with a small jitter

The same answers give the same advice. A per-visit seed breaks exact ties so
two guests at one table are not always handed the same bottle, and it never
overturns a clear winner. Handing the choice back with *Barkeeper's Choice*
widens that jitter considerably, so free rein is a real answer rather than a
slower route to the top seller. Hard rules still apply in full.

---

## The questions, and why those

| Question | What answers it | Tier |
|---|---|---|
| Wie willst du ihn trinken | the ingredient count | gate |
| Welche Agave darf es sein | the expression read off the bottle name | soft |
| Wie kräftig darf er sein | the card's own strength word, three stops | soft |
| Wonach soll es schmecken | the ingredient list, until `flavour_tags` lands | soft |
| Wo soll der Preis landen | `prices`, and the stops are derived from them | hard |
| Soll etwas draussen bleiben | `allergens`, plus smoke | hard |

**Two questions build themselves from the card.** The agave question offers
only expressions the bar carries today, so it can never invite a guest to ask
for a Cristalino that is not behind the bar, and a new bottle brings its own
option with it. The budget question derives its stops from what the card
actually costs, so no number in this app is a price and none goes stale. Both
disappear entirely if the card does not spread far enough to be worth asking.

The strength question has three stops because the Menu API carries three
strength words. Six would be inventing two of them.

---

## Things worth knowing

**The live endpoint could not be reached from the build environment.** The
network policy denies `brunnenbar.com`, so everything here is written against
the documented Menu API schema and tested against a synthetic fixture shaped
exactly like it. The first run against the real payload is worth watching,
and `docs/menu-api-felder-tequila.md` lists what to look for.

**Neat pours probably carry no `strength` and no `flavour_tags`.** If so, two
of the six questions score nothing for exactly the items this app exists to
recommend. That is the first thing to check and the first thing to fix.
Neither costs a pour its place in the results, it simply cannot be ranked by
either.

**The cocktail app still runs on the bundled export.** This app is the
working example of the pattern the brief asks for, so when the cocktail app
moves across, `assets/menu-source.js` and the loading, error and stale
screens in `assets/app.js` are what it should copy.
