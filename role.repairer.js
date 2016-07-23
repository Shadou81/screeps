"use strict";

Creep.prototype.repairerTick = function(roomObjects){
    if (this.spawning){return}
    let taskmem = this.memory.task;
    let containermem = this.memory.container;
    let room = Game.rooms[this.memory.originroom];
    if((this.memory.repairing == undefined) && (this.carry.energy == 0)) {
        this.memory.repairing = false;
        
    }
    if(!this.memory.repairing && (this.carry.energy == this.carryCapacity)) {
        this.memory.repairing = true;
        this.memory.overhalf = true;
        this.memory.container = 0;
    }
    if (taskmem){
        let task = Game.getObjectById(taskmem);
        if (!task){
            task = 0
            this.memory.task = 0
        }
        if(task.hits == task.hitsMax) {
            taskmem = this.getRepairerTask(roomObjects);
            this.memory.task = taskmem;
        }
    }
    if (!taskmem){
        this.memory.repairing = true
        taskmem = this.getRepairerTask(roomObjects);
        this.memory.task = taskmem;
    }
    if (taskmem){
        if(this.memory.repairing) {
            let task = Game.getObjectById(taskmem)
            let check = this.repair(task);
            switch (check) {
                case OK: break;
                case ERR_NOT_IN_RANGE: this.moveTo(task); break;
                case ERR_NOT_ENOUGH_RESOURCES: this.memory.repairing = false; break;
                case ERR_INVALID_TARGET: this.memory.task = 0; break;
            }
            if (this.memory.overhalf == true) {
                if (this.carry.energy <= (this.carryCapacity * 0.5)) {
                    this.memory.task = 0
                        taskmem = this.getRepairerTask(roomObjects);
                        this.memory.task = taskmem;
                        this.memory.overhalf = false;
                }
            }
        }
        else {
            if (!this.memory.container){
                containermem = this.getRepairerTask(roomObjects);
                this.memory.container = containermem
            }
            containermem = this.memory.container;
            if (containermem){
                let task = Game.getObjectById(containermem)
                let check = this.withdraw(task, RESOURCE_ENERGY);
                switch (check) {
                    case ERR_NOT_IN_RANGE: this.moveTo(task); break;
                    case ERR_FULL: 
                        this.memory.repairing = true
                        this.memory.overhalf = true
                        this.memory.container = 0
                        break;
                    case OK: this.memory.container = 0; break
                    case ERR_NOT_ENOUGH_RESOURCES: this.memory.container = this.getRepairerTask(roomObjects); break;
                }
            }
            else {
                if (!this.memory.rally){
                    let flagname = ('Rally' + room.name)
                    this.memory.rally = flagname;
                }
                let flagname = this.memory.rally;
                let rally = Game.flags[flagname];
                if (this.pos.getRangeTo(rally) > 2){this.moveTo(rally);}
            }
        }
    }
    else {
        if (!this.memory.rally){
            let flagname = ('Rally' + room.name)
            this.memory.rally = flagname;
        }
        let flagname = this.memory.rally;
        let rally = Game.flags[flagname];
        if (this.pos.getRangeTo(rally) > 2){this.moveTo(rally);}
    }
}
    
    
Creep.prototype.getRepairerTask = function(roomObjects){
    let room = Game.rooms[this.memory.originroom];
    let mypos = this.pos;
    let task;
    if (this.memory.repairing) {
        let tasklist = room.getStructureList(roomObjects, 'repair');
        if (tasklist){
            tasklist = _.sortBy(tasklist, function(struct) {return (struct.pos.getRangeTo(mypos))});
            tasklist = _.sortBy(tasklist, function(struct) {return (struct.hits)});
            for (let name in room.memory.creeps){
                let creepcheck = Game.creeps[name];
                for (let i=(tasklist.length - 1); i>=0; i--){
                    if ((creepcheck.memory.task == tasklist[i].id) && (creepcheck.memory.role == 'repairer')) {
                        tasklist.splice(i, 1);
                    }
                }
            }
            task = tasklist[0]
        }
    }
    if (!this.memory.repairing){
        let tasklist = room.getStructureList(roomObjects, 'energy');
        tasklist = _.filter(tasklist, (struct) => ((struct.structureType == STRUCTURE_LINK) ? (struct.energyCapacity >= this.carryCapacity):
                                                                                             (struct.store[RESOURCE_ENERGY] >= this.carryCapacity)))
        task = this.pos.findClosestByRange(tasklist);
    }
    if (task){return task.id;}
    else {return 0;}   
    
}