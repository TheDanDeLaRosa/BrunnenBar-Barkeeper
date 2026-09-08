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

## Fields first, names second

As of the 08.09.2026 card the Menu API carries `agave_kind`,
`agave_expression`, `brand`, `agave_region` and `additive_free`. Every one is
read straight off the item, and `assets/agave.js` consults its own
vocabularies only where a field is missing.

| Field on the card | What the app does with it |
|---|---|
| `agave_kind` | tequila, mezcal, sotol, raicilla, bacanora |
| `agave_expression` | blanco, reposado, rosado, añejo, extra añejo, cristalino |
| `brand` | shown as a badge, and mapped to a house |
| `agave_region` | shown on the card, and separates two otherwise identical suggestions |
| `additive_free` | a hard rule the guest can ask for |
| `recommended` | the card's own leader for its section, shown as a marker |
| `image` | the bottle shot on the favourite, linked and never copied |
| `menu_class` | **nothing.** It is not copied into the record at all, see below |

**`agave_kind` and `agave_expression` are documented two ways.** Dan's example
has kind `Tequila` and expression `Añejo`. The data spec's field table glosses
them the other way round. Both values are read by *what they say* rather than
by which key they arrived under, so the app is right either way. That shim
comes out once the generator and the doc agree.

### The fallback is not dead code

Those fields live in `menu.json` and reach page 217 only when the website seat
republishes, so a browser will see the older shape in between. It degrades per
field, the way the German and English strings already do, and loses exactly one
thing: that Don Julio 1942 is an añejo. `test/fixture.js` exports both shapes
and the tests walk both.

### What it derives when it has to

`assets/agave.js` reads **structured fields only** — `name`, `group` and the
two `ingredients` lists. It never reads `description` or `bartender_note`,
because those are sentences, and a sentence like *"der Negroni mit Tequila
statt Gin"* would make any keyword search lie.

| Derived | From | Notes |
|---|---|---|
| is it agave at all | spirit words, brand names, the section | the section can only add |
| `kind` | the bottle, then the shelf | mezcal wins where both are in one glass |
| `expression` | the bottle name | empty where nothing names one |
| `brand` and `portfolio` | a brand list | Diageo houses are recorded, see below |
| `pour` | the ingredient count | under two ingredients is a pour |
| `strength` | the card's own strength word | `null` where the card is silent |
| `tags` | the ingredient list | `flavour_tags` wins the day it exists |
| `price` | the cheapest size in `prices` | never a number written into the app |

### A bottle is not the shelf it stands on

The real section is called **Tequila & Mezcal Neat**. Reading a group or a
section as though it were the bottle made every Don Julio on that shelf a
mezcal, tagged it smoky, and dropped it the moment a guest said no smoke. So
the evidence is split.

- **A bottle** is its own name and its ingredients. Only that decides which
  spirit is in the glass or how it was aged.
- **A shelf** may say there is agave nearby, and may name the spirit only when
  it holds one kind. A section called `Tequila` tells you what a bottle is. A
  section called `Tequila & Mezcal Neat` does not.

### Sections may add, never remove

The data spec asks each app to pick its sections by keyword, because the head
barkeeper renames them as the card moves. That is weaker than the rule this
repo already had, so the two are combined rather than swapped. An item is this
app's business if it carries agave evidence of its own **or** sits in a section
matching `/tequila|mezcal|mescal|agave/i`.

So a Margarita that moves to Klassiker keeps being a Margarita, and a house
drink whose ingredients name nothing recognisable is still picked up by its
shelf. The consequence, tested rather than glossed over: a rename to a title
with no keyword in it loses only the items that had no evidence of their own.

### Two things that never reach a guest

`hidden_on_card` items are till articles and are dropped in
`../assets/menu-source.js`, which is the one place it can be forgotten only
once. `menu_class` is BarPatrol's margin bucket, and rather than trusting the
interface to remember not to print it, `agave.js` does not copy it into the
record at all. Both have tests.

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

1. **Hard, never relaxed.** Allergens, a budget the guest named, "no smoke"
   and "additive free only". A guest who says eleven euro is not shown a
   thirteen euro pour with an apology, and an item whose price the card does
   not carry is never offered against a budget at all. Silence is not a yes,
   which is why *additive free only* narrows a guest to the bottles the bar
   has actually vouched for, and why the question says so.
2. **One gate, relaxed only as a last resort.** Neat against mixed. If
   nothing neat survives the hard rules, the app offers mixed drinks and
   **says on screen that it did**.
3. **Soft scoring.** Expression, kind, character and strength, summed and
   normalised into the match percentage.

### Where the data is silent, the app is silent

An item whose expression the card does not name is **not penalised** for the
card being brief. A Margarita says tequila and stops there, and holding that
against it would be holding the card's brevity against the drink.

Strength is the one place silence costs a little. A bottle nobody has measured
scores below a near miss and above a real mismatch, so it stays reachable, it
never outranks something that matched exactly, and it claims nothing on screen.
It may still outrank a bottle the card says is *too* strong, which is the right
advice: a guest who asked for something light is better served by "we have not
measured this one" than by one we know is wrong.

**A match percentage is only shown once the guest has asked about two things.**
Answer one question and everything that matches it scores the same, which was
three cards all reading 99 per cent. The count is a property of the answers, so
every card in one result agrees about whether the number means anything.

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
inventing a difference.

**No two runner-ups ever carry the same label.** Two cards both saying "Was
ohne Rauch" is barely better than two both saying "Passt ebenfalls", so each
runner-up skips a claim already on screen and uses the next true one.

A test walks every pair on the card and asserts the claim is true of that pair,
and the walk over every answer combination asserts no result repeats a label.

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
| Soll etwas draussen bleiben | `allergens`, plus smoke and additives | hard |

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

**Neat pours carry `strength` now but still no `flavour_tags`.** A pour has no
ingredient list to read a character off, so a blanco and an añejo taste the
same to this app, which is exactly the difference. It is the one field left
that would change what the app can do.

**The loader asks hourly at most and compares `content_hash`.** Both come from
the data spec. `published_at` moves on every build whether or not anything
changed, so it is only the fallback for a payload built before the hash
existed. Both rules live in the shared `../assets/menu-source.js`, so the
cocktail app inherits them the day it moves across.

**The cocktail app still runs on the bundled export.** This app is the
working example of the pattern the brief asks for, so when the cocktail app
moves across, `assets/menu-source.js` and the loading, error and stale
screens in `assets/app.js` are what it should copy.
