const fs = require('fs');
const path = require('path');

const gulp = require('gulp');
const dot = require('dot');
// const template = require('gulp-dot-template');
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

function walk(dir, done) {
    var results = [];
    fs.readdir(dir, function (err, list) {
        if (err) return done(err);
        var pending = list.length;
        if (!pending) return done(null, results);
        list.forEach(function (file) {
            file = path.resolve(dir, file);
            fs.stat(file, function (err, stat) {
                if (stat && stat.isDirectory()) {
                    walk(file, function (err, res) {
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

function walkProm(path) {
    return new Promise(function (resolve, reject) {

        walk(path, (err, result) => err ? reject(err) : resolve(result) );

    });

}

function readChunk(path) {

    return new Promise(function (resolve, reject) {

        fs.readFile(path, 'utf-8', function (err, data) {

            if (err) {
                return reject(err);
            }

            console.log('chunk has been read');

            resolve({path, data});

        });

    });
}

function readChunks(pathToFolder) {

    return walkProm(pathToFolder)
        .then(paths => {
            return Promise.all(paths.map(path => readChunk(path)));
        })
        .then(files => files.map(
            file => ({
                path: file.path
                    .replace(path.resolve(__dirname, pathToFolder), '')
                    .replace(path.sep, ''),
                data: file.data
            }))
        );

}

gulp.task('dot', function (cb) {

    // read files

    readChunks('www/chunks/').then(function (files) {
        console.log(files);
        cb();
    }).catch(function (err) {
        console.log(err);
        cb();
    });

    return false;

    var indexHtmlText = fs.readFileSync('www/index.html');

    var head = fs.readFileSync('www/templates/head/index.dot');

    var tempFn = dot.template(indexHtmlText);

    var resultText = tempFn({head: head});


    fs.writeFile("dist/index.html", resultText, function (err) {
        if (err) {
            return console.log(err);
        }

        console.log("The file was saved!");

        cd();

    });

    // return gulp.src('www/*.html')
    //     .pipe(template({ name: 'Bob' }))
    //     .pipe(gulp.dest('dist'));

});


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

