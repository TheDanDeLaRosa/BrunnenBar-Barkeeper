# Whisky Felder im Menu API

Stand 08.09.2026. Gegenstück zu `menu-api-felder-fuer-die-app.md`, für die
Whisky Empfehlung in `whiskey/`.

**Alles ist da.** Fünfzehn Flaschen tragen `peat`, `region`, `flavour_tags`,
`cask`, `whisky_level` und `whisky_serve`. Damit stellt die App alle sieben
Fragen und braucht kein weiteres Feld. Was unter Wunschliste steht, ist nur
noch Feinschliff für die Ergebniskarte.

Dieses Dokument ist damit vor allem eine Beschreibung dessen, was gilt, und
nicht mehr eine Bitte.

---

## Die Regel, die alles trägt

Ein Eintrag ist ein Whisky, wenn er `peat`, `region` oder `flavour_tags`
trägt. Sonst nicht. Der Abschnitt spielt keine Rolle.

Die App akzeptiert bei zweien davon beide Schreibweisen, also `region` und
`origin`, `flavour_tags` und `notes`. Das kostet je eine Zeile und sorgt
dafür, dass weder eine Umbenennung noch ein halb durchgelaufener Bau das
Regal leert.

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

### `region`

Typ `string`. Die App liest die Werte so, wie ihr sie schreibt, und baut die
Antwortmöglichkeiten daraus. Aktuell also die neun normalisierten Tokens
Highland, Lowland, Speyside, Islay, Island, Kentucky, Ireland, Tennessee und
Blended. Alle neun haben in der App einen Namen und einen Hinweistext in
beiden Sprachen.

`Blended` ist streng genommen keine Gegend, bekommt aber trotzdem einen
Knopf, weil ein Gast, der einen Blend sucht, genau dieses Wort kennt.

**Wichtig ist nur, dass eine Schreibweise durchgehalten wird.** Steht bei einer
Flasche Highland und bei der nächsten Highlands, sind das für die App zwei
Gegenden, und ein Gast bekommt zwei Knöpfe für dieselbe Sache.

Für Blends über mehrere Gegenden ist `Scotland` genau richtig. Die App zeigt
den Wert an, bietet ihn aber nicht als Frage an, weil niemand nach irgendwo in
Schottland sucht.

### `flavour_tags` und `flavour_tags_en`

Typ `string[]`, zwei bis vier Stück, klein geschrieben. Was man schmeckt, in
Gästesprache.

Die App kennt diese und hat für jede einen Namen und eine Steigerungsform in
beiden Sprachen, was sie für Sätze wie was Fruchtigeres braucht.

`fruchtig`, `zitrus`, `honig/vanille`, `malzig`, `würzig`, `dunkle früchte`,
`schokolade`, `maritim/salzig`, `blumig`, `nussig`, `cremig`

Eine Note ausserhalb dieser Liste bricht nichts, sie wird nur unübersetzt
gezeigt. Sagt Bescheid, wenn ihr eine braucht, dann kommt sie mit Übersetzung
dazu.

`rauchig` dürft ihr ruhig setzen, die App wirft es beim Lesen raus. Rauch hat
mit `peat` eine eigene Achse, und zweimal dasselbe zu bewerten würde jede
rauchige Flasche für eine Eigenschaft doppelt belohnen. Eine Flasche, deren
einziger Tag `rauchig` ist, bleibt trotzdem ein Whisky.

---

### `cask` und `cask_en`

Typ `string[]`. Bourbonfass, Sherryfass, Portfass, Weinfass, Rumfass, Neue
Eiche. Bourbon und Tennessee Whiskey bekommen Neue Eiche, weil sie per Gesetz
aus frisch ausgebrannten Fässern kommen.

### `whisky_level`

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

### `whisky_serve` und `whisky_serve_en`

Typ `string[]`. Wie ihr die Flasche am liebsten ausschenkt.

| de | en |
|---|---|
| `pur` | `neat` |
| `mit Wasser` | `with water` |
| `auf Eis` | `on ice` |
| `Highball` | `highball` |

Das ist eine Empfehlung und kein Verbot. Ein Gast, der einen Lagavulin auf Eis
will, bekommt ihn auf Eis. Die App nutzt das Feld nur, um zu erkennen, welche
Flasche in ein langes Glas gehört, und ein Lagavulin gehört da nicht hinein.

---

## Wunschliste, was noch fehlt

Alles hier ist optional. Fehlt ein Feld, lässt die Ergebniskarte die Zeile weg
und die dazugehörige Frage verschwindet aus dem Fragebogen.

Die Namen sind bewusst so gewählt, dass sie neben den Agavenfeldern stehen
können, also `whisky_kind` neben `agave_kind`.

| Feld | Typ | Was es bringt |
|---|---|---|
| `whisky_age_years` | `number` oder `null` | `null` heisst ohne Altersangabe und die Karte schreibt das dann auch so hin. Bitte nicht 0 |
| `abv` | `number` | Etwa `45.8`, reine Anzeige |
| `whisky_kind` | `string` | Single Malt, Blended Scotch, Bourbon, Rye, Irish Blend, Tennessee Whiskey |
| `whisky_expression` | `string` | 10 Jahre, Black Label, Old No. 7 |

`brand` und `image` gibt es schon und die App liest beide mit.

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

**Fotos.** `image` wird auf der Ergebniskarte neben dem Namen gezeigt, quadratisch
und vollständig sichtbar statt beschnitten. Rund die Hälfte der Karte hat kein
Bild, das ist der Normalfall und hinterlässt keine Lücke.

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
vollständig, fehlt die dazugehörige Frage. Mit dem, was jetzt drin ist, sind es alle
sieben, nämlich Anlass, Rauch, Geschmack, Herkunft, Fass, Trinkweise und
Preis.

`tools/menu-check.html` sagt das in einem Blick. Mit dem erwarteten Hash
hinten dran, also `tools/menu-check.html?hash=8681fe2d4963d005`, sagt die
Seite ausserdem, ob live wirklich diese Version steht oder noch die davor.

`whiskey/data/demo-menu.js` bildet die fünfzehn Flaschen mit den echten
Rauchstufen und Herkünften nach, erfindet aber Preise und Noten. Sie läuft nur
mit `?demo=1` und fliegt raus, sobald republished ist.
