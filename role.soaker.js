"use strict";

Creep.prototype.soakerTick = function(roomObjects){
    if (this.spawning){return}
    this.memory.waypoint = this.memory.waypoint || (this.memory.originroom + 'waypoint')
    this.memory.reachedwaypoint = this.memory.reachedwaypoint || false;
    let waypoint = Game.flags[this.memory.waypoint]
    if ((!this.memory.reachedwaypoint) && (this.pos.getRangeTo(waypoint) > 2)){
        this.moveTo(waypoint);
        return;
    }
    else {
        this.memory.reachedwaypoint = true;
    }
    let healerflagname = (this.memory.originroom + 'healer');
    let soakerflagname = this.memory.task;
    let healerflag = Game.flags[healerflagname];
    let soakerflag = Game.flags[soakerflagname];
    this.memory.healing = this.memory.healing || false
    
    if (this.hits <= this.hitsMax * 0.60){
        this.memory.healing = true
    }
    if (this.hits == this.hitsMax){
        this.memory.healing = false
    }
    
    if (!this.memory.healing){
        this.moveTo(soakerflag, {reusePath: 20});
    }
    else {
        if (this.pos.getRangeTo(healerflag) > 4)
        this.moveTo(healerflag, {reusePath: 0});
    }
    
}