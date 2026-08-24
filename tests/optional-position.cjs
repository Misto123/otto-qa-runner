const assert = require('node:assert/strict');
const { validateConfig } = require('../runner/otto-runner.cjs');
const config = require('../sample-config.json');

delete config.search.result_position;
assert.deepEqual(validateConfig(config), []);
console.log('optional result_position: OK');

const invalid = structuredClone(config);
invalid.search.result_position = 0;
assert.match(validateConfig(invalid).join('\n'), /result_position/);
console.log('invalid result_position: rejected');
