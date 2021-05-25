import {Component, ElementRef, ViewChild, AfterViewInit, HostListener} from '@angular/core';
import {
  AmbientLight, BackSide, BufferGeometry,
  DoubleSide, Float32BufferAttribute,
  Mesh, MeshPhongMaterial,
  MeshStandardMaterial, NearestFilter, Object3D,
  PerspectiveCamera, PlaneGeometry, PointLight, Points, PointsMaterial, RepeatWrapping,
  Scene,
  SphereGeometry, TextureLoader, Vector3,
  WebGLRenderer
} from 'three';
import {PointerLockControls} from 'three/examples/jsm/controls/PointerLockControls';
import solaryImpotentObj from './solary-impotent-obj';
import allSatellites from './all-satellites';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer';
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {

  @ViewChild('canvasRef') canvas?: ElementRef<HTMLCanvasElement>;

  camera?: PerspectiveCamera;
  scene?: Scene;
  figure?: Mesh;
  vector?: Vector3;
  controls?: PointerLockControls;
  renderer?: WebGLRenderer;
  bloomComposer?: EffectComposer;

  createdObjects: any = [];
  createdSatellites: any = [];

  moveForward = false;
  moveBackward = false;
  moveLeft = false;
  moveRight = false;
  moveTop = false;
  moveBot = false;

  btnVisible = true;

  spheres = solaryImpotentObj;
  satellites = allSatellites;

  constructor() {
  }

  @HostListener('document:pointerlockchange')
  unlock(): void {
    this.btnVisible = !this.btnVisible;
  }

  @HostListener('window:keydown', ['$event'])
  keyDown(event: KeyboardEvent): void {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.moveForward = true;
        break;

      case 'ArrowLeft':
      case 'KeyA':
        this.moveLeft = true;
        break;

      case 'ArrowDown':
      case 'KeyS':
        this.moveBackward = true;
        break;

      case 'ArrowRight':
      case 'KeyD':
        this.moveRight = true;
        break;

      case 'Space':
      case 'Equal':
      case 'NumpadAdd':
      case 'KeyQ':
        this.moveTop = true;
        break;

      case 'Minus':
      case 'NumpadSubtract':
      case 'KeyE':
        this.moveBot = true;
        break;
    }
  }

  @HostListener('window:keyup', ['$event'])
  keyUp(event: KeyboardEvent): void {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.moveForward = false;
        break;

      case 'ArrowLeft':
      case 'KeyA':
        this.moveLeft = false;
        break;

      case 'ArrowDown':
      case 'KeyS':
        this.moveBackward = false;
        break;

      case 'ArrowRight':
      case 'KeyD':
        this.moveRight = false;
        break;

      case 'Space':
      case 'Equal':
      case 'NumpadAdd':
      case 'KeyQ':
        this.moveTop = false;
        break;

      case 'Minus':
      case 'NumpadSubtract':
      case 'KeyE':
        this.moveBot = false;
        break;
    }
  }

  ngAfterViewInit(): void {
    this.vectorInitial();
    this.createScene();
    this.cameraPosition();
    this.wglRenderInit();
    this.renderCanvas();
    this.createSolarSystem();
    this.createFigure(this.spheres, 'spheres');
    this.createFigure(this.satellites, 'satellites');
    this.getSatellites();
    this.chessBoard();
    this.getChilds();
    this.createStars();
    this.sunLight();
  }

  wglRenderInit(): void {
    this.renderer = new WebGLRenderer({canvas: this.canvas?.nativeElement, antialias: true});
  }

  renderCanvas(): void {
    const component: AppComponent = this;
    // tslint:disable-next-line:typedef
    (function render() {
      (component.vector as Vector3).normalize();
      if (component.controls?.isLocked) {
        component.keyBoardControls();
      }
      component.renderer?.setSize(
        (component.canvas as ElementRef<HTMLCanvasElement>).nativeElement.clientWidth,
        (component.canvas as ElementRef<HTMLCanvasElement>).nativeElement.clientHeight
      );
      component.bloomComposer?.setSize(
        (component.canvas as ElementRef<HTMLCanvasElement>).nativeElement.clientWidth,
        (component.canvas as ElementRef<HTMLCanvasElement>).nativeElement.clientHeight
      );
      component.animateFigure();
      (component.renderer as WebGLRenderer).render((component.scene as Scene), (component.camera as PerspectiveCamera));
      requestAnimationFrame(render);
    }());
  }

  keyBoardControls(): void {
    const speed = 10;
    if (this.moveForward) {
      this.controls?.moveForward(speed);
    }
    if (this.moveBackward) {
      this.controls?.moveForward(-speed);
    }
    if (this.moveLeft) {
      this.controls?.moveRight(-speed);
    }
    if (this.moveRight) {
      this.controls?.moveRight(speed);
    }
    if (this.moveTop) {
      (this.controls as PointerLockControls).getObject().position.y += speed;
    }
    if (this.moveBot) {
      (this.controls as PointerLockControls).getObject().position.y -= speed;
    }
  }

  animateFigure(): void {
    this.createdObjects.forEach((el: any) => {
      el.figure.rotation.y += 0.007;
      if (el.name !== 'Sun') {
        this.spheres.forEach((sphere: any) => {
          if (el.name === sphere.name) {
            sphere.orbit += el.speed * 0.1;
            el.figure.position.set(Math.cos(sphere.orbit) * sphere.positionX, 0, Math.sin(sphere.orbit) * sphere.positionX);
          }
        });
      }
    });
    this.createdSatellites.forEach((el: any) => {
      el.figure.rotation.y += 0.009;
      this.satellites.forEach((sphere: any) => {
        if (el.name === sphere.name) {
          sphere.orbit += (el.speed / 8) * 0.001;
          el.figure.position.set(Math.cos(sphere.orbit) * sphere.positionX, 0, Math.sin(sphere.orbit) * sphere.positionX);
        }
      });
    });
  }

  createScene(): any {
    this.scene = new Scene();

    this.camera = new PerspectiveCamera(
      25,
      this.getAspectRatio(),
      10,
      1e7
    );
    setTimeout(() => this.camera?.position.set(-148.0970196555808, 96, 12055.817005635128), 0);
  }

  cameraPosition(): void {
    (this.camera as PerspectiveCamera).position.set(-270, 1000, 3000);
    this.controls = new PointerLockControls((this.camera as PerspectiveCamera), document.body);
    this.scene?.add(this.controls.getObject());
  }

  getAspectRatio(): any {
    return (this.canvas as ElementRef<HTMLCanvasElement>).nativeElement.clientWidth /
      (this.canvas as ElementRef<HTMLCanvasElement>).nativeElement.clientHeight;
  }

  createFigure(data: any, type: string): void {
    data.forEach((sphere: any) => {
      const geometry = new SphereGeometry(sphere.radius, sphere.widthDivisions, sphere.heightDivisions);
      const material = new MeshStandardMaterial(
        {roughness: sphere.roughness, metalness: sphere.metalness, color: sphere.color}
      );
      if (sphere.name === 'Sun') {
        material.side = BackSide;
      }
      const figure = new Mesh(geometry, material);
      figure.position.set(sphere.positionX, sphere.positionY, sphere.positionZ);
      const speed = (2 * Math.PI * sphere.orbRadius) / sphere.orbTime || 0.005;
      if (type === 'spheres') {
        this.createdObjects.push({figure, name: sphere.name, speed});
      } else {
        this.createdSatellites.push({figure, name: sphere.name, owner: sphere.owner, speed});
      }
      this.scene?.add(figure);
    });
  }

  createSolarSystem(): void {
    const solarSystem = new Object3D();
    this.createdObjects.push({figure: solarSystem, name: 'Solar system', speed: 0.05});
    this.scene?.add(solarSystem);
  }

  sunLight(): void {
    const light = new PointLight('#ffffff', 3, 0, 0);
    this.scene?.add(light);
  }

  chessBoard(): void {
    const light = new AmbientLight('#ffffff', 0.5);
    this.scene?.add(light);
    const planeSize = 10000;
    const loader = new TextureLoader();
    const texture = loader.load('../assets/checker.png');
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.magFilter = NearestFilter;
    const repeats = planeSize / 2;
    texture.repeat.set(repeats, repeats);

    const planeGeo = new PlaneGeometry(planeSize, planeSize);
    const planeMat = new MeshPhongMaterial({
      map: texture,
      side: DoubleSide,
    });
    const mesh = new Mesh(planeGeo, planeMat);
    mesh.rotation.x = Math.PI * -.5;
    // this.scene?.add(mesh);
  }

  getChilds(): void {
    const solarSystem = this.createdObjects.find((el: any) => el.name === 'Solar system');
    this.createdObjects.forEach((el: any) => {
      if (el !== solarSystem) {
        solarSystem.figure.add(el.figure);
      }
    });
  }

  getSatellites(): void {
    this.createdObjects.forEach((obj: any) => {
      this.createdSatellites.forEach((satellite: any) => {
        if (obj.name === satellite.owner) {
          obj.figure.add(satellite.figure);
        }
      });
    });
  }

  vectorInitial(): void {
    this.vector = new Vector3();
  }

  lockCamera(): void {
    this.controls?.lock();
  }

  createStars(): void {
    const starsGeometry = [new BufferGeometry(), new BufferGeometry()];
    const vertices1 = [];
    const vertices2 = [];

    for (let i = 0; i < 1050; i++) {
      this.starsFactory();
      vertices1.push((this.vector as Vector3).x, (this.vector as Vector3).y, (this.vector as Vector3).z);
    }

    for (let i = 0; i < 1500; i++) {
      this.starsFactory();
      vertices2.push((this.vector as Vector3).x, (this.vector as Vector3).y, (this.vector as Vector3).z);
    }

    starsGeometry[0].setAttribute('position', new Float32BufferAttribute(vertices1, 3));
    starsGeometry[1].setAttribute('position', new Float32BufferAttribute(vertices2, 3));

    const starsMaterials = [
      new PointsMaterial({color: 0x555555, size: 2, sizeAttenuation: false}),
      new PointsMaterial({color: 0x555555, size: 1, sizeAttenuation: false}),
      new PointsMaterial({color: 0x333333, size: 2, sizeAttenuation: false}),
      new PointsMaterial({color: 0x3a3a3a, size: 1, sizeAttenuation: false}),
      new PointsMaterial({color: 0x1a1a1a, size: 2, sizeAttenuation: false}),
      new PointsMaterial({color: 0x1a1a1a, size: 1, sizeAttenuation: false})
    ];

    for (let i = 10; i < 30; i++) {
      const stars = new Points(starsGeometry[i % 2], starsMaterials[i % 6]);
      stars.rotation.x = Math.random() * 6;
      stars.rotation.y = Math.random() * 6;
      stars.rotation.z = Math.random() * 6;
      stars.scale.setScalar(i * 10);
      stars.matrixAutoUpdate = false;
      stars.updateMatrix();
      this.scene?.add(stars);
    }
  }

  starsFactory(): void {
    (this.vector as Vector3).x = Math.random() * 2 - 1;
    (this.vector as Vector3).y = Math.random() * 2 - 1;
    (this.vector as Vector3).z = Math.random() * 2 - 1;
    (this.vector as Vector3).multiplyScalar(200);
  }
}
