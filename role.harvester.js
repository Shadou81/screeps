"use strict";

Creep.prototype.harvesterTick = function(roomObjects) {
    if (this.spawning){return;}
    let room = Game.rooms[this.memory.originroom];
    if (!this.memory.assigned){
        let taskmem = this.getHarvesterTask();
        if (taskmem){
            this.memory.task = taskmem
            this.memory.assigned = true;
        }
    }
    if (this.memory.assigned){
        if (!this.memory.container){
            let containermem = this.getHarvesterContainer(roomObjects)
            if (containermem){
                this.memory.container = containermem;
            }
        }
    }
    let taskmem = this.memory.task;
    if (this.memory.assigned){
        let task = Game.getObjectById(taskmem);
        if (task){
            if (this.memory.container){
                var container = Game.getObjectById(this.memory.container)
            }
            let check = this.harvest(task);
            switch (check){
                case ERR_NOT_IN_RANGE: this.moveTo(task); break;
                case OK:
                    if (container){
                        if (this.pos.getRangeTo(container) > 1){
                            this.moveTo(container);
                        }
                        if (this.memory.linkpresent) {
                            this.transfer(container, RESOURCE_ENERGY)
                            if (container.energy == container.energyCapacity){
                                let target = room.getStructureList(roomObjects, 'storagereceivelink')
                                if ((target) && (container.cooldown == 0) && (target.energy == 0)){
                                    container.transferEnergy(target)
                                }
                            }
                        }
                        else {
                            this.transfer(container, RESOURCE_ENERGY);
                        }
                    }
            }
        }
        else {
            if (!this.memory.rally){
            //Ok, remember that.
                let flagname = ('Rally' + this.memory.originroom)
                this.memory.rally = flagname;
            }
            //Get the flag object.
            let rally = Game.flags[this.memory.rally]
            //Get close.
            if (this.pos.getRangeTo(rally) > 2){
                this.moveTo(rally)
            }
        }
    }
}

Creep.prototype.getHarvesterTask = function() {
    
    let roomName = this.memory.originroom
    let room = Game.rooms[roomName]
    for (let i=0; i<room.memory.sources.length; i++) {
        for (let j=0; j<room.memory.config.creepcounts.maxharvesterpersource; j++) {
            let check = room.memory.sources[i].harvesters[j];
            if (!check){
                let task = room.memory.sources[i].id;
                room.memory.sources[i].harvesters[j] = this.name;
                return task;
            }
        }
    }
}

Creep.prototype.getHarvesterContainer = function(roomObjects) {
    
    let roomName = this.memory.originroom;
    let room = Game.rooms[roomName];
    let sourceid = this.memory.task;
    let source = Game.getObjectById(sourceid) || 0;
    let tasklist = room.getStructureList(roomObjects, 'link');
    let container;
    if (tasklist.length > 0){  
        let nearestlink;
        if (source){
            nearestlink = source.pos.findClosestByRange(tasklist);
        }
        if (nearestlink && source.pos.getRangeTo(nearestlink) == 1){
            container = nearestlink;
            this.memory.linkpresent = true;
        }
        else {
            this.memory.linkpresent = false;
        }
        
    }
    if (source && !this.memory.linkpresent){
        tasklist = room.getStructureList(roomObjects, 'container')
        container = source.pos.findClosestByRange(tasklist);
        if (source.pos.getRangeTo(container) > 1){
            container = 0
        }
    }
    if (container) {return container.id;}
    else {return 0;}
}