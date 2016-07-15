var crypto = require('crypto')
  , tb = require('timebucket')
  , colors = require('colors')

module.exports = function container (get, set) {
  var conf = get('motley:conf.console')
  var cluster = require('cluster')
  var get_timestamp = get('utils.get_timestamp')
  return {
    _log: function (args) {
      var options = {}
      if (toString.call(args[args.length - 1]) === '[object Object]') {
        options = args.pop()
      }
      if (conf.workerId) {
        if (cluster.isMaster && Object.keys(cluster.workers).length) {
          var msg = '[master]'
          if (conf.colors) msg = colors.green(msg)
          args.unshift(msg)
        }
        else if (cluster.isWorker) {
          var msg = '[worker:' + cluster.worker.id + ']'
          if (conf.colors) msg = colors.cyan(msg)
          args.unshift(msg)
        }
      }
      if (conf.timestamp) {
        args.unshift(get_timestamp().grey)
      }
      var line = args.map(function (arg) {
        if (typeof arg !== 'string') {
          return JSON.stringify(arg, null, 2)
        }
        return arg
      }).join(' ')
      if (!options.public) {
        console.error(line)
      }
      if (get('mode') === 'zen' || colors.strip(line).match(/tweeted/)) {
        var log = {
          id: tb('µs').toString(),
          time: new Date().getTime(),
          line: line,
          data: options.data || null,
          public: options.public || false
        }
        try {
          get('motley:db.logs').save(log, function (err, saved) {
            // nothing
          })
        }
        catch (e) {}
      }
    },
    info: function () {
      if (conf.silent) return
      var args = [].slice.call(arguments)
      var data = null
      this._log(args)
    },
    log: function () {
      if (conf.silent) return
      var args = [].slice.call(arguments)
      this._log(args)
    },
    error: function () {
      var args = [].slice.call(arguments)
      var msg = '[ERROR]'
      if (conf.colors) msg = colors.red(msg)
      args.unshift(msg)
      this._log(args)
    }
  }
}