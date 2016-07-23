"use strict";
var roomObjects = require('room.manager');
var masterControlProgram = require('global.manager');
require('task.manager');
require('spawn.manager');
require('creep.manager');
require('satellite.manager');
require('war.manager');
for (let role in Memory.roles){
    require('role.' + role);
}
var profiler = require('screeps-profiler');

//Game.profiler.profile(ticks, [functionFilter]);
//Game.profiler.stream(ticks, [functionFilter]);
//Game.profiler.email(ticks, [functionFilter]);

 
// This line monkey patches the global prototypes. 
profiler.enable();
module.exports.loop = function() {
  profiler.wrap(function() {
      
    for (let struct in Game.structures){
        let structobj = Game.structures[struct];
        if (structobj.structureType == STRUCTURE_TOWER) {
            let hostile = structobj.room.find(FIND_HOSTILE_CREEPS);
            if(hostile.length > 0) {
                structobj.attack(hostile[0]);
            }
        }
    }
    
    var MCP = new masterControlProgram();
    var gameGrid = new roomObjects();
    MCP.initialize(gameGrid);
    MCP.Tick(gameGrid)
  });
}
