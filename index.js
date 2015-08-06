var gulp = require('gulp');
var inject = require('gulp-inject');
var async = require('async');
var gutil = require('gulp-util');
var through2 = require('through2');

module.exports = function (bundles) {
    return through2.obj(function (file, enc, cb) {
        var stream = this;
        
        if (!bundles || !bundles.scripts || !bundles.styles) {
            return cb(null, file);
        }
        
        if (file.isNull()) {
            return cb(null, file);
        }

        if (file.isStream()) {
            return cb(new gutil.PluginError('gulp-inject', 'Streaming not supported'));
        }

        var scriptBundles = Object.keys(bundles.scripts);
        var styleBundles = Object.keys(bundles.styles);
        var referencedScriptBundles = [];
        var referencedStyleBundles = [];

        scriptBundles.forEach(function (bundle) {
            var expression = "(" + bundle + ":js\w*)";
            var regex = new RegExp(expression, "ig");
            if (regex.test(file.contents.toString('utf-8'))) {
                referencedScriptBundles.push(bundle);
            }
        });

        styleBundles.forEach(function (bundle) {
            var expression = "(" + bundle + ":css\w*)";
            var regex = new RegExp(expression, "ig");
            if (regex.test(file.contents.toString('utf-8'))) {
                referencedStyleBundles.push(bundle);
            }
        });
        
        if (!referencedScriptBundles.length && !referencedStyleBundles.length) {
            return cb(null, file);
        }

        if (referencedScriptBundles.length) {
            async.eachSeries(referencedScriptBundles, function (bundle, fn) {
                stream.pipe(inject(gulp.src(bundles.scripts[bundle], {
                    read: false
                }), {
                    name: bundle
                }));
                fn();
            }, function(err) {
                if (err) cb(err);
            });
        }
        
        if (referencedStyleBundles.length) {
            async.eachSeries(referencedStyleBundles, function (bundle, fn) {
                stream.pipe(inject(gulp.src(bundles.styles[bundle], {
                    read: false
                }), {
                    name: bundle
                }));
                fn();
            }, function(err) {
                if (err) cb(err);
            });
        }

        return cb(null, file);
    });
};