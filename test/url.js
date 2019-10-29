'use strict';

const url = require('url');
const urlIsValid = require('../lib/url');
const test = require('tape').test;

test('Root domain, no path', (t) => {
    const u = url.parse('https://example.org');
    t.ok(urlIsValid(u));
    t.end();
});

test('Root domain with /', (t) => {
    const u = url.parse('https://example.org/');
    t.ok(urlIsValid(u));
    t.end();
});

test('Root domain http', (t) => {
    const u = url.parse('http://example.org/');
    t.ok(urlIsValid(u));
    t.end();
});

test('Root domain ftp', (t) => {
    const u = url.parse('ftp://example.org/');
    t.ok(!urlIsValid(u));
    t.end();
});

test('Relative hash', (t) => {
    const u = url.parse('#test');
    t.ok(!urlIsValid(u));
    t.end();
});

test('Absolute pathname with hash', (t) => {
    const u = url.parse('http://example.org/test/#test');
    t.ok(urlIsValid(u));
    t.end();
});

test('Relative pathname with hash', (t) => {
    const u = url.parse('/test/#test');
    t.ok(!urlIsValid(u));
    t.end();
});
