
import * as THREE from "https://unpkg.com/three@latest/build/three.module.js";

var lines = [];
var scene, camera, renderer;
var windowWidth, windowHeight;
var xMouseCoord, yMouseCoord;
var plane;
var linesShowing = true;

window.onload = function() {
    scene = new THREE.Scene();

    windowWidth = window.innerWidth;
    windowHeight = windowWidth / 64 * 10;

    camera = new THREE.OrthographicCamera(-32, 32, 5, -5);
    camera.position.set(0, 0, 100);

    // create renderer and setup the canvas
    var canvas = document.getElementById("c");
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize( windowWidth, windowHeight);


    // setup lights
    var ambientLight = new THREE.AmbientLight();
    scene.add( ambientLight );

    var light = new THREE.DirectionalLight( 0xffffff, 5.0 );
    light.position.set( 10, 100, 10 );
    scene.add( light );

    var geometry = new THREE.PlaneGeometry(1, 1);
    var material = new THREE.MeshBasicMaterial({color: 0x00ffff});
    plane = new THREE.Mesh(geometry, material);
    plane.position.set(31, 0);
    scene.add(plane);

    drawLines();
    animate();
};

function drawLines() {
        var line1Points = [
        new THREE.Vector3(-16, -5, 0),
        new THREE.Vector3(-16, 5, 0)
    ];
    var line2Points = [
        new THREE.Vector3(0, -5, 0),
        new THREE.Vector3(0, 5, 0)
    ];
    var line3Points = [
        new THREE.Vector3(16, -5, 0),
        new THREE.Vector3(16, 5, 0)
    ];
    var points = [line1Points, line2Points, line3Points];
    points.forEach(element => {
        var geometry = new THREE.BufferGeometry().setFromPoints(element);
        var material = new THREE.LineBasicMaterial({color: 0xffffff})
        var line = new THREE.Line(geometry, material);
        lines.push(line);
        scene.add(line);
    });
    var num = lines.length;
}

function removeLines() {
    var len = lines.length;
    lines.forEach(line => {
        scene.remove(line);
    });
    lines = [];
}

window.addEventListener('resize', onResize);

function onResize() {
    windowWidth = window.innerWidth;
    windowHeight = windowWidth / 64 * 10;
    renderer.setSize( windowWidth, windowHeight);
}

window.addEventListener('mousemove', onMouseMove);

function onMouseMove(e) {
    // convert to canvas coords
    var xWindow = e.clientX - (window.innerWidth / 2);
    var yWindow = e.clientY - (window.innerHeight / 2);
    var xCanvas = 32 * xWindow / (windowWidth / 2);
    var yCanvas = -5 * yWindow / (windowHeight / 2);
    xMouseCoord = xCanvas;
    yMouseCoord = yCanvas;
}

window.addEventListener('keydown', onKeyDown);

function onKeyDown(e) {
    if (e.key == 'l') {
        if (linesShowing) {
            removeLines();
            linesShowing = false;
        }
        else if (!linesShowing) {
            drawLines();
            linesShowing = true;
        }
    }
}

// have a list of images
// if an image is clicked, add it to the scene
// be able to move the images around
// add ability to remove images
// add ability to save and load scenes

function animate() {

    requestAnimationFrame( animate );

    plane.position.set(xMouseCoord, yMouseCoord);

    renderer.render( scene, camera );
};
