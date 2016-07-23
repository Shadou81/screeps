"use strict";
Creep.prototype.healerTick = function(roomObjects){

    if (this.spawning){return}
    this.memory.waypoint = this.memory.waypoint || (this.memory.originroom + 'waypoint')
    this.memory.reachedwaypoint = this.memory.reachedwaypoint || false;
    let waypoint = Game.flags[this.memory.waypoint]
    if ((!this.memory.reachedwaypoint) && (this.pos.getRangeTo(waypoint) > 2)){
        this.moveTo(waypoint);
        return
    }
    else {
        this.memory.reachedwaypoint = true;
    }
    
    let flagname = (this.memory.task)
    let flag = Game.flags[flagname]
    
    if (this.pos.getRangeTo(flag) <= 4){
        let injured = this.room.getInjured(roomObjects)
        let closestinjured = this.pos.findClosestByRange(injured);
        if (injured.length > 0){
            if (closestinjured.pos.getRangeTo(flag) <= 4){
                let check = this.heal(closestinjured);
                switch (check){
                    case OK:
                        return;
                    case ERR_NOT_IN_RANGE:
                        if (flag.pos.getRangeTo(closestinjured) <= 4){
                            this.moveTo(closestinjured, {reusePath:0});
                            if (this.pos.getRangeTo(closestinjured) > 1){
                                this.rangedHeal(closestinjured);
                            }
                            else{
                                this.heal(closestinjured);
                            }
                            return
                        }
                }
            }
        }
        else {
            if (this.pos.getRangeTo(flag) > 3){
                this.moveTo(flag, {reusePath: 5});
            }
        }
    }
    else {
        this.moveTo(flag, {reusePath: 20});
    }
}