'use strict';

module.exports = (argv) => {
	const log = (...args) => {
		if (argv.verbose) {
			console.log(...args);
		}
	};
	log.err = (...args) => {
		if (argv.verbose) {
			console.error(...args);
		}
	};
	return log;
};