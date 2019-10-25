'use strict';

const {
	isMainThread, parentPort
} = require('worker_threads');

if (isMainThread) {
	console.error('Must run parser.js as a worker.');
	process.exit(-1);
}

const parse = require('../lib/parser');

parentPort.on('message', (msg) => {
	const links = parse(msg);

	parentPort.postMessage(links);
});
