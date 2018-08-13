"use strict";

Room.prototype.addSatellite = function(flag){
        
    let satelliteName = flag.pos.roomName;
    if (Memory.MyOwnedRooms[this.name].satellites[satelliteName] == undefined){
        let satellite = Game.rooms[satelliteName]
        Memory.MyOwnedRooms[this.name].satellites[satelliteName] = satellite.controller.id;
        let sources = satellite.find(FIND_SOURCES);
        for (let i=this.memory.sources.length; i<this.memory.sources.length + sources.length; i++){
            this.memory.sources[i] = {id: sources.id, pos: sources.pos};
            this.memory.sources[i].harvesters = [];
            this.memory.sources[i].harvestRoom = 0;
            
            var sourceTerrain = [];
            sourceTerrain = this.lookForAtArea(
            LOOK_TERRAIN, 
            (this.memory.sources[i].pos.y - 1),
            (this.memory.sources[i].pos.x - 1),
            (this.memory.sources[i].pos.y + 1),
            (this.memory.sources[i].pos.x + 1),
            true
            );
            for (let j=0; j<sourceTerrain.length; j++){
                if (sourceTerrain[j].terrain != 'wall'){
                    this.memory.sources[i].harvestRoom++;
                }
            }
        }
        flag.remove()
    }
}

Room.prototype.removeSatellite = function(satelliteName){
        
    for (satellite in Memory.MyOwnedRooms[this.name].satellites){
        if (satellite == satelliteName){
            let sources = this.memory.sources
            for (let i=(sources.length - 1); i >= 0; i--){
                if (sources[i].pos.roomName == satelliteName){
                    this.memory.sources.splice(i, 1)
                }
            }
            let ownedMemory = Memory.MyOwnedRooms[this.name].satellites;
            delete ownedMemory[satelliteName]
        }
    }
}

Room.prototype.manageSatellites = function(){
        
    for (let satelliteName in Memory.MyOwnedRooms[this.name].satellites){
        let satellite = Game.rooms[satelliteName]
        if (!satellite){
            let place = new RoomPosition(25,25,satelliteName);
            var explorer = _.filter(this.memory.creeps, (creep) => (creep.role == 'explorer') && (creep.task.roomName == satelliteName));
            if (explorer.length < 1){
                this.queueSpawn('explorer', 5, place, [MOVE])
            }
        }
        if (satellite){
            let controller = satellite.controller
            if ((!controller.reservation) || (controller.reservation.ticksToEnd < 2000)){
                let reservername = []
                for (let name in this.memory.creeps){
                    let checkmemory = this.memory.creeps[name]
                    if ((checkmemory.role == 'reserver') && (checkmemory.task == controller.id)){
                        reservername.push(name);
                    }
                }
                let reserver = Game.creeps[reservername[0]]
                if ((reservername.length < this.memory.config.creepcounts.reservers) || 
                ((reserver.ticksToLive < 100) && (reservername.length < (this.memory.config.reservers + 1)))){
                    this.queueSpawn('reserver', 8, controller.id)
                }
            }
        }
    }
}

Room.prototype.responseToFlags = function(){
        
    for (let flagname in Game.flags){
        let flag = Game.flags[flagname]
        let flagroom = Game.rooms[flag.pos.roomName]
        if (flag.name == (this.name + '+')){
            if (Game.rooms[flag.pos.roomName]){
                if (!flagroom.controller.my){
                    this.addSatellite(flag);
                }
                if (flagroom.controller.my){
                        flag.remove()
                }
            }
            else{
                var explorer = _.filter(this.memory.creeps, (creep) => (creep.role == 'explorer') && (creep.task.roomName == flag.pos.roomName));
                if (explorer.length < 1){
                    this.queueSpawn('explorer', 5, flag.pos, [MOVE])
                }
            }
        }
        if (flag.name == (this.name + '-')){
            this.removeSatellite(flag.pos.roomName);
        }
        if (flag.name == (this.name + 'claim')){
            if (Memory.ClaimTargets[flag.pos.roomName] == undefined){
                Memory.ClaimTargets[flag.pos.roomName] = {}
                Memory.ClaimTargets[flag.pos.roomName].claimer = this.name;
            }
        }
    }
}

/*manageClaims: function(){
        
        for (let target in Memory.ClaimTargets){
            let targetroom = Game.rooms[target];
            let sourceroom = Game.rooms[Memory.ClaimTargets[target].claimer];
            flag = Game.rooms[sourceroom.name + 'claim'];
            if (!targetroom){

                roomManager.sendExplorer(sourceroom, target);
            }
            if (targetroom){
                if (!targetroom.controller.my){
                    if (targetroom.controller.reservation){
                        if (targetroom.controller.reservation.username == 'Shadou'){
                            roomManager.sendClaimer(sourceroom, targetroom)
                        }
                        
                    }
                    else{
                        if (!targetroom.controller.owner || 
                        ((targetroom.controller.level == 1) && (targetroom.ticksToDowngradenumber < 200))){
                            roomManager.sendClaimer(sourceroom, targetroom);
                        }
                    }
                }
                else {
                    roomManager.removeSatellite(targetroom.name)
                    delete Memory.ClaimTargets[target];
                    flag.remove()
                }
            }
        }
    },*/