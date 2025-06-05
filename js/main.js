// ========================== GLOBAL VARIABLES ==========================
var customModel;
var parts = {};
var activeTweens = [];
var animationMixer = null;
var animationActions = {};
var currentEnvironment = 'grassy';
var controls; // Add this line

// ========================== ENVIRONMENTS (Iluminação melhorada) ==========================
var environments = {
    grassy: {
        name: "🌱 Campo Verde",
        skyColor: 0x87ceeb,
        floorColor: 0x228b22,
        floorTexture: 'assets/textures/lego.jpg',
        ambientLight: { color: 0xffffff, intensity: 0.4 }, // Mais luz ambiente
        directionalLight: { color: 0xffffff, intensity: 1.8, position: [50, 100, 50] }, // Mais intensa
        hemisphereLight: { skyColor: 0x87ceeb, groundColor: 0x228b22, intensity: 0.6 }, // Nova luz
        pointLights: [
            { color: 0xffffff, intensity: 0.8, position: [20, 15, 20], distance: 80 },
            { color: 0xffffaa, intensity: 0.6, position: [-20, 12, -20], distance: 60 }
        ]
    },
    starwars: {
        name: "⭐ Star Wars",
        skyColor: 0x000011,
        floorColor: 0x333333,
        floorTexture: 'assets/textures/lego.jpg',
        ambientLight: { color: 0x4444ff, intensity: 0.3 },
        directionalLight: { color: 0xaaaaff, intensity: 1.2, position: [30, 80, 30] },
        hemisphereLight: { skyColor: 0x000022, groundColor: 0x111111, intensity: 0.4 },
        pointLights: [
            { color: 0xff4444, intensity: 1.0, position: [15, 10, 15], distance: 50 }, // Luz vermelha Sith
            { color: 0x4444ff, intensity: 0.8, position: [-15, 8, -15], distance: 40 }, // Luz azul espacial
            { color: 0xffffff, intensity: 0.5, position: [0, 20, 0], distance: 100 } // Luz da estação espacial
        ]
    },
    desert: {
        name: "🏜️ Deserto",
        skyColor: 0xffd700,
        floorColor: 0xdaa520,
        floorTexture: 'assets/textures/lego.jpg',
        ambientLight: { color: 0xffe4b5, intensity: 0.5 },
        directionalLight: { color: 0xffdd88, intensity: 2.0, position: [80, 120, 40] }, // Sol forte
        hemisphereLight: { skyColor: 0xffd700, groundColor: 0xdaa520, intensity: 0.8 },
        pointLights: [
            { color: 0xffaa44, intensity: 0.7, position: [25, 8, 25], distance: 70 }, // Reflexo da areia
            { color: 0xff8844, intensity: 0.5, position: [-25, 6, -25], distance: 50 } // Calor do deserto
        ]
    }
};

// ========================== SCENE INITIALIZATION ==========================
var scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// ========================== FLOOR (Add this section) ==========================
var floorGeometry = new THREE.PlaneGeometry(100, 100);
var floorMaterial = new THREE.MeshLambertMaterial({ color: 0x228b22 });
var floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -2;
floor.name = 'gameFloor';
floor.receiveShadow = true;
scene.add(floor);

// ========================== CAMERA ==========================
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 10);
camera.lookAt(0, 0, 0);

// ========================== RENDERER (Melhorado) ==========================
var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById('container').appendChild(renderer.domElement);

// ========================== CONTROLS ==========================
// Add OrbitControls after renderer is created
controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 4;
controls.maxDistance = 5;
controls.maxPolarAngle = Math.PI/2 ;

// Shadows melhorados
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Sombras mais suaves
renderer.shadowMap.autoUpdate = true;

// Tone mapping para melhor iluminação
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

// Gamma correction
renderer.gammaFactor = 2.2;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// ========================== INITIAL LIGHTING (Melhorada) ==========================
function initializeLighting() {
    console.log("Configurando iluminação avançada...");
    var env = environments[currentEnvironment];
    
    // 1. Luz ambiente suave
    var ambientLight = new THREE.AmbientLight(env.ambientLight.color, env.ambientLight.intensity);
    ambientLight.name = 'ambientLight';
    scene.add(ambientLight);
    
    // 2. Luz direcional principal (sol/lua)
    var directionalLight = new THREE.DirectionalLight(
        env.directionalLight.color, 
        env.directionalLight.intensity
    );
    directionalLight.position.set(...env.directionalLight.position);
    directionalLight.name = 'directionalLight';
    
    // Sombras melhoradas
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 4096; // Maior resolução
    directionalLight.shadow.mapSize.height = 4096;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 1000;
    directionalLight.shadow.camera.left = -150;
    directionalLight.shadow.camera.right = 150;
    directionalLight.shadow.camera.top = 150;
    directionalLight.shadow.camera.bottom = -150;
    directionalLight.shadow.bias = -0.0001; // Reduzir acne de sombra
    directionalLight.shadow.normalBias = 0.02;
    scene.add(directionalLight);
    
    // 3. Luz hemisférica (iluminação natural)
    if (env.hemisphereLight) {
        var hemisphereLight = new THREE.HemisphereLight(
            env.hemisphereLight.skyColor, 
            env.hemisphereLight.groundColor, 
            env.hemisphereLight.intensity
        );
        hemisphereLight.name = 'hemisphereLight';
        scene.add(hemisphereLight);
    }
    
    // 4. Luzes pontuais para detalhes
    if (env.pointLights) {
        env.pointLights.forEach(function(lightConfig, index) {
            var pointLight = new THREE.PointLight(
                lightConfig.color, 
                lightConfig.intensity, 
                lightConfig.distance
            );
            pointLight.position.set(...lightConfig.position);
            pointLight.name = 'pointLight_' + index;
            
            // Algumas luzes pontuais também fazem sombras
            if (index === 0) { // Primeira luz faz sombra
                pointLight.castShadow = true;
                pointLight.shadow.mapSize.width = 1024;
                pointLight.shadow.mapSize.height = 1024;
                pointLight.shadow.camera.near = 0.5;
                pointLight.shadow.camera.far = lightConfig.distance;
            }
            
            scene.add(pointLight);
        });
    }
    
    console.log("Iluminação avançada configurada para:", currentEnvironment);
}

// ========================== INITIALIZE SCENE ==========================
function initializeScene() {
    console.log("Inicializando cena...");
    
    // 1. Configurar iluminação
    initializeLighting();
    
    // 2. Carregar textura LEGO do chão
    var textureLoader = new THREE.TextureLoader();
    textureLoader.load('assets/textures/lego.jpg', function(texture) {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(15, 15);
        floorMaterial.map = texture;
        floorMaterial.needsUpdate = true;
        console.log("Textura LEGO carregada no chão!");
    }, undefined, function(error) {
        console.log("Textura LEGO não encontrada, usando cor sólida");
    });
    
    // 3. Configurar ambiente inicial
    addEnvironmentEffects(currentEnvironment);
    
    // 4. Carregar modelo UMA VEZ SÓ (só depois de tudo estar pronto)
    setTimeout(function() {
        console.log("Carregando modelo pela primeira vez...");
        changeModel('assets/modelos/animated_lego_darth_maul.glb');
    }, 100);
    
    console.log("Cena inicializada com sucesso!");
}

// ========================== ENVIRONMENT FUNCTIONS ==========================
function changeEnvironment(envName) {
    if (!environments[envName]) return;
    
    console.log("Mudando para ambiente:", envName);
    currentEnvironment = envName;
    var env = environments[envName];
    
    // Mudar cor do céu
    scene.background = new THREE.Color(env.skyColor);
    
    // Mudar cor do chão LEGO
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
                console.log("Chão LEGO atualizado para:", envName);
            }, undefined, function(error) {
                console.log("Textura LEGO não encontrada, usando apenas cor:", env.floorTexture);
                floor.material.map = null;
                floor.material.needsUpdate = true;
            });
        }
    }
    
    updateLighting(env);
    addEnvironmentEffects(envName);
}

function updateLighting(env) {
    console.log("Atualizando iluminação para:", env.name);
    
    // Remover todas as luzes existentes
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
    
    // Configurar novas luzes
    initializeLighting();
    
    // Atualizar exposição baseada no ambiente
    switch(currentEnvironment) {
        case 'starwars':
            renderer.toneMappingExposure = 0.8; // Mais escuro
            break;
        case 'desert':
            renderer.toneMappingExposure = 1.5; // Mais brilhante
            break;
        case 'grassy':
            renderer.toneMappingExposure = 1.2; // Neutro
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
            addStarField();
            addSpaceStation();
            break;
        case 'desert':
            addDesert();
            break;
        case 'grassy':
            addGreen();
            break;
    }
}

function addStarField() {
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

    addGLBModel('assets/modelos/vintage_lego_set_375.glb', {x: 0, y: 0, z: 0}, 0.25, Math.PI / 4, 'car');
}

function addSpaceStation() {
    var stationGeometry = new THREE.BoxGeometry(20, 5, 20);
    var stationMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
    var station = new THREE.Mesh(stationGeometry, stationMaterial);
    station.position.set(30, 15, -40);
    station.userData.isEnvironmentEffect = true;
    scene.add(station);
}

// ========================== FUNÇÃO PARA ADICIONAR AREIA LEGO ==========================
function addLegoSand() {
    console.log("Adicionando areia LEGO...");
    
    // Geometria de um pequeno tijolo LEGO 1x1 para areia
    var brickGeometry = new THREE.BoxGeometry(0.15, 0.08, 0.15); // Ligeiramente menor que a relva
    
    // Materiais de areia variados para naturalidade
    var sandMaterials = [
        new THREE.MeshLambertMaterial({ color: 0xdaa520 }), // Dourado escuro
        new THREE.MeshLambertMaterial({ color: 0xf4a460 }), // Sandy brown
        new THREE.MeshLambertMaterial({ color: 0xffd700 }), // Dourado
        new THREE.MeshLambertMaterial({ color: 0xffb347 }), // Laranja claro
        new THREE.MeshLambertMaterial({ color: 0xd2691e }), // Chocolate claro
        new THREE.MeshLambertMaterial({ color: 0xf5deb3 })  // Wheat
    ];
    
    // Criar areia espalhada numa área grande
    for (var i = 0; i < 3000; i++) { // Menos que a relva para não sobrecarregar
        var x = (Math.random() - 0.5) * 100; // Área de 100x100
        var z = (Math.random() - 0.5) * 100;
        
        // Criar pequeno tijolo de areia
        var material = sandMaterials[Math.floor(Math.random() * sandMaterials.length)];
        var sandBrick = new THREE.Mesh(brickGeometry, material);
        
        sandBrick.position.set(x, -1.95, z); // Ligeiramente mais baixo que a relva
        sandBrick.rotation.y = Math.random() * Math.PI * 2; // Rotação aleatória
        
        // Variar ligeiramente a altura e escala para naturalidade da areia
        sandBrick.scale.y = 0.3 + Math.random() * 0.4; // Mais baixo que a relva
        sandBrick.scale.x = 0.8 + Math.random() * 0.4;
        sandBrick.scale.z = 0.8 + Math.random() * 0.4;
        
        sandBrick.userData.isEnvironmentEffect = true;
        sandBrick.name = 'lego_sand_' + i;
        sandBrick.castShadow = true;
        
        scene.add(sandBrick);
    }
}

// ========================== ATUALIZAR FUNÇÃO addDesert ==========================
function addDesert() {
    // Adicionar areia LEGO primeiro
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
    
    // Corrigir as posições Y dos veículos para ficarem no chão
    addGLBModel('assets/modelos/vintage_lego_set_375.glb', {x: 0, y: 0, z: 0}, 0.25, Math.PI / 4, 'car');
   
}

function addGreen() {
    // Adicionar relva LEGO primeiro
    addLegoGrass();
    
    addGLBModel('assets/modelos/sky.glb', {x: 0, y: 0, z: 0}, 1, 1, 'sky');

    var minDistance = 30; // Distância mínima do centro (0,0,0)
    
    for (var i = 0; i < 20; i++) {
        var x, z, distance;
        
        // Gerar posições até encontrar uma que esteja longe o suficiente do centro
        do {
            x = (Math.random() - 0.5) * 80; // Entre -40 e 40
            z = (Math.random() - 0.5) * 80; // Entre -40 e 40
            distance = Math.sqrt(x * x + z * z); // Calcular distância do centro
        } while (distance < minDistance);
        
        var rotation = Math.random() * Math.PI * 2; // Rotação aleatória completa
        
        addGLBModel('assets/modelos/lego_tree.glb', {x: x, y: -2, z: z}, 2, rotation, 'arvore_lego_' + i);
    }
    
    addGLBModel('assets/modelos/lego-house.glb', {x: -15, y: -2, z: -10}, 50, Math.PI/4, 'house1');
    addGLBModel('assets/modelos/lego_house_jayden_hill_wip.glb', {x: 15, y: 0.5, z: -15}, 1, Math.PI/4, 'house2');
    addGLBModel('assets/modelos/modern_lego_house.glb', {x: 5, y: -2, z: -25}, 1, 0, 'house3');
}

// ========================== FUNÇÃO PARA ADICIONAR RELVA LEGO ==========================
function addLegoGrass() {
    console.log("Adicionando relva LEGO...");


    var axesHelper = new THREE.AxesHelper( 5 );
scene.add( axesHelper );
    
    // Geometria de um pequeno tijolo LEGO 1x1
    var brickGeometry = new THREE.BoxGeometry(0.2, 0.1, 0.2);
    
    // Materiais verdes variados para naturalidade
    var grassMaterials = [
        new THREE.MeshLambertMaterial({ color: 0x228b22 }), // Verde escuro
        new THREE.MeshLambertMaterial({ color: 0x32cd32 }), // Verde lima
        new THREE.MeshLambertMaterial({ color: 0x90ee90 }), // Verde claro
        new THREE.MeshLambertMaterial({ color: 0x00ff00 })  // Verde brilhante
    ];
    
    // Criar relva espalhada numa área grande
    for (var i = 0; i < 5000; i++) {
        var x = (Math.random() - 0.5) * 100; // Área de 100x100
        var z = (Math.random() - 0.5) * 100;
        
        // Criar pequeno tijolo de relva
        var material = grassMaterials[Math.floor(Math.random() * grassMaterials.length)];
        var grassBrick = new THREE.Mesh(brickGeometry, material);
        
        grassBrick.position.set(x, -1.9, z); // Ligeiramente acima do chão
        grassBrick.rotation.y = Math.random() * Math.PI * 2; // Rotação aleatória
        
        // Variar ligeiramente a altura para naturalidade
        grassBrick.scale.y = 0.5 + Math.random() * 0.5;
        
        grassBrick.userData.isEnvironmentEffect = true;
        grassBrick.name = 'lego_grass_' + i;
        grassBrick.castShadow = true;
        
        scene.add(grassBrick);
    }
}

// ========================== FUNÇÃO PARA ADICIONAR MODELOS GLB ==========================
function addGLBModel(modelPath, position, scale, rotation, name) {
    var loader = new THREE.GLTFLoader();
    
    loader.load(
        modelPath,
        function(gltf) {
            var model = gltf.scene.clone();
            
            // Aplicar transformações
            model.position.set(position.x, position.y, position.z);
            model.scale.set(scale, scale, scale);
            model.rotation.y = rotation || 0;

            // CORRIGIR FRUSTUM CULLING para objetos pequenos
            if (scale < 0.5) {
                model.traverse(function(child) {
                    if (child.isMesh) {
                        // Desabilitar frustum culling para objetos muito pequenos
                        child.frustumCulled = false;
                    }
                });
            }
            
            // Marcar como efeito do ambiente para ser removido ao trocar cenário
            model.userData.isEnvironmentEffect = true;
            model.name = name || 'glb_model';
            
            // REMOVER QUALQUER FUNDO/PLANO PRETO
            model.traverse(function(child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    // Remover meshes que são fundos/planos
                    if (child.name && (
                        child.name.toLowerCase().includes('background') ||
                        child.name.toLowerCase().includes('plane') ||
                        child.name.toLowerCase().includes('ground') ||
                        child.name.toLowerCase().includes('floor') ||
                        child.name.toLowerCase().includes('base')
                    )) {
                        child.visible = false;
                        console.log(`Ocultando fundo: ${child.name}`);
                    }
                    
                    // Verificar se o material é muito escuro (possivelmente um fundo)
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(function(mat, index) {
                                if (mat.color && mat.color.r < 0.1 && mat.color.g < 0.1 && mat.color.b < 0.1) {
                                    console.log(`Material muito escuro detectado em ${child.name}, índice ${index}`);
                                    child.visible = false;
                                }
                            });
                        } else {
                            if (child.material.color && 
                                child.material.color.r < 0.1 && 
                                child.material.color.g < 0.1 && 
                                child.material.color.b < 0.1) {
                                console.log(`Material muito escuro detectado em ${child.name}`);
                                child.visible = false;
                            }
                        }
                    }
                }
            });
            
            // ANIMAÇÃO AUTOMÁTICA APENAS UMA VEZ PARA OS TIJOLOS LEGO
            if (gltf.animations && gltf.animations.length > 0) {
                console.log(`${name} tem ${gltf.animations.length} animações disponíveis`);
                
                var mixer = new THREE.AnimationMixer(model);
                
                // Executar todas as animações disponíveis automaticamente UMA VEZ
                gltf.animations.forEach(function(clip, index) {
                    var action = mixer.clipAction(clip);
                    action.setLoop(THREE.LoopOnce); // Tocar apenas uma vez
                    action.clampWhenFinished = true; // Manter na posição final
                    action.play();
                    console.log(`Animação ${clip.name || 'animation_' + index} iniciada uma vez em ${name}`);
                });
                
                // Guardar o mixer para update no loop de render
                model.userData.animationMixer = mixer;
            }
            
            scene.add(model);
            console.log(`Modelo ${name} adicionado com animação única:`, modelPath);
        },
        undefined,
        function(error) {
            console.error(`Erro ao carregar modelo ${name}:`, error);
        }
    );
}

// ========================== TWEEN CONTROL ==========================
function clearTweens() {
    activeTweens.forEach(function(t) { t.stop(); });
    activeTweens = [];
    
    if (animationMixer) {
        Object.values(animationActions).forEach(function(action) {
            action.stop();
        });
    }
    
    if (customModel) {
        customModel.rotation.set(0, 0, 0);
        customModel.position.y = customModel.userData.originalY || customModel.position.y;
    }
}

// ========================== ANIMATIONS ==========================
function createCombatAnimation() {
    if (!customModel) return;
    
    console.log("Iniciando animação de combate!");
    
    var stance = new TWEEN.Tween(customModel.rotation)
        .to({ y: Math.PI / 8 }, 500)
        .easing(TWEEN.Easing.Quadratic.Out);
    
    var attack1 = new TWEEN.Tween(customModel.rotation)
        .to({ y: -Math.PI / 6 }, 400)
        .easing(TWEEN.Easing.Quadratic.InOut);
    
    var center = new TWEEN.Tween(customModel.rotation)
        .to({ y: 0 }, 300)
        .easing(TWEEN.Easing.Quadratic.InOut);
    
    var attack2 = new TWEEN.Tween(customModel.rotation)
        .to({ y: Math.PI / 4 }, 400)
        .easing(TWEEN.Easing.Quadratic.InOut);
    
    var jumpStart = new TWEEN.Tween(customModel.position)
        .to({ y: customModel.userData.originalY + 0.8 }, 300)
        .easing(TWEEN.Easing.Quadratic.Out);
    
    var spinJump = new TWEEN.Tween(customModel.rotation)
        .to({ y: Math.PI * 1.5 }, 600)
        .easing(TWEEN.Easing.Quadratic.InOut);
    
    var jumpLand = new TWEEN.Tween(customModel.position)
        .to({ y: customModel.userData.originalY }, 300)
        .easing(TWEEN.Easing.Quadratic.In);
    
    var returnNormal = new TWEEN.Tween(customModel.rotation)
        .to({ x: 0, y: 0, z: 0 }, 500)
        .easing(TWEEN.Easing.Quadratic.Out);
    
    stance.chain(attack1);
    attack1.chain(center);
    center.chain(attack2);
    attack2.chain(jumpStart);
    jumpStart.chain(jumpLand);
    jumpLand.chain(returnNormal);
    
    stance.start();
    
    attack2.onComplete(function() {
        spinJump.start();
    });
    
    activeTweens.push(stance, attack1, center, attack2, jumpStart, spinJump, jumpLand, returnNormal);
}

function createIdleAnimation() {
    if (!customModel) return;
    
    console.log("Animação idle - respiração suave");
    
    var breathe = new TWEEN.Tween(customModel.position)
        .to({ y: customModel.userData.originalY + 0.1 }, 2000)
        .easing(TWEEN.Easing.Sinusoidal.InOut)
        .yoyo(true)
        .repeat(Infinity);
    
    var lookAround = new TWEEN.Tween(customModel.rotation)
        .to({ y: Math.PI / 12 }, 3000)
        .easing(TWEEN.Easing.Sinusoidal.InOut)
        .yoyo(true)
        .repeat(Infinity);
    
    breathe.start();
    lookAround.start();
    
    activeTweens.push(breathe, lookAround);
}

// ========================== LOAD MODEL ==========================
window.changeModel = function changeModel(modelPath) {
    var loader = new THREE.GLTFLoader();
    
    clearTweens();
    if (customModel) {
        console.log("Removendo modelo anterior...");
        scene.remove(customModel);
        customModel = null;
        parts = {};
        animationMixer = null;
        animationActions = {};
    }
    
    console.log("Carregando o Darth Maul GLB:", modelPath);
    
    loader.load(
        modelPath,
        function (gltf) {
            var object = gltf.scene;
            console.log("Darth Maul GLB carregado:", object);
            
            if (customModel) {
                console.log("Modelo já existe, cancelando carregamento duplicado");
                return;
            }
            
            // Melhorar materiais e sombras
            enhanceModelMaterials(object);
            
            // Posicionamento
            var bbox = new THREE.Box3().setFromObject(object);
            var size = new THREE.Vector3();
            bbox.getSize(size);
            var maxDim = Math.max(size.x, size.y, size.z);
            var scaleFactor = 4.5 / maxDim;
            object.scale.set(scaleFactor, scaleFactor, scaleFactor);

            bbox.setFromObject(object);
            var center = bbox.getCenter(new THREE.Vector3());
            object.position.x -= center.x;
            object.position.z -= center.z;

            bbox.setFromObject(object);
            var deltaY = -2 - bbox.min.y;
            object.position.y += deltaY;
            object.userData.originalY = object.position.y;

            scene.add(object);
            customModel = object;

            // Configurar animações (SEM executar automaticamente)
            if (gltf.animations && gltf.animations.length > 0) {
                console.log("Darth Maul GLB tem", gltf.animations.length, "animações nativas");
                
                animationMixer = new THREE.AnimationMixer(object);
                
                gltf.animations.forEach(function(clip, index) {
                    var action = animationMixer.clipAction(clip);
                    var actionName = clip.name || 'animation_' + index;
                    animationActions[actionName] = action;
                    console.log("Animação disponível:", actionName);
                });
                
                // NÃO EXECUTAR NENHUMA ANIMAÇÃO AUTOMATICAMENTE
                console.log("Darth Maul GLB carregado e pronto - aguardando comando manual!");
            }
        },
        function(xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% carregado');
        },
        function (error) {
            console.error('Erro ao carregar Darth Maul GLB:', error);
        }
    );
}

// ========================== PLAY ANIMATION (Atualizada) ==========================
function playAnimation(type) {
    clearTweens();
    
    switch(type) {
        case 'combate':
            createCombatAnimation();
            break;
            
        case 'mortal':
            // Tentar encontrar animação nativa no GLB
            if (animationMixer && Object.keys(animationActions).length > 0) {
                console.log("Animações disponíveis:", Object.keys(animationActions));
                
                // Tentar diferentes nomes possíveis
                var possibleNames = ['Scene', 'Action', 'Animation', 'Take 001', 'Armature|Action'];
                var foundAction = null;
                
                for (var name of possibleNames) {
                    if (animationActions[name]) {
                        foundAction = animationActions[name];
                        break;
                    }
                }
                
                if (foundAction) {
                    console.log("Tocando animação nativa:", foundAction);
                    foundAction.reset().play();
                } else {
                    // Usar a primeira animação disponível
                    var firstActionName = Object.keys(animationActions)[0];
                    if (firstActionName) {
                        console.log("Tocando primeira animação disponível:", firstActionName);
                        animationActions[firstActionName].reset().play();
                    } else {
                        console.log("Nenhuma animação nativa encontrada");
                    }
                }
            } else {
                console.log("Nenhuma animação nativa disponível");
            }
            break;
            
        case 'idle':
            createIdleAnimation();
            break;
    }
}

// ========================== RENDER LOOP ==========================
var clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    var delta = clock.getDelta();
    
    // Update do mixer do Darth Maul
    if (animationMixer) {
        animationMixer.update(delta);
    }
    
    // Update dos mixers dos tijolos LEGO
    scene.traverse(function(child) {
        if (child.userData.animationMixer) {
            child.userData.animationMixer.update(delta);
        }
    });
    
    TWEEN.update();
    controls.update();
    renderer.render(scene, camera);
}

// ========================== INITIALIZATION (Única e correta) ==========================
var sceneInitialized = false;

function initializeOnce() {
    if (sceneInitialized) {
        console.log("Cena já foi inicializada, pulando...");
        return;
    }
    
    console.log("Inicializando cena pela primeira vez...");
    sceneInitialized = true;
    initializeScene();
    animate();
}

// Aguardar DOM estar pronto
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM carregado, inicializando cena...");
    initializeOnce();
});

// Fallback caso DOMContentLoaded já tenha passado
if (document.readyState !== 'loading') {
    console.log("DOM já carregado, inicializando imediatamente...");
    setTimeout(initializeOnce, 10);
}

// ========================== EXPOSE FUNCTIONS GLOBALLY ==========================
window.playAnimation = playAnimation;
window.clearTweens = clearTweens;
window.changeEnvironment = changeEnvironment;

// ========================== MATERIAL ENHANCEMENT FUNCTION (Add this function) ==========================
function enhanceModelMaterials(object) {
    object.traverse(function(child) {
        if (child.isMesh) {
            // Enable shadows
            child.castShadow = true;
            child.receiveShadow = true;
            
            // Enhance material properties
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
    // Improve material properties for better lighting
    if (material.isMeshStandardMaterial || material.isMeshPhongMaterial) {
        material.roughness = material.roughness || 0.7;
        material.metalness = material.metalness || 0.1;
    }
    
    // Enable transparent materials to receive shadows
    if (material.transparent) {
        material.alphaTest = 0.1;
    }
    
    // Update material
    material.needsUpdate = true;
}