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

`.github/workflows/tests.yml` runs every `*.test.js` in the repo on each push
and pull request. It **discovers** them rather than listing them, so a new
suite is picked up by being named `*.test.js` and the workflow needs no edit.
There is still nothing to install.

Scoring lives in an `engine.js` with no DOM in it, which is the only reason it
can be tested. Anything derived from the raw data lives in its own pure file
too, the way `tequila/assets/agave.js` does. Everything visual is in `app.js`.

**Derivation reads structured fields, never guest prose.** `name`, `group` and
the `ingredients` lists are written as data. `description` and
`bartender_note` are sentences, and a sentence like "der Negroni mit Tequila
statt Gin" makes any keyword search lie.

## The data rule that matters most

There is exactly one source, the live Menu API, and `assets/menu-source.js` is
the only file allowed to talk to it. Nothing is pushed to the apps, they fetch
for themselves, and there is no export and no file anyone has to send.

    https://brunnenbar.com/wp-json/wp/v2/pages/217?_fields=content

From the 08.09.2026 data spec, and these are not negotiable:

- The app only reads, it never writes back.
- Never cache it on a server of our own, and never bundle a copy. The only
  fallback is the last response that browser itself received, shown with its
  age.
- **Ask hourly at most.** The card changes a few times a week, not a few times
  a minute. `MAX_AGE_MS` is one hour and should not be shortened.
- **`content_hash` decides whether anything changed**, not `published_at`.
  Every build stamps a new timestamp whether or not the card moved, so
  comparing it would cause a needless redraw every time.
- **`hidden_on_card: true` is never shown.** These are till articles, not guest
  positions. `allItems` drops them, which is the one place it can be forgotten
  only once. This reverses the original brief, which called them orderable.
- **`menu_class` is never shown to a guest.** It is BarPatrol's margin and
  popularity bucket. `assets/menu-source.js` lists it in `INTERNAL_FIELDS`, and
  `tequila/assets/agave.js` additionally never copies it into the record it
  hands the interface, so it cannot leak by accident.
- If `&amp;` ever appears in the payload the publishing pipeline is broken.
  Report it, do not repair it.
- Never render `content.rendered` as HTML, only read the `pre` block.
- Never hard-code a drink, a price, a section name or an allergen.
- The order of sections and items is the display order, already sorted by
  `popularity_rank`. Do not resort it.
- Availability is not filtered. Everything published is orderable.
- `image` is a full URL or `null`, and roughly a third of the card has no
  photo. Link it, never copy it, and always test for null.
- `recommended` marks the card's own leader for a section. Show it as a marker.
  It is not a ranking input and there is no separate recommendations block.
- `pos_sku` is the till link and is for the bar, not a guest. It is in
  `INTERNAL_FIELDS` alongside `menu_class`.

If a field is missing, it gets added at the source by the Website Seat and all
three apps have it. Do not work around it in one app.

### Sections may add, never remove

Whether an item can be recommended is decided by the data. A cocktail has an
ingredient list. Beer and wine have none, and a neat pour is excluded from the
cocktail app separately, because it can carry its own bottle as its ingredient,
which the spirit fields give away.

Which items are a given app's business is a slightly different question. The
data spec asks each app to pick its sections by keyword, because the head
barkeeper renames them as the card moves. That is a weaker rule than the one
this repo already had, so the two are combined rather than swapped.

An item is an app's business if **it carries evidence of its own** (a cocktail
has an ingredient list, an agave spirit names a spirit or a brand) **or** it
sits in a section whose title carries the keyword. `inSection` in
`assets/menu-source.js` is the one implementation of the keyword test. So a
Margarita that moves to Klassiker keeps being a Margarita, and a house drink
whose ingredients name nothing recognisable is still picked up by its shelf.

The consequence, and it is worth knowing rather than discovering: renaming a
section to something with no keyword in it loses only the items that had no
evidence of their own. Everything else survives any rename at all. There is a
test for both halves.

## What reads the source

`assets/menu-source.js` fetches and validates. `assets/menu-adapt.js` reshapes
one published item into the drink the cocktail engine ranks. `assets/spirits.js`
works out the base spirit from the ingredient list, since the feed carries no
such field. `tequila/assets/agave.js` is the same kind of file for the agave
app. Nothing else touches the payload.

Neither adapt nor source repairs anything. Both report. `report()` names a
field missing everywhere and, separately, a value no question can offer, which
is the one that otherwise stays invisible.

`test/fixtures/menu-live.json` and `tequila/test/fixture.js` stand in for the
endpoint in tests, shaped like the real payload.
`test/fixtures/export-2026-08-19.json` is the last BarPatrol export, kept only
because it holds field values the API still needs. No app reads any of them.

## Open work

Both apps now read the live source and neither carries a bundled copy.

**Neither has been run against the live Menu API from this repository.** The
build environment's network policy denies `brunnenbar.com`, so everything is
written against the documented schema and tested against fixtures shaped like
it. The cocktail app answers it on first load: open the console and it names
any field that is missing and any value no question can offer. The first run
against the real payload is worth watching either way, and the payload only
reaches page 217 once the Website Seat republishes.

`docs/menu-api-felder-fuer-die-app.md` and `docs/menu-api-felder-tequila.md`
list what each app still wants from the source. Nothing in the second one
blocks anything, the agave app runs today.

**Two flavour vocabularies meet in the agave app, and that is by design.**
`flavour_tags` on a neat pour is deliberately granular and says `zitrus`.
Cocktails carry no `flavour_tags` in the API at all, so their character is read
off the ingredient list into the house forms `sauer/zitrus` and
`kräuterig/frisch`. Both land in one result. `TAG_ALIASES` in
`tequila/assets/agave.js` folds them onto one key, or a guest asking for citrus
would match the Margarita and not the Blanco, silently.

It is a normaliser and not a plaster. It is inert on any spelling that is
already canonical, so it stays whatever the card sends. Only spellings of the
same thing belong in it, never a new meaning.

**`agave_kind` is the spirit category and `agave_expression` is the
maturation.** That was ambiguous for a day and is settled. No code guesses
which is which any more, and a test pins the direction.

### Two data questions, both decided

`hidden_on_card` items are never shown to a guest, even where they look like
real cocktails. That is settled, not a judgement call to revisit. It is a
different field from `on_printed_menu`, which marks an off menu drink that is
still recommended and still carries its badge.

Rosato Spritz loses its alcohol free flag, because the recipe carries a real
aperitivo at roughly 15 percent. That change belongs in the generator, since
the app never writes back. The safety rule stays either way, a drink counts as
alcohol free only when the flag says so and the strength is 0.
