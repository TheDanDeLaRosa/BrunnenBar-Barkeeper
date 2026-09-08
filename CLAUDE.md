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
the only file allowed to talk to it. From the brief, and these are not
negotiable:

- The app only reads, it never writes back.
- Never ship a bundled copy of the menu as a fallback. The only fallback is the
  last response that browser itself received, shown with its age.
- If `&amp;` ever appears in the payload the publishing pipeline is broken.
  Report it, do not repair it.
- Never render `content.rendered` as HTML, only read the `pre` block.
- Never hard-code a drink, a price, a section name or an allergen.
- The order of sections and items is the display order. Do not resort it.
- Everything published is orderable. The app does not filter for availability.

Whether an item can be recommended is decided by the data and never by a
section name. A cocktail has an ingredient list, beer and wine do not.

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
