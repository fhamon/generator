'use strict';

require('tape-catch');
require('tape').test.onFinish(() => process.exit(0));
require('./host');
require('./url');
require('./write');
require('./plugins');
