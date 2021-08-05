const radians = (degrees) => {
  return degrees * Math.PI / 180;
}

const distance = (x1, y1, x2, y2) => {
  return Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));
}

const map = (value, istart, istop, ostart, ostop) => {
	return ostart + (ostop-ostart)/(istop-istart)*(value-istart);
}

const hexToRgbTreeJs = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16)/255.0,
    g: parseInt(result[2], 16)/255.0,
    b: parseInt(result[3], 16)/255.0
  } : null;
}

class App {
  constructor(containerID, suffix) {
    this.suffix=suffix;
    this.containerID=containerID;
    this.container=document.getElementById(this.containerID);

    this.elemCanvas=document.createElement('canvas');
    this.elemCanvas.id="animation-"+suffix;
    this.container.appendChild(this.elemCanvas);
  }
  setup() {
    //Pendulum
    this.raycaster = new THREE.Raycaster();
    this.pendulum = {
      length: 10, //string length
      angle: 10,  //swing angle
      angleVelocity: 0,
      angleAcceleration: 0,
      origin: {x: 0, y: 15},
      current: {x: 0, y: 0}
    };

    //Grid
    this.gutter = { size: .2 };
    this.meshes = [];
    this.grid = { cols: 56, rows:24 };
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.mouse3D = new THREE.Vector2();

    this.viewer={aspect: 0.4};
    window.addEventListener('resize', this.onResize.bind(this), { passive: true });
  }

  prepareDatGUI() {
    this.gui = new dat.GUI({ autoPlace: false });
    this.gui.domElement.id = 'datgui-'+this.suffix;
    this.container.appendChild(this.gui.domElement);
  }

  prepareStats() {
    this.stats = new Stats();
    this.stats.showPanel(0);
    this.stats.domElement.id = 'stats-'+this.suffix;
    this.container.appendChild(this.stats.domElement);
  }

  createScene() {
    const width = this.container.getBoundingClientRect().width;
    const height = width*this.viewer.aspect;
    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer({
      canvas:document.getElementById(this.elemCanvas.id),
      antialias: true,
      alpha: true,
      devicePixelRatio: window.devicePixelRatio
    });
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);
  }

  createCamera() {
    const width = this.container.getBoundingClientRect().width;;
    const height = width*this.viewer.aspect;
    this.camera = new THREE.PerspectiveCamera(45, width / height);
    this.camera.position.set(-28.15292047581049, 38.68633769613105, 30.980321888960155);
    this.scene.add(this.camera);
  }

  addAmbientLight() {
    const obj = { color: '#c4c4c4' };
    const light = new THREE.AmbientLight(obj.color, 1);
    this.scene.add(light);

    //Dat Panel
    const gui = this.gui.addFolder('Ambient Light');
    gui.addColor(obj, 'color').onChange((color) => {
      light.color = hexToRgbTreeJs(color);
    });
  }

  addSphere() {
    const meshParams = {
      color: '#f90c53',
      metalness: .41,
      emissive: '#000000',
      roughness: 0,
    };

    const geometry = new THREE.SphereGeometry(3, 32, 32);
    const material = new THREE.MeshStandardMaterial(meshParams);
    this.sphere = new THREE.Mesh(geometry, material);
    this.sphere.position.set(0, 0, 0);
    this.scene.add(this.sphere);

    //Dat Panel
    const gui = this.gui.addFolder('Sphere Material');
    gui.addColor(meshParams, 'color').onChange((color) => {
      material.color = hexToRgbTreeJs(color);
    });
    gui.add(meshParams, 'metalness', 0.1, 1).onChange((val) => {
      material.metalness = val;
    });
    gui.add(meshParams, 'roughness', 0.1, 1).onChange((val) => {
      material.roughness = val;
    });
  }

  createGrid() {
    this.groupMesh = new THREE.Object3D();

    const meshParams = {
      color: '#fff',
      metalness: .3,
      emissive: '#000000',
      roughness: 1,
    };

    const material = new THREE.MeshLambertMaterial(meshParams);
    const geometry = new THREE.BoxBufferGeometry(1, 1, 1);
    geometry.translate( 0, 1, 0);

    this.mesh = this.getMesh(geometry, material, this.grid.rows * this.grid.cols);
    this.scene.add(this.mesh);

    let ii = 0;
    this.centerX = ((this.grid.cols) + ((this.grid.cols) * this.gutter.size)) * .50;
    this.centerZ = ((this.grid.rows) + ((this.grid.rows) * this.gutter.size)) * .50;

    for (let row = 0; row < this.grid.rows; row++) {
      this.meshes[row] = [];

      for (let col = 0; col < this.grid.cols; col++) {
        const pivot = new THREE.Object3D();
        pivot.scale.set(1, 1, 1);
        pivot.position.set(col + (col * this.gutter.size) - this.centerX, 0, row + (row * this.gutter.size) - this.centerZ);
        this.meshes[row][col] = pivot;
        pivot.updateMatrix();
        this.mesh.setMatrixAt(ii++, pivot.matrix);
      }
    }

    this.mesh.instanceMatrix.needsUpdate = true;
  }

  getMesh(geometry, material, count) {
    const mesh = new THREE.InstancedMesh(geometry, material, count);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
  }

  addCameraControls() {
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.04;
    document.body.style.cursor = "-moz-grabg";
    document.body.style.cursor = "-webkit-grab";

    this.controls.addEventListener("start", () => {
      requestAnimationFrame(() => {
        document.body.style.cursor = "-moz-grabbing";
        document.body.style.cursor = "-webkit-grabbing";
      });
    });

    this.controls.addEventListener("end", () => {
      requestAnimationFrame(() => {
        document.body.style.cursor = "-moz-grab";
        document.body.style.cursor = "-webkit-grab";
      });
    });
  }

  addDirectionalLight() {
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    this.directionalLight.castShadow = true;
    this.directionalLight.position.set(0, 1, 0);

    this.directionalLight.shadow.camera.far = 1000;
    this.directionalLight.shadow.camera.near = -200;

    this.directionalLight.shadow.camera.left = -40;
    this.directionalLight.shadow.camera.right = 40;
    this.directionalLight.shadow.camera.top = 20;
    this.directionalLight.shadow.camera.bottom = -20;
    this.directionalLight.shadow.camera.zoom = 1;
    this.directionalLight.shadow.camera.needsUpdate = true;

    const targetObject = new THREE.Object3D();
    targetObject.position.set(-50, -82, 40);
    this.directionalLight.target = targetObject;

    this.scene.add(this.directionalLight);
    this.scene.add(this.directionalLight.target);
  }

  addFloor() {
    const geometry = new THREE.PlaneGeometry(300, 300);
    const material = new THREE.ShadowMaterial({ opacity: .1 });

    this.floor = new THREE.Mesh(geometry, material);
    this.floor.position.y = -3;
    this.floor.rotateX(- Math.PI / 2);
    this.floor.receiveShadow = true;

    this.scene.add(this.floor);
  }

  onResize() {
    this.width = this.container.getBoundingClientRect().width;;
    this.height = this.width*this.viewer.aspect;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  draw() {
    this.pendulum.current.x = this.pendulum.origin.x + this.pendulum.length * Math.sin(this.pendulum.angle);
    this.pendulum.current.y = this.pendulum.origin.y + this.pendulum.length * Math.cos(this.pendulum.angle);
    this.pendulum.angleAcceleration = 2 * .001 * Math.sin(this.pendulum.angle);
    this.pendulum.angleVelocity += this.pendulum.angleAcceleration;
    this.pendulum.angle += this.pendulum.angleVelocity;

    this.sphere.position.set(this.pendulum.current.x, this.pendulum.current.y + 10.5, 0);

    const { x, z } = this.sphere.position;

    let ii = 0;

    for (let row = 0; row < this.grid.rows; row++) {
      for (let col = 0; col < this.grid.cols; col++) {

        const pivot = this.meshes[row][col];
        const mouseDistance = distance(x, z, pivot.position.x, pivot.position.z);
        const y = map(mouseDistance, 4.5, 1, 0, -1.5);
        const scale = y > 1 ? 1 : y;

        pivot.updateMatrix();

        this.mesh.setMatrixAt(ii++, pivot.matrix);

        TweenMax.to(pivot.scale, .3, {
          ease: Expo.easeOut,
          y: scale,
        });
      }
    }

    this.mesh.instanceMatrix.needsUpdate = true;
  }

  animate() {
    //this.stats.begin();
    this.controls.update();
    this.draw();
    this.renderer.render(this.scene, this.camera);
    //this.stats.end();
    requestAnimationFrame(this.animate.bind(this));
  }

  init() {
    this.setup();
    this.prepareDatGUI();
    this.createScene();
    this.createCamera();
    this.addAmbientLight();
    this.addSphere();
    this.createGrid();
    this.addDirectionalLight();
    this.addCameraControls();
    this.addFloor();
    this.animate();
  }
}

const animation_pendulum=new App("canvas-container1", "pendulum");
animation_pendulum.init();
