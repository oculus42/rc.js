// http://jsperf.com/rc-rotate-tests/5
var rowData = [], rowData2 = [], i, j, ob;

for (i=0; i < 1e3; i++) {
	ob = {
		id: Math.floor(Math.random() * 1e7),
		age: Math.floor(Math.random() * 100),
		value: Math.floor(Math.random() * 1e4) / 100
	}
	rowData.push(ob);
	
	ob2 = {
		id: Math.floor(Math.random() * 1e7),
		age: Math.floor(Math.random() * 100),
		value: Math.floor(Math.random() * 1e4) / 100
	}
	rowData2.push(ob2);
}

var Opt = Object.prototype.toString,
	rotate_v05 =  function(arr, result, limited, softFail) {
		var obj, i, att;
	
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
	},
	
	rotate_fixed =  function(arr, result, limited, softFail) {
		var len, obj, i, att;
		
		// Not an array? Send it back.
		if ( Opt.call(arr) !== '[object Array]' ) {
			throw new TypeError("RC: Argument is not an array");
		}
		
		len = arr.length;
	
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
	
		for ( i = len; i; ) {
			i--;
			obj = arr[i];
	
			// All variables submit to for-in loops
			for (att in obj) {
				if ( obj.hasOwnProperty(att) ) {
					if ( result[att] === undefined ) {
						if ( limited ) {
							continue;
						} else {
							result[att] = new Array(len);
						}
					}
					result[att][i] = obj[att];
				}
			}
		}
		return result;
	};


