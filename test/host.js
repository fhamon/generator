'use strict';

const url = require('url');
const hostIsValid = require('../lib/host');
const test = require('tape').test;

test('Identity', (t) => {
	const host = url.parse('https://example.org');
	t.ok(hostIsValid(host, host));
	t.end();
});

test('Same value', (t) => {
	const a = url.parse('https://example.org');
	const b = url.parse('https://example.org');
	t.ok(hostIsValid(a, b));
	t.end();
});

test('Same Sub domain', (t) => {
	const a = url.parse('https://www.example.org');
	const b = url.parse('https://www.example.org');
	t.ok(hostIsValid(a, b));
	t.end();
});

test('Diff Sub domain', (t) => {
	const a = url.parse('https://www.example.org');
	const b = url.parse('https://example.org');
	t.ok(hostIsValid(a, b));
	t.ok(hostIsValid(b, a));
	t.end();
});

test('Diff protocol', (t) => {
	const a = url.parse('https://example.org');
	const b = url.parse('http://example.org');
	t.ok(hostIsValid(a, b));
	t.end();
});

test('Diff protocol and domain', (t) => {
	const a = url.parse('https://example.org');
	const b = url.parse('http://example.com');
	t.ok(!hostIsValid(a, b));
	t.end();
});

test('Diff protocol and sub domain', (t) => {
	const a = url.parse('https://www.example.org');
	const b = url.parse('http://example.org');
	t.ok(!hostIsValid(a, b));
	t.ok(!hostIsValid(b, a));
	t.end();
});

test('Diff domain', (t) => {
	const a = url.parse('https://example.org');
	const b = url.parse('https://example.com');
	t.ok(!hostIsValid(a, b));
	t.ok(!hostIsValid(b, a));
	t.end();
});

test('Many chars', (t) => {
	const a = url.parse('https://example.org');
	const b = url.parse('https://example org');
	t.ok(!hostIsValid(a, b));
	t.ok(!hostIsValid(b, a));
	t.end();
});

test('Domain relative', (t) => {
	const a = url.parse('https://example.org');
	const b = url.parse('/example/');
	t.ok(hostIsValid(a, b));
	t.ok(hostIsValid(b, a));
	t.end();
});
