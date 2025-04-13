// Configuração básica da cena, câmera e renderizador

// Cria a cena
var scene = new THREE.Scene();

// Cria a câmera (perspectiva)
var camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 2, 10);
camera.lookAt(0, 0, 0);

// Cria o renderizador e define seu tamanho
var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container').appendChild(renderer.domElement);

// Iluminação básica
var ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 10, 5);
scene.add(directionalLight);

// Carrega o modelo FBX usando o FBXLoader já incluído globalmente
var loader = new THREE.FBXLoader();
loader.load(
  'assets/modelos/legomandefault.fbx', // Caminho para o seu modelo
  function (object) {
    console.log('Modelo FBX carregado:', object);

    // Ajusta a escala e centraliza o modelo
    object.scale.set(0.01, 0.01, 0.01); // Ajuste conforme necessário
    var bbox = new THREE.Box3().setFromObject(object);
    var center = bbox.getCenter(new THREE.Vector3());
    object.position.sub(center);

    scene.add(object);
  },
  function (xhr) {
    console.log((xhr.loaded / xhr.total * 100) + '% carregado');
  },
  function (error) {
    console.error('Erro ao carregar o modelo:', error);
  }
);

// Função de animação
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// Atualiza o renderizador e a câmera quando a janela é redimensionada
window.addEventListener('resize', function () {
  var width = window.innerWidth;
  var height = window.innerHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});
