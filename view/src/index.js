let ws, viewer

getViewer().then(viewer => {
  return viewer
}, err => {
  if (err) {
    console.errpr(err)
    return null
  }
}).then(viewer => {
  connectWS()
})

/**
 * 连接Websocket
 */
function connectWS () {
  return new Promise((resolve, reject) => {
    if ('WebSocket' in window) {
      ws = new WebSocket(`ws://${window.location.hostname}:8181`)
      ws.onopen = function (e) {
        console.log('websocket has connected')
      }
      ws.onmessage = function (res) {
        console.log('get data.....')
        let modalData = JSON.parse(res.data)
        AddModals(modalData)
      }
      ws.onclose = function (e) {
        console.log('websocket has disconnected')
      }
      resolve(ws)
    } else {
      window.alert('你的浏览器不支持WebSocket, 请更新浏览器。')
      reject(new window.Errow('un supported browser....'))
    }
  })
}
/**
 * 创建三维视图
 */
function getViewer () {
  return new Promise((resolve, reject) => {
    viewer = new Cesium.Viewer('cesiumContainer', {
      animation: false,
      baseLayerPicker: false, // 地图切换控件(底图以及地形图)是否显示,默认显示true
      fullscreenButton: true, // 全屏按钮,默认显示true
      geocoder: false, // 地名查找,默认true
      timeline: false, // 时间线,默认true
      vrButton: false, // 双屏模式,默认不显示false
      homeButton: false, // 主页按钮，默认true
      infoBox: false, // 点击要素之后显示的信息,默认true
      selectionIndicator: true, // 选中元素显示,默认true
      sceneModePicker: false, // 是否显示投影方式控件
      navigationHelpButton: false, // 是否显示帮助信息控件
      terrainProvider: Cesium.createWorldTerrain({
        requestVertexNormals: true,
        requestWaterMask: true
      })
    })

    viewer.scene.globe.enableLighting = false
    viewer._cesiumWidget._creditContainer.style.display = 'none'
    resolve(viewer)
  })
}

/**
 *
 *
 * @param {Array[Array]} modalInfo
 * @param {string} key 列表中的唯一值，用于模型id
 * @param {number} id 该记录的序列号，自增
 * @returns
 */
function addToList (modalInfo, key, id) {
  let flightNumber = modalInfo[13] ? modalInfo[13] : '--'
  let start = modalInfo[12] ? modalInfo[12] : '--'
  let arrival = modalInfo[11] ? modalInfo[11] : '--'
  let type = modalInfo[8] ? modalInfo[8] : '--'
  let status = modalInfo[5] > 0 ? '飞行中' : '已降落'
  return '<div class="content-item" id="' + key + '"><span class="item item-id">' + id + '</span>' +
  '<span class="item item-flightNumber">' + flightNumber + '</span>' +
  '<span class="item item-start">' + start + '</span>' +
  '<span class="item item-arrival">' + arrival + '</span>' +
  '<span class="item item-type">' + type + '</span>' +
  '<span class="item  item-status">' + status + '</span></div>'
}

function trackedTarget (id) {
  let entity = viewer.entities.getById(id)
  viewer.trackedEntity = entity
  viewer.flyTo(entity)
}

/**
 * 添加多个模型
 * @param {Array[Array]} modals 模型集信息
 */
function AddModals (modals) {
  viewer.entities.removeAll()
  let listContent = document.getElementsByClassName('list-content')[0]
  listContent.innerHTML = ''
  let i = 0
  let temp = ''
  for (let index in modals) {
    if (index === 'full_count' || index === 'version') {
    } else {
      i++
      if (i > config.limit) {
        break
      }
      AddModal(modals[index], index)
      temp += addToList(modals[index], index, i)
    }
  }
  listContent.innerHTML = temp
  $('.content-item').on('click', function (evt) {
    if (this.id) {
      trackedTarget(this.id)
    }
  })
}
/**
 * 添加单个模型
 * @param {Cesium.Ｖiewer} viewer 三维球视图
 * @param {string|number} key unique value
 */
function AddModal (modalInfo, key) {
  // modal 位置
  if (modalInfo[1] & modalInfo[2]) {
    let position = new Cesium.Cartesian3.fromDegrees(modalInfo[2], modalInfo[1], (modalInfo[4] ? modalInfo[4] : 0))
    let heading = Cesium.Math.toRadians((modalInfo[3] ? modalInfo[3] : 0) - 90)
    let pitch = Cesium.Math.toRadians(2)
    let roll = Cesium.Math.toRadians(0)
    let hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll)
    let orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr)
    let entity = new Cesium.Entity({
      id: key,
      name: key,
      position: position,
      orientation: orientation,
      model: {
        uri: '../lib/Cesium-1.45/Apps/SampleData/models/CesiumAir/Cesium_Air.gltf',
        minimumPixelSize: 128,
        maximumScale: 20000
        // scale: 80
      }
    })
    viewer.entities.add(entity)
  }
}
