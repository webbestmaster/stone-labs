const fs = require('fs');
const path = require('path');

const gulp = require('gulp');
const dot = require('dot');
const template = require('gulp-dot-template');
// const autoprefixer = require('gulp-autoprefixer');

/*
 gulp.task('default', /!*['clear-dist'],*!/ function () {
 return gulp.start(/!*'app-cache', *!/ 'html', 'css', 'js', 'copy-data');
 });
 */

gulp.task('watch', ['html', 'css', 'js', 'copy-data'], function () {
    // gulp.watch('./www/*.html', ['html']);
});


gulp.task('default', function () {

    return gulp.start('dot');

});

gulp.task('dot', function () {

    return readFiles('www/chunks/', {test: /\.dot$/})
        .then(chunks => {
            return gulp.src('www/*.html')
                .pipe(template({chunks}))
                .pipe(gulp.dest('dist'));

        });

});

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



// helper for clean
var clearTasks = ['index.html', 'app-cache.mf', 'css', 'js', 'i', 'font' /*, 'images'*/].map(function (dir) {

    var taskName = 'clear-dir_' + dir;

    gulp.task(taskName, function (cd) {
        return gulp.src('./dist/www/' + dir, {read: false})
            .pipe(clean({force: true}, cd));
    });

    return taskName;

});

// for example
gulp.task('copy-font', function () {
    return gulp.src('./www/font/**/*')
        .pipe(gulp.dest('./dist/www/font'));
});

