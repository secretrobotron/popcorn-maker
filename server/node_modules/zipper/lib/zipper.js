var assert = require('assert');
var zipper = require('./_zipper');

/* assert ABI compatibility */
assert.ok(zipper.versions.node === process.versions.node, 'The running node version "' + process.versions.node + '" does not match the node version that zipper was compiled against: "' + zipper.versions.node + '"');

// push all C++ symbols into js module
for (var k in zipper) { exports[k] = zipper[k]; }
