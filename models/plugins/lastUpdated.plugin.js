module.exports = exports = function lastUpdatedPlugin (schema) {

  schema.pre('save', function(next) {
    this.updated = Date.now();
    return next();
  });
}