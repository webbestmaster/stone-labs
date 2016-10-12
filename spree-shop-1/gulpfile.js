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

function readFile(path) {

    return new Promise((resolve, reject) =>
        fs.readFile(path, 'utf8', (err, data) =>
            err ? reject(err) : resolve({path, data})
        )
    );
}

function createFindConfig(config) {
    return config || {
            test: /\.html/ // create the same for chunks
        }
}

function readChunks(pathToFolder) {

    return walk(pathToFolder)
        .then(paths =>
            Promise.all(paths.map(readFile))
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

function readTemplates(pathToFolder) {

    return walk(pathToFolder)
        .then(paths =>
            Promise.all(
                paths
                    .filter(path => /\.html/.test(path))
                    .map(readFile)
            )
        )
        .then(files =>
            files.map(
                file => ({
                    path: file.path
                        .replace(path.resolve(__dirname, pathToFolder), '')
                        .replace(path.sep, ''),
                    templateFn: dot.template(file.data)
                })
            )
        );

}

gulp.task('dot', function () {

    // read files
    return Promise.all([readChunks('www/chunks/'), readTemplates('www')])
        .then(result => {

            var chunksMap = result[0];
            var htmlList = result[1];

            console.log(chunksMap);

            htmlList.forEach(data => {

                var resultText = data.templateFn({chunks: chunksMap});

                fs.writeFile(path.resolve('dist', data.path), resultText, 'utf8', function (err) {
                    if (err) {
                        return console.log(err);
                    }

                    console.log("The file was saved!");

                });


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

