
const gulp = require('gulp');
const autoprefixer = require('gulp-autoprefixer');

gulp.task('default', /*['clear-dist'],*/ function () {
    return gulp.start(/*'app-cache', */ 'html', 'css', 'js', 'copy-data');
});

gulp.task('watch', ['html', 'css', 'js', 'copy-data'], function () {
    // gulp.watch('./www/*.html', ['html']);
});

// helper for clean
var clearTasks = ['index.html', 'app-cache.mf', 'css', 'js', 'i', 'font' /*, 'images'*/].map(function (dir) {

    var taskName = 'clear-dir_' + dir;

    gulp.task(taskName, function (cd) {
        return gulp.src('./dist/www/' + dir, { read: false })
            .pipe(clean({force: true}, cd));
    });

    return taskName;

});

// for example
gulp.task('copy-font', function () {
    return gulp.src('./www/font/**/*')
        .pipe(gulp.dest('./dist/www/font'));
});

