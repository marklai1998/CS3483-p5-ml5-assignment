const IMAGE_WIDTH = 800;
const IMAGE_HEIGHT = 544;

const mode = {
  NORMAL: "NORMAL",
  VIEW: "VIEW",
  REPLACE: "REPLACE",
};

let currentMode = mode.NORMAL;

let imageArea;
let videoArea;
let canvas;

let img;
let blurImg;
let video;

let faceapi;
let detections = [];
let croppedImages = [];
let croppedFaces = [];

function preload() {
  img = loadImage("image.jpg");
  blurImg = loadImage("image.jpg");
}

function setup() {
  canvas = createCanvas(IMAGE_WIDTH * 2, IMAGE_HEIGHT);

  blurImg.filter(BLUR, 3);
  imageArea = createGraphics(IMAGE_WIDTH, IMAGE_HEIGHT);

  video = createCapture(VIDEO);
  video.size(IMAGE_WIDTH, IMAGE_HEIGHT);
  video.hide();
  videoArea = createGraphics(IMAGE_WIDTH, IMAGE_HEIGHT);

  faceapi = ml5.faceApi(
    video,
    { withLandmarks: true, withExpressions: false, withDescriptors: false },
    () => faceapi.detect(handleFaceDetected)
  );
}

function draw() {
  drawImage();
  drawVideo();
  image(imageArea, 0, 0);
  image(videoArea, IMAGE_WIDTH, 0);
}

function keyPressed() {
  switch (key) {
    case "v":
      currentMode = mode.VIEW;
      croppedFaces = [];
      break;
    case "f":
      currentMode = mode.REPLACE;
      croppedImages = [];
      break;
    case "e":
      currentMode = mode.NORMAL;
      croppedFaces = [];
      croppedImages = [];
      break;
  }
}

const handleFaceDetected = (error, result) => {
  if (error) {
    console.log(error);
    return;
  }

  detections = result;

  if (currentMode === mode.VIEW) {
    croppedImages = detections.map(({ alignedRect: { box } }) => ({
      image: crop(img, box),
      x: box.x,
      y: box.y,
    }));
  } else if (currentMode === mode.REPLACE) {
    croppedFaces = detections.map(({ alignedRect: { box } }) => ({
      image: crop(video, box),
      x: box.x,
      y: box.y,
    }));
  }
  faceapi.detect(handleFaceDetected);
};

const drawImage = () => {
  if (currentMode === mode.NORMAL) {
    imageArea.image(img, 0, 0);
  } else {
    imageArea.image(blurImg, 0, 0);
  }

  if (currentMode !== mode.NORMAL) {
    if (currentMode === mode.VIEW) {
      croppedImages.forEach(({ image, x, y }) => {
        imageArea.image(image, x, y);
      });
    } else if (currentMode === mode.REPLACE) {
      croppedFaces.forEach(({ image, x, y }) => {
        imageArea.image(image, x, y);
      });
    }
  }
};

const drawVideo = () => {
  const frame = video.get();
  videoArea.image(frame, 0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
  videoArea.noFill();
  videoArea.stroke(0, 0, 255);
  videoArea.strokeWeight(4);
  detections.forEach(({ alignedRect: { box } }) => {
    videoArea.rect(box.x, box.y, box.width, box.height);
  });
};

const crop = (image, box) => {
  const cropped = createImage(box.width, box.height);
  cropped.copy(
    image,
    box.x,
    box.y,
    box.x + box.width,
    box.y + box.height,
    0,
    0,
    box.x + box.width,
    box.y + box.height
  );
  return cropped;
};
