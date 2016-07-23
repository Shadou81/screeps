"use strict";

var roomObjects = function() {
    this.roomstructures = {};
    this.constructions = {};
    this.droppedenergy = {};
    this.obstructions = {};
    this.hostiles = {};
    this.injured = {};
}

Room.prototype.initialize = function(roomObjects) {
    
    this.updateSpawnsList();
    this.updateCreepsList();
    this.updateContainers(roomObjects);
}

Room.prototype.Tick = function(roomObjects) {
    this.updateTier(roomObjects);
    this.replaceDeadCreeps(roomObjects);
    this.responseToFlags();
    this.manageSatellites();
    //this.defendSatellites(roomObjects);
    this.warTick(roomObjects);

    for (let spawnName in this.memory.spawns){
        let spawn = Game.spawns[spawnName];
        spawn.Tick()
    }
}

Room.prototype.updateReserve = function(containers) {
    if (this.storage){
        var reserve = 5000;
    }
    else {
        var reserve = containers.length * 1500
    }
    this.memory.config.reserve = reserve
}

Room.prototype.updateContainers = function(roomObjects) {
    
    if (this.memory.containers == undefined){
        this.memory.containers = {}
        }
        for (let id in this.memory.containers){
            let containercheck = Game.getObjectById(id)
            if (!containercheck){
                delete this.memory.containers[id]
            }
        }
        let containers = this.getStructureList(roomObjects, 'storage');
        containers = _.filter(containers, (struct) => (struct.structureType != STRUCTURE_LINK))
        for (let i=0; i<containers.length; i++){
            
            if (this.memory.containers[containers[i].id] == undefined){
                this.memory.containers[containers[i].id] = {}
            }
        }
        for(let id in this.memory.containers){
            let reservation = 0;
            for (let name in this.memory.creeps){
                let creep = Game.creeps[name];
                if ((creep.memory.task == id) && (creep.memory.role == 'carrier') && (!creep.memory.carrying)){
                    reservation += creep.carryCapacity;
                }
            }
            this.memory.containers[id].reserved = reservation
        }
        this.updateReserve(containers);
}

Room.prototype.updateSpawnsList = function() {
    
    if (this.memory.spawns == undefined){
        this.memory.spawns = {};
    }
    
    for (let spawnName in Memory.MyOwnedRooms[this.name].spawns){
        let spawn = Game.spawns[spawnName]
        if (this.memory.spawns[spawn.name] == undefined){
            this.memory.spawns[spawn.name] = spawn.id
        }
    }
    for (let spawnName in this.memory.spawns){
        let spawn = Game.spawns[spawnName];
        if (!spawn){
            delete this.memory.spawns[spawnName]
        }
    }
}

Room.prototype.updateCreepsList = function() {
    for (let creepName in Game.creeps){
        let creep = Game.creeps[creepName]
        if (creep.memory.originroom == this.name){
            this.memory.creeps[creepName] = {
                name: creep.name,
                role: creep.memory.role,
                task: creep.memory.task
            };
        }
    }
    for (let i=0; i<this.memory.sources.length; i++){
        for (let j=(this.memory.config.creepcounts.maxharvesterpersource - 1); j>=0; j--){
            let creepName = this.memory.sources[i].harvesters[j];
            let creep = Game.creeps[creepName];
            if (!creep) {
                this.memory.sources[i].harvesters.splice(j, 1);
            }
        }
    }
}

Room.prototype.newRoomSetup = function() {
    
    this.memory = this.memory || {};
    this.memory.spawnqueue = this.memory.spawnqueue || [];
    this.memory.creeps = this.memory.creeps || {};
    this.memory.sources = this.memory.sources || this.find(FIND_SOURCES);
    for (let i=0; i<this.memory.sources.length; i++){
        this.memory.sources[i].harvesters = this.memory.sources[i].harvesters || [];
    }
    this.memory.config = this.memory.config || {};

    this.memory.config.creepcounts = this.memory.config.creepcounts || {
        maxharvesterpersource: 3,
        upgraders: 1,
        builders: 2,
        repairers: 1,
        carriers: 1,
        distributors: 1,
        towerdistributors: 0,
        reservers: 0
    };

    this.memory.config.creepbodies = this.memory.config.creepbodies || {
        harvester: [WORK,WORK,CARRY,MOVE],
        builder: [WORK,WORK,CARRY,MOVE],
        repairer: [WORK,CARRY,MOVE,MOVE],
        carrier: [CARRY,CARRY,CARRY,MOVE,MOVE,MOVE],
        distributor: [CARRY,CARRY,CARRY,MOVE,MOVE,MOVE],
        upgrader: [WORK,WORK,CARRY,MOVE],
        reserver: [CLAIM,MOVE]
    };

    this.memory.config.new = this.memory.config.new || true;
    this.memory.config.tier = this.memory.config.tier || 1;
    this.memory.config.maxstructurehits = this.memory.config.maxstructurehits || 250000;
    this.memory.config.carrierOffset = this.memory.config.carrierOffset || 1
    this.memory.config.repairthreshold = this.memory.config.repairthreshold || 1500
    
}

Room.prototype.updateTier = function(roomObjects){
        
    if(this.memory.config.new){
        let containers = this.getStructureList(roomObjects, 'container')
        if (containers.length >= this.memory.sources.length){
            this.memory.config.new = false
            this.memory.config.creepbodies.builder = this.memory.config.creepbodies.repairer;
            for (let creepName in this.memory.creeps){
                let creep = Game.creeps[creepName];
                creep.memory.role = 'harvester'
            }
        }
        
    }
    
    if ((this.memory.config.tier == 1) && (this.energyCapacityAvailable >= 550)){
        this.memory.config.tier = 2;
        this.memory.config.creepbodies.harvester = [WORK,WORK,WORK,CARRY,MOVE,MOVE];
        this.memory.config.creepbodies.distributor = [CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE];
        this.memory.config.creepbodies.upgrader = [WORK,WORK,WORK,WORK,CARRY,MOVE,MOVE];
        this.memory.config.creepbodies.carrier = [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE];
        this.memory.config.creepbodies.builder = [WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE];
        this.memory.config.creepbodies.repairer = [WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE];
        this.memory.config.creepcounts.maxharvesterpersource = 2;
    }
    if ((this.memory.config.tier == 2) && (this.energyCapacityAvailable >= 800)){
        this.memory.config.tier = 3;
        this.memory.config.creepbodies.harvester = [WORK,WORK,WORK,WORK,WORK,WORK,CARRY,MOVE,MOVE,MOVE];
        this.memory.config.creepbodies.distributor = [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
        this.memory.config.creepbodies.upgrader = [WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE];
        this.memory.config.creepbodies.carrier = [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE];
        this.memory.config.creepbodies.builder = [WORK,WORK,WORK,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
        this.memory.config.creepbodies.repairer = [WORK,WORK,WORK,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
        this.memory.config.creepbodies.reserver = [CLAIM,MOVE];
        this.memory.config.creepcounts.towerdistributors = 1;
        this.memory.config.creepcounts.maxharvesterpersource = 1;
        this.memory.config.creepcounts.reservers = 2;
    }
    if ((this.memory.config.tier == 3) && (this.energyCapacityAvailable >= 1300)){
        this.memory.config.tier = 4;
        this.memory.config.creepbodies.carrier = [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
        this.memory.config.creepbodies.reserver = [CLAIM,CLAIM,MOVE,MOVE];
        this.memory.config.creepcounts.reservers = 1;
    }
}

module.exports = roomObjects;