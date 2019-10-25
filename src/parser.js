'use strict';

const {
	isMainThread, parentPort
} = require('worker_threads');

if (isMainThread) {
	console.error('Must run parser.js as a worker.');
	process.exit(-1);
}

const hostIsValid = require('../lib/host');
const urlIsInScope = require('../lib/url');
const cheerio = require('cheerio');

parentPort.on('message', (msg) => {
	const $ = cheerio.load(msg.data);
	const title = $('title').text();
	console.log(`[-] ${msg.url.href} ${title}`);

	const links = $('a[href]').toArray().map((link) => {
		const l = new URL(link.attribs.href, msg.url.href);
		l.hash = '';
		return l;
	});
	const uniqueLinks = [...new Set(links)];
	const filteredLinks = uniqueLinks.filter(urlIsInScope).filter((url) => {
		if (!url) {
			return false;
		}
		if (!hostIsValid(url, msg.url)) {
			return false;
		}
		if (url.pathname === msg.url.pathname) {
			return false;
		}
		return true;
	}).map(url => url.toString());

	console.log(`[-] ${msg.url.href} ${filteredLinks.length} / ${links.length}`);

	parentPort.postMessage({
		links: [...new Set(filteredLinks)],
		title,
		url: msg.url
	});
});
