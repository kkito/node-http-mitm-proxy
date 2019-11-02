'use strict';
const { ProxyGroup }  = require('../lib/proxy_group')

const proxyGroup = new ProxyGroup()

var port = 8082;

var Proxy = require('../');
var proxy = Proxy();

const paddingCtx = []

function getUrl(ctx) {
  let requestUrl = 'http://'
  if (ctx.proxyToServerRequestOptions.port === 443) {
    requestUrl = 'https://'
  }
  requestUrl = `${requestUrl}${ctx.proxyToServerRequestOptions.host}${ctx.proxyToServerRequestOptions.path}`
  const url = requestUrl
  // console.log(`the request url is ${url}`)
  return url
}

function upperHeader(theHeaders) {
  const result = {}
  for(const key of Object.keys(theHeaders)) {
    console.log(key)
    const items = key.split('-')
    const newKey = items.map(x => {
      return x.charAt(0).toUpperCase() + x.substring(1)
    }).join('-')
    result[newKey] = theHeaders[key]
  }
  return result
}

function isValidHost(ctx) {
  const url = getUrl(ctx)
  const invalidHosts = ['google' , 'youtube' , 'gmail', 'gstatic']
  for (const x of invalidHosts) {
    if (url.includes(x)) {
      // return false
      return true
    }
  }
  // console.log(`=======\nbegin to request ${url}\n ==========`)
  return true
}

proxy.onError(function (ctx, err, errorKind) {
  // ctx may be null
  var url = (ctx && ctx.clientToProxyRequest) ? ctx.clientToProxyRequest.url : '';
  console.error(errorKind + ' on ' + url + ':', err);
});


proxy.onRequest(function (ctx, callback) {
  // console.log('onRequest!!!!')
  if (isValidHost(ctx)) {
    const proxyClient = proxyGroup.getInstance()
    if (proxyClient) {
      execCtx(proxyClient, ctx, proxyClient)
    } else {
      ctx.clientToProxyRequest.pause()
      paddingCtx.push(ctx)
    }
  }
  callback();
});

function execCtx(client, ctx) {

  ctx.clientToProxyRequest.resume();
  const contentLengthHeadher = ctx.proxyToServerRequestOptions.headers['content-length']
  let contentLength = 0
  if (!contentLengthHeadher) {
    proxyRun(client,ctx, null)
  } else {
    contentLength = parseInt(contentLengthHeadher, 10)
    let chunks = Buffer.alloc(0)

    ctx.clientToProxyRequest.on('data', (d) => {
      // console.log(d)
      // console.log('onData')
      chunks = Buffer.concat([chunks, d])
      if (chunks.length >= contentLength) {
        proxyRun(client, ctx, chunks)
      }
    })
  }

}

function proxyRunFinish(ctx) {
  console.log(`\t\t finished ${getUrl(ctx)}`)
  setTimeout(() => {
    const proxyClient = proxyGroup.getInstance()
    if (proxyClient) {
      const nextCtx = paddingCtx.shift()
      if (nextCtx) {
        proxyRun(proxyClient, nextCtx)
      }

    }
  } , 0)
}

function proxyRun(client, ctx , body) {
  let requestUrl = 'http://'
  if (ctx.proxyToServerRequestOptions.port === 443) {
    requestUrl = 'https://'
  }
  requestUrl = `${requestUrl}${ctx.proxyToServerRequestOptions.host}${ctx.proxyToServerRequestOptions.path}`

  let myheader = ctx.proxyToServerRequestOptions.headers
  delete myheader['content-length']

  // client = new DrumstickClient({ host: process.env.DC_HOST, port: process.env.DC_PORT }, process.env.DC_KEY);
  // console.log(`begin to request ${requestUrl}`)
  // console.log(ctx.proxyToServerRequestOptions.method)
  // myheader = upperHeader(myheader)
  // console.log(myheader)
  // console.log(body)
  // console.log(body.toString())
  return client.request(
      requestUrl,
      ctx.proxyToServerRequestOptions.method,
      myheader,
      body
    )
      // client.ensureRequest(requestUrl,ctx.proxyToServerRequestOptions.headers, 'binary', {body: chunks})
      .then(res => {
        console.log(`on response ${requestUrl}: ${res.status}`)
        // client.close()
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
        console.log(`error happended for catch ${err} ${typeof err}`)
        ctx.proxyToClientResponse.writeHead(502)
        ctx.proxyToClientResponse.write(`error ${err}`)
        ctx.proxyToClientResponse.end()
        proxyRunFinish(ctx)
      })
}



proxy.listen({ port: port });
console.log('listening on ' + port);
