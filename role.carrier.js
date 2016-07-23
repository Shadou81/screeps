"use strict";

Creep.prototype.carrierTick = function(roomObjects){
    if (this.spawning){return}
    let room = Game.rooms[this.memory.originroom];
    if (this.memory.carrying == undefined){
        this.memory.carrying = false
    }
    if ((!this.memory.carrying) && (this.carry.energy >= (this.carryCapacity * room.memory.config.carrierOffset))){
        this.memory.carrying = true
    }
    if (this.memory.carrying && (this.carry.energy < (this.carryCapacity * (room.memory.config.carrierOffset * 0.5)))){
        this.memory.carrying = false
    }
    let taskmem = this.memory.task;
    let task = Game.getObjectById(taskmem)
    if (!task){
        taskmem = 0
        this.memory.task = 0
    }
    if (!taskmem){
        taskmem = this.getCarrierTask(roomObjects);
        this.memory.task = taskmem;
    }
    if (taskmem){
        if(!this.memory.carrying){
            taskmem = this.memory.task
            task = Game.getObjectById(taskmem)
            let check = this.pickup(task);
            if(check == ERR_NOT_IN_RANGE){
                this.moveTo(task)
            }
            if((check == OK) || (check == ERR_FULL)){
                this.memory.task = 0;
            }
            if(check == ERR_INVALID_TARGET){
                let check = this.withdraw(task, RESOURCE_ENERGY)
                switch (check) {
                    case ERR_NOT_IN_RANGE: 
                        this.moveTo(task); 
                        break;
                    case ERR_FULL:
                        this.memory.carrying = true;
                        this.memory.task = 0
                        break;
                    case OK: 
                        this.memory.task = 0;
                        break;
                    case ERR_NOT_ENOUGH_RESOURCES:
                        this.memory.task = 0
                        break;
                }
            }
        }
        else {
            taskmem = this.memory.task
            task = Game.getObjectById(taskmem)
            let check = this.transfer(task, RESOURCE_ENERGY)
            switch (check) {
                case ERR_NOT_IN_RANGE: 
                    this.moveTo(task); 
                    break;
                case ERR_NOT_ENOUGH_RESOURCES:
                    this.memory.task = 0;
                    this.memory.carrying = false
                    break;
                case OK: 
                case ERR_FULL:
                    this.memory.task = 0
                    break;
            }
        }
    }
    else {
        if (!this.memory.rally){
                let flagname = ('Rally' + this.memory.originroom + 'c')
                this.memory.rally = flagname;
            }
        let rally = Game.flags[this.memory.rally]
        if (this.pos.getRangeTo(rally) > 2){
        this.moveTo(rally)
        }
    }
}
    
Creep.prototype.getCarrierTask = function(roomObjects){
    let room = Game.rooms[this.memory.originroom];
    let container = room.getStructureList(roomObjects, 'storage');
    let task;
    container = _.sortBy(container, function(struct) {
        if (container.structureType == STRUCTURE_STORAGE) {
            return ((struct.storeCapacity*0.5) - struct.store[RESOURCE_ENERGY]) 
        }
        else {
            return ((struct.structureType == STRUCTURE_LINK) ? (struct.energyCapacity - struct.energy):
                                                                (struct.storeCapacity - struct.store[RESOURCE_ENERGY]))
        }
    });
    if (!this.memory.carrying){
        let dropped = room.getDroppedEnergy(roomObjects);
        if (dropped.length > 0){
            dropped = _.sortBy(dropped, (drop) => (drop.amount));
            for (let i=(dropped.length-1); i>=0; i--){
                if (dropped[i].amount < (this.carryCapacity * 0.8)){
                    dropped.splice(i, 1);
                }
            }
            if (dropped.length > 0){
                for (let creepName in room.memory.creeps){
                    let creepcheck = Game.creeps[creepName];
                    for (let i=(dropped.length-1); i>=0; i--){
                        if ((creepcheck.memory.task == dropped[i].id) && (creepcheck.memory.role == 'carrier')){
                            dropped.splice(i, 1)
                        }
                    }
                }
            }
            if (dropped.length > 0){
                task = dropped[(dropped.length - 1)];
                return task.id
            }
        }
        container = _.filter(container, (struct) => (struct.structureType != STRUCTURE_LINK))
        for (let i=0; i<container.length; i++){
            for (let id in room.memory.containers){
                if (container[i].id == id){
                    let check = container[i]
                    let reserve = room.memory.containers[id].reserved
                    let space = ((check.structureType == STRUCTURE_STORAGE) ? ((check.storeCapacity*0.5) - check.store[RESOURCE_ENERGY]):
                                                                             (check.storeCapacity - check.store[RESOURCE_ENERGY]));
                    let checkCapacity = ((check.structureType == STRUCTURE_STORAGE) ? (check.storeCapacity*0.5):(check.storeCapacity))
                    if ((space + reserve + (this.carryCapacity * room.memory.config.carrierOffset)) < checkCapacity){
                        let check1 = container[i];
                        let check2 = container[container.length - 1]
                        let check1space = (check1.structureType == STRUCTURE_STORAGE ? ((check1.storeCapacity*0.5) - check1.store[RESOURCE_ENERGY]):
                                                                                   (check1.storeCapacity - check1.store[RESOURCE_ENERGY]));
                        let check2space = (check2.structureType == STRUCTURE_STORAGE ? ((check2.storeCapacity*0.5) - check2.store[RESOURCE_ENERGY]):
                                                                                   (check2.storeCapacity - check2.store[RESOURCE_ENERGY]));
                        if ((check1space + this.carryCapacity) < check2space){
                            room.memory.containers[id].reserved += this.carryCapacity;
                            return container[i].id;
                        }
                    }
                }
            }
        }
    }
    if (this.memory.carrying){
        let storageobj = room.storage
        if (storageobj){
            container = _.filter(container, (struct) => (!((struct.structureType == STRUCTURE_LINK) && (storageobj.pos.getRangeTo(Game.structures[struct.id]) < 3))));
        }
        container = _.filter(container, (struct) => (!((struct.structureType == STRUCTURE_LINK) && (struct.energy > 0) && (struct.cooldown > 0))))
        let check = container[container.length - 1];
        let space = ((check.structureType == STRUCTURE_STORAGE) ? ((check.storeCapacity*0.5) - check.store[RESOURCE_ENERGY]):
                    ((check.structureType == STRUCTURE_LINK) ?     (check.energyCapacity - check.energy):
                                                                   (check.storeCapacity - check.store[RESOURCE_ENERGY])));
        if (space < this.carryCapacity) {task = 0}
        else {task = check;}
        }
    if (task){return task.id;}
    else {return 0;}
}