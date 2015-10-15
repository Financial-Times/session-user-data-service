"use strict";

var isUuid = function (id) {
	var uuidMatch = id.match(new RegExp("^([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})$", "i"));
    if (uuidMatch && uuidMatch[1]) {
        return uuidMatch[1];
    }

    return false;
};
module.exports = isUuid;
