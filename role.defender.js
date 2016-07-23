roleDefender = {
    
    Tick: function(creep){
        
        if (creep.spawning){return}
        roomName = creep.memory.originroom;
        room = Game.rooms[roomName];
        
        hostiles = taskManager.getHostiles(roomName);
        
        if (hostiles.length < 0){
            nearestHostile = creep.pos.findClosestByRange(hostiles);
            hostileRange = creep.pos.getRangeTo(nearestHostile);
            if (hostileRange > 3){
                creep.moveTo(nearestHostile);
            }
            if (hostileRange < 3){
                creep.rangedAttack(nearestHostile);
                let path = PathFinder.search(creep, nearesthostile, {flee: true});
                creep.moveByPath(path);
            }
        }
    }
}

module.exports = roleDefender;