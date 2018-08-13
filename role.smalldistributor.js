"use strict";

Creep.prototype.smalldistributorTick = function(roomObjects) {
    try {this.distributorTick(roomObjects);}
    catch (err) {
        require('role.distributor');
        this.distributorTick(roomObjects);
    }
}