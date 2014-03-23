/**
 * rc - a library for row-column data manipulation
 * @module rc
 * @author Samuel Rouse <samuel.rouse@gmail.com>
 * @license MIT
 */

(function() {
	"use strict";
	
	/*--------------------------------------------------------------------------*/
	/*
	* Constants and basic settings
	* Structure and codes from Lo-Dash 2.4.1 <http://lodash.com/>
	*/
	
	/** Used as a safe reference for `undefined` in pre ES5 environments */
	var undefined;
	
	var version = "0.1.0";
	
	/** Used to determine if values are of the language type Object */
	var objectTypes = {
		'function': true,
		'object': true
	};
	
	/** Used as a reference to the global object */
	var root = (objectTypes[typeof window] && window) || this;
	
	/** Detect free variable `exports` */
	var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;
	
	/** Detect free variable `module` */
	var freeModule = objectTypes[typeof module] && module && !module.nodeType && module;
	
	/** Detect free variable `global` from Node.js or Browserified code and use it as `root` */
	var freeGlobal = freeExports && freeModule && typeof global == 'object' && global;
	if (freeGlobal && (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal || freeGlobal.self === freeGlobal)) {
		root = freeGlobal;
	}
	
	/** Detect the popular CommonJS extension `module.exports` */
	var moduleExports = freeModule && freeModule.exports === freeExports && freeExports;
	
	var Opt = Object.prototype.toString;
	
	/*--------------------------------------------------------------------------*/
	
	/* Functions */	
	
	function getIndexes (array, filter) {
		var indexes = [],
			len = array.length,
			isFn = (typeof filter === 'function'),
			i;
	
		if (isFn) {
			for (i = 0; i < len; i++) {
				if ( objectFilter(i, array[i]) ) {
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
	}
	
	function getByIndexes (array, indexes) {
		var len = indexes.length,
			data = [];
	
		for (;len;) {
			len--;
			data[len] = array[indexes[len]];
		}
		return data;
	}
	
	function arrayRotate (arr, result, limited, softFail) {
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
	
	function objectFilter (obj, field, filter) {
		return filterMerge(obj, filterIndexes(obj, field, filter));
	}
	
	function filterIndexes (obj, field, filter) {
		var indexes = false;
	
		if ( obj.hasOwnProperty(field) ) {
			indexes = getIndexes(obj[field], filter);
		}
		return indexes;
	}
	
	function filterMerge(obj, indexes) {
		var result = {},
			att;
	
		if ( indexes ) {
			for (att in obj) {
				if ( obj.hasOwnProperty(att) ) {
					result[att] = getByIndexes(obj[att], indexes);
				}
			}
		}
		return result;
	}
	
	function objectRotate (obj, result, clearUndef) {
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
	}
		
	function objFromIndex (obj, index, clearUndef) {
		return new Proxy(obj, index, clearUndef);
	}
	
	function rotate(obj) {
		// Generic, which directs to the appropriate array/object rotate
		if (typeof obj !== 'object') throw new TypeError("RC: rotate requires an object or an array");
		
		if ( Opt.call(obj) === '[object Array]' ) {
			return arrayRotate.apply(this, arguments);
		} else {
			return objectRotate.apply(this, arguments);
		}
	}
	
	
	/**
	 * Create an object and add a .commit() prototype to place the values back into the original.
	 * Useful for moving simple data types around. Objects and arrays will be automatically referenced.
	 * @constructor
	 * @param obj - A columnar object
	 * @param {number} index - The index to convert into a row-based object
	 * @param {Boolean} [clearUndef] - Clear undefined attributes when copying the object.
	 * @example
	 * var proxyRow = new Proxy(colData, index);
	 */
	var Proxy = (function() {
		var __obj = [],
			__idx = [],
			__clr = [],
			__this = [],
			guid = 0;
	
		function __getId(proxy) {
			var len = __this.length, pid, i;
	
			// Most likely to be at the end, so start there
			for (i = len; i; i--) {
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
	
		function Proxy (obj, index, clearUndef) {
	
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
			var pid = __getId(this), 
				obj = __obj[pid],
				index = __idx[pid],
				clearUndef = __clr[pid],
				att;
	
			for ( att in this ) {
				if ( att !== '__rcProxyId' && this.hasOwnProperty(att) && ( !clearUndef || this[att] !== undefined ) ) {
					obj[att][index] = this[att];
				}
			}
		};
	
		Proxy.prototype.destroy = function() {
			var pid = __getId(this);
			delete __this[pid];
			delete __obj[pid];
			delete __idx[pid];
			delete __clr[pid];
		};
	
		Proxy.prototype.finalize = function() {
			this.commit();
			this.destroy();
		};
	
		return Proxy;
	})();
	
		
	/*--------------------------------------------------------------------------*/
	
	var rc = {
		rotate: rotate,
		proxy: objFromIndex,
		array: {
			getIndexes: getIndexes,
			getByIndexes: getByIndexes,
			rotate: arrayRotate
		},
		object: {
			filter: objectFilter,
			filterIndexes: filterIndexes,
			filterMerge: filterMerge,
			rotate: objectRotate,
			objFromIndex: objFromIndex,
			proxy: objFromIndex
		},
		VERSION: version
	};

	/*--------------------------------------------------------------------------*/
	
	root.rc = rc;

}.call(this));
