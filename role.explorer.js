"use strict";

Creep.prototype.explorerTick = function(roomObjects) {
    if (this.spawning){return}
        
    let place = this.memory.task
    let task = new RoomPosition(place.x, place.y, place.roomName)
        
    if (this.pos.getRangeTo(task) > 1){
        this.moveTo(task, {reusePath: 20});
    }
}