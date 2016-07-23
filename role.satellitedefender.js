"use strict";

Creep.prototype.satellitedefenderTick = function(roomObjects){
    
    if (this.spawning){return;}
    let room = this.room;
    let targetpos = new RoomPosition(25,25,this.memory.task);
    let hostiles = room.getHostiles(roomObjects)
    for (let i=0; i=hostiles.length; i++){
        if ((hostiles[i].owner == "Invader") && (hostiles[i].room.name == this.memory.task)){
            if (this.attack(hostiles[i]) == ERR_NOT_IN_RANGE){
                creep.moveTo(hostiles[i]);
            }
        }
        else{
            this.moveTo(targetpos)
        }
    }
}