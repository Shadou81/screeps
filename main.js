"use strict";
var roomObjects = require('room.manager');
var masterControlProgram = require('global.manager');
var Traveler = require('Traveler');
const profiler = require('screeps-profiler');
require('spawn.manager');
require('creep.manager');
require('satellite.manager');
require('war.manager');
for (let role in Memory.roles){
    require('role.' + role);
}
//profiler.enable();
module.exports.loop = function () {
    
    for (let struct in Game.structures){
        let structobj = Game.structures[struct];
        if (structobj.structureType == STRUCTURE_TOWER) {
            let hostile = structobj.room.find(FIND_HOSTILE_CREEPS);
            if(hostile.length > 0) {
                let healer = _.filter(hostile, function(creep) {return (creep.getActiveBodyparts(HEAL) > 0)});
                if (healer.length){
                    structobj.attack(healer[0]);
                }
                else{
                    structobj.attack(hostile[0]);
                }
            }
        }
    }
    profiler.wrap(function() {
        var MCP = new masterControlProgram();
        var gameGrid = new roomObjects();
        MCP.initialize(gameGrid);
        MCP.Tick(gameGrid);
    });
    let TickTest = 0
    if(TickTest){
        if(Memory.TickTock == undefined){
            Memory.TickTock = true;
        }   
        if(Memory.TickTock){
            console.log('Tick');
            Memory.TickTock = false;
        }
        else{
            console.log('Tock');
            Memory.TickTock = true;
        }
    }

};
