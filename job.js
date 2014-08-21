var spawn  = require('child_process').spawn
var fs     = require('fs')
var mkdirp = require('mkdirp')
var ncp    = require('ncp')
var path   = require('path')

function Job(opts, cb) {
  if (!(this instanceof Job)) return new Job(opts, cb)

  if (!opts || typeof opts == 'function')
    throw new Error('Invalid options')
  if (!opts.name)
    throw new Error('Invalid name')
  if (!opts.root)
    throw new Error('Invalid root folder')
  if (typeof cb != 'function')
    throw new Error('Invalid callback')

  this.buildLogRoot = opts.root + '/logs/' + opts.name
  mkdirp.sync(this.buildLogRoot)
  this.buildLog = this.buildLogRoot + '/build.log'

  this.cmd = opts.cmd || __dirname + '/build'
  this.args = createArgs(opts)

  this.cb = cb
  this.running = false
  this.created = Date.now()
}

function createArgs(opts) {
  if (opts.args) {
    return Array.isArray(opts.args) ? opts.args : [ opts.args ]
  }

  if (!opts.root)
    throw new Error('Invalid root folder')
  if (!opts.source)
    throw new Error('Invalid source')
  if (!opts.source_ref)
    throw new Error('Invalid source_ref')
  if (!opts.target)
    throw new Error('Invalid target')
  if (!opts.target_branch)
    throw new Error('Invalid target_branch')

  var args = [ opts.root + '/build' ]

  args.push(opts.source)
  args.push(folder(opts.source))
  args.push(opts.source_ref)

  args.push(opts.target)
  args.push(folder(opts.target))
  args.push(opts.target_branch)

  args.push(opts.push_target ? true : false)

  return args
}

function folder(repo) {
  return path.basename(repo).split('.git')[0]
}

Job.prototype.start = function() {
  var that = this

  var child = this.spawn(function(buildError) {
    that.copyLog(function(err, backup) {
      if (err) return that.cb(err)
      console.log('Wrote log:', backup)
      if (!buildError) return that.cb()
      console.log(buildError)
      that.cb(new Error('For more details, check log: ' + backup))
    })
  })

  var log = this.createBuildLog()
  child.stdout.pipe(log)
  child.stderr.pipe(log)
}

Job.prototype.spawn = function(cb) {
  this.running = true
  this.started = Date.now()

  console.log('Starting build:', this.cmd, this.args)
  var that = this

  var child = spawn(this.cmd, this.args)
  child
    .on('close', function(code) {
      that.ended = Date.now()
      if (code === 0) return cb()
      cb(new Error('Child process failed with error code: ' + code))
    })
    .on('error', function() {})

  return child
}

Job.prototype.createBuildLog = function() {
  return fs.createWriteStream(this.buildLog)
}

Job.prototype.copyLog = function(cb) {
  var backup = this.buildLogRoot + '/' + Date.now() + '.log'
  ncp(this.buildLog, backup, function(err) {
    if (err) return cb(new Error('Failed to backup build log'))
    cb(null, backup)
  })
}

exports.Job = Job
exports.createArgs = createArgs
exports.folder = folder
