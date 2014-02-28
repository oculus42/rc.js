// http://jsperf.com/rc-rotate-tests/2
var rowData = [],i, j, ob;

for (i=0; i < 1e3; i++) {
	ob = {
		id: Math.floor(Math.random() * 1e7),
		age: Math.floor(Math.random() * 100),
		value: Math.floor(Math.random() * 1e4) / 100
	}
	rowData.push(ob);
}

var Opt = Object.prototype.toString,
	rotate_base =  function(arr, result, limited, softFail) {
		var obj, len, i, att, has;
	
		// Not an array? Send it back.
		if ( Opt.call(arr) !== '[object Array]' ) {
			throw new TypeError("RC: Argument is not an array");
		}
	
		// Clean truthy/falsy values & undefined
		limited = !!limited;
		softFail = !!softFail;
	
		if ( !!result || typeof result !== 'object' ) {
			if ( limited ) {
				throw new TypeError("RC: Must pass a result object when 'limited' is true");
			} else {
				result = {};
			}
		}
	
		len = arr.length;
	
		for ( i = 0; i < len; i++ ) {
			obj = arr[i];
	
			if (typeof obj !== "object") {
				if ( !softFail ) {
					throw new TypeError("RC: Nested element is not an object");
				}
				// Otherwise skip this loop
			} else {
				for (att in obj) {
					if ( obj.hasOwnProperty(att) ) {
						has = result.hasOwnProperty(att);
	
						if ( !has ) {
							if ( limited ) {
								continue;
							} else {
								result[att] = [];
							}
						}
						result[att][i] = obj[att];
					}
				}
			}
		}
		return result;
	},
	rotate_backwards =  function(arr, result, limited, softFail) {
		var obj, i, att, has;
	
		// Not an array? Send it back.
		if ( Opt.call(arr) !== '[object Array]' ) {
			throw new TypeError("RC: Argument is not an array");
		}
	
		// Clean truthy/falsy values & undefined
		limited = !!limited;
		softFail = !!softFail;
	
		if ( !!result || typeof result !== 'object' ) {
			if ( limited ) {
				throw new TypeError("RC: Must pass a result object when 'limited' is true");
			} else {
				result = {};
			}
		}
	
		for ( i = arr.length; i; ) {
			i--;
			obj = arr[i];
	
			if (typeof obj !== "object") {
				if ( !softFail ) {
					throw new TypeError("RC: Nested element is not an object");
				}
				// Otherwise skip this loop
			} else {
				for (att in obj) {
					if ( obj.hasOwnProperty(att) ) {
						if ( !result.hasOwnProperty(att) ) {
							if ( limited ) {
								continue;
							} else {
								result[att] = [];
							}
						}
						result[att][i] = obj[att];
					}
				}
			}
		}
		return result;
	},
	
	rotate_undef =  function(arr, result, limited, softFail) {
		var obj, i, att, has;
	
		// Not an array? Send it back.
		if ( Opt.call(arr) !== '[object Array]' ) {
			throw new TypeError("RC: Argument is not an array");
		}
	
		// Clean truthy/falsy values & undefined
		limited = !!limited;
		softFail = !!softFail;
	
		if ( !!result || typeof result !== 'object' ) {
			if ( limited ) {
				throw new TypeError("RC: Must pass a result object when 'limited' is true");
			} else {
				result = {};
			}
		}
	
		for ( i = arr.length; i; ) {
			i--;
			obj = arr[i];
	
			if (typeof obj !== "object") {
				if ( !softFail ) {
					throw new TypeError("RC: Nested element is not an object");
				}
				// Otherwise skip this loop
			} else {
				for (att in obj) {
					if ( obj.hasOwnProperty(att) ) {
						if ( result[att] === undefined ) {
							if ( limited ) {
								continue;
							} else {
								result[att] = [];
							}
						}
						result[att][i] = obj[att];
					}
				}
			}
		}
		return result;
	},
	
	rotate_obj =  function(arr, result, limited, softFail) {
		var obj, i, att, has;
	
		// Not an array? Send it back.
		if ( Opt.call(arr) !== '[object Array]' ) {
			throw new TypeError("RC: Argument is not an array");
		}
	
		// Clean truthy/falsy values & undefined
		limited = !!limited;
		softFail = !!softFail;
	
		if ( !!result || typeof result !== 'object' ) {
			if ( limited ) {
				throw new TypeError("RC: Must pass a result object when 'limited' is true");
			} else {
				result = {};
			}
		}
	
		for ( i = arr.length; i; ) {
			i--;
			obj = arr[i];
	
			// All variables submit to for-in loops
			for (att in obj) {
				if ( obj.hasOwnProperty(att) ) {
					if ( result[att] === undefined ) {
						if ( limited ) {
							continue;
						} else {
							result[att] = [];
						}
					}
					result[att][i] = obj[att];
				}
			}
		}
		return result;
	};


