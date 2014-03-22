/**
 * rc.js - Row/Column Conversions
 * v0.06 - Proxy fixes
 */

(function(root){
	"use strict";

	/**
	 * Create an object and add a .commit() prototype to place the values back into the original.
	 * Useful for moving simple data types around. Objects and arrays will be automatically referenced.
	 * @constructor
	 * @param obj - A columnar object
	 * @param {number} index - The index to convert into a row-based object
	 * @param {Boolean} [clearUndef] - Clear undefined attributes when copying the object.
	 */
	var Proxy = (function() {
			var __obj = [],
				__idx = [],
				__clr = [],
				__this = [],
				guid = 0;
	
		function __getId(proxy) {
			var i = __this.length, pid;
	
			// Most likely to be at the end, so start there
			for (;i;) {
				i--;
				if (__this[i] === proxy) {
					pid = i;
					break;
				}
			}
	
			if (pid === undefined) {
				throw new ReferenceError("Proxy is finalized and cannot be used again.");   
			}
			return pid;
		}
	
		function Proxy(obj, index, clearUndef) {
	
			var att;
	
			// Increment the guid
			++guid;
	
			// Set the private data.
			__obj[guid] = obj;
			__idx[guid] = index;
			__clr[guid] = clearUndef;
			__this[guid] = this;
	
			for ( att in obj ) {
				if ( obj.hasOwnProperty(att) && ( !clearUndef || obj[att][index] !== undefined ) ) {
					this[att] = obj[att][index];
				}
			}
		}
	
		// Defined inside the constructor to give it access to the originating object and parameters
		Proxy.prototype.commit = function(){
			var guid = __getId(this), 
				obj = __obj[guid],
				index = __idx[guid],
				clearUndef = __clr[guid],
				att;
	
			for ( att in this ) {
				if ( att !== '__rcProxyId' && this.hasOwnProperty(att) && ( !clearUndef || this[att] !== undefined ) ) {
					obj[att][index] = this[att];
				}
			}
		};
	
		Proxy.prototype.destroy = function() {
			var guid = __getId(this);
			delete __this[guid];
			delete __obj[guid];
			delete __idx[guid];
			delete __clr[guid];
		};
	
		Proxy.prototype.finalize = function() {
			this.commit();
			this.destroy();
		};
	
		return Proxy;
	})();

	var Opt = Object.prototype.toString,
		self = {
		array: {
			getIndexes: function(array, filter) {
				var indexes = [],
					len = array.length,
					isFn = (typeof filter === 'function'),
					i;
						
				if (isFn) {
					for (i = 0; i < len; i++) {
						if ( filter(i, array[i]) ) {
							indexes.push(i);
						}
					}
				} else {
					for (i = 0; i < len; i++) {
						if ( array[i] === filter ) {
							indexes.push(i);
						}
					}
				}
			},
			getByIndexes: function(array, indexes) {
				var len = indexes.length,
					data = [];

				for (;len;) {
					len--;
					data[len] = array[indexes[len]];
				}
				return data;
			},
			rotate: function(arr, result, limited, softFail) {
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

				i = arr.length;

				for (;i;) {
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
			}
		},
		object: {
			filter: function(obj, field, filter) {
				return self.object.filterMerge(obj, self.object.filterIndexes(obj, field, filter));
			},
			filterIndexes: function(obj, field, filter) {
				var indexes = false;

				if ( obj.hasOwnProperty(field) ) {
					indexes = self.array.getIndexes(obj[field], filter);
				}
				return indexes;
			},
			filterMerge: function(obj, indexes) {
				var result = {},
					att;

				if ( indexes ) {
					for (att in obj) {
						if ( obj.hasOwnProperty(att) ) {
							result[att] = self.array.getByIndexes(obj[att], indexes);
						}
					}
				}
				return result;
			},
			rotate: function(obj, result, clearUndef) {
				var att, i, len = 0;

				// Not an array? Send it back.
				if ( typeof obj !== 'object' ) {
					throw new TypeError("RC: Argument is not an object");
				}

				if ( result === undefined ) {
					result = [];
				} else if ( Object.prototype.toString.call(result) !== '[object Array]' ) {
					throw new TypeError("RC: Result argument is an array");
				}

				// Get the longest length of all properties
				for (att in obj) {
					if ( obj.hasOwnProperty(att) ) {
						len = Math.max(len, att.length);
					}
				}

				for (i = 0; i < len; i++) {
					if ( result[i] === undefined ) {
						result[i] = {};
					} else if ( typeof result[i] !== 'object' ) {
						throw new TypeError("RC: Result contains incorrect type at index " + i);
					}

					for (att in obj) {
						if ( obj.hasOwnProperty(att) && ( !clearUndef || obj[att][i] !== undefined ) ) {
							result[i][att] = obj[att][i];
						}
					}
				}

				return result;
			},
			objFromIndex: function(obj, index, clearUndef) {
				return new Proxy(obj, index, clearUndef);
			},
			proxy: function(obj, index, clearUndef) {
				return new Proxy(obj, index, clearUndef);
			}
		},
		rotate: function(obj) {
			// Generic, which directs to the appropriate array/object rotate
			if (typeof obj !== 'object') throw new TypeError("RC: rotate requires an object or an array");
			if ( Opt.call(obj) === '[object Array]' ) {
				return self.array.rotate.apply(this, arguments);
			} else {
				return self.object.rotate.apply(this, arguments);
			}
		},
		version: 'v0.05'
	};

	root.rc = self;

	// Can we build a chaining mode?
	// Should we move this into the same namespace?
	/**
	 * @constructor
	 * @param obj - A (hopefully) columnar object
	 * @param {Boolean} [clearUndef] - Clear undefined attributes when copying the object.
	 */
	root.RC = function(obj, clearUndef) {
		var att;

		for ( att in obj ) {
			if ( obj.hasOwnProperty(att) && ( !clearUndef || obj[att] !== undefined ) ) {
				this[att] = obj[att];
			}
		}
	};

	root.RC.prototype.filter = function(field, filter) {
		return new root.RC(self.object.filter(this, field, filter));
	};
	root.RC.prototype.proxy = function(index, clearUndef) {
		return self.object.proxy(this, index, clearUndef);
	};
	root.RC.prototype.rotate = function(mergeObj, clearUndef) {
		return self.object.rotate(this, mergeObj, clearUndef);
	};
}(this));