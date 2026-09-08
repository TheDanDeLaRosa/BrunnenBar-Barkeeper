# Whisky Felder im Menu API

Stand 08.09.2026. Gegenstück zu `menu-api-felder-fuer-die-app.md`, für die
Whisky Empfehlung in `whiskey/`.

**Der grosse Teil ist da.** Fünfzehn Flaschen tragen `peat`, `origin` und
`notes`. Damit läuft die App. Was unten unter Wunschliste steht, macht sie
besser, blockiert sie aber nicht.

---

## Die Regel, die alles trägt

Ein Eintrag ist ein Whisky, wenn er `peat`, `origin` oder `notes` trägt.
Sonst nicht. Der Abschnitt spielt keine Rolle.

Das ist nicht Prinzipienreiterei, es ist der einzige Weg, der mit der echten
Karte funktioniert. Jack Daniel's steht in Spirituosen und nicht in
Whisk(e)y. Sechs weitere Flaschen liegen hinter `hidden_on_card`. Wer nach
Abschnittstiteln filtert, verliert genau die Hälfte des Regals, und zwar
lautlos.

Damit gilt für alle drei Apps dieselbe Bauart. Ein Cocktail hat eine
Zutatenliste, ein Agavenbrand hat `agave_kind`, ein Whisky hat ein
Geschmacksprofil. Benennt die Abschnitte morgen um und keine App merkt es.

---

## Was jetzt schon drin ist

### `peat`

Typ `number`, 0 bis 4. Das wichtigste Feld, weil Rauch die eine Sache ist,
bei der ein falscher Vorschlag den Abend eines Gastes ruiniert.

| Wert | heisst | auf unserer Karte |
|---|---|---|
| 0 | kein Rauch | Singleton, Glenkinchie, Bourbon, Jameson |
| 1 | ein Hauch | Oban, Dalwhinnie, Johnnie Walker Black |
| 2 | spürbar | Talisker 10, Talisker Skye |
| 3 | kräftig | noch nichts |
| 4 | Lagerfeuer | Lagavulin 16 |

**Regel, die die App durchsetzt.** Sagt ein Gast kein Rauch, sieht er nie eine
Flasche ab Stufe 2, egal wie gut sie sonst passen würde. Diese Regel wird nie
gelockert. Eine Flasche ohne `peat` gilt dabei als rauchig, weil die sichere
Lesart von vielleicht rauchig rauchig ist.

Umgekehrt gilt das nicht. Wer Lagerfeuer will und wir haben gerade nichts,
bekommt trotzdem einen Vorschlag, aber die Seite sagt dazu, dass wir den Rauch
nicht getroffen haben.

### `origin`

Typ `string`. Die App liest die Werte so, wie ihr sie schreibt, und baut die
Antwortmöglichkeiten daraus. Aktuell also Speyside, Islay, Highland, Lowland,
Skye, Scotland, Ireland, Kentucky und Tennessee.

**Wichtig ist nur, dass eine Schreibweise durchgehalten wird.** Steht bei einer
Flasche Highland und bei der nächsten Highlands, sind das für die App zwei
Gegenden, und ein Gast bekommt zwei Knöpfe für dieselbe Sache.

Für Blends über mehrere Gegenden ist `Scotland` genau richtig. Die App zeigt
den Wert an, bietet ihn aber nicht als Frage an, weil niemand nach irgendwo in
Schottland sucht.

### `notes` und `notes_en`

Typ `string[]`, zwei bis vier Stück, klein geschrieben. Was man schmeckt, in
Gästesprache.

Die App kennt diese und hat für jede einen Namen und eine Steigerungsform in
beiden Sprachen, was sie für Sätze wie was Fruchtigeres braucht.

`fruchtig`, `zitrus`, `honig/vanille`, `malzig`, `würzig`, `dunkle früchte`,
`schokolade`, `maritim/salzig`, `blumig`, `nussig`, `cremig`

Eine Note ausserhalb dieser Liste bricht nichts, sie wird nur unübersetzt
gezeigt. Sagt Bescheid, wenn ihr eine braucht, dann kommt sie mit Übersetzung
dazu.

Rauchig gehört bewusst nicht in diese Liste. Rauch hat mit `peat` eine eigene
Achse, und zweimal dasselbe zu bewerten würde jede rauchige Flasche doppelt
belohnen.

---

## Wunschliste, nach Nutzen sortiert

Alles hier ist optional. Fehlt ein Feld, lässt die Ergebniskarte die Zeile weg
und die dazugehörige Frage verschwindet aus dem Fragebogen. Die App fragt nie
etwas, das die Karte nicht beantworten kann.

Die Namen sind bewusst so gewählt, dass sie neben den Agavenfeldern stehen
können, also `whisky_kind` neben `agave_kind`.

| Feld | Typ | Was es bringt |
|---|---|---|
| `cask`, `cask_en` | `string[]` | Bourbonfass, Sherryfass, Portfass, Weinfass, Rumfass, Neue Eiche. Das Fass macht oft mehr aus als die Jahreszahl, und es ist die zweitbeste Frage nach dem Rauch |
| `whisky_level` | `string` | `einstieg`, `klassiker`, `kenner`, `rarität`. Erlaubt der App, einen ersten Whisky vom schweren Ende des Regals fernzuhalten |
| `whisky_serve`, `_en` | `string[]` | `pur`, `mit Wasser`, `auf Eis`, `Highball`. Wie ihr die Flasche am liebsten ausschenkt |
| `whisky_age_years` | `number` oder `null` | `null` heisst ohne Altersangabe und die Karte schreibt das dann auch so hin. Bitte nicht 0 |
| `abv` | `number` | Etwa `45.8`, reine Anzeige |
| `whisky_kind` | `string` | Single Malt, Blended Scotch, Bourbon, Rye, Irish Blend, Tennessee Whiskey |
| `whisky_expression` | `string` | 10 Jahre, Black Label, Old No. 7 |

`brand` gibt es schon und die App liest es mit.

**Wenn ihr nur eins davon macht, macht `cask`.** Danach `whisky_level`.

### Noch nicht profiliert

Fireball, Jack Daniel's Fire, Jack Daniel's Honey und Johnnie Walker Red. Die
App lässt sie in Ruhe, solange sie kein Profil haben, und das ist auch richtig
so. Ein Zimtlikör als Antwort auf eine Whiskyfrage wäre schlechter als keine
Antwort. Wenn ihr sie doch drin haben wollt, brauchen sie dieselben drei
Felder wie alle anderen.

---

## Zwei Stellen, an denen sich die Dokumente widersprechen

**`hidden_on_card`.** Das Datenblatt vom Website Seat sagt, solche Zeilen
seien reine Kassenartikel und dürften Gästen nicht gezeigt werden. Das Menu
API Brief sagt das Gegenteil, nämlich dass alles Veröffentlichte bestellbar
ist und die Fahne nur die gedruckte Karte meint. Dan hat entschieden, und zwar
für die zweite Lesart, damit die App das ganze Backbar empfehlen kann, während
die gedruckte Karte kurz bleibt.

**Die Whisky App zeigt diese Flaschen also.** Sechs von fünfzehn hängen daran.
Sie bekommen auf der Ergebniskarte den Hinweis, dass sie nicht auf der Karte
stehen. Der gemeinsame Loader filtert nichts weg, bietet aber `cardItems` an,
falls eine andere App die strengere Lesart braucht.

**Abfragerhythmus.** Das Datenblatt sagt höchstens stündlich, das Brief sagt
höchstens ein paar Minuten. Der Loader macht jetzt stündlich, weil der Text
mit der längeren Frist der neuere ist und die Karte sich ein paar Mal pro
Woche ändert und nicht ein paar Mal pro Minute.

---

## Was die App aus vorhandenen Feldern selbst holt

**Preise.** Ausschliesslich aus `prices`. Die drei Preisstufen im Fragebogen
werden bei jedem Aufruf aus den echten Preisen geschnitten, deshalb steht in
der App keine einzige Zahl. Verglichen wird mit dem günstigsten Ausschank
einer Zeile, weil ein Gast mit Budget das kleine Glas bestellen kann. Eine
Obergrenze wird nie überschritten, und eine Flasche ganz ohne Preis wird einem
Gast mit Obergrenze nicht angeboten.

**Aktualität.** Über `content_hash`, nicht über `published_at`. Ein neuer Bau
setzt einen neuen Zeitstempel, auch wenn sich nichts geändert hat, und dann
würde die Ansicht unter einem Gast neu aufgebaut, der gerade liest.

**Beliebtheit.** Aus `popularity_rank`, nur als Stichentscheid zwischen sonst
gleichwertigen Flaschen und mit sehr kleinem Gewicht.

**`menu_class` wird nirgends angefasst.** Ein Test im Repo scheitert, wenn
jemand es doch tut. Ein Gast darf nie erfahren, dass die Bar seinen Drink
intern als Dog führt.

**`recommended` bleibt bewusst ungenutzt.** Es markiert auf der Website den
Leader eines Abschnitts. In dieser App stünde es neben unserer eigentlichen
Empfehlung und würde ihr widersprechen, und zwei goldene Aussagen auf einem
Bildschirm heben sich gegenseitig auf.

---

## Zum Nachprüfen

Sobald republished ist, reicht ein Blick auf die App. Fehlt ein Feld
vollständig, fehlt die dazugehörige Frage. Sind alle da, hat der Fragebogen
sieben Fragen. Heute sind es vier, nämlich Rauch, Geschmack, Herkunft und
Preis.

`whiskey/data/demo-menu.js` bildet die fünfzehn Flaschen mit den echten
Rauchstufen und Herkünften nach, erfindet aber Preise und Noten. Sie läuft nur
mit `?demo=1` und fliegt raus, sobald republished ist.
