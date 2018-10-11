window.addEventListener('DOMContentLoaded', init);

var mesh;
var scene;

function init() {
  const width = 960;
  const height = 540;

  // レンダラーを作成
  const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#myCanvas')
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);

  // シーンを作成
  scene = new THREE.Scene();

  // カメラを作成
  const camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000);
  camera.position.set(0, 0, +1000);

  //
  var sock = new WebSocket("ws://localhost:8080");
  sock.onopen = function (event) {
      console.log("Socket connected");

  }
  sock.onmessage = SocketOnMessage;

  // 箱を作成
  //const geometry = new THREE.BoxGeometry(500, 500, 500);
  //const material = new THREE.MeshStandardMaterial({color: 0x0000FF});
  //const box = new THREE.Mesh(geometry, material);
  //scene.add(box);

    //
  var vres = 1000;
  var hres = 500;
  var r = 250;

  var vertexs = new Array(vres);
  for (var i = 0; i < vres; i++) {
      vertexs[i] = new Array(hres);
  }

  for (var i = 0; i < vres; i++)
  {
      for (var j = 0; j < hres; j++)
      {
          vertexs[i][j] = [0,0,0];
          var theta_z = Math.PI / 2 - Math.PI / (vres - 1) * i;
          var theta_h = 2 * Math.PI / (hres - 1) * j;
          var r_h = r * Math.cos(theta_z);
          vertexs[i][j][0] = r_h * Math.cos(theta_h);
          vertexs[i][j][1] = r_h * Math.sin(theta_h);
          vertexs[i][j][2] = r * Math.sin(theta_z);
      }
  }
  // Initialise threejs geometry
  var geometry = new THREE.Geometry();

  //// Add grid vertices to geometry
  var n = vertexs.length;
  var m = vertexs[0].length;
  for (var i = 0; i < vres; i++) {
      for (var j = 0; j < hres; j++) {
          var newvert = new THREE.Vector3(vertexs[i][j][0], vertexs[i][j][1], vertexs[i][j][2]);
          geometry.vertices.push(newvert);
      }
  }

  // Add cell faces (2 traingles per cell) to geometry
  for (var i = 0; i < n - 1; i++) {
      for (var j = 0; j < m - 1; j++) {
          var n0 = i * m + j;
          var n1 = n0 + 1;
          var n2 = (i + 1) * m + j + 1;
          var n3 = n2 - 1;
          face1 = new THREE.Face3(n0, n1, n2);
          face2 = new THREE.Face3(n2, n3, n0);
          geometry.faces.push(face1);
          geometry.faces.push(face2);
      }
  }

  // Compute normals for shading
  geometry.computeFaceNormals();
  ////geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({ color: 0x0000FF });
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // 平行光源
  const light = new THREE.DirectionalLight(0xFFFFFF);
  light.intensity = 2; // 光の強さを倍に
  light.position.set(-1, -1, -1);
  const light2 = new THREE.AmbientLight(0x404040); // soft white light
  light2.intensity = 2;
  // シーンに追加
  scene.add(light);
  scene.add(light2);

  // 初回実行
  //tick();

  //show FPS
  var stats = new Stats();
  stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom);

  function tick() { 
    stats.begin();

    // 箱を回転させる
    if (mesh != null) {
        mesh.rotation.x += 0.01;
        mesh.rotation.y += 0.01;    
    }

    // レンダリング
    renderer.render(scene, camera);

    stats.end();

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

function SocketOnMessage(event) {
    var geometry = parseGeometry(event.data);
    const material = new THREE.MeshStandardMaterial({ color: 0x0000FF });
    if (mesh != null) {
        scene.remove(mesh);
    }
    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
}

function parseGeometry(varr) {
    var vertexs = JSON.parse(varr);

    // Initialise threejs geometry
    var geometry = new THREE.Geometry();

    // Add grid vertices to geometry
    var n = vertexs.length;
    var m = vertexs[0].length;
    for (var i = 0; i < n; i++) {
        for (var j = 0; j < m; j++) {
            var newvert = new THREE.Vector3(vertexs[i][j][0], vertexs[i][j][1], vertexs[i][j][2]);
            geometry.vertices.push(newvert);
        }
    }

    // Add face to geometry
    for (var i = 0; i < n - 1; i++) {
        for (var j = 0; j < m - 1; j++) {
            var n0 = i * m + j;
            var n1 = n0 + 1;
            var n2 = (i + 1) * m + j + 1;
            var n3 = n2 - 1;
            face1 = new THREE.Face3(n0, n1, n2);
            face2 = new THREE.Face3(n2, n3, n0);
            geometry.faces.push(face1);
            geometry.faces.push(face2);
        }
    }

    geometry.computeFaceNormals();

    return geometry;
}
