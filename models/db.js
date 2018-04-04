const MongoClient = require('mongodb').MongoClient;

var state = {
  client: null
}

exports.connect = function(url, callback) {
  if (state.client) return callback();

  MongoClient.connect(url, function(err, client) {
    if (err) return callback(err);
    state.client = client;
    callback();
  })
}

exports.getClient = function() {
  return state.client;
}

exports.close = function(callback) {
  if (state.client) {
    state.client.close(function(err, result) {
      state.client = null;
      // state.mode = null;
      callback(err);
    })
  }
}