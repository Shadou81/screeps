"use strict";

Room.prototype.replaceDeadCreeps = function(roomObjects){
    
    if (this.memory.config.new){
        let builders = _.filter(this.memory.creeps, (creep) => (creep.role == 'builder'));
        if(builders.length < this.memory.config.creepcounts.builders) {
            let constructions = this.getConstructionsList(roomObjects);
            if (builders.length < constructions.length){
                this.queueSpawn('builder', 1)
            }
        }
    }
    else{
        let harvestersearch = _.filter(this.memory.creeps, (creep) => (creep.role == 'harvester'));
        let distributorsearch = _.filter(this.memory.creeps, (creep) => (creep.role == 'distributor'));
        if ((harvestersearch.length == 0) && (distributorsearch.length == 0)){
            this.queueSpawn('harvester', 3);
            this.queueSpawn('distributor', 4);
        }
        else {
            let carriersearch = _.filter(this.memory.creeps, (creep) => (creep.role == 'carrier'));
            let repairersearch = _.filter(this.memory.creeps, (creep) => (creep.role == 'repairer'));
            let upgradersearch = _.filter(this.memory.creeps, (creep) => (creep.role == 'upgrader'));
            let buildersearch = _.filter(this.memory.creeps, (creep) => (creep.role == 'builder'));
            let towersearch = _.filter(this.memory.creeps, (creep) => (creep.role == 'towerdistributor'));
            if (distributorsearch.length < this.memory.config.creepcounts.distributors){
                this.queueSpawn('distributor', 4);
            }
            if (harvestersearch.length < (this.memory.config.creepcounts.maxharvesterpersource * this.memory.sources.length)){
                this.queueSpawn('harvester', 5);
            }
            if (towersearch.length < this.memory.config.creepcounts.towerdistributors){
                this.queueSpawn('towerdistributor', 6, null, this.memory.config.creepbodies.distributor);
            }
            if (repairersearch.length < this.memory.config.creepcounts.repairers){
                this.queueSpawn('repairer', 6);
            }
            if (upgradersearch.length < this.memory.config.creepcounts.upgraders){
                this.queueSpawn('upgrader', 7);
            }
            if (carriersearch.length < this.memory.config.creepcounts.carriers){
                this.queueSpawn('carrier', 8);
            }
            if (buildersearch.length < this.memory.config.creepcounts.builders){
                let constructions = this.getConstructionsList(roomObjects);
                if (buildersearch.length < constructions.length){
                    this.queueSpawn('builder', 9)
                }
            }
        }
    }
}

Room.prototype.queueSpawn = function(role, priority, task = null, body = null) {
        
    let order = {
        role: role,
        priority: priority,
        task: task,
        body: body
    };
    
    let orderMemory = this.memory.spawnqueue
    let duplicate = false
    for (let i=0; i<this.memory.spawnqueue.length; i++){
        if (_.isMatch(order, orderMemory[i])){
            duplicate = true
        }
    }
    if (!duplicate){
        orderMemory.push(order);
    }
}

StructureSpawn.prototype.spawnCreep = function(order, test = 'test'){
        
    let role = order.role;
    let priority = order.priority;
    let task = order.task;
    let room = this.room;
    let config = room.memory.config.creepbodies;
    let body = order.body || room.memory.config.creepbodies[order.role]
    
    if (test == 'test') {
        let check = this.canCreateCreep(body, undefined)
        return check;
    }
    if (test == 'create') {
        let newName = this.createCreep(body, undefined, {role: role, task: task, originroom: room.name})
        return newName;
    }
}
    
StructureSpawn.prototype.Tick = function() {
        
    let room = this.room
    let memory = room.memory.spawnqueue
    
    if (memory.length > 0){
        let sortMemory = _.sortBy(memory, function(creep) {return (creep.priority)});
        room.memory.spawnqueue = sortMemory;
    }
    spawning: {
        while(memory.length > 0){
            let creep = memory[0]
            let order = {
                role: creep.role, 
                priority: creep.priority, 
                task: creep.task, 
                body: creep.body
            };
            let creepTest = this.spawnCreep(order, 'test');
            switch(creepTest){
                case OK:
                    let newName = this.spawnCreep(order, 'create')
                    room.memory.spawnqueue.splice(0, 1)
                    console.log(room.name + ' is spawning a creep of type ' + creep.role + ': ' + newName)
                    if (order.role == 'harvester' || order.role == 'distributor'){
                        for (let creepname in room.memory.creeps){
                            creep = Game.creeps[creepname]
                            if (creep.memory.role == ('small' + order.role)){
                                creep.suicide();
                            }
                        }
                    }
                    break spawning;
                case ERR_BUSY:
                    break spawning;
                case ERR_INVALID_ARGS:
                    room.memory.spawnqueue.splice(0, 1)
                    console.log(room.name + 'failed to create a creep of type ' + creep.role + ' because the body is defined badly.');
                    break;    
                case ERR_RCL_NOT_ENOUGH:
                    room.memory.spawnqueue.splice(0, 1)
                    console.log(room.name + 'failed to create a creep of type ' + creep.role + ' because the room RCL is not high enough.');
                    break; 
                case ERR_NOT_ENOUGH_ENERGY:
                    if (order.role == 'distributor'){
                        let distributorsearch = _.filter(room.memory.creeps, (creep) => (creep.role == 'smalldistributor'));
                        if (distributorsearch.length == 0){
                            room.queueSpawn('smalldistributor', 2, null, [CARRY,CARRY,CARRY,MOVE,MOVE,MOVE])
                        }
                    }
                    if (order.role == 'harvester'){
                        let distributorsearch = _.filter(room.memory.creeps, (creep) => (creep.role == 'smalldistributor'));
                        let harvestersearch = _.filter(room.memory.creeps, (creep) => (creep.role == 'smallharvester'));
                        if (harvestersearch.length == 0){
                            room.queueSpawn('smallharvester', 1, null, [WORK,WORK,CARRY,MOVE])
                        }
                        if (distributorsearch.length == 0){
                            room.queueSpawn('smalldistributor', 2, null, [CARRY,CARRY,CARRY,MOVE,MOVE,MOVE])
                        }
                    }
                    break spawning;
                default: 
                    room.memory.spawnqueue.splice(0)
                    console.log(room.name + 'failed to create a creep of type ' + creep.role + ' because of an unaccounted for error. Error code: '+ creepTest)
                    break;
            }
        }
    }
}