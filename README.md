# release-packager

[![Build Status](https://travis-ci.org/micnews/release-packager.svg)](https://magnum.travis-ci.com/micnews/release-packager)

Sick of the discussion about if you should check in `node_modules` into git or not? Want to check in `node_modules` when deploying your app but don't want to pollute the repository with mumbo jumbo and make all devs angry?

## Use case

`release-packager` aims to solve the use case where you develop your app in repo A but deploy to another repo B. What happens is roughly as follows:

1. Clone repo A.
2. Check out some git ref in A.
3. Do a bunch of stuff (`npm install --production`, `npm dedupe` etc) on A.
4. Clone repo B.
5. Check out a branch to commit to in B.
6. Wipe working directory in B and copy A's working tree to B.
7. Find and delete `.gitignore` files.
8. Commit changes to B with optional push.

Ideally this module is part of a larger system with webhooks or other things for triggering this appropriately.

For more details check out the [`build script`](build).

## Install

```
$ npm install release-packager
```

## Usage

```js
var packager = require('release-packager')({ root: '/tmp' })
var opts = {
  source: '/var/local/myapp.git',
  source_ref: 'v1.0.1',
  target: 'git@github.com:micnews/myapp-deploy',
  target_branch: 'master',
  push_target: true
}
packager.build(opts, function (err, done) {
  console.log('build result', err)
  done()
})

```

## API

### packager(opts)
Creates a new `release-packager` instance.

#### `options`

* `'root'` *(string)*: Path to folder where `release-packager` stores the build files and logs. All repositories are cloned into `<root>/build` and all logs end up in `<root>/logs`.

### packager.build(opts, callback)
Builds an application. Internally `release-packager` have a simple queue system with separate queues for each application.

#### `options`

* `'name'` *(string)*: Name/id of the application.
* `'source'` *(string)*: Address to source git repository.
* `'source_ref'` *(string)*: Anything that resolves to a git ref, e.g. a tag.
* `'target'` *(string)*: Address to target git repository.
* `'target_branch'` *(string)*: Branch to commit to in target repository.
* `'push_target'` *(boolean, default: `false`)*: Set to true if the target should be pushed.

#### `callback`
Called with an error if the build failed and also a `done()` callback. `done()` has to be called when the caller are done processing the build results. This was designed so the caller can do other stuff as part of a build transaction and will prevent consecutive builds causing upgrades during already ongoing upgrades and similar race condition related problems.

### packager.shutdown(callback)
Shuts down release-packager.

#### `callback`
Called after all running build jobs are finished.

## TODO

* Persist build queue data in `shutdown()` and resume working at startup. Define path to leveldb in options object.
* Call back with build meta data in `build()`

## License

Copyright (c) 2014 Mic Network, Inc

This software is released under the MIT license:

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
