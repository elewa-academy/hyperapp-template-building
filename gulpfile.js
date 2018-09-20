let gulp = require("gulp");
let browserify = require("browserify");
let babelify = require("babelify");
let source = require("vinyl-source-stream");

gulp.task("js", function() {
  return browserify("./src/index.js")
    .transform(babelify, {
      presets: ["es2015"]
    })
    .bundle()
    .pipe(source("bundle.js"))
    .pipe(gulp.dest("./public"));
});

gulp.task("default", ["js"]);

gulp.task("watch", function() {
  return gulp.watch("./src/**.js", ["default"]);
});
