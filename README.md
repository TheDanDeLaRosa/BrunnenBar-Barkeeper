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

### Questions only offer answers the card can honour

Every option a guest can tap is worked out from the menu at the moment it is
shown, against everything answered so far. If nothing still in reach matches an
option, it is not offered.

**Every answer narrows the next question, not just the hard rules.** Picking
mezcal used to leave all nine flavours on offer, so a guest could ask for a
mezcal coffee drink. The card has exactly one mezcal drink, Margarita Rojas,
and it is a smoky sour. The flavour question now offers sour, smoky and
Barkeeper's Choice, and nothing else.

The same narrowing removes shapes that cannot happen. Mid evening at medium
strength there is no spritz, because every spritz on the card is strength 0 or
1, and no stirred drink, because none is tagged for mid evening. A test asserts
both of those claims are still true of the card, so the exclusion cannot quietly
become a snapshot of a bug.

**A question with no real answer is dropped rather than padded out.** Late in
the evening at strength 2 the only whiskey is Talisker Campfire, which is served
hot, and hot is not one of the four shapes the question offers. Every answer
would have led nowhere, so the question is not asked. An unanswerable question
is not a gentler failure than a missing one, it is a promise the card cannot
keep.

**You are never offered to exclude something you just asked for.** Having said
you like mezcal, "no mezcal" would be absurd and picking both would leave
nothing at all.

Two questions are deliberately never filtered. **Strength** is a scale, and a
scale with holes in it reads as broken. **Allergens** is reassurance as much as
it is a filter, and a guest with a nut allergy should see nuts acknowledged
whether or not anything currently contains them.

#### When the narrowing would leave nothing

Option filtering climbs the same ladder the scoring does, in the same order.
Full narrowing first, then gates only, then zero proof without the shot gate,
then hard rules alone. Offering options from a stricter pool than the results
will come from would take away answers that really were available.

This matters in two places on the current card:

- **Alcohol free shots do not exist.** The engine already answers that by
  loosening the shot requirement and saying so on screen. The questions now
  offer what that fallback can actually deliver, which is why zero proof
  outlives the shot gate on the way down. A guest who asks for no alcohol
  never gets offered a flavour only an alcoholic drink has.
- **Nothing light late at night.** There is no strength 1 drink tagged for late
  evening at all. Rather than collapsing the questionnaire to nothing, it
  relaxes and carries on, and the guest gets the near miss the engine was
  always going to give them.

A test walks the funnel, 950 steps across every reachable moment, strength and
spirit, and asserts every option still on offer leads to at least one real
drink.

### Answers do not linger behind a question you can no longer see

Going back and choosing zero proof takes the spirit question away. Going back
and choosing a round of shots takes four flavours away. Any answer that is no
longer on offer is dropped when that happens.

This matters more than it sounds. A stale answer keeps scoring from behind a
question the guest cannot see, so the results are shaped by something with
nothing on screen to explain it. Picking Sweet and Coffee, then going back to
zero proof, now keeps Sweet and quietly drops Coffee.

### The shots path asks less

Picking *Eine Runde Shots* at the first question drops the questionnaire from
seven questions to five. Two are skipped, and both for the same reason: they
could not be answered correctly.

**How it should turn up** is skipped because a shot already is the answer. The
four shapes on offer are long over ice, short and stirred, shaken and silky,
and spritz, and no shot can be any of them. Asking anyway cost every shot the
same 18 points, so a perfect shot came back looking like a mediocre match.

**Which spirit you like** is skipped because the shots on the card are almost
all liqueur and schnapps. Only four of the eleven spirit options appear in a
single available shot, so seven of them could only ever subtract.

Two questions deliberately stay. **Strength** stays because it is the only
thing separating a 40% Raki from a sweet hazelnut liqueur, and because picking
zero proof is what triggers the honest fallback described above. **Allergens**
stays because it is a hard rule, and a hard rule is never dropped to save a
guest a tap.

A test asserts the general form of this rather than the specific fix: every
question the shots path still asks must have at least one option that at least
one shot on the card actually matches. Add a shot-shaped serve option later and
the test tells you the skip should be reconsidered.

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
