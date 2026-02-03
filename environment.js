
import * as THREE from "https://unpkg.com/three@latest/build/three.module.js";

var lines = [];
var images = [];
var scene, camera, renderer;
var windowWidth, windowHeight;
var linesShowing = true;
let mouse = {
    x: 0, y: 0,
    down: false,
    inScene: false,
    xOffset: 0, yOffset: 0
}
var screenHeight = 8;
var screenWidth = 64;
var selectedObject, prevObject;


window.onload = function() {
    scene = new THREE.Scene();

    // create and setup camera
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

// draws guiding lines to divide the scene into 4 parts
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

// removes the lines from the scene
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

// listens for file upload and reads it
const fileUpload = document.querySelector("#sceneUpload")
fileUpload.addEventListener("change", async (event) => {
    var uploadedScene = await event.target.files[0].text()
    buildScene(uploadedScene)
})

// resizes the scene when the window is resized
function onResize() {
    windowWidth = window.innerWidth;
    windowHeight = windowWidth / screenWidth * screenHeight;
    renderer.setSize( windowWidth, windowHeight);
}

// updates the mouse coordinates as it moves
function onMouseMove(e) {
    // convert to canvas coords
    var xWindow = e.clientX - (window.innerWidth / 2);
    var yWindow = e.clientY - (window.innerHeight / 2);
    var xCanvas = screenWidth / 2 * xWindow / (windowWidth / 2);
    var yCanvas = -1 * screenHeight / 2 * yWindow / (windowHeight / 2);
    mouse.x = xCanvas;
    mouse.y = yCanvas;
}

// controls:
// l : toggle visibillity of guiding lines
// up arrow : enlarges selected image
// down arrow : shrinks selected image
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

// adds functionality for various actions
function onMouseDown(e) {
    let clickedElement = e.target;
    mouse.down = true;
    // downloads the scene if the download button is clicked
    if (e.target.id == 'download') {
        downloadScene();
    }
    // adds an image if it was clicked
    if (e.target.tagName == 'IMG') {
        addImage(e.target)
    }
    // logic for moving images with the mouse
    if (clickedElement.tagName == 'CANVAS') {
        // uses ray picking to establish what image the mouse selected 
        // (while ignoring the guiding lines) and updates it to the 
        // currently selected object
        var raycaster = new THREE.Raycaster();
        var mouseLocation = new THREE.Vector2(mouse.x / (screenWidth / 2), mouse.y / (screenHeight / 2));
        raycaster.setFromCamera(mouseLocation, camera);
        var intersects = raycaster.intersectObjects(scene.children);
        intersects.forEach(element => {
        if (element.object.type != "Line") {
            selectedObject = element.object;
        }
        else {selectedObject = null;}
        });
        // the offset is used to keep a memory of the relative positioning
        // of the mouse and image
        if (selectedObject != null) {
            mouse.xOffset = selectedObject.position.x - mouse.x;
            mouse.yOffset = selectedObject.position.y - mouse.y;
        }
    }
}

// keeps a memory of the last selected object
function onMouseUp(e) {
    mouse.down = false;
    prevObject = selectedObject;
    selectedObject = null;
}

// enlarges/shrinks the last selected image with the scroll wheel
function onScroll(e) {
    let current = null;
    if (selectedObject != null) {current = selectedObject;}
    else if (prevObject != null) {current = prevObject;}
    if (current == null || !mouse.inScene) {return;}
    var xScale = current.scale.x;
    var yScale = current.scale.y;
    var aspectRatio = xScale / yScale;
    current.scale.set(xScale + (0.01 * e.deltaY * -1) * aspectRatio, yScale + (0.01 * e.deltaY * -1));
}

// records the url, position, and scale of each image in the scene, 
// stringifies it, then downloads this data
function downloadScene() {
    const imagesData = [];
    images.forEach(img => {
        imagesData.push([img.material.map.source.data.currentSrc, img.position, img.scale]);
    });
    var imagesJSON = JSON.stringify(imagesData);
    const blob = new Blob([imagesJSON], {type: "applications/json"});
    window.open(URL.createObjectURL(blob));
}

// recreates a scene from the save file
function buildScene(fileContents) {
    var data = JSON.parse(fileContents)
    data.forEach(imageData => {
        // element = [image url, position, scale]
        addImage(imageData[0], imageData[1], imageData[2])
    })
}


// adds an image to the scene.
// can be called with just an IMG as a parameter, or the URL, pos, and scale
function addImage(img, position, scale) {
    var loader = new THREE.TextureLoader();
    // if position is undefined, that means an IMG element was passed as an arg, 
    // so the url is img.src
    if (position == undefined) {
        var texture = loader.load(img.src);
    }
    // if it is defined, img is the url
    else {
        var texture = loader.load(img);
    }

    // creates the image
    texture.colorSpace = THREE.SRGBColorSpace;
    var imageMaterial = new THREE.SpriteMaterial({
        map: texture,
        color: 0xffffff
    });
    var image = new THREE.Sprite(imageMaterial);

    // calculates scale if it wasn't given
    if (scale == undefined) {    
        var width = img.naturalWidth;
        var height = img.naturalHeight;
        var ratio = width / height;
        image.scale.x = 5 * ratio;
        image.scale.y = 5;
    }
    else {
        image.scale.x = scale.x
        image.scale.y = scale.y
    }
    
    if (position != undefined) {
        image.position.set(position.x, position.y, position.z);
    }
    else {
        image.position.set(0, 0, 0)
    }
    images.push(image);
    scene.add(image);
}

function animate() {

    requestAnimationFrame( animate );

    if (selectedObject != null && mouse.down) {
        selectedObject.position.set(mouse.x + mouse.xOffset, 
            mouse.y + mouse.yOffset);
    }

    if (mouse.y < screenHeight / -2 || mouse.y > screenHeight / 2) {
        mouse.inScene = false;
    }
    else {mouse.inScene = true;}

    renderer.render( scene, camera );
};
