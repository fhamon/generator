'use strict';

const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const logger = require('./logger');
let argv = {_:[]};
let log = logger(argv);

const urlToPath = (root, url) => {
    let p = url.pathname;
    while (p.includes('*')) {
        p = p.replace('*', '');
    }
    while (p.includes('//')) {
        p = p.replace('//', '/');
    }
    p = path.join(root, p);
    if (url.pathname.endsWith('/')) {
        p += 'index.html';
    }
    if (!path.resolve(p).startsWith(path.resolve(root))) {
        throw new Error(`Path ${p} is outside root ${root}.`);
    }
    return p;
};

module.exports = (argv) => {
    if (!argv.write) {
        return () => {};
    }
    log = logger(argv);
    mkdirp(argv.write);
    return (httpData) => {
        return new Promise((resolve, reject) => {
            try {
                const p = urlToPath(argv.write, httpData.url);
                log(`[-] Writing file ${p} for ${httpData.url.href}.`);
                mkdirp(path.dirname(p), (err) => {
                    if (err) {
                        return reject(err);
                    }
                    fs.writeFile(p, httpData.data, {
                        encoding: 'utf-8'
                    }, (err) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve();
                    });
                });
            } catch (ex) {
                reject(ex);
            }
        });
    };
};

module.exports.urlToPath = urlToPath;
