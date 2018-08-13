"use strict";

Creep.prototype.smallharvesterTick = function(roomObjects) {
    try {this.harvesterTick(roomObjects);}
    catch (err) {
        require('role.harvester');
        this.harvesterTick(roomObjects);
    }
}