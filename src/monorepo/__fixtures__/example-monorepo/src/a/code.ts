// Should use version in monorepo root's package.json
require('root-dep');

// Should use version in module's package.json
require('version-override-dep');
require('optional-dep');
require('peer-dep');
// require('unimported-dep');

// Should use version in b's package.json
require('../b');
