# BrunnenBar apps — read this first

BrunnenBar is a cocktail bar at Am Brunnenlech 31, 86150 Augsburg. Dan is the
owner and the decision maker on anything not written down here.

This repo holds two apps. The **cocktail recommender** at the root, and the
**agave recommender** for tequila and mezcal under `tequila/`. A **whiskey
recommender** is planned alongside them on the same website. All of them share
one look and one set of rules.

The two apps share `assets/brunnenbar-theme.css` and `assets/menu-source.js`
by reference, with `../` from `tequila/`, rather than by copy. One repository
serving one website should not carry two copies of either.

## Before changing anything visual

Read `docs/design-system.md`. It has the full palette with every hex value, the
type scale, the component markup and the reasons behind the choices.

The shared look lives in `assets/brunnenbar-theme.css` and knows nothing about
cocktails or tequila. Each app's own `styles.css` holds only what is true of
that app alone and should stay under about forty lines. **If a rule would also
be right for one of the other apps, it belongs in the theme.**

Short version of the look: near-black grounds with a green bias, champagne gold
as the only accent, forest green as a secondary mark, serif headings against a
sans body, one column at 46rem, one breakpoint at 34rem.

Never introduce a colour that is not already a token. Never use grey neutrals,
the green bias in the grounds is what holds the whole thing together.

## How guest-facing copy sounds

Warm casual German, du and ihr, never Sie. **No hyphens, no dashes, no bullet
lists, no numbered lists, no colons and no semicolons.** Write in sentences.

Every string exists in German and English, and falls back to German per field
rather than wholesale. Nothing is machine translated, the English is the bar's
own.

Never pre-wish a birthday or a wedding.

## How the code is built

Vanilla JavaScript, no framework, no build step, no dependencies. Plain script
tags exposing globals, because the page has to work opened straight off disk
and on an iPad behind the bar. Tests are plain node, no runner to install.

```
node test/engine.test.js            node tequila/test/agave.test.js
node test/menu-source.test.js       node tequila/test/engine.test.js
```

Scoring lives in an `engine.js` with no DOM in it, which is the only reason it
can be tested. Anything derived from the raw data lives in its own pure file
too, the way `tequila/assets/agave.js` does. Everything visual is in `app.js`.

**Derivation reads structured fields, never guest prose.** `name`, `group` and
the `ingredients` lists are written as data. `description` and
`bartender_note` are sentences, and a sentence like "der Negroni mit Tequila
statt Gin" makes any keyword search lie.

## The data rule that matters most

There is exactly one source, the live Menu API, and `assets/menu-source.js` is
the only file allowed to talk to it. From the 08.09.2026 data spec, and these
are not negotiable:

- The app only reads, it never writes back.
- Never ship a bundled copy of the menu as a fallback, and never cache it on a
  server of our own. The only fallback is the last response that browser itself
  received, shown with its age.
- **Ask hourly at most.** The card changes a few times a week, not a few times
  a minute. `MAX_AGE_MS` is one hour and should not be shortened.
- **`content_hash` decides whether anything changed**, not `published_at`.
  Every build stamps a new timestamp whether or not the content moved.
- **`hidden_on_card: true` is never shown.** These are till articles, not guest
  positions. `allItems` drops them, which is the one place it can be forgotten
  only once. This reverses the original brief, which called them orderable.
- **`menu_class` is never shown to a guest.** It is BarPatrol's margin and
  popularity bucket. `tequila/assets/agave.js` deliberately does not copy it
  into the record it hands the interface, so it cannot leak by accident.
- If `&amp;` ever appears in the payload the publishing pipeline is broken.
  Report it, do not repair it.
- Never render `content.rendered` as HTML, only read the `pre` block.
- Never hard-code a drink, a price, a section name or an allergen.
- The order of sections and items is the display order. Do not resort it.
- `image` is a URL or `null`. Link it, never copy it, and always test for null.
- `recommended` marks the card's own leader for a section. Show it as a marker.
  It is not a ranking input and there is no separate recommendations block.

### Sections may add, never remove

The data spec asks each app to pick its sections by keyword, because the head
barkeeper renames them as the card moves. That is a weaker rule than the one
this repo already had, so the two are combined rather than swapped.

An item is an app's business if **it carries evidence of its own** (a cocktail
has an ingredient list, an agave spirit names a spirit or a brand) **or** it
sits in a section whose title carries the keyword. So a Margarita that moves to
Klassiker keeps being a Margarita, and a house drink whose ingredients name
nothing recognisable is still picked up by its shelf.

The consequence, and it is worth knowing rather than discovering: renaming a
section to something with no keyword in it loses only the items that had no
evidence of their own. Everything else survives any rename at all. There is a
test for both halves.

Whether an item can be recommended is otherwise decided by the data. A cocktail
has an ingredient list, beer and wine do not.

## Open work

**The cocktail app still runs on the bundled export, which the brief forbids.**
`docs/menu-api-felder-fuer-die-app.md` lists the four fields the Menu API needs
before three of its seven questions can score anything. That is the thing
blocking a clean launch.

The agave app already reads the live source and is the working example of the
pattern. When the cocktail app moves across, the loading, error and stale
screens in `tequila/assets/app.js` are what it should copy.

`docs/menu-api-felder-tequila.md` is the same kind of ask for the agave app.
Nothing there blocks it, it runs today.

**Neither app has been run against the live Menu API from this repository.**
The build environment's network policy denies `brunnenbar.com`, so everything
is written against the documented schema and tested against synthetic fixtures
shaped like it. The first run against the real payload is worth watching.

**The card writes one flavour two ways.** The cocktail half uses
`sauer/zitrus` and `kräuterig/frisch`, the neat pours use `zitrus` and
`frisch`. `TAG_ALIASES` in `tequila/assets/agave.js` folds them onto one key,
because otherwise a guest asking for citrus matches the Margarita and not the
Blanco. Only spellings of the same thing belong in that table, never a new
meaning, and it should shrink to nothing once the two halves agree at source.

**`agave_kind` is the spirit category and `agave_expression` is the
maturation.** That was ambiguous for a day and is settled. No code guesses
which is which any more, and a test pins the direction.
