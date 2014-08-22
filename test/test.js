var test = require('tap').test
var assert = require('tap').assert
var rimraf = require('rimraf').sync
var fs = require('fs')
var Packager = require('../')
var Job = require('../job').Job
var folder = require('../job').folder
var createArgs = require('../job').createArgs
var root = __dirname + '/tmp'

test('options to Job must be valid', function(t) {
  t.ok(assert.throws(function() { Job() },
                     new Error('Invalid options')).ok)

  t.ok(assert.throws(function() { Job(function(){}) },
                     new Error('Invalid options')).ok)

  t.ok(assert.throws(function() { Job({}) },
                     new Error('Invalid name')).ok)

  t.ok(assert.throws(function() { Job({ name: 'foo' }) },
                     new Error('Invalid root folder')).ok)

  t.ok(assert.throws(function() {
    Job({
      name: 'foo',
      root: root
    })
  }, new Error('Invalid callback')).ok)

  end(t)
})

test('options to createArgs must be valid', function(t) {
  var opts = { args: 'foo' }

  var args = createArgs(opts)
  t.ok(Array.isArray(args))
  t.ok(args[0] === opts.args)

  opts = { args: [ 'foo' ] }
  args = createArgs(opts)
  t.ok(Array.isArray(args))
  t.ok(args[0] === opts.args[0])

  t.ok(assert.throws(function() {
    createArgs({})
  }, new Error('Invalid root folder')).ok)

  opts = { root: root }
  t.ok(assert.throws(function() {
    createArgs(opts)
  }, new Error('Invalid source')).ok)

  opts.source = 'source'
  t.ok(assert.throws(function() {
    createArgs(opts)
  }, new Error('Invalid source_ref')).ok)

  opts.source_ref = 'source_ref'
  t.ok(assert.throws(function() {
    createArgs(opts)
  }, new Error('Invalid target')).ok)

  opts.target = 'target'
  t.ok(assert.throws(function() {
    createArgs(opts)
  }, new Error('Invalid target_branch')).ok)

  opts.target_branch = 'target_branch'
  args = createArgs(opts)

  t.ok(Array.isArray(args))
  t.ok(args.length == 8)

  t.ok(args[0] === opts.root + '/build')
  t.ok(args[1] === opts.source)
  t.ok(args[2] === folder(opts.source))
  t.ok(args[3] === opts.source_ref)
  t.ok(args[4] === opts.target)
  t.ok(args[5] === folder(opts.target))
  t.ok(args[6] === opts.target_branch)
  t.ok(args[7] === false)

  opts.push_target = true
  args = createArgs(opts)
  t.ok(args[7] === true)

  t.end()
})

test('repository address should resolve to correct folder', function(t) {
  var repos = [
    'repo',
    '/path/to/repo',
    '/path/to/repo.git',
    'git@github.com:organisation/repo.git'
  ]
  var expected = 'repo'
  repos.forEach(function(repo) {
    t.ok(folder(repo) === expected, 'should be correct folder name')
  })
  t.end()
})

test('failed build script should error back', function(t) {
  var opts = options()
  opts.cmd = __dirname + '/fail'
  var job = new Job(opts, function(){})
  job.spawn(function(err) {
    t.ok(err, 'should error back')
    end(t)
  })
})

test('successful build script should not error back', function(t) {
  var opts = options()
  var job = new Job(opts, function(){})
  job.spawn(function(err) {
    t.ok(!err, 'should not error back')
    end(t)
  })
})

test('starting two builds of same app will process in order', function(t) {
  var opts = options()
  var builder = Packager(opts)
  var count = 0
  builder.build(opts, function(err, done) {
    t.ok(!err, 'should not error back')
    ++count
    done()
  })
  builder.build(opts, function(err, done) {
    t.ok(!err, 'should not error back')
    t.ok(count === 1, 'should have built before this one')
    done()
    end(t)
  })
})

test('shutdown will fire after first build for the same app 1', function(t) {
  var opts = options()
  var builder = Packager(opts)
  var build = buildHelper(builder, opts)
  build()
  build()
  build()
  builder.shutdown(function() {
    t.ok(build.count === 1, 'should have finished first build')
    end(t)
  })
})

test('shutdown will fire after first build for the same app 2', function(t) {
  var opts = options()
  var builder = Packager(opts)
  var build = buildHelper(builder, opts)
  build()
  builder.shutdown(function() {
    t.ok(build.count === 1, 'should have finished first build')
    end(t)
  })
  build()
  build()
})


test('if no builds, shutdown will fire before builds start', function(t) {
  var opts = options()
  var builder = Packager(opts)
  var build = buildHelper(builder, opts)
  builder.shutdown(function() {
    t.ok(build.count === 0, 'no builds should have finished')
    end(t)
  })
  build()
  build()
  build()
})

test('only first shutdown callback will fire', function(t) {
  var opts = options()
  var builder = Packager(opts)
  var build = buildHelper(builder, opts)
  var count = 0
  builder.shutdown(function() {
    t.ok(count === 0, 'no builds should have finished')
    end(t)
  })
  builder.shutdown(function() {
    ++count
  })
  builder.shutdown(function() {
    ++count
  })
})

function end(t) {
  rimraf(root)
  t.end()
}

function options() {
  return {
    name: 'foo',
    root: root,
    cmd: __dirname + '/success',
    args: [ 0.5 ]
  }
}

function buildHelper(builder, opts) {
  var build = function() {
    builder.build(opts, function(err, done) {
      ++build.count
      done()
    })
  }
  build.count = 0
  return build
}
