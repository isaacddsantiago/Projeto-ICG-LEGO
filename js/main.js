// ========================== SCENE ==========================
var scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// ========================== FLOOR ==========================
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

// ========================== CAMERA ==========================
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 10);
camera.lookAt(0, 0, 0);

// ========================== RENDERER ==========================
var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container').appendChild(renderer.domElement);
renderer.shadowMap.enabled = true;

// ========================== GLOBAL VARIABLES ==========================
var customModel;
var parts = {};
var activeTweens = [];

// ========================== TWEEN CONTROL ==========================
function clearTweens() {
    activeTweens.forEach(function(t) { t.stop(); });
    activeTweens = [];
    Object.values(parts).forEach(function(p) {
        if (p && p.rotation) p.rotation.set(0, 0, 0);
    });
}

// ========================== LOAD MODEL ==========================
window.changeModel = function changeModel(modelPath) {
    var loader = new THREE.FBXLoader();
    
    clearTweens();
    if (customModel) {
        scene.remove(customModel);
        customModel = null;
        parts = {};
    }

    if (modelPath === 'assets/modelos/lego spider man.fbx') {
        loader.setResourcePath('assets/skins/'); 
    }
    
    console.log("Carregando o modelo:", modelPath);
    
    loader.load(
        modelPath,
        function (object) {
            var bbox = new THREE.Box3().setFromObject(object);
            var size = new THREE.Vector3();
            bbox.getSize(size);
            var maxDim = Math.max(size.x, size.y, size.z);
            var desiredSize = 4.5;
            var scaleFactor = desiredSize / maxDim;
            object.scale.set(scaleFactor, scaleFactor, scaleFactor);

            bbox.setFromObject(object);

            var center = bbox.getCenter(new THREE.Vector3());
            object.position.x -= center.x;
            object.position.z -= center.z;

            bbox.setFromObject(object);
            var floorY = -2;
            var deltaY = floorY - bbox.min.y;
            object.position.y += deltaY;

            var target = new THREE.Vector3(camera.position.x, object.position.y, camera.position.z);
            object.lookAt(target);

            if (modelPath === 'assets/modelos/legomandefault.fbx' || modelPath === 'assets/modelos/lego spider man.fbx') {
                object.rotation.y -= Math.PI / 2;
            }

            scene.add(object);
            customModel = object;

            object.traverse(function (child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });


            if (modelPath === 'assets/modelos/legomandefault.fbx') {
                parts.head = object.getObjectByName('Cylinder006');
                parts.armLeft = object.getObjectByName('Cylinder009');
                parts.armRight = object.getObjectByName('Cylinder012');
                parts.handLeft = object.getObjectByName('Cylinder004');
                parts.handRight = object.getObjectByName('Cylinder016');
                parts.legLeft = object.getObjectByName('Cylinder014');
                parts.legRight = object.getObjectByName('Cylinder013');
                parts.trousers = object.getObjectByName('Cylinder010');
                parts.innertight = object.getObjectByName('Cylinder011');
                console.log("Partes disponíveis:", parts);
            } else {
                parts = {};
            }
        },
        undefined,
        function (error) {
            console.error('Erro ao carregar modelo:', error);
            alert("Falha ao carregar o modelo. Verifique o caminho '" + modelPath + "' e se o arquivo é um FBX válido.");
        }
    );
}

// ========================== INITIAL MODEL ==========================
changeModel('assets/modelos/legomandefault.fbx');

// ========================== LIGHTS ==========================
var ambientLight = new THREE.AmbientLight(0xffffff, 0.3); // luz branca com baixa intensidade
scene.add(ambientLight);

var directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(50, 100, 50);
directionalLight.castShadow = true;

directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;

directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.camera.left = -100;
directionalLight.shadow.camera.right = 100;
directionalLight.shadow.camera.top = 100;
directionalLight.shadow.camera.bottom = -100;

scene.add(directionalLight);


// var helper = new THREE.CameraHelper( directionalLight.shadow.camera );
// scene.add(helper);

// ========================== ORBIT CONTROLS ==========================
var controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 5;
controls.maxDistance = 50;
controls.maxPolarAngle = Math.PI / 2;

// ========================== WINDOW RESIZE ==========================
window.addEventListener('resize', function () {
    var w = window.innerWidth;
    var h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
});

// ========================== ANIMATIONS ==========================
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
                .to({ y: Math.PI / 4 }, 400)
                .easing(TWEEN.Easing.Sinusoidal.InOut)
                .yoyo(true)
                .repeat(Infinity)
                .start(),
            new TWEEN.Tween(parts.legRight.rotation)
                .to({ y: -Math.PI / 4 }, 400)
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

// ========================== RENDER LOOP ==========================
var clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    clock.getDelta();
    TWEEN.update();
    controls.update();
    renderer.render(scene, camera);
}
animate();
