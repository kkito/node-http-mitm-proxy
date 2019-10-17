'use strict';

const { DrumstickClient} =require("@kkito/drumstick");
const client = new DrumstickClient({ host: process.env.DC_HOST, port: process.env.DC_PORT}, process.env.DC_KEY);

var port = 8082;

var Proxy = require('../');
var proxy = Proxy();

proxy.onError(function(ctx, err, errorKind) {
  // ctx may be null
  var url = (ctx && ctx.clientToProxyRequest) ? ctx.clientToProxyRequest.url : '';
  console.error(errorKind + ' on ' + url + ':', err);
});


proxy.onRequest(function(ctx, callback) {
  console.log('onRequest!!!!')
  ctx.clientToProxyRequest.resume();
  if (ctx.proxyToServerRequestOptions.method === 'GET') {
    let requestUrl = 'http://'
    if (ctx.proxyToServerRequestOptions.port === 443) {
      requestUrl = 'https://'
    }
    requestUrl = `${requestUrl}${ctx.proxyToServerRequestOptions.host}${ctx.proxyToServerRequestOptions.path}`
    ctx.proxyToServerRequestOptions.method
    ctx.proxyToServerRequestOptions.port
    client.ensureRequest(requestUrl, ctx.proxyToServerRequestOptions.headers , 'binary', {})
    .then(res => {
      ctx.proxyToClientResponse.writeHead(res.status, res.headers)
      ctx.proxyToClientResponse.write(res.body)
    })
    .catch(err => {
      ctx.proxyToClientResponse.writeHead(502)
    })
  } else {
    console.log(`other method found ${ctx.proxyToServerRequestOptions.method}`)
    ctx.clientToProxyRequest.on('data' , (d) => {
      console.log(d)
      console.log('onData')
      ctx.proxyToClientResponse.writeHead(200)
      ctx.proxyToClientResponse.write(`params is ${d}`)
      ctx.proxyToClientResponse.end()
    })
  }
  callback();
});



proxy.listen({ port: port });
console.log('listening on ' + port);
