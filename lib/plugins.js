'use strict';

const fs = require('fs');

const plugins = [];

const defaultPlugin = () => {
	return {
		key: '',
		init: async () => {},
		actions: async () => {
			return {};
		}
	};
};

const register = (p) => {
	if (!p.key) {
		throw Error(`No key was set on a plugin`);
	}

	if (!!plugins[p.key]) {
		throw Error(`Key ${p.key} already used.`);
	}

	p = Object.assign({}, defaultPlugin(), p);
	plugins[p.key] = p;
	return p;
};

const resolveActions = async (key, plugin) => {
	const actions = await plugin.actions();
	let match = null;

	if (!!actions) {
		match = actions;

		if (!!match && typeof match === 'function') {
			return match;
		}

		const path = key.split('.');

		path.forEach((p) => {
			if (!match || typeof match !== 'object') {
				return false;
			}

			match = match[p];
		});

		if (typeof match !== 'function') {
			match = null;
		}
	}

	return match;
};

const notify = async (key, data) => {
	let answer = undefined;
	for (let plugin in plugins) {
		const fx = await resolveActions(key, plugins[plugin]);

		if (!!fx) {
			answer = await fx(data, key);
		}
	}

	return answer;
};

const init = () => {
	const dir = __dirname.replace('lib', 'plugins'); // todo this will create a bug if /lib/lib/...
	const pluginsFiles = fs.readdirSync(dir);
	pluginsFiles.forEach(async (file) => {
		let p = require(`${dir}/${file}`);
		p = await register(p);
		await p.init();
	});
};

module.exports = {
	init: init,
	notify: notify,
	_register: register,
	_resolveActions: resolveActions
};
