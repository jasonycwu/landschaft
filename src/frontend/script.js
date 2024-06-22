/**
 * @Author: Jason Y. Wu
 * @Date:   2024-06-16 20:13:05
 * @Last Modified by:   Jason Y. Wu
 * @Last Modified time: 2024-06-17 02:14:22
 */
import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {GUI} from "https://cdn.skypack.dev/lil-gui@0.17.0";

const containerEl = document.querySelector(".globe-wrapper");
const canvasEl = containerEl.querySelector("#globe-3d");
const svgMapDomEl = document.querySelector("#map");
const svgCountries = Array.from(svgMapDomEl.querySelectorAll("path"));
const svgCountryDomEl = document.querySelector("#country");
const countryNameEl = document.querySelector(".info span");

let renderer, scene, camera, rayCaster, pointer, controls;
let globeGroup, globeColorMesh, globeStrokesMesh, globeSelectionOuterMesh;

const svgViewBox = [2000, 1000];
const offsetY = -.1;

const params = {
    strokeColor: "#111111",
    defaultColor: "#9a9591",
    hoverColor: "#dcdad9", // original 00C9A2
    clickedColor: "#dcdad9",
    fogColor: "#e4e5e6",
    fogDistance: 2.65,
    strokeWidth: 2,
    hiResScalingFactor: 2,
    lowResScalingFactor: .7
}


let hoveredCountryIdx = 6;
let clickedCountryIdx = -1;
let isTouchScreen = false;
let isHoverable = true;

const textureLoader = new THREE.TextureLoader();
let staticMapUri;
const bBoxes = [];
const dataUris = [];


initScene();

window.addEventListener("resize", updateSize);


containerEl.addEventListener("touchstart", (e) => {
    isTouchScreen = true;
});
containerEl.addEventListener("mousemove", (e) => {
    updateMousePosition(e.clientX, e.clientY);
});
containerEl.addEventListener("click", (e) => {
    updateMousePosition(e.clientX, e.clientY);
    handleCountryClick();
});

function updateMousePosition(eX, eY) {
    pointer.x = (eX - containerEl.offsetLeft) / containerEl.offsetWidth * 2 - 1;
    pointer.y = -((eY - containerEl.offsetTop) / containerEl.offsetHeight) * 2 + 1;
}


function initScene() {
    renderer = new THREE.WebGLRenderer({canvas: canvasEl, alpha: true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(params.fogColor, 0, params.fogDistance);

    camera = new THREE.OrthographicCamera(-1.2, 1.2, 1.2, -1.2, 0, 3);
    camera.position.z = 1.3;

    globeGroup = new THREE.Group();
    scene.add(globeGroup);

    rayCaster = new THREE.Raycaster();
    rayCaster.far = 1.15;
    pointer = new THREE.Vector2(-1, -1);

    createOrbitControls();
    createGlobe();
    prepareHiResTextures();
    prepareLowResTextures();


    updateSize();

    gsap.ticker.add(render);
}

// the globe itself, its behavior
function createOrbitControls() {
    controls = new OrbitControls(camera, canvasEl);
    controls.enablePan = false;
    // controls.enableZoom = false;
    controls.enableDamping = true;
    controls.minPolarAngle = .46 * Math.PI;
    controls.maxPolarAngle = .46 * Math.PI;
    controls.autoRotate = false; // rotate on its own
    controls.autoRotateSpeed *= 1.2;

    controls.addEventListener("start", () => {
        isHoverable = false;
        pointer = new THREE.Vector2(-1, -1);
        gsap.to(globeGroup.scale, {
            duration: .3,
            x: .9,
            y: .9,
            z: .9,
            ease: "power1.inOut"
        })
    });
    controls.addEventListener("end", () => {
        // isHoverable = true;
        gsap.to(globeGroup.scale, {
            duration: .6,
            x: 1,
            y: 1,
            z: 1,
            ease: "back(1.7).out",
            onComplete: () => {
                isHoverable = true;
            }
        })
    });
}

// creates and configs the globe
function createGlobe() {
    const globeGeometry = new THREE.IcosahedronGeometry(1, 20);

    const globeColorMaterial = new THREE.MeshBasicMaterial({
        transparent: true,
        alphaTest: true,
        side: THREE.DoubleSide
    });
    const globeStrokeMaterial = new THREE.MeshBasicMaterial({
        transparent: true,
        depthTest: false,
    });
    const outerSelectionColorMaterial = new THREE.MeshBasicMaterial({
        transparent: true,
        side: THREE.DoubleSide
    });

    globeColorMesh = new THREE.Mesh(globeGeometry, globeColorMaterial);
    globeStrokesMesh = new THREE.Mesh(globeGeometry, globeStrokeMaterial);
    globeSelectionOuterMesh = new THREE.Mesh(globeGeometry, outerSelectionColorMaterial);

    globeStrokesMesh.renderOrder = 2;

    globeGroup.add(globeStrokesMesh, globeSelectionOuterMesh, globeColorMesh);
}

function setMapTexture(material, URI) {
    textureLoader.load(
        URI,
        (t) => {
            t.repeat.set(1, 1);
            material.map = t;
            material.needsUpdate = true;
        });
}

function prepareHiResTextures() {
    let svgData;
    gsap.set(svgMapDomEl, {
        attr: {
            "viewBox": "0 " + (offsetY * svgViewBox[1]) + " " + svgViewBox[0] + " " + svgViewBox[1],
            "stroke-width": params.strokeWidth,
            "stroke": params.strokeColor,
            "fill": params.defaultColor,
            "width": svgViewBox[0] * params.hiResScalingFactor,
            "height": svgViewBox[1] * params.hiResScalingFactor,
        }
    })
    svgData = new XMLSerializer().serializeToString(svgMapDomEl);
    staticMapUri = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgData);
    setMapTexture(globeColorMesh.material, staticMapUri);

    gsap.set(svgMapDomEl, {
        attr: {
            "fill": "none",
            "stroke": params.strokeColor,
        }
    })
    svgData = new XMLSerializer().serializeToString(svgMapDomEl);
    staticMapUri = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgData);
    setMapTexture(globeStrokesMesh.material, staticMapUri);
    countryNameEl.innerHTML = svgCountries[hoveredCountryIdx].getAttribute("data-name");
}

function handleCountryClick() {
    if (clickedCountryIdx !== -1 && clickedCountryIdx !== hoveredCountryIdx) {
        clickedCountryIdx = hoveredCountryIdx;
        const svgCountryClone = svgCountries[clickedCountryIdx].cloneNode(true);
        svgCountryDomEl.innerHTML = '';
        svgCountryDomEl.appendChild(svgCountryClone);
        const svgData = new XMLSerializer().serializeToString(svgCountryDomEl);
        const clickUri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);
        setMapTexture(globeSelectionOuterMesh.material, clickUri);
    }
}

function prepareLowResTextures() {
    gsap.set(svgCountryDomEl, {
        attr: {
            "viewBox": "0 " + (offsetY * svgViewBox[1]) + " " + svgViewBox[0] + " " + svgViewBox[1],
            "stroke-width": params.strokeWidth,
            "stroke": params.strokeColor,
            "fill": params.hoverColor,
            "width": svgViewBox[0] * params.lowResScalingFactor,
            "height": svgViewBox[1] * params.lowResScalingFactor,
        }
    })
    svgCountries.forEach((path, idx) => {
        bBoxes[idx] = path.getBBox();
    })
    svgCountries.forEach((path, idx) => {
        svgCountryDomEl.innerHTML = "";
        svgCountryDomEl.appendChild(svgCountries[idx].cloneNode(true));
        const svgData = new XMLSerializer().serializeToString(svgCountryDomEl);
        dataUris[idx] = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgData);
    })
    setMapTexture(globeSelectionOuterMesh.material, dataUris[hoveredCountryIdx]);

}

function updateMap(uv = {x: 0, y: 0}) {
    const pointObj = svgMapDomEl.createSVGPoint();
    pointObj.x = uv.x * svgViewBox[0];
    pointObj.y = (1 + offsetY - uv.y) * svgViewBox[1];

    let countryClicked = false;

    for (let i = 0; i < svgCountries.length; i++) {
        const boundingBox = bBoxes[i];
        if (
            pointObj.x > boundingBox.x ||
            pointObj.x < boundingBox.x + boundingBox.width ||
            pointObj.y > boundingBox.y ||
            pointObj.y < boundingBox.y + boundingBox.height
        ) {
            const isHovering = svgCountries[i].isPointInFill(pointObj);
            if (isHovering) {
                if (i !== hoveredCountryIdx) {
                    hoveredCountryIdx = i;
                    if (!countryClicked) {
                        setMapTexture(globeSelectionOuterMesh.material, dataUris[hoveredCountryIdx]);
                        countryNameEl.innerHTML = svgCountries[hoveredCountryIdx].getAttribute("data-name");
                    }
                    break;
                }
            }
        }
    }
}



function render() {
    controls.update();

    if (isHoverable) {
        rayCaster.setFromCamera(pointer, camera);
        const intersects = rayCaster.intersectObject(globeStrokesMesh);
        if (intersects.length) {
            updateMap(intersects[0].uv);
        }
    }

    if (isTouchScreen && isHoverable) {
        isHoverable = false;
    }

    renderer.render(scene, camera);
}

// sets the size of the globe container
function updateSize() {
    const side = Math.min(1000, Math.min(window.innerWidth, window.innerHeight) - 50);
    containerEl.style.width = side + "px";
    containerEl.style.height = side + "px";
    renderer.setSize(side, side);
}