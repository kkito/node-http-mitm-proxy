'use strict';

const { DrumstickClient } = require("@kkito/drumstick");
let client = new DrumstickClient({ host: process.env.DC_HOST, port: process.env.DC_PORT }, process.env.DC_KEY);

var port = 8082;

var Proxy = require('../');
var proxy = Proxy();

let isRunning = false
const paddingCtx = []

proxy.onError(function (ctx, err, errorKind) {
  // ctx may be null
  var url = (ctx && ctx.clientToProxyRequest) ? ctx.clientToProxyRequest.url : '';
  console.error(errorKind + ' on ' + url + ':', err);
});


proxy.onRequest(function (ctx, callback) {
  console.log('onRequest!!!!')
  if (isRunning) {
    ctx.clientToProxyRequest.pause()
    paddingCtx.push(ctx)
  } else {
    execCtx(ctx)
  }
  callback();
});

function execCtx(ctx) {

  ctx.clientToProxyRequest.resume();
  const contentLengthHeadher = ctx.proxyToServerRequestOptions.headers['content-length']
  let contentLength = 0
  if (!contentLengthHeadher) {
    proxyRun(ctx, null)
  } else {
    contentLength = parseInt(contentLengthHeadher, 10)
    let chunks = Buffer.alloc(0)

    ctx.clientToProxyRequest.on('data', (d) => {
      console.log(d)
      console.log('onData')
      chunks = Buffer.concat([chunks, d])
      if (chunks.length >= contentLength) {
        proxyRun(ctx, chunks)
      }
    })
  }

}

function proxyRunFinish(ctx) {
  isRunning = false
  let nextCtx
  while(nextCtx = paddingCtx.shift()) {
    proxyRun(nextCtx)
  }
}

function proxyRun(ctx , body) {
  isRunning = true
  let requestUrl = 'http://'
  if (ctx.proxyToServerRequestOptions.port === 443) {
    requestUrl = 'https://'
  }
  requestUrl = `${requestUrl}${ctx.proxyToServerRequestOptions.host}${ctx.proxyToServerRequestOptions.path}`

  let myheader = ctx.proxyToServerRequestOptions.headers
  delete myheader['content-length']

  client = new DrumstickClient({ host: process.env.DC_HOST, port: process.env.DC_PORT }, process.env.DC_KEY);
  console.log(`begin to request ${requestUrl}`)
  return client.ensureRequestV2(
      requestUrl,
      ctx.proxyToServerRequestOptions.method,
      myheader,
      body, {}
    )
      // client.ensureRequest(requestUrl,ctx.proxyToServerRequestOptions.headers, 'binary', {body: chunks})
      .then(res => {
        console.log(`on response ${requestUrl}: ${res.status}`)
        client.close()
        if (res.headers['connection']) {
          res.headers['connection'] = 'keep-alive, close'
        }
        ctx.proxyToClientResponse.writeHead(res.status, res.headers)
        ctx.proxyToClientResponse.write(res.body)
        ctx.proxyToClientResponse.end()
        proxyRunFinish(ctx)
      })
      .catch(err => {
        client.close()
        console.log(`error happended ${err} ${typeof err}`)
        ctx.proxyToClientResponse.writeHead(502)
        proxyRunFinish(ctx)
      })
}



proxy.listen({ port: port });
console.log('listening on ' + port);
