"use strict";

Creep.prototype.builderTick = function(roomObjects){
    if (this.spawning){return}
    let room = Game.rooms[this.memory.originroom];
    let taskmem;
    if (!room.memory.config.new){
        taskmem = (this.memory.building ? this.memory.task : this.memory.container)
    }
    else{
        taskmem = this.memory.task;
    }
    let task;
    if(this.memory.building == undefined) {
        this.memory.building = false;
    }
    if((!this.memory.building) && (this.carry.energy == this.carryCapacity)){
        this.memory.building = true;
        this.memory.container = 0
    }
    if (room.memory.config.new == true){
        if (!taskmem) {
            this.memory.building = true;
            taskmem = this.getBuilderTask(roomObjects);
        }
        this.memory.task = taskmem
        task = Game.getObjectById(taskmem)
        if (this.memory.building){
            let check = this.build(task);
            switch (check) {
                case OK: break;
                case ERR_NOT_IN_RANGE: this.moveTo(task); break;
                case ERR_NOT_ENOUGH_RESOURCES: 
                    this.memory.building = false
                    break;
                case ERR_INVALID_TARGET: 
                    this.memory.task = this.getBuilderTask(roomObjects); 
                    break;
            }
            if (this.pos.getRangeTo(task) > 0){
                this.moveTo(task)
            }
        }
        if (!this.memory.building){
            let source
            if (!this.memory.source) {
                source = task.pos.findClosestByRange(FIND_SOURCES); 
                this.memory.source = source.id;
            }
            source = Game.getObjectById(this.memory.source)
            let check = this.harvest(source);
            switch (check) {
                case OK: break;
                case ERR_NOT_IN_RANGE: this.moveTo(task); break;
                case ERR_INVALID_TARGET: this.memory.task = 0; this.memory.source = 0; break;
            }
        }
    }
    else{
        if (!taskmem){
            this.memory.building = true;
            taskmem = this.getBuilderTask(roomObjects);
            this.memory.task = taskmem
        }
        if (taskmem) {
            task = Game.getObjectById(taskmem)
            if(this.memory.building){
                let check = this.build(task);
                switch (check) {
                    case OK: break;
                    case ERR_NOT_IN_RANGE: this.moveTo(task); break;
                    case ERR_NOT_ENOUGH_RESOURCES: this.memory.building = false; break;
                    case ERR_INVALID_TARGET: this.memory.task = 0; break;
                }
            }
            if (!this.memory.building){
                if (!this.memory.container){
                    this.memory.container = this.getBuilderTask(roomObjects);
                }
                if (this.memory.container){
                    task = Game.getObjectById(this.memory.container);
                    let check = this.withdraw(task, RESOURCE_ENERGY);
                    switch (check) {
                        case ERR_NOT_IN_RANGE: this.moveTo(task); break;
                        case ERR_FULL: 
                            this.memory.building = true;
                            this.memory.container = 0
                            break;
                        case OK: this.memory.container = 0;
                        case ERR_NOT_ENOUGH_RESOURCES: this.memory.container = this.getBuilderTask(roomObjects);; break;
                    }
                }
                else {
                    if (!this.memory.rally){
                        let flagname = ('Rally' + this.memory.originroom)
                        this.memory.rally = flagname;
                    }
                    let rally = Game.flags[this.memory.rally]
                    if (this.pos.getRangeTo(rally) > 2){
                    this.moveTo(rally);
                    }
                }
            }
        }
        else {
            if (!this.memory.rally){
                let flagname = ('Rally' + this.memory.originroom)
                this.memory.rally = flagname
            }
            let rally = Game.flags[this.memory.rally]
            if (this.pos.getRangeTo(rally) > 2){
            this.moveTo(rally)
            }
        }
    }
}


Creep.prototype.getBuilderTask = function(roomObjects){
    let room = Game.rooms[this.memory.originroom];
    if (this.memory.building){
        var tasklist = room.getConstructionsList(roomObjects);
        if (tasklist.length > 0) {
            for (let name in room.memory.creeps){
                let creepcheck = Game.creeps[name];
                for (let i=(tasklist.length - 1); i>=0; i--){
                    if ((tasklist[i].structureType != STRUCTURE_TOWER) && (creepcheck.memory.task == tasklist[i].id) && (creepcheck.memory.role == 'builder')) {
                        tasklist.splice(i, 1);
                    }
                }
            }
        }
    }
    if (!this.memory.building){
        var tasklist = room.getStructureList(roomObjects, 'energy');
        tasklist = _.filter(tasklist, (struct) => (((struct.structureType == STRUCTURE_LINK) ? (struct.energy >= this.carryCapacity):
                                                                                               (struct.store[RESOURCE_ENERGY] >= this.carryCapacity))))
        if (tasklist.length > 0){
            let roomEnergy = _.sum(tasklist, (contain) => ((contain.structureType == STRUCTURE_LINK) ? (contain.energy):(contain.store[RESOURCE_ENERGY])));
            if (roomEnergy < room.memory.config.reserve){
                tasklist = null;
            }
        }
    }
    let task = this.pos.findClosestByRange(tasklist);
    if (!task){
        if (tasklist.length > 0 && this.memory.building){
            task = tasklist[0]
        }
    }
    if (task){return task.id;}
    else {return 0;}

}