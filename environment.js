
import * as THREE from "https://unpkg.com/three@latest/build/three.module.js";

const stateInfo = {
    lines: [],
    images: [],
    scene: null,
    camera: null,
    renderer: null,
    window: {width: 0, height: 0},
    linesShowing: false,
    mouse: {x: 0, y: 0, down: false, inScene: false, xOffset: 0, yOffset: 0},
    frustum: {width: 64, height: 8},
    selectedObject: null,
    prevObject: null
}



window.onload = function() {
    stateInfo.scene = new THREE.Scene();

    // create and setup camera
    stateInfo.window.width = window.innerWidth;
    stateInfo.window.height = stateInfo.window.width / stateInfo.frustum.width * stateInfo.frustum.height;
    stateInfo.camera = new THREE.OrthographicCamera(-1 * stateInfo.frustum.width / 2, stateInfo.frustum.width / 2, 
        stateInfo.frustum.height / 2, -1 * stateInfo.frustum.height / 2);
    stateInfo.camera.position.set(0, 0, 100);

    // create renderer and setup the canvas
    var canvas = document.getElementById("c");
    stateInfo.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    stateInfo.renderer.setSize( stateInfo.window.width, stateInfo.window.height);
    stateInfo.renderer.outputColorSpace = THREE.SRGBColorSpace;

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
        stateInfo.lines.push(line);
        stateInfo.scene.add(line);
    });
}

// removes the lines from the scene
function removeLines() {
    stateInfo.lines.forEach(line => {
        stateInfo.scene.remove(line);
    });
    stateInfo.lines = [];
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
    stateInfo.window.width = window.innerWidth;
    stateInfo.window.height = stateInfo.window.width / stateInfo.frustum.width * stateInfo.frustum.height;
    stateInfo.renderer.setSize( stateInfo.window.width, stateInfo.window.height);
}

// updates the mouse coordinates as it moves
function onMouseMove(e) {
    // convert to canvas coords
    var xWindow = e.clientX - (window.innerWidth / 2);
    var yWindow = e.clientY - (window.innerHeight / 2);
    var xCanvas = stateInfo.frustum.width / 2 * xWindow / (stateInfo.window.width / 2);
    var yCanvas = -1 * stateInfo.frustum.height / 2 * yWindow / (stateInfo.window.height / 2);
    stateInfo.mouse.x = xCanvas;
    stateInfo.mouse.y = yCanvas;
}

// controls:
// l : toggle visibillity of guiding lines
// up arrow : enlarges selected image
// down arrow : shrinks selected image
function onKeyDown(e) {
    if (e.key == 'l') {
        if (stateInfo.linesShowing) {
            removeLines();
            stateInfo.linesShowing = false;
        }
        else if (!stateInfo.linesShowing) {
            drawLines();
            stateInfo.linesShowing = true;
        }
    }
    if (e.key == "ArrowUp") {
        var xScale = stateInfo.prevObject.scale.x;
        var yScale = stateInfo.prevObject.scale.y;
        stateInfo.prevObject.scale.set(xScale * 1.02, yScale * 1.02);
    }
    if (e.key == "ArrowDown") {
        var xScale = stateInfo.prevObject.scale.x;
        var yScale = stateInfo.prevObject.scale.y;
        stateInfo.prevObject.scale.set(xScale * 0.98, yScale * 0.98);
    }
}

// adds functionality for various actions
function onMouseDown(e) {
    let clickedElement = e.target;
    stateInfo.mouse.down = true;
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
        var mouseLocation = new THREE.Vector2(stateInfo.mouse.x / (stateInfo.frustum.width / 2), stateInfo.mouse.y / (stateInfo.frustum.height / 2));
        raycaster.setFromCamera(mouseLocation, stateInfo.camera);
        var intersects = raycaster.intersectObjects(stateInfo.scene.children);
        intersects.forEach(element => {
        if (element.object.type != "Line") {
            stateInfo.selectedObject = element.object;
        }
        else {stateInfo.selectedObject = null;}
        });
        // the offset is used to keep a memory of the relative positioning
        // of the mouse and image
        if (stateInfo.selectedObject != null) {
            stateInfo.mouse.xOffset = stateInfo.selectedObject.position.x - stateInfo.mouse.x;
            stateInfo.mouse.yOffset = stateInfo.selectedObject.position.y - stateInfo.mouse.y;
        }
    }
}

// keeps a memory of the last selected object
function onMouseUp(e) {
    stateInfo.mouse.down = false;
    stateInfo.prevObject = stateInfo.selectedObject;
    stateInfo.selectedObject = null;
}

// enlarges/shrinks the last selected image with the scroll wheel
function onScroll(e) {
    let current = null;
    if (stateInfo.selectedObject != null) {current = stateInfo.selectedObject;}
    else if (stateInfo.prevObject != null) {current = stateInfo.prevObject;}
    if (current == null || !stateInfo.mouse.inScene) {return;}
    var xScale = current.scale.x;
    var yScale = current.scale.y;
    var aspectRatio = xScale / yScale;
    current.scale.set(xScale + (0.01 * e.deltaY * -1) * aspectRatio, yScale + (0.01 * e.deltaY * -1));
}

// records the url, position, and scale of each image in the scene, 
// stringifies it, then downloads this data
function downloadScene() {
    const imagesData = [];
    stateInfo.images.forEach(img => {
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
    stateInfo.images.push(image);
    stateInfo.scene.add(image);
}

function animate() {

    requestAnimationFrame( animate );

    if (stateInfo.selectedObject != null && stateInfo.mouse.down) {
        stateInfo.selectedObject.position.set(stateInfo.mouse.x + stateInfo.mouse.xOffset, 
            stateInfo.mouse.y + stateInfo.mouse.yOffset);
    }

    if (stateInfo.mouse.y < stateInfo.frustum.height / -2 || stateInfo.mouse.y > stateInfo.frustum.height / 2) {
        stateInfo.mouse.inScene = false;
    }
    else {stateInfo.mouse.inScene = true;}

    stateInfo.renderer.render( stateInfo.scene, stateInfo.camera );
};
