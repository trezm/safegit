'use strict';

var _ = require('underscore');
var async = require('async');
var shell = require('shelljs');

var settings;
try {
  if (!settings) {
    settings = require(process.cwd() + '/.safegit.json');
  }
} catch(err) {
  // couldn't find it in the current directory.
}

try {
  if (!settings) {
    settings = require(process.env.HOME + '/.safegit.json');
  }
} catch(err) {
  // couldn't find it in the current directory.
}

if (!settings) {
  console.error('Couldn\'t find a .safegit file.');
  process.exit(1);
}

function Safegit(args) {
  args.shift();
  args.shift();
  args.unshift('git');

  this.args = args;
}

Safegit.prototype.run = function() {
  var customCommands = this.createCustomCommands();
  var safetyCommands = this.createSafetyCommands();

  var self = this;
  self.runThings(customCommands || safetyCommands, function(err, code) {
    self.finish(err || code);
  });
};

Safegit.prototype.makeRunnable = function(executable) {
  return function(next) {
    var child = shell.exec(executable, { silent: true }, function(code) {
      if (code === 0) {
        next(null, code);
      } else {
        console.log('"' + executable + '" failed with code [' + code + ']');
        next(code);
      }
    });

    child.stdout.on('data', function(data) {
      console.log(data);
    });


    child.stderr.on('data', function(data) {
      console.log('[err]:', data);
    });
  };
};

/*
 * Runs custom commands
 *
 * callback: fn(err, code)
 */

Safegit.prototype.createCustomCommands = function() {
  var firstCommand = settings[this.args[1]];
  var thingsToRun = [];

  if (!!firstCommand && typeof firstCommand === 'object') {
    var commands = firstCommand.commands || [];

    var _replaceArguments = function(i, argument) {
      return function replaceInCommand(command) {
        command = command.replace(new RegExp('\\$' + i, 'g'), argument);
        return command;
      };
    };

    for (var i = 2; i < this.args.length; i++) {
      var argument = this.args[i];

      commands = _.map(commands, _replaceArguments(i - 1, argument));
    }

    for (var j = 0; j < commands.length; j++) {
      thingsToRun.push(this.makeRunnable(commands[j]));
    }
  }

  return !!thingsToRun.length ? thingsToRun : null;
};

Safegit.prototype.createSafetyCommands = function() {
  var thingsToRun = [];

  for (var i = 1; i < this.args.length; i++) {
    var key = this.args[i];
    if (!!settings[key]) {
      thingsToRun.push(this.makeRunnable(settings[key]));
    }
  }

  thingsToRun.push(this.makeRunnable(this.args.map(function(unquoted) {
    return '"' + unquoted + '"';
  }).join(' ')));

  return !!thingsToRun.length ? thingsToRun : null;
};

Safegit.prototype.runThings = function(listOfThings, callback) {
  async.series(listOfThings, callback);
};

Safegit.prototype.finish = function(code) {
  process.exit(code);
};

module.exports = function(args) {
  var safegit = new Safegit(args);
  safegit.run();
};
