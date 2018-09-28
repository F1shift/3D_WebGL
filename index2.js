window.addEventListener('DOMContentLoaded', init);

var mesh;
var scene;
var camera;
var renderer;
var stats;
var composer, renderPass, outlinePass;
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var selectedObjects = [];

function init() {

    //#region レンダラーを作成
    renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector('#myCanvas')
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    //#endregion

    //#region シーンを作成
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xf0f0f0 );
    scene.background = new THREE.Color( 0x000000 );
    scene.background = new THREE.Color( 0xE0E0E0 );
    //#endregion

    //#region カメラを作成
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.set(0, 0, 1000);
    //#endregion
    
    //#region コントロール
    var controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls.addEventListener( 'change', render );
    controls.minDistance = 20;
    controls.maxDistance = 2000;
    controls.enablePan = false;
    //#endregion

    //#region postprocessing(OutLine effect)
    composer = new THREE.EffectComposer( renderer );

    renderPass = new THREE.RenderPass( scene, camera );
    composer.addPass( renderPass );

    outlinePass = new THREE.OutlinePass( new THREE.Vector2( window.innerWidth, window.innerHeight ), scene, camera );
    outlinePass.renderToScreen = true;
    outlinePass.visibleEdgeColor.set('#ff6f00');
    outlinePass.hiddenEdgeColor.set('#ffffff');
    outlinePass.pulsePeriod = 2;
    outlinePass.usePatternTexture = true;
    composer.addPass( outlinePass );

    var onLoad = function (texture) {

        outlinePass.patternTexture = texture;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;

    };

    var loader = new THREE.TextureLoader();

    //loader.load('examples/textures/wallpaper_grey-white-checkered-squares-512x512.jpg', onLoad);
    //Read from textureData.js to prevent CROS error.
    loader.load(greyWhiteCheckered, onLoad);
    //#endregion

    //#region window.addEventListener
    window.addEventListener( 'mousemove', onTouchMove );
    window.addEventListener( 'touchmove', onTouchMove );
    window.addEventListener('resize', OnResize, false );
    //#endregion

    //#region 環境オブジェクト

        //#region 光源
        var spotLight = new THREE.SpotLight( 0xffffff, 1.5 );
        spotLight.position.set( 0, 500, 0 );
        spotLight.angle = Math.PI / 4;
        spotLight.penumbra = 0.05;
        spotLight.decay = 2;

        spotLight.castShadow = true;
        spotLight.shadow.mapSize.width = 2048;
        spotLight.shadow.mapSize.height = 2048;
        spotLight.shadow.camera.near = 1;
        spotLight.shadow.camera.far = 1000;
        scene.add( spotLight );
        var ambientLight = new THREE.AmbientLight( 0xf0f0f0 );
        ambientLight.intensity = 0.2;
        scene.add( ambientLight );

        lightHelper = new THREE.SpotLightHelper( spotLight, 0x99CC00 );
        scene.add( lightHelper );
        shadowCameraHelper = new THREE.CameraHelper( spotLight.shadow.camera );
        scene.add( shadowCameraHelper );
        //#endregion
    　　
        //#region グラウンド
        var planeGeometry = new THREE.PlaneBufferGeometry( 2000, 2000 );
        planeGeometry.rotateX( - Math.PI / 2 );
        var planeMaterial = new THREE.ShadowMaterial( { opacity: 0.2 } );

        var plane = new THREE.Mesh( planeGeometry, planeMaterial );
        plane.position.y = -200;
        plane.receiveShadow = true;
        scene.add( plane );

        var helper = new THREE.GridHelper( 2000, 100 );
        helper.position.y = - 199;
        helper.material.opacity = 0.25;
        helper.material.transparent = true;
        scene.add( helper );

        var axes = new THREE.AxesHelper( 1000 );
        // axes.position.set( 0, 0, 0 );
        //axes.position.set( -500, - 500, - 500 );
        //scene.add( axes );
        //#endregion
        
    //#endregion
    
    //#region WebSocketコネクションを作る
    var sock = new WebSocket("ws://localhost:8080");
    sock.onopen = function (event) {
        console.log("Socket connected");
    }
    sock.onmessage = SocketOnMessage;
    //#endregion
    
    //#region show FPS
    stats = new Stats();
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(stats.dom);
    //#endregion
    
    //#region デフォルト球体を加入する
    var defaultMesh = GetPresetMesh(50,100,150, 0, 0, 0);
    defaultMesh.castShadow = true;
    scene.add(defaultMesh);
    //#endregion

    //Animationl0-op;o99-
    requestAnimationFrame(tick);
}

function render() {
    stats.update();
    // レンダリング
    //renderer.render(scene, camera);
    composer.render(scene, camera);
}

function tick() { 

    //箱を回転させる
    if (mesh != null) {
        mesh.rotation.x += 0.01;
        mesh.rotation.y += 0.01;    
    }

    // レンダリング
    render();

    requestAnimationFrame(tick);
}

function SocketOnMessage(event) {
    try{
        var geometry = parseGeometry(event.data, true);
        const material = new THREE.MeshStandardMaterial({ color: 0x0000FF });
        if (mesh != null) {
            scene.remove(mesh);
        }
        mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        scene.add(mesh);
    }
    catch(e)
    {
        console.log("recieve massege : " + event.data);
    }
    
}

function parseGeometry(varr, invert) {
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
            if(invert)
            {
                face1 = new THREE.Face3(n2, n1, n0);
                face2 = new THREE.Face3(n0, n3, n2);
            }
            else
            {
                face1 = new THREE.Face3(n0, n1, n2);
                face2 = new THREE.Face3(n2, n3, n0);
            }
            geometry.faces.push(face1);
            geometry.faces.push(face2);
        }
    }

    geometry.computeFaceNormals();

    return geometry;
}

function GetPresetMesh(vres, hres, r, x, y, z)
{
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
          vertexs[i][j][0] = r_h * Math.cos(theta_h) + x;
          vertexs[i][j][1] = r_h * Math.sin(theta_h) + y;
          vertexs[i][j][2] = r * Math.sin(theta_z) + z;
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
          face1 = new THREE.Face3(n2, n1, n0);
          face2 = new THREE.Face3(n0, n3, n2);
          geometry.faces.push(face1);
          geometry.faces.push(face2);
      }
  }

  // Compute normals for shading
     geometry.computeFaceNormals();
  ////geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({ color: 0x0000FF });
  mesh = new THREE.Mesh(geometry, material);
  return mesh;
}

function addSelectedObject( object ) {

    selectedObjects = [];
    selectedObjects.push( object );

}

function checkIntersection() {

    raycaster.setFromCamera( mouse, camera );

    var intersects = raycaster.intersectObjects( [ scene ], true );

    if ( intersects.length > 0 ) {
        for(var i = 0; i < intersects.length; i++)
        {
            if (intersects[ i ].object.type == "Mesh")
            {
                var selectedObject = intersects[ i ].object;
                addSelectedObject( selectedObject );
                outlinePass.selectedObjects = selectedObjects;
                break;
            }
        }
        
    } else {

        outlinePass.selectedObjects = [];

    }

}

function onTouchMove( event ) {

    var x, y;

    if ( event.changedTouches ) {

        x = event.changedTouches[ 0 ].pageX;
        y = event.changedTouches[ 0 ].pageY;

    } else {

        x = event.clientX;
        y = event.clientY;

    }

    mouse.x = ( x / window.innerWidth ) * 2 - 1;
    mouse.y = - ( y / window.innerHeight ) * 2 + 1;

    checkIntersection();

}

function OnResize() {
    var width = window.innerWidth;
    var height = window.innerHeight;

    renderer.setSize(width, height);
    composer.setSize( width, height );

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

