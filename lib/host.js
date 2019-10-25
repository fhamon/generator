'use strict';

/**
 * Checks if a is a sub-domain of b
 * @param URLWithStringQuery a
 * @param URLWithStringQuery b
 */
const hostTest = (a, b) => {
	const r = new RegExp('\\.+' + b.host.replace('.', '\\.') + '$');
	return r.test(a.host);
};

/**
 * Checks if the hosts are compatible
 * @param URLWithStringQuery a
 * @param URLWithStringQuery b
 */
module.exports = (a, b) => {
	if (a === b) {
		return true;
	}
	if (a.host === b.host) {
		return true;
	}
	if (a.protocol === b.protocol) {
		if (hostTest(a, b) || hostTest(b, a)) {
			return true;
		}
	}
	return false;
};