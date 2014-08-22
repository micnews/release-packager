var Job = require('./job').Job

function Packager(opts) {
  if (!(this instanceof Packager)) return new Packager(opts)
  this.services = []
  this.running = true
  this.shutdownCb = null
  this.root = opts.root
}

/**
 * Creates and returns a packager instance.
 * @param {Object} opts
 * @param {String} opts.root Path to root folder
 */
module.exports = function(opts) {
  return new Packager(opts)
}

/**
 * Build an app.
 * @param {Object} opts
 * @param {String} opts.name Name of the application to build
 * @param {String} opts.source Source git repository
 * @param {String} opts.source_ref Git ref to build from
 * @param {String} opts.target Target git repository
 * @param {String} opts.target_branch Target branch to commit to
 * @param {Boolean} [opts.push_target] Set to true if code should be pushed
 */
Packager.prototype.build = function(opts, cb) {
  if (!this.running) return

  cb = cb || function(err, done) { done() }

  var that = this
  var service = this.getService(opts.name)

  opts.root = this.root

  var wrapper = function(err) {
    cb(err, function() {
      console.log('Caller done. Removing build job.')
      service.jobs.splice(0, 1)
      process.nextTick(that.processJobs.bind(that))
    })
  }

  service.jobs.push(new Job(opts, wrapper))
  console.log('Added build job', opts)

  process.nextTick(this.processJobs.bind(this))
}

Packager.prototype.processJobs = function() {
  if (!this.running) return

  if (this.shutdownCb) {
    if (this.hasRunningJobs()) return
    return this.doShutdown()
  }

  console.log('Processing job queue.')

  this.services.forEach(function(service) {
    if (!service.jobs.length) return
    var job = service.jobs[0]
    if (job.running) return console.log('Found running job. Will wait.')
    console.log('Starting job.')
    job.start()
  })
}

Packager.prototype.shutdown = function(cb) {
  var that = this
  process.nextTick(function() {
    if (that.shutdownCb === null) {
      that.shutdownCb = cb
      if (that.hasRunningJobs()) return
      that.doShutdown()
    }
  })
}

Packager.prototype.doShutdown = function() {
  console.log('Shutting down.')
  this.running = false
  this.shutdownCb()
}

Packager.prototype.hasRunningJobs = function() {
  return this.services.filter(function(service) {
    return service.jobs.length && service.jobs[0].running
  }).length > 0
}

Packager.prototype.getService = function(name) {
  var services = this.services.filter(function(service) {
    return service.name === name
  })

  if (services.length) return services[0]

  var newService = { name: name, jobs: [] }
  this.services.push(newService)
  return newService
}
