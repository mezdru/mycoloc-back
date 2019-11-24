module.exports = exports = function syncUserPlugin (schema) {

  schema.methods.linkUser = function(user) {
    this.user = user;
    this.temporaryToken = {
      value: null,
      generated: Date.now()
    };
    return this.save();
  }

}