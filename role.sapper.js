"use strict";
Creep.prototype.sapperTick = function(roomObjects){
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
    let target = this.memory.task;
    let targetflag = Game.flags[target]
    let attackflagname = (this.memory.originroom + 'attack')
    let attackflag = Game.flags[attackflagname];
    
    if (attackflag){
        let targetroomName = targetflag.pos.roomName;
        let targetroom = Game.rooms[targetroomName];
        let room = attackflag.room;
        if (room){
            let targetstructure = room.lookAt(attackflag.pos)
        
            let attacktarget;
            targetstructure.forEach(function(lookObject) {
                if(lookObject.type == LOOK_STRUCTURES && lookObject[LOOK_STRUCTURES].structureType == STRUCTURE_WALL){
                    attacktarget = lookObject.structure
                }
            });
            if (attacktarget){
                let attackobject = Game.getObjectById(attacktarget.id)
                if (this.dismantle(attackobject) == ERR_NOT_IN_RANGE){
                    this.moveTo(attackobject)
                }
            }
            else {
                this.moveTo(targetflag)
            }
        }
        else {
            this.moveTo(targetflag);
        }
    }
    else if (targetflag){
        let targetroomName = targetflag.pos.roomName;
        let targetroom = Game.rooms[targetroomName];
        let room = this.room
        let spawn = room.find(FIND_HOSTILE_SPAWNS);
        
        let nearesttower = this.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_TOWER);}});
        
        if (nearesttower && (this.dismantle(nearesttower) == ERR_NOT_IN_RANGE)){
            if (this.moveTo(nearesttower) == ERR_NO_PATH){
                let obstructions = room.getStructureList(roomObjects, 'obstructions');
                let mypos = this.pos;
                obstructions = _.filter(obstructions, function(struct) {return (struct.pos.getRangeTo(mypos) < 2)});
                obstructions = _.sortBy(obstructions, function(struct) {return (struct.hits)});
                    if (obstructions.length > 0){
                    let task = Game.getObjectById(obstructions[0].id)
                    if (this.pos.getRangeTo(task)>1){
                        this.moveTo(task);
                    }
                    if (this.pos.getRangeTo(task) == 1){
                        this.dismantle(task)
                    }
                }
            }
        }
        if (!nearesttower && (spawn.length > 0) && (targetflag.pos.roomName == room.name)){
            if (this.dismantle(spawn[0]) == ERR_NOT_IN_RANGE){
                    if (this.moveTo(spawn[0]) == ERR_NO_PATH){
                    let obstructions = room.getStructureList(roomObjects, 'obstructions');
                    let mypos = this.pos;
                    obstructions = _.filter(obstructions, function(struct) {return (struct.pos.getRangeTo(mypos) < 1)});
                    obstructions = _.sortBy(obstructions, function(struct) {return (struct.hits)});
                        if (obstructions.length > 0){
                        let task = Game.getObjectById(obstructions[0].id)
                        if (this.pos.getRangeTo(task)>1){
                            this.moveTo(task);
                        }
                        if (this.pos.getRangeTo(task) == 1){
                            this.dismantle(task)
                        }
                    }
                }
            }
        }
        if (!nearesttower && (spawn.length == 0)) {
            this.moveTo(targetflag)
        }
    }
}
