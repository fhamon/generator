'use strict';

const {
	isMainThread, parentPort, workerData
} = require('worker_threads');

if (isMainThread) {
	console.error('Must run http.js as a worker.');
	process.exit(-1);
}

const URL = require('url');
const fetchData = require('../lib/http');
const argv = workerData.argv;

parentPort.on('message', async (msg) => {
	try {
		const data = await fetchData(URL.parse(msg));
		parentPort.postMessage(data);
	} catch (ex) {
		parentPort.postMessage({ error: ex });
	}
});
