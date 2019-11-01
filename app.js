#!/usr/bin/env node

'use strict';

const yargs = require('yargs');
const pkg = require('./package.json');
const updateNotifier = require('update-notifier');

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
	.string('c')
	.describe('c', 'Feed a config file to the generator')
	.alias('c', 'config')
	.number('r')
	.describe('r', 'The retry delay for failed requests, in ms')
	.alias('r', 'retryDelay')
	.default('r', 200)
	.string('w')
	.describe('w', 'Write the html output to the specified directory')
	.alias('w', 'write')
	.number('p')
	.describe('p', 'Number of concurent tasks')
	.alias('p', 'parallel')
	.default('p', require('os').cpus().length)
	.version(pkg.version)
	.argv;

require('./lib/dns-cache');
const URL = require('url');
const log = require('./lib/logger')(argv);
const errors = [];
const seenUrls = new Map();
const pendingUrls = new Map();
const fetchData = require('./lib/http')(argv);
const parse = require('./lib/parser')(argv);
const write = require('./lib/write')(argv);
const RunQueue = require('run-queue');

try {
	if (argv.config) {
		const config = require(argv.config);
		argv.config = config;
		log(`[*] Loaded config file from ${argv.c}`);
	}
} catch (ex) {
	console.error(`[!] Failed to load config file at ${argv.config}`);
}

if (argv.write) {
	log(`[*] Output will be saved in ${argv.w}`);
}

const writeFile = async (httpData, queue) => {
	try {
		await write(httpData);
	} catch (ex) {
		errors.push(ex);
	}
};

const mustIgnoreUrl = (url) => {
	if (!url.pathname) {
		return false;
	}
	if (!argv.config || !argv.config.ignores || !argv.config.ignores.length) {
		return false;
	}
	return argv.config.ignores.reduce((memo, current) => {
		if (url.pathname.startsWith(current)) {
			return true;
		}
		return memo;
	}, false);
}

const run = async (httpRequest, queue) => {
	try {
		pendingUrls.delete(httpRequest);
		seenUrls.set(httpRequest, true);
		const u = URL.parse(httpRequest);
		if (mustIgnoreUrl(u)) {
			log(`[!] ${u.href} was ignored.`);
			return;
		}
		const httpData = await fetchData(u);
		seenUrls.set(httpData.url.href, httpData);
		const parsed = parse(httpData);
		parsed.links.forEach(link => {
			if (!seenUrls.has(link) && !pendingUrls.has(link)) {
				pendingUrls.set(link, true);
				queue.add(1, run, [link, queue]);
			}
		});
		if (argv.write) {
			queue.add(0, writeFile, [httpData, queue]);
		}
	} catch (ex) {
		errors.push(ex);
	} finally {
		log(`[%] ${pendingUrls.size} request remaining.`);
	}
}

(async () => {
	const queue = new RunQueue({
		maxConcurrency: argv.p || 1
	});
	argv._.forEach((link) => {
		pendingUrls.set(link, true);
		queue.add(1, run, [link, queue]);
	});
	await queue.run();
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

