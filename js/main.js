// ========================== GLOBAL VARIABLES ==========================
var customModel;
var parts = {};
var activeTweens = [];
var animationMixer = null;
var animationActions = {};
var currentEnvironment = 'grassy';
var controls;

var currentMusic = null;
var musicVolume = 0.5;
var isMuted = false;
var previousVolume = 0.5;

var environments = {
    grassy: {
        name: "🌱 Campo Verde",
        skyColor: 0x87ceeb,
        floorColor: 0x228b22,
        floorTexture: 'assets/textures/lego.jpg',
        ambientLight: { color: 0xffffff, intensity: 0.4 },
        directionalLight: { color: 0xffffff, intensity: 1.8, position: [50, 100, 50] },
        hemisphereLight: { skyColor: 0x87ceeb, groundColor: 0x228b22, intensity: 0.6 },
        pointLights: [
            { color: 0xffffff, intensity: 0.8, position: [20, 15, 20], distance: 80 },
            { color: 0xffffaa, intensity: 0.6, position: [-20, 12, -20], distance: 60 }
        ]
    },
    starwars: {
        name: "⭐ Star Wars",
        skyColor: 0x000011,
        floorColor: 0xC4D8E2,
        floorTexture: 'assets/textures/lego.jpg',
        ambientLight: { color: 0x4444ff, intensity: 0.3 },
        directionalLight: { color: 0xaaaaff, intensity: 1.2, position: [30, 80, 30] },
        hemisphereLight: { skyColor: 0x000022, groundColor: 0x111111, intensity: 0.4 },
        pointLights: [
            { color: 0xff4444, intensity: 1.0, position: [15, 10, 15], distance: 50 },
            { color: 0x4444ff, intensity: 0.8, position: [-15, 8, -15], distance: 40 },
            { color: 0xffffff, intensity: 0.5, position: [0, 20, 0], distance: 100 }
        ]
    },
    desert: {
        name: "🏜️ Deserto",
        skyColor: 0xffd700,
        floorColor: 0xdaa520,
        floorTexture: 'assets/textures/lego.jpg',
        ambientLight: { color: 0xffe4b5, intensity: 0.5 },
        directionalLight: { color: 0xffdd88, intensity: 2.0, position: [80, 120, 40] },
        hemisphereLight: { skyColor: 0xffd700, groundColor: 0xdaa520, intensity: 0.8 },
        pointLights: [
            { color: 0xffaa44, intensity: 0.7, position: [25, 8, 25], distance: 70 },
            { color: 0xff8844, intensity: 0.5, position: [-25, 6, -25], distance: 50 }
        ]
    }
};

var scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

var floorGeometry = new THREE.PlaneGeometry(100, 100);
var floorMaterial = new THREE.MeshLambertMaterial({ color: 0x228b22 });
var floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -2;
floor.name = 'gameFloor';
floor.receiveShadow = true;
scene.add(floor);

var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 10);
camera.lookAt(0, 0, 0);

var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById('container').appendChild(renderer.domElement);

controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 4;
controls.maxDistance = 5;
controls.maxPolarAngle = Math.PI/2;

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.gammaFactor = 2.2;
renderer.outputColorSpace = THREE.SRGBColorSpace;

function initializeLighting() {
    var env = environments[currentEnvironment];
    
    var ambientLight = new THREE.AmbientLight(env.ambientLight.color, env.ambientLight.intensity);
    ambientLight.name = 'ambientLight';
    scene.add(ambientLight);
    
    var directionalLight = new THREE.DirectionalLight(
        env.directionalLight.color, 
        env.directionalLight.intensity
    );
    directionalLight.position.set(...env.directionalLight.position);
    directionalLight.name = 'directionalLight';
    
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 4096;
    directionalLight.shadow.mapSize.height = 4096;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 1000;
    directionalLight.shadow.camera.left = -150;
    directionalLight.shadow.camera.right = 150;
    directionalLight.shadow.camera.top = 150;
    directionalLight.shadow.camera.bottom = -150;
    directionalLight.shadow.bias = -0.0001;
    directionalLight.shadow.normalBias = 0.02;
    scene.add(directionalLight);
    
    if (env.hemisphereLight) {
        var hemisphereLight = new THREE.HemisphereLight(
            env.hemisphereLight.skyColor, 
            env.hemisphereLight.groundColor, 
            env.hemisphereLight.intensity
        );
        hemisphereLight.name = 'hemisphereLight';
        scene.add(hemisphereLight);
    }
    
    if (env.pointLights) {
        env.pointLights.forEach(function(lightConfig, index) {
            var pointLight = new THREE.PointLight(
                lightConfig.color, 
                lightConfig.intensity, 
                lightConfig.distance
            );
            pointLight.position.set(...lightConfig.position);
            pointLight.name = 'pointLight_' + index;
            
            if (index === 0) {
                pointLight.castShadow = true;
                pointLight.shadow.mapSize.width = 1024;
                pointLight.shadow.mapSize.height = 1024;
                pointLight.shadow.camera.near = 0.5;
                pointLight.shadow.camera.far = lightConfig.distance;
            }
            
            scene.add(pointLight);
        });
    }
}

function initializeScene() {
    initializeLighting();
    
    var textureLoader = new THREE.TextureLoader();
    textureLoader.load('assets/textures/lego.jpg', function(texture) {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(15, 15);
        floorMaterial.map = texture;
        floorMaterial.needsUpdate = true;
    }, undefined, function(error) {
        console.log("Textura não encontrada, usando cor base");
    });
    
    addEnvironmentEffects(currentEnvironment);
    
    setTimeout(function() {
        changeModel('assets/modelos/animated_lego_darth_maul.glb');
        
        if (currentEnvironment === 'starwars') {
            setTimeout(function() {
                disableAnimationButtons();
                createIdleAnimation();
            }, 1000);
        }
    }, 100);
}

function changeEnvironment(envName) {
    if (!environments[envName]) return;
    
    currentEnvironment = envName;
    var env = environments[envName];
    
    scene.background = new THREE.Color(env.skyColor);
    
    var floor = scene.getObjectByName('gameFloor');
    if (floor) {
        floor.material.color.setHex(env.floorColor);
        
        if (env.floorTexture) {
            var textureLoader = new THREE.TextureLoader();
            textureLoader.load(env.floorTexture, function(texture) {
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set(15, 15);
                floor.material.map = texture;
                floor.material.needsUpdate = true;
            }, undefined, function(error) {
                floor.material.map = null;
                floor.material.needsUpdate = true;
            });
        }
    }
    
    updateLighting(env);
    addEnvironmentEffects(envName);
    playEnvironmentMusic(envName);
    
    if (envName === 'starwars') {
        disableAnimationButtons();
        setTimeout(function() {
            createIdleAnimation();
        }, 500);
    } else {
        enableAnimationButtons();
        clearTweens();
    }
}

function updateLighting(env) {
    var lightsToRemove = [];
    scene.traverse(function(child) {
        if (child.type === 'AmbientLight' || 
            child.type === 'DirectionalLight' || 
            child.type === 'HemisphereLight' || 
            child.type === 'PointLight') {
            lightsToRemove.push(child);
        }
    });
    lightsToRemove.forEach(light => scene.remove(light));
    
    initializeLighting();
    
    switch(currentEnvironment) {
        case 'starwars':
            renderer.toneMappingExposure = 0.8;
            break;
        case 'desert':
            renderer.toneMappingExposure = 1.5;
            break;
        case 'grassy':
            renderer.toneMappingExposure = 1.2;
            break;
    }
}

function addEnvironmentEffects(envName) {
    var effectsToRemove = [];
    scene.traverse(function(child) {
        if (child.userData.isEnvironmentEffect) {
            effectsToRemove.push(child);
        }
    });
    effectsToRemove.forEach(effect => scene.remove(effect));
    
    switch(envName) {
        case 'starwars':
            addStarWars();
            break;
        case 'desert':
            addDesert();
            break;
        case 'grassy':
            addGreen();
            break;
    }
}

function addStarWars() {
    addGLBModel('assets/modelos/stars.glb', {x: 0, y: 0, z: 0}, 1, 1, 'stars');
    var starsGeometry = new THREE.BufferGeometry();
    var starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 2 });
    
    var starsVertices = [];
    for (let i = 0; i < 10000; i++) {
        starsVertices.push(
            (Math.random() - 0.5) * 2000,
            Math.random() * 1000 + 200,
            (Math.random() - 0.5) * 2000
        );
    }
    
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    var starField = new THREE.Points(starsGeometry, starsMaterial);
    starField.userData.isEnvironmentEffect = true;
    scene.add(starField);

    addFloatingGLBModel('assets/modelos/lego_starfighter.glb', {x: -10, y: 2, z: -10}, 3, Math.PI / 4, 'starfighter');
    addFloatingGLBModel('assets/modelos/lego_space_dart_i.glb', {x: 10, y: 0, z: -10}, 1/14, -Math.PI / 4, 'starfighter2');
}

function addFloatingGLBModel(modelPath, position, scale, rotation, name) {
    var loader = new THREE.GLTFLoader();
    
    loader.load(modelPath, function(gltf) {
        var model = gltf.scene.clone();
        
        model.position.set(position.x, position.y, position.z);
        model.scale.set(scale, scale, scale);
        model.rotation.y = rotation || 0;
        model.userData.isEnvironmentEffect = true;
        model.name = name;
        
        model.traverse(function(child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.frustumCulled = false;
            }
        });
        
        scene.add(model);
        
        model.userData.floatOffset = Math.random() * Math.PI * 2;
        model.userData.originalY = position.y;
    });
}

function addLegoSand() {
    var brickGeometry = new THREE.BoxGeometry(0.15, 0.08, 0.15);
    
    var sandMaterials = [
        new THREE.MeshLambertMaterial({ color: 0xdaa520 }),
        new THREE.MeshLambertMaterial({ color: 0xf4a460 }),
        new THREE.MeshLambertMaterial({ color: 0xffd700 }),
        new THREE.MeshLambertMaterial({ color: 0xffb347 }),
        new THREE.MeshLambertMaterial({ color: 0xd2691e }),
        new THREE.MeshLambertMaterial({ color: 0xf5deb3 })
    ];
    
    for (var i = 0; i < 3000; i++) {
        var x = (Math.random() - 0.5) * 100;
        var z = (Math.random() - 0.5) * 100;
        
        var material = sandMaterials[Math.floor(Math.random() * sandMaterials.length)];
        var sandBrick = new THREE.Mesh(brickGeometry, material);
        
        sandBrick.position.set(x, -1.95, z);
        sandBrick.rotation.y = Math.random() * Math.PI * 2;
        
        sandBrick.scale.y = 0.3 + Math.random() * 0.4;
        sandBrick.scale.x = 0.8 + Math.random() * 0.4;
        sandBrick.scale.z = 0.8 + Math.random() * 0.4;
        
        sandBrick.userData.isEnvironmentEffect = true;
        sandBrick.name = 'lego_sand_' + i;
        sandBrick.castShadow = true;
        
        scene.add(sandBrick);
    }
}

function addDesert() {
    addLegoSand();
    addGLBModel('assets/modelos/sky.glb', {x: 0, y: -120, z: 0}, 1, 1, 'sky');
    
    var pyramidGeometry = new THREE.ConeGeometry(15, 20, 4);
    var pyramidMaterial = new THREE.MeshLambertMaterial({ color: 0xdaa520 });
    
    var pyramid1 = new THREE.Mesh(pyramidGeometry, pyramidMaterial);
    pyramid1.position.set(-40, 8, -30);
    pyramid1.rotation.y = Math.PI / 4;
    pyramid1.userData.isEnvironmentEffect = true;
    scene.add(pyramid1);

    var pyramid2 = new THREE.Mesh(pyramidGeometry, pyramidMaterial);
    pyramid2.position.set(40, 8, -30);
    pyramid2.rotation.y = Math.PI / 4;
    pyramid2.userData.isEnvironmentEffect = true;
    scene.add(pyramid2);
    
    addGLBModel('assets/modelos/lego_trophy.glb', {x: 0, y: -2, z: -30}, 1, 0, 'trophy');
    addSimpleCactus();
}

function addGreen() {
    addLegoGrass();
    addGLBModel('assets/modelos/sky.glb', {x: 0, y: 0, z: 0}, 1, 1, 'sky');

    var minDistance = 30;
    
    for (var i = 0; i < 20; i++) {
        var x, z, distance;
        
        do {
            x = (Math.random() - 0.5) * 80;
            z = (Math.random() - 0.5) * 80;
            distance = Math.sqrt(x * x + z * z);
        } while (distance < minDistance);
        
        var rotation = Math.random() * Math.PI * 2;
        addGLBModel('assets/modelos/lego_tree.glb', {x: x, y: -2, z: z}, 2, rotation, 'arvore_lego_' + i);
    }
    
    addGLBModel('assets/modelos/lego-house.glb', {x: -15, y: -2, z: -10}, 50, Math.PI/4, 'house1');
    addGLBModel('assets/modelos/lego_house_jayden_hill_wip.glb', {x: 15, y: 0.5, z: -15}, 1, Math.PI/4, 'house2');
    addGLBModel('assets/modelos/modern_lego_house.glb', {x: 5, y: -2, z: -25}, 1, 0, 'house3');
}

function addSimpleCactus() {
    var cactusCount = 50;
    var minDistanceFromCenter = 5;
    var minDistanceFromObjects = 5;
    
    for (var i = 0; i < cactusCount; i++) {
        var x, z, validPosition = false;
        var attempts = 0;
        
        do {
            x = (Math.random() - 0.5) * 90;
            z = (Math.random() - 0.5) * 90;
            
            var distanceFromCenter = Math.sqrt(x * x + z * z);
            var distanceFromPyramid1 = Math.sqrt((x + 40) * (x + 40) + (z + 30) * (z + 30));
            var distanceFromPyramid2 = Math.sqrt((x - 40) * (x - 40) + (z + 30) * (z + 30));
            var distanceFromTrophy = Math.sqrt(x * x + (z + 30) * (z + 30));
            
            validPosition = (distanceFromCenter >= minDistanceFromCenter) &&
                           (distanceFromPyramid1 >= minDistanceFromObjects) &&
                           (distanceFromPyramid2 >= minDistanceFromObjects) &&
                           (distanceFromTrophy >= minDistanceFromObjects);
            
            attempts++;
        } while (!validPosition && attempts < 30);
        
        if (validPosition) {
            addGLBModel('assets/modelos/voxel_cactus_1x2.glb', {x: x, y: -2, z: z}, 1, Math.random() * Math.PI * 2, 'cactus_' + i);
        }
    }
}

function addLegoGrass() {
    var brickGeometry = new THREE.BoxGeometry(0.2, 0.1, 0.2);
    
    var grassMaterials = [
        new THREE.MeshLambertMaterial({ color: 0x228b22 }),
        new THREE.MeshLambertMaterial({ color: 0x32cd32 }),
        new THREE.MeshLambertMaterial({ color: 0x90ee90 }),
        new THREE.MeshLambertMaterial({ color: 0x00ff00 })
    ];
    
    for (var i = 0; i < 5000; i++) {
        var x = (Math.random() - 0.5) * 100;
        var z = (Math.random() - 0.5) * 100;
        
        var material = grassMaterials[Math.floor(Math.random() * grassMaterials.length)];
        var grassBrick = new THREE.Mesh(brickGeometry, material);
        
        grassBrick.position.set(x, -1.9, z);
        grassBrick.rotation.y = Math.random() * Math.PI * 2;
        grassBrick.scale.y = 0.5 + Math.random() * 0.5;
        
        grassBrick.userData.isEnvironmentEffect = true;
        grassBrick.name = 'lego_grass_' + i;
        grassBrick.castShadow = true;
        
        scene.add(grassBrick);
    }
}

function addGLBModel(modelPath, position, scale, rotation, name) {
    var loader = new THREE.GLTFLoader();
    
    loader.load(
        modelPath,
        function(gltf) {
            var model = gltf.scene.clone();
            
            model.position.set(position.x, position.y, position.z);
            model.scale.set(scale, scale, scale);
            model.rotation.y = rotation || 0;

            if (scale < 0.5) {
                model.traverse(function(child) {
                    if (child.isMesh) {
                        child.frustumCulled = false;
                    }
                });
            }
            
            model.userData.isEnvironmentEffect = true;
            model.name = name || 'glb_model';
            
            model.traverse(function(child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    if (child.name && (
                        child.name.toLowerCase().includes('background') ||
                        child.name.toLowerCase().includes('plane') ||
                        child.name.toLowerCase().includes('ground') ||
                        child.name.toLowerCase().includes('floor') ||
                        child.name.toLowerCase().includes('base')
                    )) {
                        child.visible = false;
                    }
                    
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(function(mat, index) {
                                if (mat.color && mat.color.r < 0.1 && mat.color.g < 0.1 && mat.color.b < 0.1) {
                                    child.visible = false;
                                }
                            });
                        } else {
                            if (child.material.color && 
                                child.material.color.r < 0.1 && 
                                child.material.color.g < 0.1 && 
                                child.material.color.b < 0.1) {
                                child.visible = false;
                            }
                        }
                    }
                }
            });
            
            if (gltf.animations && gltf.animations.length > 0) {
                var mixer = new THREE.AnimationMixer(model);
                
                gltf.animations.forEach(function(clip, index) {
                    var action = mixer.clipAction(clip);
                    action.setLoop(THREE.LoopOnce);
                    action.clampWhenFinished = true;
                    action.play();
                });
                
                model.userData.animationMixer = mixer;
            }
            
            scene.add(model);
        },
        undefined,
        function(error) {
            console.error(`Erro ao carregar modelo ${name}:`, error);
        }
    );
}

function clearTweens() {
    if (currentEnvironment === 'starwars') return;
    
    activeTweens.forEach(function(t) { t.stop(); });
    activeTweens = [];
    
    if (animationMixer) {
        Object.values(animationActions).forEach(function(action) {
            action.stop();
        });
    }
    
    if (customModel) {
        if (customModel.userData.modelType === 'indiana') {
            customModel.rotation.set(0, 0, 0);
        } else if (customModel.userData.modelType === 'travis') {
            customModel.rotation.set(0, Math.PI / 2, 0);
        } else {
            customModel.rotation.set(0, 0, 0);
        }
        
        customModel.position.y = customModel.userData.originalY || customModel.position.y;
    }
}

function createIdleAnimation() {
    if (!customModel) return;
    
    var breathe = new TWEEN.Tween(customModel.position)
        .to({ y: customModel.userData.originalY + 0.1 }, 2000)
        .easing(TWEEN.Easing.Sinusoidal.InOut)
        .yoyo(true)
        .repeat(Infinity);
    
    var originalRotationY = customModel.rotation.y;
    var targetRotationY = originalRotationY + Math.PI / 12;
    
    var lookAround = new TWEEN.Tween(customModel.rotation)
        .to({ y: targetRotationY }, 3000)
        .easing(TWEEN.Easing.Sinusoidal.InOut)
        .yoyo(true)
        .repeat(Infinity);
    
    breathe.start();
    lookAround.start();
    
    activeTweens.push(breathe, lookAround);
}

window.changeModel = function changeModel(modelPath) {
    var loader = new THREE.GLTFLoader();
    
    clearTweens();
    if (customModel) {
        scene.remove(customModel);
        customModel = null;
        parts = {};
        animationMixer = null;
        animationActions = {};
    }
    
    loader.load(
        modelPath,
        function (gltf) {
            var object = gltf.scene;
            
            if (customModel) return;
            
            enhanceModelMaterials(object);
            
            var bbox = new THREE.Box3().setFromObject(object);
            var size = new THREE.Vector3();
            bbox.getSize(size);
            var maxDim = Math.max(size.x, size.y, size.z);

            if (modelPath.includes('indiana')) {
                object.userData.modelType = 'indiana';
                object.scale.set(5, 5, 5);
                object.rotation.y = 0;
            } else if (modelPath.includes('travis')) {
                object.userData.modelType = 'travis';
                object.scale.set(15, 15, 13);
                object.rotation.y = Math.PI / 2;
            } else if (modelPath.includes('darth_maul')) {
                object.userData.modelType = 'darth_maul';
                var scaleFactor = 4.5 / maxDim;
                object.scale.set(scaleFactor, scaleFactor, scaleFactor);
                object.rotation.y = 0;
            }
            
            bbox.setFromObject(object);
            var center = bbox.getCenter(new THREE.Vector3());
            object.position.x -= center.x;
            object.position.z -= center.z;

            bbox.setFromObject(object);
            if (object.userData.modelType === 'travis') {
                object.position.y = -2 - bbox.min.y - 0.75;
            } else {
                var deltaY = -2 - bbox.min.y;
                object.position.y += deltaY;
            }
            object.userData.originalY = object.position.y;

            scene.add(object);
            customModel = object;

            if (gltf.animations && gltf.animations.length > 0) {
                animationMixer = new THREE.AnimationMixer(object);
                
                gltf.animations.forEach(function(clip, index) {
                    var action = animationMixer.clipAction(clip);
                    var actionName = clip.name || 'animation_' + index;
                    animationActions[actionName] = action;
                });
            }
            
            updateAnimationButtonText();
        },
        function(xhr) {},
        function (error) {
            console.error('Erro ao carregar modelo:', error);
        }
    );
}

function playAnimation(type) {
    if (currentEnvironment === 'starwars') return;
    
    clearTweens();
    
    switch(type) {
        case 'mortal':
            if (animationMixer && Object.keys(animationActions).length > 0) {
                if (customModel && customModel.userData.modelType === 'indiana') {
                    var attackAction = null;
                    
                    var attackNames = ['atacar', 'attack', 'Action', 'Scene'];
                    for (var name of attackNames) {
                        if (animationActions[name]) {
                            attackAction = animationActions[name];
                            break;
                        }
                    }
                    
                    if (attackAction) {
                        attackAction.reset().play();
                    } else {
                        var firstActionName = Object.keys(animationActions)[0];
                        if (firstActionName) {
                            animationActions[firstActionName].reset().play();
                        }
                    }
                } else if (customModel && customModel.userData.modelType === 'travis') {
                    var singAction = null;
                    
                    var singNames = ['sing', 'singing', 'cantar', 'perform', 'Action', 'Scene'];
                    for (var name of singNames) {
                        if (animationActions[name]) {
                            singAction = animationActions[name];
                            break;
                        }
                    }
                    
                    if (singAction) {
                        singAction.reset().play();
                    } else {
                        var firstActionName = Object.keys(animationActions)[0];
                        if (firstActionName) {
                            animationActions[firstActionName].reset().play();
                        }
                    }
                } else {
                    var possibleNames = ['Scene', 'Action', 'Animation', 'Take 001', 'Armature|Action'];
                    var foundAction = null;
                    
                    for (var name of possibleNames) {
                        if (animationActions[name]) {
                            foundAction = animationActions[name];
                            break;
                        }
                    }
                    
                    if (foundAction) {
                        foundAction.reset().play();
                    } else {
                        var firstActionName = Object.keys(animationActions)[0];
                        if (firstActionName) {
                            animationActions[firstActionName].reset().play();
                        }
                    }
                }
            }
            break;
    }
}

function updateAnimationButtonText() {
    var animationButton = document.querySelector('button[onclick*="playAnimation(\'mortal\')"]') ||
                         document.querySelector('button[onclick*="mortal"]') ||
                         document.querySelector('.animation-controls button:first-of-type');
    
    if (animationButton && customModel) {
        if (customModel.userData.modelType === 'indiana') {
            animationButton.textContent = '🏹 Atacar';
            animationButton.title = 'Indiana Jones ataca!';
        } else if (customModel.userData.modelType === 'travis') {
            animationButton.textContent = '🎤 Cantar';
            animationButton.title = 'Travis Scott canta!';
        } else if (customModel.userData.modelType === 'darth_maul') {
            animationButton.textContent = '💀 Mortal para Trás';
            animationButton.title = 'Animação mortal do Darth Maul';
        } else {
            animationButton.textContent = '🎬 Animação';
            animationButton.title = 'Executar animação do modelo';
        }
    }
}

function disableAnimationButtons() {
    var animationButtons = document.querySelectorAll('button[onclick*="playAnimation"]');
    var stopButton = document.querySelector('button[onclick*="clearTweens"]');
    
    animationButtons.forEach(function(button) {
        button.disabled = true;
        button.style.opacity = '0.5';
        button.style.cursor = 'not-allowed';
    });
    
    if (stopButton) {
        stopButton.disabled = true;
        stopButton.style.opacity = '0.5';
        stopButton.style.cursor = 'not-allowed';
    }
    
    var controlsDiv = document.querySelector('.controls') || document.body;
    var existingMessage = document.getElementById('starwars-message');
    if (!existingMessage) {
        var message = document.createElement('div');
        message.id = 'starwars-message';
        message.style.cssText = 'color: #00aaff; font-size: 14px; margin: 10px 0; text-align: center;';
        message.textContent = '⭐ No ambiente Star Wars, Darth Maul medita automaticamente';
        controlsDiv.appendChild(message);
    }
}

function enableAnimationButtons() {
    var animationButtons = document.querySelectorAll('button[onclick*="playAnimation"]');
    var stopButton = document.querySelector('button[onclick*="clearTweens"]');
    
    animationButtons.forEach(function(button) {
        button.disabled = false;
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
    });
    
    if (stopButton) {
        stopButton.disabled = false;
        stopButton.style.opacity = '1';
        stopButton.style.cursor = 'pointer';
    }
    
    var message = document.getElementById('starwars-message');
    if (message) {
        message.remove();
    }
}

function enhanceModelMaterials(object) {
    object.traverse(function(child) {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(function(mat) {
                        enhanceSingleMaterial(mat);
                    });
                } else {
                    enhanceSingleMaterial(child.material);
                }
            }
        }
    });
}

function enhanceSingleMaterial(material) {
    if (material.isMeshStandardMaterial || material.isMeshPhongMaterial) {
        material.roughness = material.roughness || 0.7;
        material.metalness = material.metalness || 0.1;
    }
    
    if (material.transparent) {
        material.alphaTest = 0.1;
    }
    
    material.needsUpdate = true;
}

var clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    var delta = clock.getDelta();
    
    if (animationMixer) {
        animationMixer.update(delta);
    }
    
    scene.traverse(function(child) {
        if (child.userData.animationMixer) {
            child.userData.animationMixer.update(delta);
        }
        
        if ((child.name === 'starfighter' || child.name === 'starfighter2') && child.userData.originalY !== undefined) {
            var time = Date.now() * 0.001;
            child.position.y = child.userData.originalY + Math.sin(time + child.userData.floatOffset) * 1;
        }
    });
    
    TWEEN.update();
    controls.update();
    renderer.render(scene, camera);
}

var sceneInitialized = false;

function initializeOnce() {
    if (sceneInitialized) return;
    
    sceneInitialized = true;
    initializeScene();
    animate();
}

document.addEventListener('DOMContentLoaded', function() {
    initializeOnce();
});

if (document.readyState !== 'loading') {
    setTimeout(initializeOnce, 10);
}

function initializeMusic() {
    var musicFiles = {
        grassy: 'music/mine.mp3',
        starwars: 'music/starwarsmusic.mp3',
        desert: 'music/egypt.mp3'
    };
    
    return musicFiles;
}

function playEnvironmentMusic(envName) {
    var musicFiles = initializeMusic();
    var musicFile = musicFiles[envName];
    
    if (!musicFile) return;
    
    if (currentMusic) {
        currentMusic.pause();
        currentMusic.currentTime = 0;
        currentMusic = null;
    }
    
    currentMusic = new Audio(musicFile);
    currentMusic.loop = true;
    currentMusic.volume = isMuted ? 0 : musicVolume;
    
    currentMusic.addEventListener('canplaythrough', function() {
        currentMusic.play().catch(function(error) {
            console.log("Clique na tela para ativar o áudio");
        });
    });
    
    currentMusic.addEventListener('error', function(e) {
        console.error("Erro ao carregar música:", musicFile);
    });
    
    currentMusic.load();
}

function changeVolume(value) {
    musicVolume = value / 100;
    document.getElementById('volumeValue').textContent = value + '%';
    
    if (currentMusic && !isMuted) {
        currentMusic.volume = musicVolume;
    }
}

function toggleMute() {
    var muteBtn = document.getElementById('muteBtn');
    
    if (isMuted) {
        isMuted = false;
        if (currentMusic) {
            currentMusic.volume = musicVolume;
        }
        muteBtn.textContent = '🔇 Mute';
        muteBtn.classList.remove('muted');
    } else {
        isMuted = true;
        if (currentMusic) {
            currentMusic.volume = 0;
        }
        muteBtn.textContent = '🔊 Unmute';
        muteBtn.classList.add('muted');
    }
}

window.playAnimation = playAnimation;
window.clearTweens = clearTweens;
window.changeEnvironment = changeEnvironment;

window.loadDarthMaul = function() {
    changeModel('assets/modelos/animated_lego_darth_maul.glb');
}

window.loadIndianaJones = function() {
    changeModel('assets/modelos/indiana.glb');
}

window.loadTravisScott = function() {
    changeModel('assets/modelos/travis.glb');
}

document.getElementById('startBtn').addEventListener('click', function() {
    document.getElementById('initialMenu').style.display = 'none';
    document.getElementById('menu').style.display = 'block';
    document.getElementById('volumeControl').style.display = 'block';
    
    setTimeout(function() {
        playEnvironmentMusic(currentEnvironment);
    }, 500);
});

window.changeVolume = changeVolume;
window.toggleMute = toggleMute;