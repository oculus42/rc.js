/**
 * rc.js - Row/Column Conversions
 * v0.01 - First release
 */
 
 
(function(root){
	"use strict";
	
	/**
	 * Create an object and add a .commit() prototype to place the values back into the original.
	 * Useful for moving simple data types around. Objects and arrays will be automatically referenced.
	 */
	function Proxy(obj, index, clearUndef) {
		var att;
		
		// Clean truthy/falsy values & undefined
		clearUndef = !!clearUndef;
				
		for ( att in obj ) {
			if ( obj.hasOwnProperty(att) && ( !clearUndef || obj[att][index] !== undefined ) ) {
				this[att] = obj[att][index];
			}
		}
	
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
				var result = {}, fld, indexes, att;
				
				if ( obj.hasOwnProperty(field) ) {
					fld = obj[field];
				
					indexes = self.array.getIndexes(fld, filter);
					
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
				
				// Clean truthy/falsy values & undefined
				clearUndef = !!clearUndef;
				
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
						throw new TypeError("RC: Result contains incrrect type at index " + i);
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
		}
	};
	
	// Can we build a chainable mode?
	root.rc = self;

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
