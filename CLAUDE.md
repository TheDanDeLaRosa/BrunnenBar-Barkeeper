# BrunnenBar apps — read this first

BrunnenBar is a cocktail bar at Am Brunnenlech 31, 86150 Augsburg. Dan is the
owner and the decision maker on anything not written down here.

This repo holds two apps. The **cocktail recommender** at the root and the
**whisky recommender** in `whiskey/`. A **tequila recommender** is planned
alongside them. All three share one look, one loader and one set of rules.

## Before changing anything visual

Read `docs/design-system.md`. It has the full palette with every hex value, the
type scale, the component markup and the reasons behind the choices.

The shared look lives in `assets/brunnenbar-theme.css` and knows nothing about
any one drink. Each app's own `assets/styles.css` holds only what is true of
that app alone and should stay under about forty lines. **If a rule would also
be right for a sibling app, it belongs in the theme.**

The theme and `assets/menu-source.js` are **linked from each app, never
copied**. Two copies drift, and the loader especially must stay a single file.

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
and on an iPad behind the bar. Tests are plain node, `node test/engine.test.js`
and `node test/menu-source.test.js`, no runner to install.

Scoring lives in `assets/engine.js` with no DOM in it, which is the only reason
it can be tested. Everything visual is in `assets/app.js`.

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
- `hidden_on_card` is **not** a reason to hide something. The seat's data sheet
  says it marks till-only articles, the Menu API brief and Dan both say it only
  means off the printed card. The payload settles it. Every row carrying the
  flag is a real drink, while the genuine till entries carry it as false. No
  app filters on it and the loader offers no helper that would.
- Freshness is `content_hash`, never `published_at`. Every build stamps a new
  timestamp whether anything changed or not.
- At most one fetch an hour.
- `menu_class` is the bar's internal star and dog grading. A guest must never
  see it in any form. There is a test that fails if the interface reads it.

Whether an item can be recommended is decided by the data and never by a
section name. A cocktail has an ingredient list, beer and wine do not. A whisky
carries `peat` and has no ingredient list, so it is poured rather than built.
`flavour_tags` is **not** evidence of a whisky, it is on every cocktail in the
published card. The app reads `region` and `flavour_tags` once a row qualifies,
and accepts the older `origin` and `notes` spellings for both. An agave pour carries `agave_kind`,
`agave_expression`, `agave_region` and `additive_free`. All of these are flat
on the item, next to `brand`.

**Section titles are never a filter, not even as a keyword.** Jack Daniel's is
profiled in Spirituosen rather than in Whisk(e)y, and six of the fifteen
whiskies sit behind `hidden_on_card` so the printed card stays short. Anything
matching on the section would lose half the shelf without saying so.

Each app also cuts its own question flow down to what the data can answer. A
question whose field carries fewer than two values across the pool is dropped,
and so is an answer nothing in the pool carries. See `BBWhiskyEngine.tailor`.

## Open work

Both apps are waiting on the same thing, fields in the Menu API.

`docs/menu-api-felder-fuer-die-app.md` asked for four fields. A capture of a
real published payload shows all four already there, on every position, so
the cocktail app is not waiting on data. It still runs on the bundled export
the brief forbids, but that is now work on the app rather than a request to
the website seat.

`docs/whisky-api-felder-fuer-die-app.md` is now a description rather than a
request. Fifteen whiskies carry every field the app asked for, which is all
seven questions. Nothing on that side is outstanding.

The whisky app is blocked on one thing only, and it is not a field. The
website seat has to republish menu.json to page 217, otherwise none of it is
reachable from a browser. `whiskey/data/demo-menu.js` is a preview behind
`?demo=1` until then, and is not a fallback and not a data source.
