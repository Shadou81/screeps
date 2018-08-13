"use strict";
const profiler = require('screeps-profiler');

var masterControlProgram = function() {
    
}

masterControlProgram.prototype.initialize = function(roomObjects) {
    this.initializeMemory();
    this.updateRoles();
    this.updateRooms(); 
    this.updateCreeps();
    
    for (let roomName in Memory.MyOwnedRooms){
        let room = Game.rooms[roomName]
        room.initialize(roomObjects)
    }
    
}   

masterControlProgram.prototype.initializeMemory = function() {

    if (Memory.MyOwnedRooms == undefined){
        Memory.MyOwnedRooms = {};
    }
    if (Memory.creeps == undefined){
        Memory.creeps = {};
    }
    if (Memory.rooms == undefined){
        Memory.rooms = {};
    }
    if (Memory.rooms.creeps == undefined){
        Memory.rooms.creeps == {};
    }
    if (Memory.roles == undefined){
        Memory.roles = {}
    }
    if (Memory.creepNum == undefined){
        Memory.creepNum = 0;
    }
}

masterControlProgram.prototype.updateRoles = function() {
    for (let creepName in Game.creeps){
        let creep = Game.creeps[creepName];
        let role = creep.memory.role;
        if (Memory.roles[role] == undefined){
            Memory.roles[role] = role;
        }
    }
}

masterControlProgram.prototype.updateCreeps = function() {
    
    for (let creepName in Memory.creeps){
        let creep = Game.creeps[creepName];
        if(!creep){
            let roomName = Memory.creeps[creepName].originroom;
            let room = Game.rooms[roomName];
            delete room.memory.creeps[creepName];
            delete Memory.creeps[creepName];
        }
    }
    
    for (let creepName in Game.creeps){
        let creep = Game.creeps[creepName];
        let roomName = creep.memory.originroom;
        let room = Game.rooms[roomName];
        room.memory.creeps[creepName] = {
            name: creep.name,
            role: creep.memory.role,
            task: creep.memory.task
        };
    }
}

masterControlProgram.prototype.updateRooms = function() {
    
    for (let spawnName in Game.spawns){
        let spawn = Game.spawns[spawnName]
        if (Memory.MyOwnedRooms[spawn.room.name] == undefined){
            Memory.MyOwnedRooms[spawn.room.name] = {};
            Memory.MyOwnedRooms[spawn.room.name].spawns = {};
            Memory.MyOwnedRooms[spawn.room.name].satellites = {}
            spawn.room.newRoomSetup()
        }
        if (Memory.MyOwnedRooms[spawn.room.name].spawns[spawn.name] == undefined){
            Memory.MyOwnedRooms[spawn.room.name].spawns[spawn.name] = spawn.id;
        }
    }
    for (let roomName in Memory.MyOwnedRooms){
        let room = Game.rooms[roomName]
        if (room == undefined){
            delete Memory.MyOwnedRooms[roomName];
            delete Memory.rooms[roomName]
            continue;
        }
        for (let spawnName in Memory.MyOwnedRooms[room.name].spawns){
            let spawn = Game.spawns[spawnName];
            if (!spawn){
                delete Memory.MyOwnedRooms[room.name].spawns[spawnName]
            }
        }
    }
}
masterControlProgram.prototype.Tick = function(roomObjects) {
    for (let creepName in Game.creeps){
        let creep = Game.creeps[creepName];
        creep.Tick(roomObjects);
    }
    for (let roomName in Memory.MyOwnedRooms){
        let room = Game.rooms[roomName];
        room.Tick(roomObjects);
    }
    
}
profiler.registerClass(masterControlProgram, 'masterControlProgram');
module.exports = masterControlProgram;