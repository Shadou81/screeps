"use strict";
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
            if (Memory.ClaimTargets[this.name]){
                let claimName = Memory.ClaimTargets[this.name];
                let claim = Game.rooms[claimName];
                if (claim){
                    let claimconst = claim.find(FIND_MY_CONSTRUCTION_SITES)
                    roomObjects.constructions[this.name] = roomObjects.constructions[this.name].concat(claimconst);
                }
            }    
        }
        return roomObjects.constructions[this.name];
}
Room.prototype.getDroppedEnergy = function(roomObjects) {
    
    if (roomObjects.droppedenergy[this.name] == undefined) {
        roomObjects.droppedenergy[this.name] = (this.find(FIND_DROPPED_ENERGY));
        if (Object.keys(Memory.MyOwnedRooms[this.name].satellites).length > 0){
            for (let satelliteName in Memory.MyOwnedRooms[this.name].satellites){
                let satellite = Game.rooms[satelliteName];
                if (satellite){
                    let satellitedrop = satellite.find(FIND_DROPPED_ENERGY)
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