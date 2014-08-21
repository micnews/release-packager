# smithers

Sick of the discussion about if you should check in `node_modules` into git or not? Want to check in `node_modules` when deploying your app but don't want to pollute the repository with mumbo jumbo and make all devs angry?

## Use case

Smithers aims to solve the use case where you develop your app in repo A but deploy to another repo B. What happens is roughly as follows:

1. Clone repo A.
2. Check out some git ref in A.
3. Do a bunch of stuff (`npm install --production`, `npm dedupe` etc) on A.
4. Clone repo B.
5. Check out a branch to commit to in B.
6. Wipe working directory in B and copy A's working tree to B.
7. Find and remove `.gitignore` files and delete them.
8. Commit and optionally push to B.

Ideally this module is part of a larger system with webhooks or other things for triggering this appropriately.

For more details check out the [`build script`](build).

## Install

```
$ npm install smithers
```

## Usage

```js
var smithers = require('smithers')({ root: '/tmp/smithers' })
var opts = {
  source: '/var/local/myapp.git',
  source_ref: 'v1.0.1',
  target: 'git@github.com:micnews/myapp-deploy',
  target_branch: 'master',
  push_target: true
}
smithers.build(opts, function (err, done) {
  console.log('build result', err)
  done()
})

```

## API

### smithers(opts)
Creates a new smithers builder instance.

#### `options`

* `'root'` *(string)*: Path to folder where `smithers` stores the build files and logs. All repositories are cloned into `<root>/build` and all logs end up in `<root>/logs`.

### smithers.build(opts, callback)
Builds an application. Internally `smithers` have a simple queue system with separate queues for each application type.

#### `options`

* `'name'` *(string)*: Name/id of the application.
* `'source'` *(string)*: Address to source git repository.
* `'source_ref'` *(string)*: Anything that resolves to a git ref, e.g. a tag.
* `'target'` *(string)*: Address to target git repository.
* `'target_branch'` *(string)*: Branch to commit to in target repository.
* `'push_target'` *(boolean, default: `false`)*: Set to true if the target should be pushed.

#### `callback`
Called with an error if the build failed for some reason and also a `done()` callback. This is done to integrate whatever the user wants to do as part of build transaction, perhaps update some database or notify someone about the results before letting smithers continue grabbing new jobs.

### smithers.shutdown(callback)
Shuts down smithers.

#### `callback`
Called after all running build jobs are finished.

## TODO

* Persist build queue data in `shutdown()` and resume working at startup. Define path to leveldb in options object.

## License

Copyright (c) 2014 Mic Network, Inc

This software is released under the MIT license:

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
