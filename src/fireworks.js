var fireworks = [];
var to = { px: 0, py: 0, pz: 500 };
var renderer, scene, camera;
var controls;
var clock = new THREE.Clock();
var gui;
var guiParam;
var MAXSIZE = 500;
var Firework = function(scene, size) {
    this.scene    = scene;
    this.size = size;
    this.done     = false;
    this.dest     = [];
    this.colors   = [];
    this.geometry = null;
    this.points   = null;
    this.material = new THREE.PointsMaterial({
        size: 16,
        color: 0xffffff,
        opacity: 1,
        vertexColors: true,
        transparent: true,
        depthTest: false,
    });
    this.launch();
};

// prototype
Firework.prototype = {
    constructor: Firework,

    reset: function() {
        this.scene.remove(this.points);
        this.dest     = [];
        this.colors   = [];
        this.geometry = null;
        this.points   = null;
    },

    launch: function() {
        var x = THREE.Math.randInt(-window.innerWidth, window.innerWidth);
        var y = THREE.Math.randInt(100, 800);
        var z = THREE.Math.randInt(-1000, -3000);

        var from = new THREE.Vector3(x, -800, z);    // 烟花起点
        var to = new THREE.Vector3(x, y, z);         // 烟花终点

        var color = new THREE.Color();
        color.setHSL(THREE.Math.randFloat(0.1, 0.9), 1, 0.9);
        this.colors.push( color );

        this.geometry = new THREE.Geometry();
        this.points   = new THREE.Points(this.geometry, this.material);

        this.geometry.colors = this.colors;
        this.geometry.vertices.push(from);
        this.dest.push(to);
        this.colors.push(color);
        this.scene.add(this.points);     // 未爆炸时，上升的点
    },

    explode: function(vector) {    // 烟花爆炸
        this.scene.remove(this.points);
        this.dest = [];
        this.colors = [];
        this.geometry = new THREE.Geometry();

        for(let i = 0; i < 80; i++) {       // 爆炸图案
            let color = new THREE.Color();
            color.setHSL( THREE.Math.randFloat( 0.1, 0.9 ), 1, 0.5 );
            this.colors.push( color );
            let from = new THREE.Vector3(vector.x, vector.y, vector.z);
            var to;        // 每个点的终点
            let radis = THREE.Math.randInt(100, this.size);
            if ((i >= 0 && i < 4) || (i >= 20 && i < 24) || (i >= 40 && i < 44) || (i >= 60 && i < 64)) {
                to = new THREE.Vector3(
                    vector.x + radis/4 * Math.cos(22.5*(i%4)),
                    vector.y + radis/4 * Math.sin(22.5*(i%4)),
                    vector.z
                );
            }
            if ((i >= 4 && i < 10) || (i >= 24 && i < 30) || (i >= 44 && i < 50) || (i >= 64 && i < 70)) {
                to = new THREE.Vector3(
                    vector.x + radis/2 * Math.cos(15*((i+4)%6)),
                    vector.y + radis/2 * Math.sin(15*((i+4)%6)),
                    vector.z
                );
            }
            if ((i >= 10 && i < 20) || (i >= 30 && i < 40) || (i >= 50 && i < 60) || (i >= 70 && i < 80)) {
                to = new THREE.Vector3(
                    vector.x + radis * Math.cos(9*(i%10)),
                    vector.y + radis * Math.sin(9*(i%10)),
                    vector.z
                );
            }
            this.geometry.vertices.push(from);
            this.dest.push(to);
        }
        this.geometry.colors = this.colors;
        this.points = new THREE.Points(this.geometry, this.material);
        this.scene.add(this.points);
    },

    update: function() {
        if( this.points && this.geometry ) {
            let total = this.geometry.vertices.length;

            for (let i = 0; i < total; i++) {
                this.geometry.vertices[i].x += ( this.dest[i].x - this.geometry.vertices[i].x ) / 30;
                this.geometry.vertices[i].y += ( this.dest[i].y - this.geometry.vertices[i].y ) / 30;
                this.geometry.vertices[i].z += ( this.dest[i].z - this.geometry.vertices[i].z ) / 30;
            }
            this.geometry.verticesNeedUpdate = true;

            if (total === 1) {   // 只有上升的点时，接近终点时爆炸
                if( Math.ceil( this.geometry.vertices[0].y ) > ( this.dest[0].y - 20 ) ) {
                    this.explode(this.geometry.vertices[0]);
                    return;
                }
            }

            // 爆炸后，透明度逐渐减小，变为0时移除该烟花
            if (total > 1) {
                this.material.opacity -= 0.010;
                this.material.colorsNeedUpdate = true;
            }
            if (this.material.opacity <= 0) {
                this.reset();
                this.done = true;
                return;
            }
        }
    },
};

function render() {
    var delta = clock.getDelta();
    controls.update(delta);
    requestAnimationFrame(render);

    // 添加烟花像下面这样写就行，在主场景中改变一样烟花初始化函数中的to和from变量

    if (THREE.Math.randInt(1, 20) === 10) {      // 加入新的烟花
        fireworks.push(new Firework(scene, MAXSIZE));
    }
    for (let i = 0; i < fireworks.length; i++) {
        if (fireworks[i].done) {
            fireworks.splice(i, 1);
            continue;
        }
        fireworks[i].update();
    }

    renderer.render(scene, camera);
}


function initRender() {
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000);
    renderer.sortObjects = true;
    document.body.appendChild(renderer.domElement);
}

function initScene() {
    scene = new THREE.Scene();
}

function initCamera() {
    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 20000 );
    camera.position.set( 0, 0, 500 );
    scene.add(camera);
}
function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight)
}
var stats;
function initStat() {
    stats = new Stats();
    stats.setMode(0);
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';
    document.body.appendChild(stats.domElement);
}

function initGui() {
    guiParam = new function () {
        this.bgColor = 0x000000;
        this.maxSize = 500;
    };

    var gui = new dat.GUI();

    gui.addColor(guiParam, 'bgColor').onChange(function(value) {
        renderer.setClearColor(value);
    });
    gui.add(guiParam, 'maxSize', 100, 600).onChange(function(value) { // 设置烟花的半径大小
        MAXSIZE = value;
    });
}

function init() {
    initRender();
    initScene();
    initCamera();
    initStat();
    initGui();
    controls = new THREE.OrbitControls(camera);
    clock = new THREE.Clock();

    window.addEventListener('resize', onResize, false);
    render();
}

window.onload = init;














