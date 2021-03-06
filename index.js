/**
 * @author Stanislav Kalashnik <darkpark.main@gmail.com>
 * @license GNU GENERAL PUBLIC LICENSE Version 3
 */

'use strict';

var path     = require('path'),
    chokidar = require('chokidar'),
    Runner   = require('@cjssdk/runner'),
    log      = require('@runner/logger'),
    runner   = new Runner();


// should be removed after rework!
global.DEVELOP = true;


// global configuration for tasks
runner.config = {};


// report subsystem
runner.log = log;


runner.alias = function ( alias, id ) {
    runner.tasks[alias] = runner.tasks[id];
};


runner.watch = function ( glob, task ) {
    function handler ( name ) {
        log.info('changed: %s run: %s', log.colors.magenta(name), log.colors.cyan(task));
        runner.run(task);
    }

    return chokidar.watch(glob, runner.watch.config)
        .on('change', handler)
        .on('unlink', handler)
        .on('add',    handler);
};

runner.watch.config = {
    ignoreInitial: true,
    awaitWriteFinish: {
        stabilityThreshold: 50
    }
};


runner.keystrokes = {};

runner.keystroke = function ( id, rule ) {
    //var key = [];

    if ( rule && runner.tasks[id] ) {
        //rule = rule.toLowerCase().split('+');
        // rule.map(function ( part ) {
        //     return part.trim();
        // });
        //
        // if ( rule.indexOf('ctrl')  !== -1 ) { key.push('ctrl'); }
        // if ( rule.indexOf('alt')   !== -1 ) { key.push('alt'); }
        // if ( rule.indexOf('shift') !== -1 ) { key.push('shift'); }
        //
        // key.push('shift');

        runner.keystrokes[rule] = id;
    }
};


process.stdin.on('keypress', function ( str, key ) {
    var keystroke = [];

    key.ctrl  && keystroke.push('ctrl');
    key.meta  && keystroke.push('alt');
    key.shift && keystroke.push('shift');
    keystroke.push(key.name);
    keystroke = keystroke.join('+');

    if ( runner.keystrokes[keystroke] ) {
        runner.run(runner.keystrokes[keystroke]);
    }
});


runner.addListener('start', function ( event ) {
    log.info('starting %s ...', log.colors.cyan(event.id));
});

runner.addListener('finish', function ( event ) {
    log.info('finished %s after %s ms', log.colors.cyan(event.id), log.colors.magenta(event.time));
});

runner.addListener('error', function ( event ) {
    if ( event.code === 404 ) {
        log.fail('task %s is missing', log.colors.bold(event.id));
    }
});

// possible conflict detection
if ( path.dirname(path.dirname(process.mainModule.filename)) !== path.dirname(__dirname) ) {
    log.fail('both global and local node-runner instances are used at the same time!');
}


// public
module.exports = runner;
