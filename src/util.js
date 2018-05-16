
/* Functions */
const has = (object, property) => Object.prototype.hasOwnProperty.call(object, property);

module.exports = {
  has,
};
