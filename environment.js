
import * as THREE from "https://unpkg.com/three@latest/build/three.module.js";

var lines = [];
var scene, camera, renderer;
var windowWidth, windowHeight;
var xMouseCoord, yMouseCoord;
var plane, plane2, plane3;
var planeFollowing = false, plane2Following = false, plane3Following = false;
var linesShowing = true;
var lastPlane;
var activePlane;

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

    var planeGeom = new THREE.PlaneGeometry(1, 1);
    var cyan = new THREE.MeshBasicMaterial({color: 0x00ffff});
    var yellow = new THREE.MeshBasicMaterial({color: 0xffff00});
    var magenta = new THREE.MeshBasicMaterial({color: 0xff00ff});
    plane = new THREE.Mesh(planeGeom, cyan);
    plane2 = new THREE.Mesh(planeGeom, yellow);
    plane3 = new THREE.Mesh(planeGeom, magenta);
    plane.position.set(31, 0);
    plane2.position.set(0, -20);
    plane3.position.set(0, -20);
    lastPlane = plane;
    scene.add(plane);
    scene.add(plane2);
    scene.add(plane3);
    activePlane = plane;
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
}

function removeLines() {
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
    if (e.key == '1') {
        planeFollowing = !planeFollowing;
        activePlane = plane;
    }
    if (e.key == '2') {
        plane2Following = !plane2Following;
        activePlane = plane2;
    }
    if (e.key == '3') {
        plane3Following = !plane3Following;
        activePlane = plane3;
    }
    if (e.key == "ArrowUp") {
        activePlane.scale.set(activePlane.scale.x * 1.1, activePlane.scale.y * 1.1);
    }
    if (e.key == "ArrowDown") {
        activePlane.scale.set(activePlane.scale.x * 0.9, activePlane.scale.y * 0.9);
    }
}

// have a list of images
// if an image is clicked, add it to the scene
// be able to move the images around
// add ability to remove images
// add ability to save and load scenes

function animate() {

    requestAnimationFrame( animate );

    if (planeFollowing) {
        plane.position.set(xMouseCoord, yMouseCoord);
    }
    if (plane2Following) {
        plane2.position.set(xMouseCoord, yMouseCoord);
    }
    if (plane3Following) {
        plane3.position.set(xMouseCoord, yMouseCoord);
    }

    renderer.render( scene, camera );
};
