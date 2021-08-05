
class THREE_pendulum_mdk {
  constructor(containerID, suffix) {
    this.suffix=suffix;
    this.containerID=containerID;
    this.container=document.getElementById(this.containerID);

    this.elemCanvas=document.createElement('canvas');
    this.elemCanvas.id="animation-"+suffix;
    this.container.appendChild(this.elemCanvas);
    this.plate
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
    //ball
    this.raycaster = new THREE.Raycaster();

    this.ball = {
      state:{
        position:{x:0, y:0, z:0},
        velocity:0.0,
        acceleration:0.0
      },
      param:{
        inertia:1.0,
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
    this.camera = new THREE.PerspectiveCamera(50, width/height);
    this.camera.position.set(-20.0, 0.0, 0.0);
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
    this.ball.state.position.x=0.0;
    this.ball.state.position.y=0.0;
    this.ball.state.position.z=0.0;
    this.sphere.position.set(this.ball.state.position.x, this.ball.state.position.y, this.ball.state.position.z);
    this.scene.add(this.sphere);
  }

  addFloor() {
    const meshParams = {
      color: '#DEB887',
      metalness: .3,
      emissive: '#000000',
      roughness: 0,
    };
    const geometry = new THREE.PlaneGeometry(100, 100);
    const material = new THREE.MeshStandardMaterial(meshParams);

    this.floor = new THREE.Mesh(geometry, material);
    this.floor.position.y = -1;
    this.floor.rotateX(-Math.PI/2);
    this.floor.receiveShadow = true;

    this.scene.add(this.floor);
  }

  addSpring() {

    const meshParams = {
      color: '#888',
    	linewidth: 2,
    	linecap: 'round', //ignored by WebGLRenderer
    	linejoin:  'round' //ignored by WebGLRenderer
    };

    const points = [];
    this.points_div=200;
    this.spring={handlingPoint:0.0, offset:2.0, nlength:9.0, stiffness: 100.0, viscosity: 3.0};
    this.spiral={radius:0.80, winding:12.0, length:this.spring.nlength-2.0*this.spring.offset};
    this.spiral_div={w:2.0*Math.PI*this.spiral.winding/this.points_div, l:this.spiral.length/this.points_div};

    points.push(new THREE.Vector3(0.0,0.0,this.sphere.position.z));
    points.push(new THREE.Vector3(0.0,0.0,this.sphere.position.z+this.spring.offset));
    for(let i=0; i<this.points_div; i++){
      const x=this.spiral.radius*Math.sin(i*this.spiral_div.w);
      const y=this.spiral.radius*Math.cos(i*this.spiral_div.w);
      const z=i*this.spiral_div.l+this.sphere.position.z+this.spring.offset;
      const p = new THREE.Vector3(x,y,z);
      points.push(p);
    }
    points.push(new THREE.Vector3(0.0,0.0,this.sphere.position.z+this.spiral.length+1.0*this.spring.offset));
    points.push(new THREE.Vector3(0.0,0.0,this.sphere.position.z+this.spiral.length+2.0*this.spring.offset));

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial(meshParams);
    this.line = new THREE.Line(geometry,material);
    this.scene.add(this.line);

    const gui_m = this.gui.addFolder('Manipulation');
    gui_m.add(this.spring, 'handlingPoint', -20, 0).onChange((val) => {
      this.spring.handlingPoint = val;
    });

    const gui_c = this.gui.addFolder('Characteristics of the Spring');
    gui_c.add(this.spring, 'stiffness', 10, 8000).onChange((val) => {
      this.spring.stiffness = val;
    });
    gui_c.add(this.spring, 'viscosity', 1, 200).onChange((val) => {
      this.spring.viscosity = val;
    });
  }

  configureController(){
    this.disturbance={
      static_friction:false,
      step_force:false,
    };
    this.I_controller={"enable":false, gain:0.0, ie:0.0};

    const gui_s = this.gui.addFolder('Disturbance');
    gui_s.add(this.disturbance, 'static_friction');
    gui_s.add(this.disturbance, 'step_force');

    const gui_c = this.gui.addFolder('I Controller');
    gui_c.add(this.I_controller, 'enable');
    gui_c.add(this.I_controller, 'gain', 0.0, 1000.0).onChange((val) => {
      this.I_controller.gain = val;
    });
  }

  draw() {

    const sdiv=100;
    const td=0.01;
    const ts=td/sdiv;

    const uc={static: 100, dynamic: 0.01};
    let fd=0.0;
    let fc={p:0, i:0, d:0, act:0};
    for(let i=0;i<sdiv;i++){
      if(this.disturbance.static_friction==true){
        fd=uc.dynamic*this.ball.state.velocity;
        if(Math.abs(this.ball.state.velocity)<2) fd+=uc.static*Math.sign(this.ball.state.velocity);
      }
      if(this.disturbance.step_force==true){
        fd+=10;
      }
      this.ball.state.position.z+=this.ball.state.velocity*ts;
      this.ball.state.velocity+=this.ball.state.acceleration*ts;
      if(this.I_controller.enable==true) this.I_controller.ie+=(this.spring.handlingPoint-this.ball.state.position.z)*ts; else this.I_controller.ie=0.0;
      fc.p=this.spring.stiffness*(this.spring.handlingPoint-this.ball.state.position.z);
      fc.i=this.I_controller.gain*this.I_controller.ie;
      fc.d=-this.spring.viscosity*this.ball.state.velocity
      fc.act=fc.p+fc.i+fc.d;
      this.ball.state.acceleration=(-fd+fc.act)/this.ball.param.inertia;
    }

    this.ball.state.position.x=0.0;
    this.ball.state.position.y=0.0;
    this.sphere.position.set(this.ball.state.position.x, this.ball.state.position.y, this.ball.state.position.z);

    const positions = this.line.geometry.attributes.position.array;
    const points_num = this.line.geometry.attributes.position.array.length/3;

    this.spiral.length=this.spring.nlength+(this.spring.handlingPoint-this.ball.state.position.z)-2.0*this.spring.offset;
    this.spiral_div.l=this.spiral.length/this.points_div;

    positions[0]=0.0;
    positions[1]=0.0;
    positions[2]=this.sphere.position.z;
    positions[3]=0.0;
    positions[4]=0.0;
    positions[5]=this.sphere.position.z+this.spring.offset;
    for(let i=0; i<this.points_div; i++){
      positions[(i+2)*3]=this.spiral.radius*Math.sin(i*this.spiral_div.w);
      positions[(i+2)*3+1]=this.spiral.radius*Math.cos(i*this.spiral_div.w);
      positions[(i+2)*3+2]=i*this.spiral_div.l+this.sphere.position.z+this.spring.offset;
    }
    positions[3*points_num-6]=0.0;
    positions[3*points_num-5]=0.0;
    positions[3*points_num-4]=this.sphere.position.z+this.spiral.length+1.0*this.spring.offset;
    positions[3*points_num-3]=0.0;
    positions[3*points_num-2]=0.0;
    positions[3*points_num-1]=this.sphere.position.z+this.spiral.length+2.0*this.spring.offset;

    this.line.geometry.attributes.position.needsUpdate = true;
  }

  animate() {
    this.controls.update();
    this.draw();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate.bind(this));
  }

  init() {
    this.setup();
    this.prepareDatGUI();
    this.createScene();
    this.createCamera();
    this.addAmbientLight();
    this.addSphere();
    this.addSpring();
    this.addFloor();
    this.configureController();
    this.addDirectionalLight();
    this.addCameraControls();
    this.animate();
  }
}
