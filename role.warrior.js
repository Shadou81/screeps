Creep.prototype.warriorTick = function(roomObjects){

    if (this.spawning){return}
    room = this.room;
    
    let hostiles = room.getHostiles(roomObjects);
    let nearestHostile = this.pos.findClosestByRange(hostiles);
    if (hostiles.length > 0 && (this.pos.getRangeTo(nearestHostile) < 5)){
        if (this.attack(nearestHostile) == ERR_NOT_IN_RANGE){
            if (this.hits > (this.hitsMax * 0.5)){
                this.moveTo(nearestHostile);
            }
        }
    }
    else {
        if (this.getActiveBodyparts(HEAL) > 0){
            if (this.hits < this.hitsMax){
                this.heal(this);
            }
        }
        let flagName = this.memory.task;
        let flag = Game.flags[flagName];
        this.moveTo(flag)
    }
    
}