
/* Functions */
const has = (object, property) => Object.prototype.hasOwnProperty.call(object, property);

/**
 * Create an object from the specified column index
 * @param {Object} obj
 * @param {number} index
 * @param {Boolean} [clearUndef]
 * @param {Object} [result]
 * @returns {*}
 */
const objFromIndex = (obj, index, clearUndef, result = {}) =>
  Object.entries(obj).reduce((acc, [key, val]) => {
    if (!clearUndef || val[index] !== undefined) {
      acc[key] = val[index];
    }
    return acc;
  }, result);


module.exports = {
  has,
  objFromIndex,
};
