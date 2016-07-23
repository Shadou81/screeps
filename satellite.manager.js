"use strict";

Room.prototype.addSatellite = function(flag){
        
    let satelliteName = flag.pos.roomName;
    if (Memory.MyOwnedRooms[this.name].satellites[satelliteName] == undefined){
        let satellite = Game.rooms[satelliteName]
        Memory.MyOwnedRooms[this.name].satellites[satelliteName] = satellite.controller.id;
        let sources = satellite.find(FIND_SOURCES);
        this.memory.sources = this.memory.sources.concat(sources);
        for (let i=(this.memory.sources.length-(sources.length)); i<this.memory.sources.length; i++){
            this.memory.sources[i].harvesters = []
        }
        flag.remove()
    }
}

Room.prototype.removeSatellite = function(satelliteName){
        
    for (let satellite in Memory.MyOwnedRooms[this.name].satellites){
        if (satellite == satelliteName){
            let sources = this.memory.sources
            for (let i=(sources.length - 1); i >= 0; i--){
                if (sources[i].room.name == satelliteName){
                    this.memory.sources.splice(i, 1)
                }
            }
            let ownedMemory = Memory.MyOwnedRooms[this.name].satellites;
            delete ownedMemory[satelliteName]
        }
    }
}

Room.prototype.defendSatellites = function(roomObjects){
    let hostiles = this.getHostiles(roomObjects);
    if (hostiles.length > 0){
        for (let satelliteName in MemoryMyOwnedRooms[this.name].satellites){
            for (let i=0; i<hostiles.length; i++){
                if ((hostiles[i].owner == 'Invader') && (hostiles[i].room.name == satelliteName)){
                    let satellitesearch = _.filter(this.memory.creeps, (creep) => ((creep.role == 'satellitedefender') && (creep.task == satelliteName)));
                    if (satellitesearch == 0){
                        let satellitedefenderbody = [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,
                                                     MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK]
                        this.queueSpawn('satellitedefender', 3, satelliteName, satellitedefenderbody);
                    }
                }
            }
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
                let place = new RoomPosition(25,25,satelliteName);
                if (explorer.length < 1){
                    this.queueSpawn('explorer', 5, place, [MOVE])
                }
            }
        }
        if (flag.name == (this.name + '-')){
            this.removeSatellite(flag.pos.roomName);
            flag.remove()
        }
        if (flag.name == (this.name + 'claim')){
            if (Memory.ClaimTargets[this.name] == undefined){
                Memory.ClaimTargets[this.name] = flag.pos.roomName;
            }
        }
    }
}

Room.prototype.manageClaims = function(){
        
    for (let target in Memory.ClaimTargets){
        let targetroom = Game.rooms[target];
        let sourceroom = Game.rooms[Memory.ClaimTargets[target].claimer];
        let flag = Game.rooms[sourceroom.name + 'claim'];
        if (!targetroom){
            var explorer = _.filter(this.memory.creeps, (creep) => (creep.role == 'explorer') && (creep.task.roomName == flag.pos.roomName));
            let place = new RoomPosition(25,25,satelliteName);
            if (explorer.length < 1){
                this.queueSpawn('explorer', 5, place, [MOVE])
            }
        }
        if (targetroom){
            if (!targetroom.controller.my){
                if (targetroom.controller.reservation){
                    if (targetroom.controller.reservation.username == 'Shadou'){
                        var claimer = _.filter(this.memory.creeps, (creep) => (creep.role == 'claimer') && (creep.memory.task == flag.pos.roomName));
                        if (claimer.length < 1){
                            this.queuespawn('claimer', 5, flag.pos.roomName, [CLAIM,MOVE])
                        }
                    }
                }
                else{
                    if (!targetroom.controller.owner || 
                    ((targetroom.controller.level == 1) && (targetroom.ticksToDowngrade < 200))){
                        var claimer = _.filter(this.memory.creeps, (creep) => (creep.role == 'claimer') && (creep.memory.task == flag.pos.roomName));
                        if (claimer.length < 1){
                            this.queuespawn('claimer', 5, flag.pos.roomName, [CLAIM,MOVE])
                        }                    }
                }
            }
            else {
                this.removeSatellite(targetroom.name)
                delete Memory.ClaimTargets[this.name];
                flag.remove()
            }
        }
    }
}