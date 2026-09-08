/*
 * BrunnenBar — single file preview builder
 * =========================================================================
 * Squashes one of the recommender apps into a single HTML file that runs
 * anywhere, so it can be sent to somebody who wants to look at it without
 * cloning a repository or standing up a server.
 *
 * Run:  node tools/build-preview.js whiskey
 *
 * The output is a preview and never the app. It is pinned to the bundled
 * preview data and cannot reach the Menu API at all, which is the honest
 * shape for something that will be opened on a phone in a bar with no
 * relationship to the live card. The gold banner the app already shows in
 * preview mode carries that message on every screen.
 *
 * Nothing here is a second copy of anything. It reads the same files the
 * app loads at run time and concatenates them, so a change to the app is a
 * change to the preview the next time this runs.
 * =========================================================================
 */
'use strict';

var fs = require('fs');
var path = require('path');

var ROOT = path.join(__dirname, '..');
var app = process.argv[2] || 'whiskey';

function read(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

/* The apps differ only in which files they load and what their preview data
 * is called, so a second entry here is all the tequila app would need. */
var APPS = {
  whiskey: {
    title: 'The Whiskey Expert',
    css: ['assets/brunnenbar-theme.css', 'whiskey/assets/styles.css'],
    /* The loader is in here for its field, price and section helpers, not to
     * fetch anything. A preview never calls loadMenu. */
    js: ['assets/menu-source.js', 'whiskey/assets/engine.js',
         'whiskey/data/questions.js', 'whiskey/data/demo-menu.js'],
    main: 'whiskey/assets/app.js',
    shot: 'whiskey/data/preview-bottle.svg',
    shotRef: 'data/preview-bottle.svg',
    out: 'tools/preview-whiskey.html'
  }
};

var spec = APPS[app];
if (!spec) {
  console.error('Unknown app "' + app + '". Known: ' + Object.keys(APPS).join(', '));
  process.exit(1);
}

// ---------------------------------------------------------------- assets --

var shotUri = 'data:image/svg+xml;base64,'
  + Buffer.from(read(spec.shot), 'utf8').toString('base64');

var css = spec.css.map(read).join('\n\n');
var libs = spec.js.map(read).join('\n');

/* The three edits that turn the app into a preview of itself. Each one is
 * asserted rather than attempted, so a rename in the app fails the build
 * here instead of shipping a page that silently does the wrong thing. */
var main = read(spec.main);

var edits = [
  [/var DEMO = [^;]+;/,
   'var DEMO = true;   // built as a preview, so this is not a question'],
  [/var s = document\.createElement\('script'\);[\s\S]*?document\.head\.appendChild\(s\);/,
   'adopt(window.BBWhiskyDemo.menu);   // bundled in, nothing to fetch'],
  [/if \(DEMO\) loadDemo\(\); else loadLive\(\);/,
   'loadDemo();   // a preview never reaches for the Menu API']
];

edits.forEach(function (pair, i) {
  if (!pair[0].test(main)) {
    console.error('Edit ' + (i + 1) + ' did not match ' + spec.main
      + '. The app changed shape, so this builder needs updating rather than working around.');
    process.exit(1);
  }
  main = main.replace(pair[0], pair[1]);
});

libs = libs.split(spec.shotRef).join(shotUri);

// ------------------------------------------------------------------ html --

var html = '<title>' + spec.title + '</title>\n'
  + '<style>\n' + css + '\n</style>\n\n'
  + '<div class="shell">\n'
  + '  <header class="top">\n'
  + '    <nav class="lang" id="lang-toggle" aria-label="Sprache / Language"></nav>\n'
  + '  </header>\n'
  + '  <main class="stage" id="stage" aria-live="polite"></main>\n'
  + '  <p id="live" class="sr-only" role="status" aria-live="polite"></p>\n'
  + '</div>\n\n'
  + '<script>\n' + libs + '\n</' + 'script>\n'
  + '<script>\n' + main + '\n</' + 'script>\n';

fs.writeFileSync(path.join(ROOT, spec.out), html);
console.log('wrote ' + spec.out + '  ' + Math.round(html.length / 1024) + ' kB');
