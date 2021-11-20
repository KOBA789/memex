const $scan = document.getElementById("scan");
let rotX = 0;
let rotY = 0;
const handleValue = (e) => {
  const d = e.target.value;
  if (d.getUint8(1) !== 0x18) {
    return;
  }
  const seq = ((d.getUint8(3) + 255) % 256) ^ 126;
  const accXu = ((d.getUint8(14) + 116) % 256) ^ 84;
  const accYu = ((d.getUint8(15) + 115) % 256) ^ 55;
  const accZu = ((d.getUint8(16) + 242) % 256) ^ 82;
  const accYXl = ((d.getUint8(17) + 241) % 256) ^ 120;
  const accZl = (d.getUint8(18) & 0xF) % 16;
  const accX12bit = (accXu << 4) | accYXl & 0xF;
  const accY12bit = (accYu << 4) | (accYXl >> 4);
  const accZ12bit = (accZu << 4) | accZl;
  const accXf = (accX12bit - 2048) / 16;
  const accYf = (accY12bit - 2048) / 16;
  const accZf = (accZ12bit - 2048) / 16;

  rotX = Math.atan(accYf / accZf);
  rotY = -Math.atan(accXf / Math.sqrt(accYf * accYf + accZf * accZf));
};
const handleScan = async () => {
  const serviceUuid = "f5dc3761-ce15-4449-8cfa-7af6ad175056";
  const notificationCharUuid = "f5dc3764-ce15-4449-8cfa-7af6ad175056";
  const controlCharUuid = "f5dc3762-ce15-4449-8cfa-7af6ad175056";
  const device = await navigator.bluetooth.requestDevice({
    filters: [
      { services: [serviceUuid] }
    ],
    optionalServices: [serviceUuid]
  });
  console.log("connecting...");
  const server = await device.gatt.connect();
  console.log("getting service...");
  const service = await server.getPrimaryService(serviceUuid);
  console.log("getting notification characteristic...");
  const notificationChar = await service.getCharacteristic(notificationCharUuid);
  console.log("starting notification...");
  notificationChar.addEventListener("characteristicvaluechanged", handleValue, false);
  await notificationChar.startNotifications();
  const controlChar = await service.getCharacteristic(controlCharUuid);
  console.log("writing magic bytes...");
  await controlChar.writeValue(new Uint8Array([0x14, 0x24, 0x96, 0x7F, 0x3F, 0x6B, 0x7F, 0x6C, 0x9B, 0xFF, 0x88, 0x6F, 0xC5, 0xB4, 0x60, 0x44, 0xE0, 0x87, 0x06, 0x00]).buffer);
  $scan.remove();

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const light = new THREE.AmbientLight(0x909090);
  scene.add(light);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  scene.add(directionalLight);

  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshStandardMaterial({
    color: 0xe0e0e0,
    roughness: 0.5,
  });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  camera.position.z = 5;
  const animate = function () {
    requestAnimationFrame(animate);

    cube.rotation.x = -rotX;
    cube.rotation.z = rotY;

    renderer.render(scene, camera);
  };
  animate();
};
$scan.addEventListener("click", handleScan, false);
