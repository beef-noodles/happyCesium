var WebSocket = require('ws')
var axios = require('axios')
var CircularJSON = require('circular-json')
var config = require('./serverConfig')
var wss = new WebSocket.Server({
  port: 8181
})

wss.on('connection', function (ws) {
  console.log('client connected')
  // ws.on('message', function (message) {
  //   ws.send(message)
  // })
  getDataByInterval(config.requestInterval, wss)
})

/**
 * 轮询获取数据
 * @param {int} interval 时间间隔（毫秒）
 * @param {*} wss WebSocket Server 实例
 */
function getDataByInterval (interval /* number */, wss) {
  let url = 'https://data-live.flightradar24.com/zones/fcgi/feed.js'
  getDataAndSendData(url, wss)
  setInterval(function () {
    getDataAndSendData(url, wss)
  }, interval)
}
/**
 * 获取数据
 * @param {string} url 服务地址
 * @param {WebSokcetServer} wss WebSocket Server 实例
 */
function getDataAndSendData (url, wss) {
  axios.get(url).then(data => {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(CircularJSON.stringify(data.data))
      }
    })
  }, err => {
    console.error(`出错了：${err}`)
  })
}
