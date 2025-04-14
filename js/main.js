// ============================== SCENE SETUP ==============================
var scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

var floorGeometry = new THREE.PlaneGeometry(100, 100);
var floorMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
var floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -2;
scene.add(floor);
floor.receiveShadow = true;

var textureLoader = new THREE.TextureLoader();
textureLoader.load('assets/textures/grass.jpg', function(texture) {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(10, 10);
  floorMaterial.map = texture;
  floorMaterial.needsUpdate = true;
});

// ============================== CAMERA & RENDERER ==============================
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 10);
camera.lookAt(0, 0, 0);

var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container').appendChild(renderer.domElement);
renderer.shadowMap.enabled = true;

// ============================== LIGHTS ==============================
var ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

var sunLight = new THREE.DirectionalLight(0xffffff, 1);
sunLight.position.set(50, 100, 50);
sunLight.castShadow = true;
scene.add(sunLight);

// ============================== CONTROLS ==============================
var controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 5;
controls.maxDistance = 50;
controls.maxPolarAngle = Math.PI / 2;

window.addEventListener('resize', function () {
  var width = window.innerWidth;
  var height = window.innerHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});

// ============================== MODEL LOAD ==============================
var customModel;
var parts = {};

var loader = new THREE.FBXLoader();
loader.load(
  'assets/modelos/legomandefault.fbx',
  function (object) {
    object.scale.set(0.01, 0.01, 0.01);
    var bbox = new THREE.Box3().setFromObject(object);
    var center = bbox.getCenter(new THREE.Vector3());
    object.position.sub(center);

    scene.add(object);
    customModel = object;

    parts.head        = object.getObjectByName('Cylinder006');
    parts.armLeft     = object.getObjectByName('Cylinder009');
    parts.armRight    = object.getObjectByName('Cylinder012');
    parts.handLeft    = object.getObjectByName('Cylinder004');
    parts.handRight   = object.getObjectByName('Cylinder016');
    parts.legLeft     = object.getObjectByName('Cylinder014');
    parts.legRight    = object.getObjectByName('Cylinder013');
    parts.body        = object.getObjectByName('Cylinder009');
    parts.trousers    = object.getObjectByName('Cylinder010');
    parts.innertight  = object.getObjectByName('Cylinder011');

    setupPivot(parts.head, 'head', new THREE.Vector3(0, -0.008, 0.002), customModel);
    setupPivot(parts.handLeft, 'handLeft', new THREE.Vector3(0.015, 0, 0), parts.armLeft);
    setupPivot(parts.handRight, 'handRight', new THREE.Vector3(-0.015, 0, 0), parts.armRight);
  },
  undefined,
  function (error) {
    console.error('Erro ao carregar modelo:', error);
  }
);

// ============================== PIVOTS ==============================
function setupPivot(part, name, offset, parent) {
  const partWorldPos = new THREE.Vector3();
  part.getWorldPosition(partWorldPos);

  const parentWorldPos = new THREE.Vector3();
  parent.getWorldPosition(parentWorldPos);

  const localPivotPos = partWorldPos.clone().sub(parentWorldPos).add(offset);

  const pivot = new THREE.Group();
  pivot.name = name + '_pivot';
  pivot.position.copy(localPivotPos);

  parent.add(pivot);
  pivot.add(part);

  part.position.set(0, 0, 0); 

  parts[name] = pivot;
}

// ============================== ANIMATION CONTROLS ==============================
let activeTweens = [];

function clearTweens() {
  activeTweens.forEach(tween => tween.stop());
  activeTweens = [];

  Object.values(parts).forEach(p => {
    if (p && p.rotation) p.rotation.set(0, 0, 0);
  });
}

function playAnimation(type) {
  clearTweens();

  if (type === 'dancar' && parts.armLeft && parts.armRight) {
    activeTweens.push(
      new TWEEN.Tween(parts.armLeft.rotation)
        .to({ z: -Math.PI / 3 }, 600)
        .easing(TWEEN.Easing.Sinusoidal.InOut)
        .yoyo(true)
        .repeat(Infinity)
        .start(),
      new TWEEN.Tween(parts.armRight.rotation)
        .to({ z: Math.PI / 3 }, 600)
        .easing(TWEEN.Easing.Sinusoidal.InOut)
        .yoyo(true)
        .repeat(Infinity)
        .start()
    );
  }

  if (type === 'caminhar' && parts.legLeft && parts.legRight) {
    activeTweens.push(
      new TWEEN.Tween(parts.legLeft.rotation)
        .to({ x: Math.PI / 4 }, 400)
        .easing(TWEEN.Easing.Sinusoidal.InOut)
        .yoyo(true)
        .repeat(Infinity)
        .start(),
      new TWEEN.Tween(parts.legRight.rotation)
        .to({ x: -Math.PI / 4 }, 400)
        .easing(TWEEN.Easing.Sinusoidal.InOut)
        .yoyo(true)
        .repeat(Infinity)
        .start()
    );
  }

  if (type === 'rodarCabeca' && parts.head) {
    activeTweens.push(
      new TWEEN.Tween(parts.head.rotation)
        .to({ y: Math.PI / 2 }, 800)
        .easing(TWEEN.Easing.Sinusoidal.InOut)
        .yoyo(true)
        .repeat(Infinity)
        .start()
    );
  }
}

window.playAnimation = playAnimation;
window.clearTweens = clearTweens;

// ============================== ANIMATION LOOP ==============================
var clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  let delta = clock.getDelta();

  TWEEN.update();
  controls.update();
  renderer.render(scene, camera);
}
animate();
