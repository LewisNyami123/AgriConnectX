// utils/pick.js
module.exports = function pick(obj = {}, allowed = []) {
  return allowed.reduce((acc, key) => {
    if (Object.prototype.hasOwnProperty.call(obj, key)) acc[key] = obj[key];
    return acc;
  }, {});
};