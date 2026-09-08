# Die App auf brunnenbar.com bringen

Stand 08.09.2026. Zehn Dateien, kein Build, keine Datenbank, kein Plugin.

---

## Was hochgeladen wird

```
barkeeper/
  index.html
  data/questions.js
  assets/  app.js  engine.js  menu-source.js  menu-adapt.js  spirits.js
           brunnenbar-theme.css  styles.css  favicon.svg
```

Alle Pfade sind relativ, der Ordner kann also heißen wie er will und liegen wo
er will. Zusammen rund 100 kB.

**Alle zehn Dateien werden gebraucht.** Fehlt `data/questions.js`, bleibt die
Seite leer, weil dort die Fragen und sämtliche Texte stehen.

---

## Weg 1, empfohlen. Eigene Seite unter brunnenbar.com/barkeeper/

1. `barkeeper.zip` entpacken
2. Den Ordner `barkeeper` per FTP oder im Dateimanager des Hosters in das
   WordPress Wurzelverzeichnis legen, also dorthin, wo auch `wp-config.php`
   und der Ordner `wp-content` liegen
3. `https://brunnenbar.com/barkeeper/` aufrufen

Fertig. Danach nur noch im Menü verlinken, zum Beispiel neben der Cocktailkarte.

Nicht über die WordPress Mediathek hochladen, die nimmt `.html` und `.js` gar
nicht erst an und benennt Dateien um.

**Warum dieser Weg der beste ist.** Die App liegt dann auf derselben Domain wie
das Menu API. Der Abruf ist damit same origin, es gibt keine CORS Frage und
nichts, was ein Browser blockieren könnte. Außerdem füllt sie den ganzen
Bildschirm, was auf dem Handy am Tisch der eigentliche Fall ist.

---

## Weg 2. Innerhalb einer WordPress Seite

Wenn sie in der Seitenstruktur mit Kopf und Fuß erscheinen soll, bleibt der
Ordner aus Weg 1 liegen und wird zusätzlich eingebettet. Neue Seite anlegen,
einen Block **Individuelles HTML** einfügen, das hier hinein:

```html
<iframe id="bb-barkeeper" src="/barkeeper/" title="Welcher Drink passt zu dir"
        style="width:100%;height:640px;border:0;display:block"></iframe>
<script>
window.addEventListener('message', function (e) {
  if (!e.data || e.data.type !== 'bb-height') return;
  var f = document.getElementById('bb-barkeeper');
  if (f) f.style.height = e.data.height + 'px';
});
</script>
```

Das Skript ist nötig. Ohne es steht der Rahmen fest auf 640 Pixel und die
Ergebnisseite scrollt innerhalb des Rahmens, auf dem Handy also zwei
Scrollbalken gegeneinander. Die App meldet ihre Höhe bei jedem Schritt, der
Rahmen wächst und schrumpft mit.

Manche Sicherheitsplugins entfernen `<script>` aus Beiträgen. Wenn die Höhe
nicht mitgeht, ist das der Grund, dann ist Weg 1 der ruhigere.

---

## Nach dem Hochladen einmal prüfen

Seite öffnen, Entwicklerkonsole auf, neu laden. Die App sagt beim Start selbst,
ob mit den Daten etwas nicht stimmt.

- **Keine Meldung.** Alles da, nichts zu tun.
- **"missing fields the questions score against".** Ein Feld fehlt auf der
  ganzen Karte, die Frage dazu kann nichts bewerten. Siehe
  `menu-api-felder-fuer-die-app.md`.
- **"Values no question can offer".** Einzelne Getränke tragen einen Wert, den
  keine Frage anbietet, und sind darüber nicht erreichbar. Die Meldung nennt
  Getränk und Wert.

Nichts davon wird in der App repariert. Repariert wird an der Quelle, dann
haben es die Cocktail App, die Tequila App und die Whiskey App gleichzeitig.

---

## Aktualisieren

Die Karte muss nie mit hochgeladen werden. Die App holt sie sich selbst,
höchstens stündlich, und merkt an `content_hash`, ob sich wirklich etwas
geändert hat. Karte in der Bar ändern und innerhalb einer Stunde steht es drin.

Nur wenn sich die App selbst ändert, werden die Dateien ersetzt.
