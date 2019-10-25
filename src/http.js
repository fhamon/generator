'use strict';

const {
	isMainThread, parentPort, workerData
} = require('worker_threads');

if (isMainThread) {
	console.error('Must run http.js as a worker.');
	process.exit(-1);
}

const URL = require('url');
const chalk = require('chalk');
const hostIsValid = require('../lib/host');
const argv = workerData.argv;

const reject = (err) => parentPort.postMessage({error: err});
const resolve = (data) => parentPort.postMessage(data);
const formatUrl = (url) => chalk.green(URL.format(url));
const formatUrlError = (url) => chalk.red(URL.format(url));

const fetchData = async (url, isRetry) => {
	const client = require(url.protocol === 'https:' ? 'https' : 'http');
	client.get(url, (resp) => {
		let data = '';
		resp.on('data', chunk => data += chunk);
		resp.on('end', () => {
			if (resp.headers['location'] && resp.statusCode >= 300 && resp.statusCode <= 399) {
				const loc = URL.parse(resp.headers['location']);
				console.log(`[-] Redirect from ${formatUrl(url)} to ${formatUrl(loc)}.`);
				if (hostIsValid(url, loc)) {
					setTimeout(() => {
						fetchData(loc);
					}, argv.retryDelay);
				} else {
					reject(`Ignored redirection from ${formatUrl(url)} to ${formatUrlError(loc)}.`);
				}
				return;
			} else if (resp.statusCode !== 200) {
				reject(`http response form ${formatUrlError(url)} is ${resp.statusCode}`);
				return;
			}
			console.log(`[-] Fetched ${formatUrl(url)}.`);
			resolve({
				data,
				url,
				workerUrl: workerData.url
			});
		});
	}).on('error', (err) => {
		if (!isRetry && err.code === 'ECONNRESET') {
			setTimeout(() => {
				fetchData(url, true);
			}, argv.retryDelay);
		} else {
			reject("Error: " + err.message);
		}
	});
};

parentPort.on('message', (msg) => {
	fetchData(URL.parse(msg));
});
