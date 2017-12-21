var gulp = require('gulp'),
  mocha = require('gulp-mocha');

gulp.task('test', function(){
  process.env.NODE_ENV = "test";
  process.env.NODE_CONFIG_DIR = './test/config'; //sometimes some locations don't work with this syntax, hence using "../" maybe helpful.

  return gulp.src('./test/**/*.spec.js', {read: false})
    .pipe(mocha());
});
