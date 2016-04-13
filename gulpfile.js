var gulp = require('gulp'),
  mocha = require('gulp-mocha');

gulp.task('test', function(){
  process.env.NODE_ENV = "test";
  process.env.NODE_CONFIG_DIR = './test/config';

  return gulp.src('./test/**/*.spec.js', {read: false})
    .pipe(mocha());
});