# BrunnenBar apps — read this first

BrunnenBar is a cocktail bar at Am Brunnenlech 31, 86150 Augsburg. Dan is the
owner and the decision maker on anything not written down here.

This repo holds the **cocktail recommender**. Two more are planned alongside it
on the same website, a **whiskey recommender** and a **tequila recommender**.
All three share one look and one set of rules.

## Before changing anything visual

Read `docs/design-system.md`. It has the full palette with every hex value, the
type scale, the component markup and the reasons behind the choices.

The shared look lives in `assets/brunnenbar-theme.css` and knows nothing about
cocktails. `assets/styles.css` holds only what is true of this app alone and
should stay under about forty lines. **If a rule would also be right for the
whiskey or tequila app, it belongs in the theme.**

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
the only file allowed to talk to it. Nothing is pushed to the apps, they fetch
for themselves, and there is no export and no file anyone has to send.

    https://brunnenbar.com/wp-json/wp/v2/pages/217?_fields=content

From the brief, and these are not negotiable:

- The app only reads, it never writes back.
- Never cache it on a server of our own, and never bundle a copy. The only
  fallback is the last response that browser itself received, shown with its
  age.
- Ask at most hourly. The card changes a few times a week, not a few times a
  minute.
- Compare `content_hash` to decide whether anything actually changed.
  `published_at` moves on every build even when the card did not, so it would
  cause a needless redraw every time.
- If `&amp;` ever appears in the payload the publishing pipeline is broken.
  Report it, do not repair it.
- Never render `content.rendered` as HTML, only read the `pre` block.
- Never hard-code a drink, a price, a section name or an allergen.
- The order of sections and items is the display order, already sorted by
  `popularity_rank`. Do not resort it.
- `hidden_on_card` items are till articles and must never reach a guest.
  `allItems` drops them at the door so no caller has to remember.
- Availability is not filtered. Everything else published is orderable.

Two fields are for the bar and never for a guest. `menu_class` grades margin
and popularity, so `star`, `puzzle`, `plowhorse` and `dog` stay internal, and
`pos_sku` is the till link. Both are listed in `INTERNAL_FIELDS`.

`image` is a full URL or `null`, and roughly a third of the card has no photo,
so every caller has to cope with null.

Whether an item can be recommended is decided by the data and never by a
section name. A cocktail has an ingredient list. Beer and wine have none, and a
neat pour is excluded separately because it can carry its own bottle as its
ingredient, which the spirit fields give away.

If a field is missing, it gets added at the source by the Website Seat and all
three apps have it. Do not work around it in one app.

## Open work

`docs/menu-api-felder-fuer-die-app.md` lists four fields the Menu API still
needs before three of the seven questions can score anything. They were absent
from the first brief and are still absent from the second, so this remains the
one thing blocking a clean launch. Until they land the app runs on the bundled
export, which the brief forbids.
