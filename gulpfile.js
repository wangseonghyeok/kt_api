const gulp = require('gulp');
const { src, dest, watch, series, parallel } = require('gulp');
const browserSync = require('browser-sync').create();
const del = require('del');
const imagemin = require('gulp-imagemin');
const sourcemaps = require('gulp-sourcemaps');
const concat = require('gulp-concat');
const rename = require('gulp-rename');
const terser = require('gulp-terser');
const sass = require('gulp-sass')(require('sass'));
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const includer = require('gulp-html-ssi');
const babel = require('gulp-babel');
const CacheBuster = require('gulp-cachebust');
const prettier = require('gulp-prettier');
const cacheBbust = require('gulp-cache-bust');

const cachebust = new CacheBuster();

// paths setting
const paths = {
    build: './dist/',
    scss: {
        src: './markup/assets/css/scss/**/*',
        ignore: '!./markup/assets/css/scss/import',
        dest: './dist/assets/css',
    },
    csscopy: {
        src: './markup/assets/css/lib/**/*',
        dest: './dist/assets/css/lib',
    },
    img: {
        src: './markup/assets/img/**/*',
        dest: './dist/assets/img',
    },
    js: {
        src: './markup/assets/js/**/*',
        ignore: '!./markup/assets/js/lib',
        dest: './dist/assets/js',
    },
    jscopy: {
        src: './markup/assets/js/lib/**/*',
        dest: './dist/assets/js/lib',
    },
    fonts: {
        src: './markup/assets/fonts/**/*',
        dest: './dist/assets/fonts',
    },
    html: {
        src: './markup/html/**/*',
        ignore: '!./markup/html/_include',
        dest: './dist',
    },
    cdl: {
        index: {
            src: './markup/coding_list.html',
            dest: './dist',
        },
        folder: {
            src: './markup/_coding_list/**/*',
            dest: './dist/_coding_list',
        },
    },
    guide: {
        src: './markup/_guide/**/*',
        dest: './dist/_guide',
    },
};

function reload(cb) {
    browserSync.reload();
    cb();
}

function clean(cb) {
    return del(paths.build, cb);
}

function fonts() {
    return src(paths.fonts.src).pipe(dest(paths.fonts.dest));
}

function images() {
    return (
        src(paths.img.src)
            // .pipe(
            //     imagemin([
            //         imagemin.gifsicle({ interlaced: true }),
            //         imagemin.mozjpeg({ quality: 90, progressive: true }),
            //         imagemin.optipng({ optimizationLevel: 9 }),
            //         imagemin.svgo({
            //             plugins: [{ removeViewBox: true }, { cleanupIDs: false }],
            //         }),
            //     ]),
            // )
            .pipe(dest(paths.img.dest))
    );
}

const sassOptions = {
    outputStyle: 'compact',
    indentType: 'tab',
    indentWidth: 1,
    precision: 2,
    sourceComments: false,
};
function scss() {
    return (
        src([paths.scss.src, paths.scss.ignore])
            .pipe(sourcemaps.init())
            .pipe(sass(/* sassOptions */).on('error', sass.logError))
            .pipe(postcss([autoprefixer({ grid: 'autoplace' }), cssnano()]))
            .pipe(rename({ suffix: '.min' }))
            // .pipe(cachebust.resources())
            .pipe(sourcemaps.write('./maps'))
            .pipe(dest(paths.scss.dest))
            .pipe(browserSync.stream())
    );
}

function csscopy() {
    return src(paths.csscopy.src).pipe(dest(paths.csscopy.dest)).pipe(browserSync.stream());
}

async function scripts() {
    return (
        src([paths.js.src, paths.js.ignore])
            // .pipe(sourcemaps.init())
            // .pipe(babel())
            // .pipe(terser().on('error', error => console.log(error)))
            // .pipe(rename({ suffix: '.min' }))
            // .pipe(cachebust.resources())
            // .pipe(sourcemaps.write('./maps'))
            .pipe(dest(paths.js.dest))
    );
}

function jscopy() {
    return src(paths.jscopy.src).pipe(dest(paths.jscopy.dest));
}

async function htmlssi() {
    return src([paths.html.src, paths.html.ignore]).pipe(includer()).pipe(prettier()).pipe(dest(paths.html.dest));
}

async function htmlssiBuild() {
    return (
        src([paths.html.src, paths.html.ignore])
            .pipe(includer())
            // .pipe(cachebust.references())
            .pipe(
                cacheBbust({
                    type: 'timestamp',
                }),
            )
            .pipe(prettier())
            .pipe(dest(paths.html.dest))
    );
}

function cache() {
    return src(`${paths.html.dest}/**/*.html`).pipe(cachebust.references()).pipe(dest(paths.html.dest));
}

function cdlindex() {
    return src(paths.cdl.index.src).pipe(dest(paths.cdl.index.dest));
}

function cdlfolder() {
    return src(paths.cdl.folder.src).pipe(dest(paths.cdl.folder.dest));
}

function guide() {
    return src(paths.guide.src).pipe(dest(paths.guide.dest));
}

function server() {
    browserSync.init({
        server: {
            baseDir: paths.build,
            index: '/coding_list.html',
            // index: '/ACF-HM-001.html',
        },
        port: 3000,
    });
}

function watchFiles() {
    watch(paths.fonts.src, series(fonts, reload));
    watch(paths.img.src, series(images, reload));
    watch(paths.scss.src, scss);
    watch(paths.csscopy.src, csscopy);
    watch(paths.js.src, series(scripts, reload));
    watch(paths.jscopy.src, series(jscopy, reload));
    watch(paths.html.src, series(htmlssi, reload));
    watch(paths.cdl.index.src, series(cdlindex, reload));
    watch(paths.cdl.folder.src, series(cdlfolder, reload));
    watch(paths.guide.src, series(guide, reload));
}

const web = parallel(fonts, images, scss, csscopy, scripts, jscopy, htmlssi, cdlindex, cdlfolder, guide);
const build = series(
    clean,
    parallel(fonts, images, scss, csscopy, scripts, jscopy, htmlssiBuild, cdlindex, cdlfolder, guide),
);

exports.build = build;
exports.default = series(clean, web, parallel(server, watchFiles));
