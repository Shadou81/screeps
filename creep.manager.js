"use strict";

Creep.prototype.Tick = function(roomObjects) {
    let role = this.memory.role;
    try {this[role + 'Tick'](roomObjects);}
    catch (err) {
        require('role.' + role);
        this[role + 'Tick'](roomObjects);
    }
}
