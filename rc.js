/**
 * rc.js - Row/Column Conversions
 * v0.02.1 - Closure Compiler support, additional comments
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
	function Proxy(obj, index, clearUndef) {
		var att;
				
		for ( att in obj ) {
			if ( obj.hasOwnProperty(att) && ( !clearUndef || obj[att][index] !== undefined ) ) {
				this[att] = obj[att][index];
			}
		}
	
		// Defined inside the constructor to give it access to the originating object and parameters
		Proxy.prototype.commit = function(){
			var att;
			for ( att in this ) {
				if ( this.hasOwnProperty(att) && ( !clearUndef || this[att] !== undefined ) ) {
					obj[att][index] = this[att];
				}
			}
		};
	}
	
	var self = {
		array: {
			getIndexes: function(array, filter) {
				var indexes = [], 
					len = array.length, 
					isFn = (typeof filter === 'function'),
					i;
					
				for (i = 0; i < len; i++) {
					if ( ( isFn && filter.call(null, i, array[i]) ) || ( !isFn && array[i] === filter ) ) {
						indexes.push(i);
					}
				}
				return indexes;
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
				var obj, len, i, att, has;
				
				// Not an array? Send it back.
				if ( Object.prototype.toString.call(arr) !== '[object Array]' ) {
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
			if ( Object.prototype.toString.call(obj) !== '[object Array]' ) {
				return self.array.rotate.apply(this, arguments);
			} else {
				return self.object.rotate.apply(this, arguments);
			}
		},
		version: 'v0.02.1'
	};
	
	root.rc = self;

	// Can we build a chaining mode?
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
