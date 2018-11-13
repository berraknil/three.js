// important Camera rotation info
// https://stackoverflow.com/questions/42089919/three-js-camera-rotation-y-to-360-degrees-conversion

// WHy use Cube Camera
// https://medium.com/@soffritti.pierfrancesco/dynamic-reflections-in-three-js-2d46f3378fc4

if (WEBGL.isWebGLAvailable() === false) {
  document.body.appendChild(WEBGL.getWebGLErrorMessage());
}

let container, stats;
let camera, scene, renderer, light;
let controls, water, sphere;

function init() {
  container = document.getElementById('container');

  //

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  //

  scene = new THREE.Scene();

  //

  camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    1,
    20000
  );
  camera.position.set(30, 30, 100);

  //

  light = new THREE.DirectionalLight(0xffffff, 0.8);
  scene.add(light);

  // Water

  var waterGeometry = new THREE.PlaneBufferGeometry(10000, 10000);

  water = new THREE.Water(waterGeometry, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: new THREE.TextureLoader().load(
      'textures/waternormals.jpg',
      function(texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      }
    ),
    alpha: 1.0,
    sunDirection: light.position.clone().normalize(),
    sunColor: 0xffffff,
    waterColor: 0x001e0f,
    distortionScale: 3.7,
    fog: scene.fog !== undefined
  });

  water.rotation.x = -Math.PI / 2;

  scene.add(water);

  // Skybox

  var sky = new THREE.Sky();
  sky.scale.setScalar(10000);
  scene.add(sky);

  var uniforms = sky.material.uniforms;

  uniforms.turbidity.value = 10;
  uniforms.rayleigh.value = 2;
  uniforms.luminance.value = 1;
  uniforms.mieCoefficient.value = 0.005;
  uniforms.mieDirectionalG.value = 0.8;

  var parameters = { distance: 400, inclination: 0.49, azimuth: 0.205 };

  var cubeCamera = new THREE.CubeCamera(1, 20000, 256);
  cubeCamera.renderTarget.texture.minFilter = THREE.LinearMipMapLinearFilter;

  function updateSun() {
    var theta = Math.PI * (parameters.inclination - 0.5);
    var phi = 2 * Math.PI * (parameters.azimuth - 0.5);

    light.position.x = parameters.distance * Math.cos(phi);
    light.position.y = parameters.distance * Math.sin(phi) * Math.sin(theta);
    light.position.z = parameters.distance * Math.sin(phi) * Math.cos(theta);

    sky.material.uniforms.sunPosition.value = light.position.copy(
      light.position
    );
    water.material.uniforms.sunDirection.value.copy(light.position).normalize();

    cubeCamera.update(renderer, scene);
  }

  updateSun();

  //

  var geometry = new THREE.IcosahedronBufferGeometry(20, 1);
  var count = geometry.attributes.position.count;

  var colors = [];
  var color = new THREE.Color();

  for (var i = 0; i < count; i += 3) {
    color.setHex(Math.random() * 0xffffff);

    colors.push(color.r, color.g, color.b);
    colors.push(color.r, color.g, color.b);
    colors.push(color.r, color.g, color.b);
  }

  geometry.addAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  var material = new THREE.MeshStandardMaterial({
    vertexColors: THREE.VertexColors,
    roughness: 0.0,
    flatShading: true,
    envMap: cubeCamera.renderTarget.texture,
    side: THREE.DoubleSide
  });

  sphere = new THREE.Mesh(geometry, material);
  scene.add(sphere);

  //

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.target.set(0, 10, 0);
  controls.minDistance = 40.0;
  controls.maxDistance = 200.0;
  camera.lookAt(controls.target);

  //

  stats = new Stats();
  container.appendChild(stats.dom);

  // GUI

  const gui = new dat.GUI();

  const skyFolder = gui.addFolder('Sky');
  skyFolder.add(parameters, 'inclination', 0, 0.5, 0.0001).onChange(updateSun);
  skyFolder.add(parameters, 'azimuth', 0, 1, 0.0001).onChange(updateSun);
  skyFolder.open();

  var uniforms = water.material.uniforms;

  const waterFolder = gui.addFolder('Water');
  waterFolder
    .add(uniforms.distortionScale, 'value', 0, 8, 0.1)
    .name('distortionScale');
  waterFolder.add(uniforms.size, 'value', 0.1, 10, 0.1).name('size');
  waterFolder.add(uniforms.alpha, 'value', 0.9, 1, 0.001).name('alpha');
  waterFolder.open();

  const cameraPositionFolder = gui.addFolder('CameraPosition');

  cameraPositionFolder.add(camera.position, 'x', -500, 500).step(0.1);
  cameraPositionFolder.add(camera.position, 'y', -500, 500).step(0.1);
  cameraPositionFolder.add(camera.position, 'z', 1000, 5000).step(0.1);
  cameraPositionFolder.open();

  const cameraRotationFolder = gui.addFolder('CameraRotation');

  cameraRotationFolder.add(camera.rotation, 'x', -1, 1).step(0.1);
  cameraRotationFolder.add(camera.rotation, 'y', -1, 1).step(0.1);
  cameraRotationFolder.add(camera.rotation, 'z', 0, 20).step(0.1);
  cameraRotationFolder.open();
  //

  window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  render();
  stats.update();
}

function render() {
  var time = performance.now() * 0.001;

  // sphere.position.y = Math.sin(time) * 20 + 5;
  sphere.rotation.x = time * 0.5;
  sphere.rotation.z = time * 0.51;

  water.material.uniforms.time.value += 1.0 / 60.0;

  renderer.render(scene, camera);
}

init();
animate();
