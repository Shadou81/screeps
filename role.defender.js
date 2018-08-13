"use strict"
    
Creep.prototype.defenderTick = function(roomObjects){
        
    if (creep.spawning){return}
    roomName = this.memory.originroom;
    room = Game.rooms[roomName];
        
    hostiles = taskManager.getHostiles(roomName);
        
    if (hostiles.length < 0){
        nearestHostile = this.pos.findClosestByRange(hostiles);
        hostileRange = this.pos.getRangeTo(nearestHostile);
        if (hostileRange > 3){
            this.travelTo(nearestHostile);
        }
        if (hostileRange <= 3){
            this.rangedAttack(nearestHostile);
        }
        if (hostileRange < 3){
            let path = PathFinder.search(this, nearesthostile, {flee: true});
            this.moveByPath(path);
        }
    }
    
}