"use strict";

Creep.prototype.reserverTick = function(creep) {
    if (creep.spawning){return}
    let taskmem = this.memory.task;
    let task = Game.getObjectById(taskmem);
    if (task){
        if(this.reserveController(task) == ERR_NOT_IN_RANGE){
            this.moveTo(task, {reusePath: 20})
        }
    }
}