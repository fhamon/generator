'use strict';

const http = require('http');
const https = require('https');
const URL = require('url');
const chalk = require('chalk');
const hostIsValid = require('./host');
const logger = require('./logger');
let argv = {_:[]};
let log = logger(argv);
const formatUrl = (url) => chalk.green(URL.format(url));
const formatUrlError = (url) => chalk.red(URL.format(url));

const fetchData = (resolve, reject, url, isRetry) => {
    const client = url.protocol === 'https:' ? https : http;
    log(`[-] Fetching ${formatUrl(url)}.`);
    const requestOptions = {
        ...url,
        headers: !argv.config || !argv.config.headers ? null : argv.config.headers
    };
    client.get(requestOptions, (resp) => {
        let data = '';
        resp.on('data', chunk => data += chunk);
        resp.on('end', () => {
            if (resp.headers['location'] && resp.statusCode >= 300 && resp.statusCode <= 399) {
                const loc = URL.parse(resp.headers['location']);
                log(`[-] Redirect from ${formatUrl(url)} to ${formatUrl(loc)}.`);
                if (hostIsValid(url, loc)) {
                    setTimeout(() => {
                        fetchData(resolve, reject, loc);
                    }, argv.retryDelay);
                } else {
                    reject(`Ignored redirection from ${formatUrl(url)} to ${formatUrlError(loc)}.`);
                }
                return;
            } else if (resp.statusCode !== 200) {
                reject(`http response form ${formatUrlError(url)} is ${resp.statusCode}`);
                return;
            }
            log(`[-] Fetched ${formatUrl(url)}.`);
            resolve({
                data,
                url,
                //workerUrl: workerData.url
            });
        });
    }).on('error', (err) => {
        if (!isRetry && err.code === 'ECONNRESET') {
            setTimeout(() => {
                fetchData(resolve, reject, url, true);
            }, argv.retryDelay);
        } else {
            reject("Error: " + err.message);
        }
    });
};

module.exports = (argv_) => {
    argv = argv_;
    log = logger(argv);
    return async (url) => {
        return new Promise((resolve, reject) => {
            fetchData(resolve, reject, url);
        });
    };
}
