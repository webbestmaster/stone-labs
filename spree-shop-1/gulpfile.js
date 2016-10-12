const fs = require('fs');
const path = require('path');

const gulp = require('gulp');

const clean = require('gulp-rimraf');

const dot = require('dot');
const template = require('gulp-dot-template');

const cssimport = require('gulp-cssimport');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');


gulp.task('clean', function () {
    return gulp.src('./dist/**/*')
        .pipe(clean({force: true}));
});


gulp.task('dot', function () {

    return readFiles('www/chunks/', {test: /\.dot$/})
        .then(chunks => {
            return gulp.src('www/*.html')
                .pipe(template({chunks}))
                .pipe(gulp.dest('dist'));

        });

});


gulp.task('import-css', function () {
    return gulp.src('./www/css/main/main.scss')
        .pipe(cssimport({}))
        .pipe(gulp.dest('./dist/'));
});

gulp.task('sass', function () {
    return gulp.src('./dist/main.scss')
        .pipe(clean({force: true}))
        .pipe(sass())
        .pipe(gulp.dest('./dist/'));
});


gulp.task('autoprefix', function () {
    return gulp.src('./dist/main.css')
        .pipe(autoprefixer({
            browsers: ['last 4 version', 'safari 5', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'],
            cascade: false
        }))
        .pipe(gulp.dest('./dist/'));
});

gulp.task('css', gulp.series('import-css', 'sass', 'autoprefix'));

gulp.task('copy:data', function () {
    return gulp.src('www/static/**/*').pipe(gulp.dest('./dist/static/'));
});

// DEFAULT TASK
gulp.task('default', gulp.series('clean', gulp.parallel('css', 'dot')));


// WATCH TASK
gulp.task('watch:dot', function () {
    gulp.watch('www/*.html', gulp.series('dot'));
});

gulp.task('watch:css', function () {
    gulp.watch('www/**/*.scss', gulp.series('css'));
});

gulp.task('watch', gulp.series('default', gulp.parallel('watch:dot', 'watch:css')) );




// util section
function _walk(dir, done) {
    var results = [];
    fs.readdir(dir, function (err, list) {
        if (err) return done(err);
        var pending = list.length;
        if (!pending) return done(null, results);
        list.forEach(function (file) {
            file = path.resolve(dir, file);
            fs.stat(file, function (err, stat) {
                if (stat && stat.isDirectory()) {
                    _walk(file, function (err, res) {
                        results = results.concat(res);
                        if (!--pending) done(null, results);
                    });
                } else {
                    results.push(file);
                    if (!--pending) done(null, results);
                }
            });
        });
    });
}

function walk(path) {
    return new Promise((resolve, reject) =>
        _walk(path, (err, result) =>
            err ? reject(err) : resolve(result)
        )
    );
}

function readFile(path) {

    return new Promise((resolve, reject) =>
        fs.readFile(path, 'utf8', (err, data) =>
            err ? reject(err) : resolve({path, data})
        )
    );
}

function readFiles(pathToFolder, {test = /[\s\S]+/}) {

    return walk(pathToFolder)
        .then(paths =>
            Promise.all(paths
                .filter(() => test.test)
                .map(readFile)
            )
        )
        .then(files => {
                var map = {};
                files.forEach(
                    file => {
                        var key = file.path
                            .replace(path.resolve(__dirname, pathToFolder), '')
                            .replace(path.sep, '');
                        map[key] = file.data;
                    }
                );
                return map;
            }
        );

}

