'use strict';

const test = require('tape').test;
const plugins = require('../lib/plugins');

const plugin = {
	key: 'foo',
	init: async () => {},
	actions: async () => {
		return {
			foo: {
				bar: async () => 'hello',
				baz: {
					bar: async () => 'world'
				}
			}
		};
	}
};

test('Register plugin', async (t) => {
	t.deepEqual(await plugins._register(plugin), plugin);
	t.end();
});

test('Notify plugin', async (t) => {
	t.equal(await plugins.notify('foo.bar'), 'hello');
	t.equal(await plugins.notify('foo.baz.bar'), 'world');
	t.end();
});
