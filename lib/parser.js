'use strict';

const hostIsValid = require('./host');
const urlIsInScope = require('./url');
const cheerio = require('cheerio');
const logger = require('./logger');
let argv = { _: [] };
let log = logger(argv);

const parse = (msg) => {
    const $ = cheerio.load(msg.data);
    const title = $('title').text();
    log(`[-] ${msg.url.href} ${title}`);

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

    log(`[-] ${msg.url.href} ${filteredLinks.length} / ${links.length}`);

    return {
        links: [...new Set(filteredLinks)],
        title,
        url: msg.url
    }
};

module.exports = (argv_) => {
    argv = argv_;
    log = logger(argv);
    return parse;
};
