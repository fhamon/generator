'use strict';

const urlToPath = require('../lib/write').urlToPath;
const test = require('tape').test;
const path = require('path');

test('Extension less path', (t) => {
    const p = urlToPath('./test', {pathname: '/fr'});
    t.equals(p, path.normalize('./test/fr'));
    t.end();
});

test('Directory path to index.html', (t) => {
    const p = urlToPath('./test', {pathname: '/fr/'});
    t.equals(p, path.normalize('./test/fr/index.html'));
    t.end();
});

test('Full path pdf.pdf', (t) => {
    const p = urlToPath('./test', {pathname: '/workspace/pdf.pdf'});
    t.equals(p, path.normalize('./test/workspace/pdf.pdf'));
    t.end();
});

test('Outside', (t) => {
    let e;
    try {
        const p = urlToPath('./test', {pathname: '/../pdf.pdf'});
        t.ok(!p);
    } catch (ex) {
        e = ex;
    }
    t.ok(e, e.message);
    t.end();
});

test('Starless', (t) => {
    const p = urlToPath('./test', {pathname: '/fr/*/*/**/test'});
    t.equals(p, path.normalize('./test/fr/test'));
    t.end();
});

test('Double slash', (t) => {
    const p = urlToPath('./test', {pathname: '/fr//*//test'});
    t.equals(p, path.normalize('./test/fr/test'));
    t.end();
});