
class THREE_waterflow {
  constructor(containerID, suffix) {
    this.suffix=suffix;
    this.containerID=containerID;
    this.container=document.getElementById(this.containerID);

    this.elemCanvas=document.createElement('canvas');
    this.elemCanvas.id="animation-"+suffix;
    this.container.appendChild(this.elemCanvas);
  }

  hexToRGB(hex){
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16)/255.0,
      g: parseInt(result[2], 16)/255.0,
      b: parseInt(result[3], 16)/255.0
    } : null;
  }

  setup() {
    //waterball
    this.raycaster = new THREE.Raycaster();

    this.waterball = {
      state:{
        position:{x:0, y:0, z:0},
        velocity:0.0,
        acceleration:0.0
      },
      param:{
        inertia:0.5,
      },
    };

    this.viewer={aspect: 0.4};
    this.width = this.container.getBoundingClientRect().width;
    this.height = this.width*this.viewer.aspect;
    this.mouse3D = new THREE.Vector2();

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
    this.camera = new THREE.PerspectiveCamera(50, width / height);
    this.camera.position.set(-10.0, 5.0, 30.0);
    this.scene.add(this.camera);
  }

  onResize() {
    this.width = this.container.getBoundingClientRect().width;
    this.height = this.width*this.viewer.aspect;

    this.camera.aspect = this.width/this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  addAmbientLight() {
    const obj = { color: '#c4c4c4' };
    const light = new THREE.AmbientLight(obj.color, 1);
    this.scene.add(light);
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

  addSphere() {
    const meshParams = {
      color: '#f90c53',
      metalness: .1,
      emissive: '#000000',
      roughness: 0,
    };
    const geometry = new THREE.SphereGeometry(1, 20, 20);
    const material = new THREE.MeshStandardMaterial(meshParams);
    this.sphere = new THREE.Mesh(geometry, material);
    this.waterball.state.position.x=20.0;
    this.waterball.state.position.y=0.0;
    this.waterball.state.position.z=0.0;
    this.sphere.position.set(this.waterball.state.position.x, this.waterball.state.position.y, this.waterball.state.position.z);
    this.scene.add(this.sphere);
  }

  addParticles() {
    this.meshes = [];
    this.particles=2000;

    this.groupMesh = new THREE.Object3D();
    const meshParams = {
      color: '#ccf',
      transparent: true,
      opacity:0.4,
      metalness: 0.3,
      emissive: '#000000',
      roughness: 1,
    };
    const material = new THREE.MeshPhongMaterial(meshParams);
    const geometry = new THREE.SphereGeometry(0.2, 20, 20);

    this.mesh = new THREE.InstancedMesh(geometry, material, this.particles);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.scene.add(this.mesh);

    let inst_idx = 0;

    for (let i = 0; i < this.particles; i++) {
      const pivot=new THREE.Object3D();
      let seed_x=20+10*(Math.random()-0.5);
      let seed_theta=2.0*Math.PI*Math.random();
      let seed_S=Math.sin(seed_theta);
      let seed_C=Math.cos(seed_theta);
      const x=seed_C*seed_x;
      const y=5.0*(Math.random()-0.5);
      const z=seed_S*seed_x;
      pivot.scale.set(1, 1, 1);
      pivot.position.set(x, y, z);
      this.meshes[i] = pivot;
      pivot.updateMatrix();
      this.mesh.setMatrixAt(inst_idx++, pivot.matrix);

    }
    this.mesh.instanceMatrix.needsUpdate = true;

    this.flow={velocity:1.0, viscosity:2.0};
    const gui = this.gui.addFolder('Water Flow');
    gui.add(this.flow, 'velocity', 0, 4).onChange((val) => {
      this.flow.velocity = val;
    });
    gui.add(this.flow, 'viscosity', 0.1, 20).onChange((val) => {
      this.flow.viscosity = val;
    });
  }

  draw() {

    const sdiv=100;
    const td=0.01;
    const ts=td/sdiv;
    for(let i=0;i<sdiv;i++){
      this.waterball.state.velocity+=this.waterball.state.acceleration*ts;
      this.waterball.state.acceleration=this.flow.viscosity*(this.flow.velocity-this.waterball.state.velocity)/this.waterball.param.inertia;
      let ball_S=Math.sin(this.waterball.state.velocity*ts);
      let ball_C=Math.cos(this.waterball.state.velocity*ts);
      this.waterball.state.position.x=+ball_C*this.waterball.state.position.x+ball_S*this.waterball.state.position.z;
      this.waterball.state.position.z=-ball_S*this.waterball.state.position.x+ball_C*this.waterball.state.position.z;
    }
    this.waterball.state.position.y=(this.waterball.state.position.y+this.waterball.state.velocity*0.05*(Math.random()-0.5))*0.99;
    this.sphere.position.set(this.waterball.state.position.x, this.waterball.state.position.y, this.waterball.state.position.z);

    let inst_idx = 0;

    let flow_S=Math.sin(this.flow.velocity*td);
    let flow_C=Math.cos(this.flow.velocity*td);
    for(let i=0; i<this.particles; i++){
      const pivot = this.meshes[i];
      const x=+flow_C*pivot.position.x+flow_S*pivot.position.z;
      const y=(pivot.position.y+this.flow.velocity*0.1*(Math.random()-0.5))*0.998;
      const z=-flow_S*pivot.position.x+flow_C*pivot.position.z;
      pivot.scale.set(1, 1, 1);
      pivot.position.set(x, y, z);
      pivot.updateMatrix();
      this.mesh.setMatrixAt(inst_idx++, pivot.matrix);
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
    //this.prepareStats();
    this.createScene();
    this.createCamera();
    this.addAmbientLight();
    this.addSphere();
    this.addParticles();
    this.addDirectionalLight();
    this.addCameraControls();
    this.animate();
  }
}
