'use strict';

var path = require('path');
var browserSync = require( 'browser-sync' ).create();
var helpers = require('handlebars-helpers');
var ghPages = require('gulp-gh-pages');
var extname = require('gulp-extname');
var assemble = require('assemble');
var watch = require('base-watch');
var yaml = require('js-yaml');
var del = require('delete');
var app = assemble();
app.use(watch());

app.option('layout', 'default');
app.dataLoader('yml', function(str, fp) {
  return yaml.safeLoad(str);
});

app.create('slides', {viewType: 'partial', layout: 'slide'});
app.preLayout(/slides\/.*\.hbs$/, function(view, next) {
  view.layout = view.layout || 'slide';
  next();
});

app.helpers(helpers());

app.task('load', function(cb) {
  app.partials('src/templates/partials/*.hbs');
  app.layouts('src/templates/layouts/*.hbs');
  app.slides('src/templates/slides/*.hbs');
  app.pages('src/templates/*.hbs');
  app.data('src/data/*.{json,yml}');
  cb();
});

app.task('build', ['load', 'copy'], function() {
  return app.toStream('pages')
    .pipe(app.renderFile())
    .pipe(extname())
    .pipe(app.dest('_gh_pages'))
    .pipe(browserSync.stream());
});

app.task('copy', ['copy-*']);

app.task('copy-css', function() {
  return app.copy(['node_modules/reveal.js/css/**/*', 'src/styles/**/*'], '_gh_pages/css');
});

app.task('copy-js', function() {
  return app.copy('node_modules/reveal.js/js/**/*', '_gh_pages/js');
});

app.task('copy-lib', function() {
  return app.copy('node_modules/reveal.js/lib/**/*', '_gh_pages/lib');
});

app.task('copy-img', function() {
  return app.copy('src/img/**/*', '_gh_pages/img');
});

app.task('copy-plugin', function() {
  return app.copy('node_modules/reveal.js/plugin/**/*', '_gh_pages/js/plugin');
});

app.task('clean', function(cb) {
  del('./_gh_pages', {force: true}, cb);
});

app.task('cleanPublish', function(cb) {
  del('./.publish', {force: true}, cb);
});

app.task('push', function() {
  return app.src('_gh_pages/**/*')
    .pipe(ghPages());
});
app.task('deploy', app.series(['push', 'cleanPublish']));

app.task('serve', function() {
  browserSync.init({
    port: 8080,
    startPath: 'index.html',
    server: {
      baseDir: path.join(__dirname, './_gh_pages')
    }
  });
});

app.task('watch', function() {
  app.watch('src/**/*', ['build']);
});

app.task('default', ['build']);
app.task('dev', ['build', app.parallel(['serve', 'watch'])]);

module.exports = app;
