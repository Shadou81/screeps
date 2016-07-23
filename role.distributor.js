"use strict";

Creep.prototype.distributorTick = function(roomObjects) {
    
    if (this.spawning){return}
        
    let taskmem = (this.memory.distributing ? this.memory.task : this.memory.container)
    let room = Game.rooms[this.memory.originroom];
    
    if (this.memory.distributing == undefined){
        this.memory.distributing = true;
        this.memory.container = 0
    }
    if (!taskmem){
        this.memory.distributing = true;
        taskmem = this.getDistributorTask(roomObjects);
        this.memory.task = taskmem
    }
    if (!this.memory.distributing && (this.carry.energy >= this.carryCapacity*0.9)){
        this.memory.distributing = true;
        taskmem = this.getDistributorTask(roomObjects);
        this.memory.task = taskmem
    }
    if (this.memory.distributing && (this.carry.energy < 50)) {
        this.memory.distributing = false;
        taskmem = this.getDistributorTask(roomObjects);
        this.memory.container = taskmem
    }
    if (taskmem && this.memory.distributing){
        let task = Game.getObjectById(taskmem);
        if (task.energy == task.energyCapacity){
            taskmem = this.getDistributorTask(roomObjects);
            this.memory.task = taskmem;
        }
    }
    if (taskmem) {
        let task = Game.getObjectById(taskmem)
        if(this.memory.distributing){
            let check = this.transfer(task, RESOURCE_ENERGY);
            switch (check) {
                case OK: 
                    break;
                case ERR_NOT_IN_RANGE: this.moveTo(task); break;
                case ERR_NOT_ENOUGH_RESOURCES: 
                    this.memory.distributing = false; 
                    taskmem = this.getDistributorTask(roomObjects);
                    this.memory.container = taskmem;
                    task = Game.getObjectById(taskmem);
                    break;
                case ERR_INVALID_TARGET: creep.memory.task = 0; break;
            }
        }
        if (!this.memory.distributing){
            let check = this.withdraw(task, RESOURCE_ENERGY);
            switch (check) {
                case ERR_NOT_IN_RANGE: this.moveTo(task); break;
                case ERR_FULL:
                    this.memory.distributing = true;
                    this.memory.container = 0
                    break;
                case OK:
                    this.memory.container = 0
                    break;
                case ERR_NOT_ENOUGH_RESOURCES: 
                    taskmem = this.getDistributorTask(roomObjects);
                    this.memory.container = taskmem;
                    break;
            }
        }
    }
    if (!taskmem && (this.memory.role != 'towerdistributor')) {
        if (!this.memory.receivelink){
            let receivelink = room.getStructureList(roomObjects, 'storagereceivelink');
            if (receivelink){
                this.memory.receivelink = receivelink.id
            }
        }
        if (this.memory.receivelink){
            let link = Game.getObjectById(this.memory.receivelink);
            if (!this.memory.distributing){
                if (link.energy > 0){
                    taskmem = this.memory.receivelink;
                    if (this.withdraw(link, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                        this.moveTo(link);
                    }
                }
            }
            if (this.memory.distributing && (link.energy > 0)){
                let storage = room.storage;
                taskmem = storage.id
                    if (this.transfer(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                    this.moveTo(storage)
                }
            }
        }
    }
    if (!taskmem) {
        if (!this.memory.rally){
            let flagname = ('Rally' + this.memory.originroom)
            this.memory.rally = flagname;
            }
        //Get the flag object.
        let rally = Game.flags[this.memory.rally]
        //Get close.
        if (this.pos.getRangeTo(rally) > 2){
        this.moveTo(rally)
        }
    }
}

Creep.prototype.getDistributorTask = function(roomObjects) {

    let room = Game.rooms[this.memory.originroom];
    let task;
    if (this.memory.distributing){
        let refill = room.getStructureList(roomObjects, 'refill');
        if (refill.length > 0){
            for (let creepName in room.memory.creeps){
                let creepcheck = Game.creeps[creepName];
                for (let i=(refill.length - 1); i>=0; i--){
                    if ((creepcheck.memory.task == refill[i].id) && ((creepcheck.memory.role == 'distributor') ||
                                                                     (creepcheck.memory.role == 'smalldistributor') ||
                                                                     (creepcheck.memory.role == 'towerdistributor'))) {
                        refill.splice(i, 1);
                    }
                }
            }
            if ((refill.length > 0) && !(this.memory.role == 'towerdistributor')){
                task = this.pos.findClosestByRange(refill);
            }
        }
        if ((refill.length == 0) || (this.memory.role == 'towerdistributor')) {
            let tower = room.getStructureList(roomObjects, 'tower');
            tower = _.filter(tower, (struct) => (struct.energy < struct.energyCapacity));
            tower = _.sortBy(tower, (struct) => (struct.energy))
            task = tower[0];
        }
        if ((refill.length > 0) && (this.memory.role == 'towerdistributor') && (!task)){
            task = this.pos.findClosestByRange(refill);
        }
    }
    if (!this.memory.distributing){
        let tasklist = room.getStructureList(roomObjects, 'energy');
        let storage = room.storage
        tasklist = _.filter(tasklist, (struct) => (struct.structureType == STRUCTURE_LINK ? 
                                                (((Game.getObjectById(struct.id)).pos.getRangeTo(storage) == 1) &&
                                                  (struct.energy >= this.carryCapacity)) :
                                                  (struct.store[RESOURCE_ENERGY] >= this.carryCapacity)));
        if (tasklist.length > 0){
            task = this.pos.findClosestByRange(tasklist);
            if (task.structureType == STRUCTURE_STORAGE){
                let link = room.getStructureList(roomObjects, 'storagereceivelink')
                if (link){
                    if (link.energy > 0){
                        task = link
                    }
                }
            }
        }
        else {
            task = 0
        }
    }
    if (task){return task.id;}
    else {return 0;}
}