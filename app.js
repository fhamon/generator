#!/usr/bin/env node

'use strict';

const yargs = require('yargs');
const pkg = require('./package.json');
const updateNotifier = require('update-notifier');

const {
	Worker, isMainThread
} = require('worker_threads');

const argv = yargs
	.demandCommand(1, 'At least one argument must be provided: the starting url')
	//.usage(require('./lib/banner') + '\nUsage: $0 [opts]')
	.help('h')
	.alias('h', ['?', 'help'])
	.showHelpOnFail(true)
	.boolean('v')
	.describe('v', 'Enables verbose mode')
	.alias('v', 'verbose')
	.alias('v', 'vv')
	.alias('v', 'vvv')
	//.string('c')
	//.describe('c', 'Feed a config file to the generator')
	//.alias('c', 'config')
	.number('r')
	.describe('r', 'The retry delay for failed requests, in ms')
	.alias('r', 'retryDelay')
	.default('r', 200)
	.version(pkg.version)
	.argv;

require('./lib/dns-cache');
const URL = require('url');
const log = require('./lib/logger')(argv);
const errors = [];
const seenUrls = new Map();
const httpRequests = argv._;
const fetchData = require('./lib/http')(argv);
const parse = require('./lib/parser')(argv);

if (isMainThread) {
	(async () => {
		while (!!httpRequests.length) {
			try {
				const httpRequest = httpRequests.shift();
				seenUrls.set(httpRequest, true);
				const httpData = await fetchData(URL.parse(httpRequest));
				seenUrls.set(httpData.url.href, httpData);
				const parsed = parse(httpData);
				parsed.links.forEach(link => {
					if (!seenUrls.has(link) && !httpRequests.includes(link)) {
						httpRequests.push(link);
					}
				});
			} catch (ex) {
				errors.push(ex);
			} finally {
				log(`[%] ${httpRequests.length} request remaining.`);
			}
		}
		log()
		log('All Done.');
		log(`Fetched ${seenUrls.size} urls.`);
		if (errors.length) {
			log(`${errors.length} were encountered:`);
		}
		errors.forEach(err => {
			console.error(`[!] ${err}`);
		});
	})();
	//updateNotifier({ pkg: pack }).notify();
} else {
	console.error('Must run app.js as the main thread.');
	process.exit(-1);
}
