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
const log = require('./lib/logger')(argv);
const errors = [];
const seenUrls = new Map();
const throwError = (err) => { throw err; };
const exit = (code) => {
	if (code !== 0) {
		log(`[!] Worker stopped in error with exit code ${code}`);
	} else if (argv.verbose) {
		log(`[*] Worker stopped properly with exit code ${code}`)
	}
};

const createParserWorker = () => {
	const worker = new Worker('./src/parser.js', {
		workerData: {
			argv
		}
	});
	worker.send = (response) => {
		log(`[${worker.threadId}] Parsing url ${response.url.href}`);
		worker.postMessage(response);
	};
	worker.on('message', (msg) => {
		if (!msg) {
			throw new Error('Message cannot be empty');
		}
		log(`[${worker.threadId}] Parsed url ${msg.url.href}`);
		if (msg.error) {
			errors.push(msg.error);
			log.err(`[!] ${msg.error}`);
		}
		const hasNewUrl = msg.links.reduce((memo, link) => {
			return memo || !seenUrls.has(link);
		}, false);
		if (hasNewUrl) {
			msg.links.forEach((link) => {
				process.nextTick(() => httpWorker.send(link));
			});
		} else {
			worker.terminate();
		}
	});
	worker.on('error', throwError);
	worker.on('exit', exit);
	return worker;
};

const createHttpWorker = () => {
	const worker = new Worker('./src/http.js', {
		workerData: {
			argv
		}
	});
	worker.send = (url) => {
		if (seenUrls.has(url)) {
			log(`[?] Skipped already seen url ${url}`);
			return;
		}
		seenUrls.set(url, true);
		log(`[${worker.threadId}] Fetching url ${url}`);
		worker.postMessage(url);
	};
	worker.on('message', (msg) => {
		if (!msg) {
			throw new Error('Message cannot be empty');
		}
		if (msg.error) {
			errors.push(msg.error);
			log.err(`[!] ${worker.threadId} ${msg.error}`);
		}
		if (msg.data && msg.url) {
			log(`[${worker.threadId}] Fetched url ${msg.url.href}`);
			seenUrls.set(msg.url, msg);
			process.nextTick(() => parserWorker.send(msg));
		}
	});
	worker.on('error', throwError);
	worker.on('exit', exit);
	return worker;
};

const parserWorker = createParserWorker();
const httpWorker = createHttpWorker();

if (isMainThread) {
	argv._.forEach(arg => httpWorker.send(arg));
	//updateNotifier({ pkg: pack }).notify();
} else {
	console.error('Must run app.js as the main thread.');
	process.exit(-1);
}
