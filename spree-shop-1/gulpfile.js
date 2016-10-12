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

function readChunk(path) {

    return new Promise((resolve, reject) =>
        fs.readFile(path, 'utf8', (err, data) =>
            err ? reject(err) : resolve({path, data})
        )
    );
}

function readChunks(pathToFolder) {

    return walk(pathToFolder)
        .then(paths =>
            Promise.all(paths.map(readChunk))
        )
        .then(files => {
                var map = {};
                files.forEach(
                    file => {
                        var key = file.path
                            .replace(path.resolve(__dirname, pathToFolder), '')
                            .replace(path.sep, '');
                        map[key] = dot.template(file.data);
                    }
                );
                return map;
            }
        );

}

gulp.task('dot', function (cb) {

    // read files
    readChunks('www/chunks/')
        .then(function (chunksMap) {

            console.log(chunksMap)

            var indexHtmlText = fs.readFileSync('www/index.html');

            var tempFn = dot.template(indexHtmlText);

            var resultText = tempFn({chunk: chunksMap});

            fs.writeFile("dist/index.html", resultText, 'utf8', function (err) {
                if (err) {
                    return console.log(err);
                }

                console.log("The file was saved!");

                cb();

            });


        })
        .catch(function (err) {
            console.log(err);
            cb();
        });

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

