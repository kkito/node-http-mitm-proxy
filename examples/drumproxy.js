'use strict';

var port = 8082;

var Proxy = require('../');
var proxy = Proxy();

proxy.onError(function(ctx, err, errorKind) {
  // ctx may be null
  var url = (ctx && ctx.clientToProxyRequest) ? ctx.clientToProxyRequest.url : '';
  console.error(errorKind + ' on ' + url + ':', err);
});

proxy.onRequest(function(ctx, callback) {
  console.log('=============== REQUEST: http://' + ctx.clientToProxyRequest.headers.host + ctx.clientToProxyRequest.url);
  return callback();
});

proxy.onRequestData(function(ctx, chunk, callback) {
  //console.log('request data length: ' + chunk.length);
  return callback(null, chunk);
});

proxy.onResponse(function(ctx, callback) {
  //console.log('RESPONSE: http://' + ctx.clientToProxyRequest.headers.host + ctx.clientToProxyRequest.url);
  return callback(null);
});

proxy.onResponseData(function(ctx, chunk, callback) {
  //console.log('response data length: ' + chunk.length);
  return callback(null, chunk);
});

proxy.listen({ port: port });
console.log('listening on ' + port);
