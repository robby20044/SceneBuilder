
import * as THREE from "https://unpkg.com/three@latest/build/three.module.js";
import { OrbitControls } from 'https://unpkg.com/three@latest/examples/jsm/controls/OrbitControls.js';

var scene;
var camera;
var renderer;
var controls;

window.onload = function() {
// Three.js code goes here
scene = new THREE.Scene();

var windowWidth = window.innerWidth / 4;
var windowHeight = windowWidth / 16 * 10;

// setup the camera
var fov = 75;
var ratio = windowWidth / windowHeight;
var zNear = 1;
var zFar = 10000;
camera = new THREE.PerspectiveCamera( fov, ratio, zNear, zFar );
camera.position.set(0, 0, 100);

// create renderer and setup the canvas
renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize( windowWidth, windowHeight);
const container = document.getElementById("tjs");
container.appendChild(renderer.domElement);


// setup lights
var ambientLight = new THREE.AmbientLight();
scene.add( ambientLight );

var light = new THREE.DirectionalLight( 0xffffff, 5.0 );
light.position.set( 10, 100, 10 );
scene.add( light );

var geometry = new THREE.BoxGeometry(20, 20, 20);
var material = new THREE.MeshStandardMaterial({color: 0x00ffff});
var cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// interaction
controls = new OrbitControls( camera, renderer.domElement );

// call animation/rendering loop
animate();

};

function animate() {

requestAnimationFrame( animate );

// and here..
controls.update();
renderer.render( scene, camera );
};
