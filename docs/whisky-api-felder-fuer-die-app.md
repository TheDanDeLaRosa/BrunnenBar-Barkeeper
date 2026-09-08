# Was die Whisky App aus dem Menu API braucht

Stand 08.09.2026. Gegenstück zu `menu-api-felder-fuer-die-app.md`, nur für die
Whisky Empfehlung in `whiskey/`.

Die App ist fertig gebaut und liest die eine Quelle über denselben Loader wie
die Cocktail App. Was fehlt, ist ein Feld pro Flasche. Ohne dieses Feld weiss
die Karte nicht, dass eine Flasche ein Whisky ist, und die App kann nichts
empfehlen.

Anders als beim Cocktail Brief geht es hier nicht um vier Werte, die es schon
mal gab. Whisky Profile standen nie im Export. Sie stehen aber auf jeder
Flasche und auf jeder Produktseite, das Ausfüllen ist also Abschreiben und
nicht Erfinden.

---

## Die eine Regel, die alles trägt

Ein Eintrag ist ein Whisky, wenn er ein Objekt `whisky` hat. Sonst nicht.

Das ist bewusst dieselbe Bauart wie bei den Cocktails, wo eine gefüllte
`ingredients` Liste entscheidet. Kein Abschnittsname im Code, keine Liste von
Marken, nichts das kaputt geht, wenn ihr die Karte umbaut. Ihr könnt den
Abschnitt Whisky morgen in Braunes umbenennen und die App merkt es nicht.

Ein Bier hat kein `whisky`, ein Cocktail auch nicht, und beide bleiben deshalb
für immer aus den Empfehlungen raus, ohne dass jemand etwas filtern muss.

---

## Das Feld

```json
"whisky": {
  "kind": "Single Malt",
  "kind_en": "Single malt",
  "distillery": "Talisker",
  "origin": "Inseln",
  "origin_en": "The islands",
  "age_years": 10,
  "abv": 45.8,
  "cask": ["Bourbonfass"],
  "cask_en": ["Bourbon cask"],
  "peat": 2,
  "notes": ["maritim/salzig", "würzig", "fruchtig"],
  "notes_en": ["maritime/salty", "spicy", "fruity"],
  "serve": ["pur", "mit Wasser", "Highball"],
  "serve_en": ["neat", "with water", "highball"],
  "level": "klassiker"
}
```

Alles andere an der Zeile bleibt wie im Menu API Brief. `prices`, `name`,
`description`, `bartender_note`, `allergens`, `popularity_rank` und
`on_printed_menu` liest die App aus den Feldern, die es schon gibt.

### Was die App mindestens braucht

`peat`, `origin` und `notes`. Mit diesen drei läuft sie.

Alles andere ist Zusatz. Fehlt ein Zusatzfeld, lässt die Ergebniskarte die
Zeile einfach weg und die passende Frage verschwindet aus dem Fragebogen. Die
App fragt nie etwas, das die Karte nicht beantworten kann, und sie bietet nie
eine Antwort an, die keine Flasche trägt. Wenn also nur die Hälfte der Felder
kommt, läuft trotzdem eine kürzere und ehrliche Version.

---

## 1. `peat`

Typ `number`, 0 bis 4. Das wichtigste Feld überhaupt, weil Rauch die eine
Sache ist, bei der ein falscher Vorschlag den Abend eines Gastes ruiniert.

| Wert | heisst | Beispiel |
|---|---|---|
| 0 | kein Rauch | Singleton, Cardhu, Bourbon |
| 1 | ein Hauch | Oban, Clynelish, Johnnie Walker Black |
| 2 | spürbar | Talisker 10 |
| 3 | kräftig | Caol Ila 12 |
| 4 | Lagerfeuer | Lagavulin 16 |

**Regel, die die App durchsetzt.** Sagt ein Gast kein Rauch, sieht er nie eine
Flasche ab Stufe 2, egal wie gut sie sonst passen würde. Diese Regel wird nie
gelockert. Eine Flasche ohne `peat` gilt dabei als rauchig, weil die sichere
Lesart von vielleicht rauchig rauchig ist. Ein Feld, das ihr vergesst, kostet
die Flasche also Empfehlungen.

Umgekehrt gilt das nicht. Wer Lagerfeuer will und wir haben gerade nichts,
bekommt trotzdem einen Vorschlag, aber die Seite sagt dazu, dass wir den Rauch
nicht getroffen haben.

## 2. `origin` und `origin_en`

Typ `string`. Genau ein Wert aus dieser Liste.

| de | en |
|---|---|
| `Speyside` | `Speyside` |
| `Islay` | `Islay` |
| `Highlands` | `Highlands` |
| `Lowlands` | `Lowlands` |
| `Campbeltown` | `Campbeltown` |
| `Inseln` | `The islands` |
| `Irland` | `Ireland` |
| `USA` | `USA` |
| `Japan` | `Japan` |
| `Schottland` | `Scotland` |
| `Andere` | `Elsewhere` |

`Schottland` ist für Blends gedacht, die aus mehreren Regionen kommen, etwa
Johnnie Walker. Die App zeigt den Wert auf der Karte an, bietet ihn aber
bewusst nicht als Antwort an, weil niemand nach irgendwo in Schottland fragt.

`Inseln` meint Skye, Orkney, Jura, Mull und Arran. Islay ist bewusst getrennt,
weil Gäste danach namentlich fragen.

**Regel, die die App durchsetzt.** Die Herkunft ist ein Tor und keine
Punktzahl. Wer Islay sagt, bekommt Islay. Haben wir nichts davon, öffnet die
App die Auswahl und sagt auf der Seite, dass sie es getan hat.

## 3. `notes` und `notes_en`

Typ `string[]`, zwei bis vier Stück. Was man schmeckt, in Gästesprache.

| de | en |
|---|---|
| `fruchtig` | `fruity` |
| `zitrus` | `citrus` |
| `honig/vanille` | `honey/vanilla` |
| `malzig` | `malty` |
| `würzig` | `spicy` |
| `dunkle früchte` | `dark fruit` |
| `schokolade` | `chocolate` |
| `maritim/salzig` | `maritime/salty` |
| `blumig` | `floral` |
| `nussig` | `nutty` |
| `cremig` | `creamy` |

Klein geschrieben und mit Umlauten, genau wie in der Tabelle. Beide Listen in
derselben Reihenfolge.

Rauchig steht bewusst nicht drin. Rauch hat mit `peat` eine eigene Achse, und
zweimal dasselbe zu bewerten würde jede rauchige Flasche doppelt belohnen.

## 4. `cask` und `cask_en`

Typ `string[]`. Was das Fass angeht, macht es meist mehr aus als die
Jahreszahl.

| de | en |
|---|---|
| `Bourbonfass` | `Bourbon cask` |
| `Sherryfass` | `Sherry cask` |
| `Portfass` | `Port cask` |
| `Weinfass` | `Wine cask` |
| `Rumfass` | `Rum cask` |
| `Neue Eiche` | `New oak` |

Bourbon und Tennessee Whiskey bekommen `Neue Eiche`, weil sie per Gesetz aus
frisch ausgebrannten Fässern kommen.

## 5. `serve` und `serve_en`

Typ `string[]`. Wie wir die Flasche am liebsten ausschenken.

| de | en |
|---|---|
| `pur` | `neat` |
| `mit Wasser` | `with water` |
| `auf Eis` | `on ice` |
| `Highball` | `highball` |

Das ist eine Empfehlung und kein Verbot. Ein Gast, der einen Lagavulin auf Eis
will, bekommt ihn auf Eis. Die App nutzt das Feld nur, um zu erkennen, welche
Flasche in ein langes Glas passt.

## 6. `level`

Typ `string`, genau ein Wert. Wofür die Flasche heute Abend da ist.

| Wert | heisst |
|---|---|
| `einstieg` | erster Whisky, weich, verzeiht alles |
| `klassiker` | kennt man, steht in jeder guten Bar |
| `kenner` | für jemanden, der schon öfter Whisky trinkt |
| `rarität` | die gute Flasche hinten |

**Regel, die die App durchsetzt.** Sagt ein Gast, es ist sein erster Whisky,
sieht er nur `einstieg` und `klassiker`. Ein Anfänger mit einem Lagavulin 16
im Glas kommt nicht wieder. Haben wir nichts Passendes, öffnet die App die
Auswahl und sagt es dazu.

## 7. `kind`, `distillery`, `age_years` und `abv`

Reine Anzeige, keine Bewertung.

- `kind` und `kind_en`, Typ `string`. `Single Malt`, `Blended Scotch`,
  `Blended Malt`, `Bourbon`, `Rye`, `Irish Blend`, `Tennessee Whiskey`,
  `Japanese Blend`, `Grain`.
- `distillery`, Typ `string`. Für später, wenn wir Flaschen derselben
  Brennerei nebeneinander zeigen wollen.
- `age_years`, Typ `number` oder `null`. `null` heisst ohne Altersangabe und
  die Karte schreibt das dann auch so hin. Bitte nicht 0 schreiben.
- `abv`, Typ `number`, etwa `45.8`.

---

## Was die App aus vorhandenen Feldern selbst holt

**Preise.** Ausschliesslich aus `prices`. Die drei Preisstufen im Fragebogen
werden bei jedem Aufruf aus den echten Preisen der Karte geschnitten, deshalb
steht in der App keine einzige Zahl. Verglichen wird immer mit dem günstigsten
Ausschank einer Zeile, weil ein Gast mit Budget das kleine Glas bestellen kann.

**Regel, die die App durchsetzt.** Eine Obergrenze wird nie überschritten.
Eine Flasche ganz ohne Preis wird einem Gast mit Obergrenze nicht angeboten,
aus demselben Grund wie beim Rauch.

**Beliebtheit.** Aus `popularity_rank`. Nur als Stichentscheid zwischen sonst
gleichwertigen Flaschen und mit sehr kleinem Gewicht. Verkaufszahlen
entscheiden nichts.

**Allergene, Beschreibung, Barkeeper Notiz, Karte ja nein.** Wie gehabt aus
`allergens`, `description`, `bartender_note` und `on_printed_menu`.

---

## Zum Loslegen

In `whiskey/data/demo-menu.js` liegen neunzehn Flaschen im richtigen Format,
inklusive der Diageo Kernserie. Die Struktur stimmt, die Werte sind ein
Vorschlag zum Gegenlesen und keine Wahrheit. Wer die Karte pflegt, kann die
Profile von dort übernehmen, korrigieren und in die echten Zeilen hängen.

Die Datei ist ausdrücklich keine Datenquelle. Sie wird nur geladen, wenn in der
Adresszeile `?demo=1` steht, sie wird bei einem gescheiterten Fetch nie
angefasst, und die Seite schreibt im Vorschaumodus in Gold auf jeden Bildschirm,
dass nichts davon echt ist. Sobald die echten Profile live sind, fliegt sie raus.

## Zum Nachprüfen

Wenn die Felder drin sind, reicht ein Blick auf eine Flasche. Die App meldet
beim Start in der Konsole nichts, sie zeigt es direkt. Fehlt ein Feld
vollständig, fehlt die dazugehörige Frage. Sind alle da, hat der Fragebogen
sieben Fragen und die Ergebniskarte acht Zeilen.

Sagt Bescheid, sobald das live ist. Es ist keine Änderung an der App nötig.
