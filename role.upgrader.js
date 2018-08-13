"use strict";

Creep.prototype.upgraderTick = function(roomObjects) {
    if (this.spawning){return;}
    let taskmem = (this.memory.upgrading ? this.memory.task : this.memory.container)
    let room = Game.rooms[this.memory.originroom];
    if((!this.memory.upgrading) && (this.carry.energy == this.carryCapacity)) {
        this.memory.upgrading = true;
        taskmem = this.getUpgraderTask(roomObjects);
        this.memory.task = taskmem;
    }
    if (this.memory.upgrading && (this.carry.energy == 0)){
        this.memory.upgrading = false;
        taskmem = this.getUpgraderTask(roomObjects);
        this.memory.container = taskmem;
    }
    if (!taskmem && this.memory.upgrading){
        taskmem = this.getUpgraderTask(roomObjects);
        this.memory.task = taskmem;
    }
    if (!taskmem && !this.memory.upgrading){
        taskmem = this.getUpgraderTask(roomObjects);
        this.memory.container = taskmem;
    }
    if (taskmem) {
        let task = Game.getObjectById(taskmem)
        if(this.memory.upgrading){
            var check = this.upgradeController(task);
            switch (check) {
                case OK: 
                    if (this.pos.getRangeTo(room.controller) > 2){
                        this.travelTo(room.controller, {range: 2});
                    }
                    break;
                case ERR_NOT_IN_RANGE: this.travelTo(task); break;
                case ERR_NOT_ENOUGH_RESOURCES: 
                    this.memory.upgrading = false; 
                    break;
                case ERR_INVALID_TARGET: this.memory.task = 0; break;
            }
        }
        if(!this.memory.upgrading){
            if (task){
                var check = this.withdraw(task, RESOURCE_ENERGY);
                switch (check) {
                    case ERR_NOT_IN_RANGE: this.travelTo(task); break;
                    case OK:
                    case ERR_NOT_ENOUGH_RESOURCES: 
                        this.memory.container = 0; 
                        break;
                }
            }
        }
    }
}
Creep.prototype.getUpgraderTask = function(roomObjects){
    let room = Game.rooms[this.memory.originroom];
    let tasklist;
    if (this.memory.upgrading){
        return room.controller.id
    }
    if (!this.memory.upgrading){
        tasklist = room.getStructureList(roomObjects, 'energy');
        tasklist = _.filter(tasklist, (struct) => (struct.structureType != STRUCTURE_LINK))
        tasklist = _.filter(tasklist, (struct) => (struct.store[RESOURCE_ENERGY] >= this.carryCapacity));
    }
    let task = this.pos.findClosestByRange(tasklist);
    if (task){return task.id;}
    else {return 0;}
}