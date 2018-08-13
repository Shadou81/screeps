"use strict";

Room.prototype.warTick = function(roomObjects){
    
    let warriorflag = Game.flags[this.name + 'warrior'];
    let archerflag = Game.flags[this.name + 'archer'];
    let healerflag = Game.flags[this.name + 'healer'];
    let sapperflag = Game.flags[this.name + 'sapper'];
    let soakerflag = Game.flags[this.name + 'soaker'];

    if (warriorflag){
        var warriors = _.filter(this.memory.creeps, (creep) => (creep.role == 'warrior'));
        this.memory.config.warriorsrequest = this.memory.config.warriorsrequest || 0;
        if (warriors.length < this.memory.config.warriorsrequest){
            let warriorbody = [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,
                                MOVE,MOVE,MOVE,MOVE,MOVE];
            this.queueSpawn('warrior', 15, warriorflag.name, warriorbody);
        }
    }
    if (archerflag){
        
        
    }
    if (soakerflag){
        var soakers = _.filter(this.memory.creeps, (creep) => (creep.role == 'soaker'));
        this.memory.config.soakersrequest = this.memory.config.soakersrequest || 0;
        if (soakers.length < this.memory.config.soakersrequest){
            let soakerbody = [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,
                          TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,
                          TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,
                          MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,
                          MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
            this.queueSpawn('soaker', 15, soakerflag.name, soakerbody);
        }
    }
    if (healerflag){
        var healers = _.filter(this.memory.creeps, (creep) => (creep.role == 'healer'));
        this.memory.config.healersrequest = this.memory.config.healersrequest || 0;
        if (healers.length < this.memory.config.healersrequest){
            let healerbody = [HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,
                              HEAL,HEAL,HEAL,HEAL,HEAL,MOVE,MOVE,MOVE,MOVE,MOVE,
                              MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
            this.queueSpawn('healer', 15, healerflag.name, healerbody);
        }
    }
    if (sapperflag){
        var sappers = _.filter(this.memory.creeps, (creep) => (creep.role == 'sapper'));
        this.memory.config.sappersrequest = this.memory.config.sappersrequest || 0;
        if (sappers.length < this.memory.config.sappersrequest){
            let sapperbody = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,
                              WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK]
            this.queueSpawn('sapper', 15, sapperflag.name, sapperbody);
        }
    }
    /** let hostiles = this.getHostiles(this.name);
    if (hostiles.length > 0){
        var defenders = _.filter(room.memory.creeps, (creep) => (creep.role == 'defender'));
        if (defenders.length < hostiles.length){
            defenderbody = [TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,MOVE,MOVE,MOVE]
            let order = new spawnManager.creepOrder(room.name, 'defender', 12, null, defenderbody);
            spawnManager.queueSpawn(order);
        }
    }**/
    
}