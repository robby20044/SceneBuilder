
import * as THREE from "https://unpkg.com/three@latest/build/three.module.js";

var lines = [];
var images = [];
var scene, camera, renderer;
var windowWidth, windowHeight;
var xMouseCoord, yMouseCoord;
var linesShowing = true;
var mouseDown, mouseInScene;
var screenHeight = 8;
var screenWidth = 64;
var loader = new THREE.TextureLoader();
var raycaster = new THREE.Raycaster();
var clickedElement;
var selectedObject, prevObject;


window.onload = function() {
    scene = new THREE.Scene();

    windowWidth = window.innerWidth;
    windowHeight = windowWidth / screenWidth * screenHeight;

    camera = new THREE.OrthographicCamera(-1 * screenWidth / 2, screenWidth / 2, 
        screenHeight / 2, -1 * screenHeight / 2);
    camera.position.set(0, 0, 100);

    // create renderer and setup the canvas
    var canvas = document.getElementById("c");
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize( windowWidth, windowHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

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
window.addEventListener('keydown', onKeyDown);
window.addEventListener('mousemove', onMouseMove);
window.addEventListener('mousedown', onMouseDown);
window.addEventListener('mouseup', onMouseUp);
window.addEventListener('wheel', onScroll);


function onResize() {
    windowWidth = window.innerWidth;
    windowHeight = windowWidth / screenWidth * screenHeight;
    renderer.setSize( windowWidth, windowHeight);
}

function onMouseMove(e) {
    // convert to canvas coords
    var xWindow = e.clientX - (window.innerWidth / 2);
    var yWindow = e.clientY - (window.innerHeight / 2);
    var xCanvas = screenWidth / 2 * xWindow / (windowWidth / 2);
    var yCanvas = -1 * screenHeight / 2 * yWindow / (windowHeight / 2);
    xMouseCoord = xCanvas;
    yMouseCoord = yCanvas;
}

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
    if (e.key == "ArrowUp") {
        var xScale = prevObject.scale.x;
        var yScale = prevObject.scale.y;
        prevObject.scale.set(xScale * 1.02, yScale * 1.02);
    }
    if (e.key == "ArrowDown") {
        var xScale = prevObject.scale.x;
        var yScale = prevObject.scale.y;
        prevObject.scale.set(xScale * 0.98, yScale * 0.98);
    }
}

function onMouseDown(e) {
    clickedElement = e.target;
    mouseDown = true;
    if (e.target.tagName == 'IMG') {
        var width = e.target.naturalWidth;
        var height = e.target.naturalHeight;
        var ratio = width / height;
        // https://codepen.io/duhaime/pen/jaYdLg used to learn how to add images to scene
        var texture = loader.load(e.target.src);
        texture.colorSpace = THREE.SRGBColorSpace;
        var imageMaterial = new THREE.SpriteMaterial({
            map: texture,
            color: 0xffffff
        });
        var image = new THREE.Sprite(imageMaterial);
        image.scale.x = 5 * ratio;
        image.scale.y = 5;
        image.position.set(0, 0, 0);
        images.push(image);
        scene.add(image);
    }
    if (clickedElement.tagName == 'CANVAS') {
        var mouse = new THREE.Vector2(xMouseCoord / (screenWidth / 2), yMouseCoord / (screenHeight / 2));
        raycaster.setFromCamera(mouse, camera);
        var intersects = raycaster.intersectObjects(scene.children);
        intersects.forEach(element => {
        if (element.object.type != "Line") {
            selectedObject = element.object;
        }
        else {selectedObject = null;}
        });
    }
}

function onMouseUp(e) {
    mouseDown = false;
    prevObject = selectedObject;
    selectedObject = null;
}

function onScroll(e) {
    if (mouseDown) {
        var xScale = selectedObject.scale.x;
        var yScale = selectedObject.scale.y;
        var aspectRatio = xScale / yScale;
        selectedObject.scale.set(xScale + (0.01 * e.deltaY * -1) * aspectRatio, yScale + (0.01 * e.deltaY * -1));
    }
    else if (mouseInScene) {
        var xScale = prevObject.scale.x;
        var yScale = prevObject.scale.y;
        var aspectRatio = xScale / yScale;
        prevObject.scale.set(xScale + (0.01 * e.deltaY * -1) * aspectRatio, yScale + (0.01 * e.deltaY * -1));
    }
}

// TODO:
// find more images
// add ability to remove images
// change layer of image
// add ability to save and load scenes

function animate() {

    requestAnimationFrame( animate );

    if (selectedObject != null && mouseDown) {
        selectedObject.position.set(xMouseCoord, yMouseCoord);
    }

    if (yMouseCoord < screenHeight / -2 || yMouseCoord > screenHeight / 2) {
        mouseInScene = false;
    }
    else {mouseInScene = true;}

    renderer.render( scene, camera );
};
