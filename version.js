#!/usr/bin/env node
var fs = require('fs');
var argv = process.argv;
var file = argv[2];
var pkg = require(file);
var tag = argv[3];
var sha = argv[4];
pkg.version = [ pkg.version, tag, sha ].join('-');
fs.writeFileSync(file, JSON.stringify(pkg));
console.log('== Wrote version %s to %s.', pkg.version, file);
console.log('== Updated package.json: %s', fs.readFileSync(file).toString());
