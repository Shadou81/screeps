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
    this.updateHarvesters();
    this.updateContainers(roomObjects);
}

Room.prototype.Tick = function(roomObjects) {
    this.updateTier(roomObjects);
    this.replaceDeadCreeps(roomObjects);
    this.responseToFlags();
    this.manageSatellites();
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

Room.prototype.updateHarvesters = function() {
    for (let i=0; i<this.memory.sources.length; i++){
        let harvestRoom = this.memory.sources[i].harvestRoom;
        if (this.memory.config.creepcounts.maxharvesterpersource < harvestRoom){
            harvestRoom = this.memory.config.creepcounts.maxharvesterpersource;
        }
        for (let j=(harvestRoom - 1); j>=0; j--){
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
    this.memory.sources = this.memory.sources || []
    var sources = this.find(FIND_SOURCES);
    for (let i=0; i<sources.length; i++){
        this.memory.sources[i] = {id:sources[i].id, pos:sources[i].pos};
    }
    for (let i=0; i<this.memory.sources.length; i++){
        this.memory.sources[i].harvesters = this.memory.sources[i].harvesters || [];
        this.memory.sources[i].harvestRoom = this.memory.sources[i].harvestRoom || 0;
        var sourceTerrain = []
        sourceTerrain = this.lookForAtArea(
            LOOK_TERRAIN, 
            (this.memory.sources[i].pos.y - 1),
            (this.memory.sources[i].pos.x - 1),
            (this.memory.sources[i].pos.y + 1),
            (this.memory.sources[i].pos.x + 1),
            true
            );
        for (let j=0; j<sourceTerrain.length; j++){
            if (sourceTerrain[j].terrain != 'wall'){
                this.memory.sources[i].harvestRoom++;
            }
        }
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
        this.memory.config.creepbodies.upgrader = [WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE]
        this.memory.config.creepcounts.reservers = 1;
    }
}

Room.prototype.getStructureList = function(roomObjects, type){
    
    if (roomObjects.roomstructures[this.name] == undefined) {
        roomObjects.roomstructures[this.name] = (this.find(FIND_STRUCTURES));
        if (Memory.MyOwnedRooms[this.name] != undefined){
            if (Object.keys(Memory.MyOwnedRooms[this.name].satellites).length > 0){
                for (let satelliteName in Memory.MyOwnedRooms[this.name].satellites){
                    let satellite = Game.rooms[satelliteName];
                    if (satellite){
                        let satellitestructures = satellite.find(FIND_STRUCTURES)
                        roomObjects.roomstructures[this.name] = roomObjects.roomstructures[this.name].concat(satellitestructures);
                    }
                }
            }
        }
    }
    switch (type){
        case 'obstructions' : 
            if (roomObjects.obstructions[this.name] == undefined){
                roomObjects.obstructions[this.name] = _.filter(roomObjects.roomstructures[this.name], (struct) => (struct.structureType == STRUCTURE_WALL || struct.structureType == STRUCTURE_RAMPART));
            }
            return roomObjects.obstructions[this.name];
        case 'link' :
            let links = _.filter(roomObjects.roomstructures[this.name], (struct) => (struct.structureType == STRUCTURE_LINK));
            return links
        case 'storagereceivelink':
            let roomlinks = _.filter(roomObjects.roomstructures[this.name], (struct) => (struct.structureType == STRUCTURE_LINK));
            let linkstorage = this.storage
            for (let i=0; i<roomlinks.length; i++){
                let linkobj = roomlinks[i];
                if (linkstorage.pos.getRangeTo(linkobj) == 1){
                    return linkobj;
                }
            }
            return 0
        case 'repair' : 
            let repairs = _.filter(roomObjects.roomstructures[this.name], (struct) => ((struct.hits <= (struct.hitsMax - this.memory.config.repairthreshold)) && 
                                                                                       (struct.hits < this.memory.config.maxstructurehits)));
            return repairs;
        case 'container' : 
            let containers = _.filter(roomObjects.roomstructures[this.name], (struct) => (struct.structureType == STRUCTURE_CONTAINER));
            return containers;
        case 'storage' :
            let storage = _.filter(roomObjects.roomstructures[this.name], (struct) => (struct.structureType == STRUCTURE_CONTAINER ||
                                                                                       struct.structureType == STRUCTURE_STORAGE ||
                                                                                       struct.structureType == STRUCTURE_LINK));
            return storage;
        case 'energy' :
            let energy = _.filter(roomObjects.roomstructures[this.name], (struct) => ((struct.structureType == STRUCTURE_CONTAINER ||
                                                                                       struct.structureType == STRUCTURE_STORAGE ||
                                                                                       struct.structureType == STRUCTURE_LINK) && 
                ((struct.structureType == STRUCTURE_LINK) ? (struct.energy > 0):(struct.store[RESOURCE_ENERGY] > 0))));
            return energy;
        case 'refill' :
            let refills = _.filter(roomObjects.roomstructures[this.name], (struct) => ((struct.structureType == STRUCTURE_SPAWN || 
                                                                                        struct.structureType == STRUCTURE_EXTENSION) && 
                                                                                       (struct.energy < struct.energyCapacity)));
            return refills;
        case 'tower':
            let tower = _.filter(roomObjects.roomstructures[this.name], (struct) => (struct.structureType == STRUCTURE_TOWER));
            return tower;
        }
}  
Room.prototype.getConstructionsList = function(roomObjects) {
    if (roomObjects.constructions[this.name] == undefined) {
            roomObjects.constructions[this.name] = (this.find(FIND_MY_CONSTRUCTION_SITES));
            if (Object.keys(Memory.MyOwnedRooms[this.name].satellites).length > 0){
                for (let satelliteName in Memory.MyOwnedRooms[this.name].satellites){
                    let satellite = Game.rooms[satelliteName];
                    if (satellite){
                        let satelliteconst = satellite.find(FIND_MY_CONSTRUCTION_SITES)
                        roomObjects.constructions[this.name] = roomObjects.constructions[this.name].concat(satelliteconst);
                    }
                }
            }
        }
        return roomObjects.constructions[this.name];
}
Room.prototype.getDroppedEnergy = function(roomObjects) {
    
    if (roomObjects.droppedenergy[this.name] == undefined) {
        roomObjects.droppedenergy[this.name] = (this.find(FIND_DROPPED_RESOURCES));
        if (Object.keys(Memory.MyOwnedRooms[this.name].satellites).length > 0){
            for (let satelliteName in Memory.MyOwnedRooms[this.name].satellites){
                let satellite = Game.rooms[satelliteName];
                if (satellite){
                    let satellitedrop = satellite.find(FIND_DROPPED_RESOURCES)
                    roomObjects.droppedenergy[this.name] = roomObjects.droppedenergy[this.name].concat(satellitedrop);
                }
            }
        }
    }
    return roomObjects.droppedenergy[this.name];
}

Room.prototype.getHostiles = function(roomObjects){

    if (roomObjects.hostiles[this.name] == undefined){
        roomObjects.hostiles[this.name] = this.find(FIND_HOSTILE_CREEPS);
        if (Object.keys(Memory.MyOwnedRooms[this.name].satellites).length > 0){
            for (let satelliteName in Memory.MyOwnedRooms[this.name].satellites){
                let satellite = Game.rooms[satelliteName];
                if (satellite){
                    let satellitehostiles = satellite.find(FIND_HOSTILE_CREEPS)
                    roomObjects.hostiles[this.name] = roomObjects.hostiles[this.name].concat(satellitehostiles);
                }
            }
        }
    }
    return roomObjects.hostiles[this.name];
}

Room.prototype.getInjured = function(roomObjects){

    var room = Game.rooms[this.name]
    if (roomObjects.injured[this.name] == undefined){
        roomObjects.injured[this.name] = this.find(FIND_MY_CREEPS);
        roomObjects.injured[this.name] = _.filter(roomObjects.injured[this.name], (creep) => (creep.hits < creep.hitsMax))
    }
    return roomObjects.injured[this.name];
}
Room.prototype.getList = function(roomObjects, type){
    
    if (roomObjects.roomstructures[this.name] == undefined) {
        roomObjects.roomstructures[this.name] = (this.find(FIND_STRUCTURES));
        if (Memory.MyOwnedRooms[this.name] != undefined){
            if (Object.keys(Memory.MyOwnedRooms[this.name].satellites).length > 0){
                for (let satelliteName in Memory.MyOwnedRooms[this.name].satellites){
                    let satellite = Game.rooms[satelliteName];
                    if (satellite){
                        let satellitestructures = satellite.find(FIND_STRUCTURES)
                        roomObjects.roomstructures[this.name] = roomObjects.roomstructures[this.name].concat(satellitestructures);
                    }
                }
            }
        }
    }
    switch (type){
        case 'obstructions' : 
            if (roomObjects.obstructions[this.name] == undefined){
                roomObjects.obstructions[this.name] = _.filter(roomObjects.roomstructures[this.name], (struct) => (struct.structureType == STRUCTURE_WALL || struct.structureType == STRUCTURE_RAMPART));
            }
            return roomObjects.obstructions[this.name];
        case 'link' :
            let links = _.filter(roomObjects.roomstructures[this.name], (struct) => (struct.structureType == STRUCTURE_LINK));
            return links
        case 'storagereceivelink':
            let roomlinks = _.filter(roomObjects.roomstructures[this.name], (struct) => (struct.structureType == STRUCTURE_LINK));
            let linkstorage = this.storage
            for (let i=0; i<roomlinks.length; i++){
                let linkobj = roomlinks[i];
                if (linkstorage.pos.getRangeTo(linkobj) == 1){
                    return linkobj;
                }
            }
            return 0
        case 'repair' : 
            let repairs = _.filter(roomObjects.roomstructures[this.name], (struct) => ((struct.hits <= (struct.hitsMax - this.memory.config.repairthreshold)) && 
                                                                                       (struct.hits < this.memory.config.maxstructurehits)));
            return repairs;
        case 'container' : 
            let containers = _.filter(roomObjects.roomstructures[this.name], (struct) => (struct.structureType == STRUCTURE_CONTAINER));
            return containers;
        case 'storage' :
            let storage = _.filter(roomObjects.roomstructures[this.name], (struct) => (struct.structureType == STRUCTURE_CONTAINER ||
                                                                                       struct.structureType == STRUCTURE_STORAGE ||
                                                                                       struct.structureType == STRUCTURE_LINK));
            return storage;
        case 'energy' :
            let energy = _.filter(roomObjects.roomstructures[this.name], (struct) => ((struct.structureType == STRUCTURE_CONTAINER ||
                                                                                       struct.structureType == STRUCTURE_STORAGE ||
                                                                                       struct.structureType == STRUCTURE_LINK) && 
                ((struct.structureType == STRUCTURE_LINK) ? (struct.energy > 0):(struct.store[RESOURCE_ENERGY] > 0))));
            return energy;
        case 'refill' :
            let refills = _.filter(roomObjects.roomstructures[this.name], (struct) => ((struct.structureType == STRUCTURE_SPAWN || 
                                                                                        struct.structureType == STRUCTURE_EXTENSION) && 
                                                                                       (struct.energy < struct.energyCapacity)));
            return refills;
        case 'tower':
            let tower = _.filter(roomObjects.roomstructures[this.name], (struct) => (struct.structureType == STRUCTURE_TOWER));
            return tower;
        }
}


module.exports = roomObjects;