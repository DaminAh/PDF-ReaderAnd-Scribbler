//canvas variable

const pdfBoard = document.getElementById("pdf-board");
const drawingSlate = document.getElementById("drawing-slate");
const tempSlate = document.getElementById("temp-slate");

const ctx = pdfBoard.getContext("2d");
const ctxSlate = drawingSlate.getContext("2d");
const ctxTemp = tempSlate.getContext("2d");

const pdfBoardOffsetX = pdfBoard.offsetLeft;
const pdfBoardOffsetY = pdfBoard.offsetTop;

const drawingSlateOffsetX = drawingSlate.offsetLeft;
const drawingSlatesOffsetY = drawingSlate.offsetTop;

const tempSlateOffsetX = tempSlate.offsetLeft;
const tempSlateOffsetY = tempSlate.offsetTop;

pdfBoard.width = window.innerWidth - pdfBoardOffsetX;
pdfBoard.height = window.innerHeight - pdfBoardOffsetY;

drawingSlate.width = window.innerWidth - drawingSlateOffsetX;
drawingSlate.height = window.innerHeight - drawingSlatesOffsetY;

tempSlate.width = window.innerWidth - tempSlateOffsetX;
tempSlate.height = window.innerHeight - tempSlateOffsetY;

let isPainting = false;
let slatePainting = false;
let eraserOff = true;
let lineWidth = 5;
let startX;
let startY;

//toolbar variables
let strokeInput = document.getElementById("stroke");
let lineInput = document.getElementById("lineWidth");
let alphaInput = document.getElementById("alpha");
let eraser = document.getElementById("eraser");
let tlbBtns = document.querySelectorAll(".tlbBtn");
let alphaChannelValue = alphaInput.value;
let alphatemp = null;

//pdfjs variables
let pdfDoc = null;
let numPages = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;
let scale = 1.5;

//misc variables
//misc variables
let preScaledImg;
let imgElm = new Image();
let img = new Image();
let ZoomSwitch = false;
var hRatio;
var vRatio;
var ratio;

const toolbar = document.getElementById("toolbar");
const form = document.getElementById("form");
const fileInput = document.querySelector(".file-select");

window.addEventListener("load", (event) => {
  ctxSlate.globalAlpha = alphaChannelValue;
  tempSlate.style.opacity = alphaChannelValue;
  reIntializeInputs();
  console.log("reintialised called");
});

function reIntializeInputs() {
  ctxTemp.strokeStyle = strokeInput.value;
  lineWidth = lineInput.value;
}

form.addEventListener("submit", logSubmit);
eraser.addEventListener("click", () => {
  drawingSlate.classList.toggle("crosshair");
  eraser.classList.toggle("blue");
  eraserLogic();
});

function eraserLogic() {
  if (eraserOff) {
    alphatemp = alphaChannelValue;
    alphaInput.disabled = true;
    console.log("alpha temp: ", alphatemp);
    settingAlphaChannels(1);
    eraserOff = false;
    switchIndex();
    ctxSlate.globalCompositeOperation = "destination-out";
    for (let btn of tlbBtns) {
      // console.log(btn);
      btn.disabled = true;
      btn.classList.toggle("grey");
    }
  } else {
    alphaInput.disabled = false;
    eraserOff = true;
    ctxSlate.globalCompositeOperation = "source-over";
    switchIndex();
    console.log("alpha temp: ", alphatemp);
    settingAlphaChannels(alphatemp);
    for (let btn of tlbBtns) {
      // console.log(btn);
      btn.disabled = false;
      btn.classList.toggle("grey");
    }
  }
}

function switchIndex() {
  drawingSlate.style.zIndex == "1"
    ? (drawingSlate.style.zIndex = "2")
    : (drawingSlate.style.zIndex = "1");
  tempSlate.style.zIndex == "2"
    ? (tempSlate.style.zIndex = "1")
    : (tempSlate.style.zIndex = "2");
}

//toolbar events
toolbar.addEventListener("click", (e) => {
  if (e.target.id === "clear") {
    clear();
  }
});

toolbar.addEventListener("change", (e) => {
  if (e.target.id === "stroke") {
    ctxTemp.strokeStyle = e.target.value;
  }

  if (e.target.id === "lineWidth") {
    lineWidth = e.target.value;
  }
});

alphaInput.addEventListener("change", () => {
  alphaChannelValue = alphaInput.value;
  console.log("calling settingAlphaChannels()");
  settingAlphaChannels(alphaChannelValue);
});

function settingAlphaChannels(value) {
  alphaChannelValue = value;
  tempSlate.style.opacity = alphaChannelValue;
  ctxSlate.globalAlpha = alphaChannelValue;
  console.log("setting alpha channels to = ", alphaChannelValue);
  console.log("ctxSlate.globalAlpha= ", ctxSlate.globalAlpha);
  console.log("tempSlate.style.opacity= ", tempSlate.style.opacity);
}

function initializeCanvas() {
  console.log("canvas loaded");
}

//drawing canvas events
const draw = (e) => {
  if (!isPainting) {
    return;
  }

  ctxTemp.lineWidth = lineWidth;
  ctxTemp.lineCap = "round";
  ctxTemp.lineJoin = "round";
  ctxTemp.lineTo(e.clientX - pdfBoardOffsetX, e.clientY);
  ctxTemp.stroke();
};

tempSlate.addEventListener("mousedown", (e) => {
  isPainting = true;
  startX = e.clientX;
  startY = e.clientY;
  ctxSlate.globalAlpha = alphaChannelValue;
});

tempSlate.addEventListener("mouseup", (e) => {
  isPainting = false;
  ctxTemp.stroke();
  ctxTemp.beginPath();
  ctxSlate.drawImage(tempSlate, 0, 0);
  ctxTemp.clearRect(0, 0, tempSlate.width, tempSlate.height);
});
tempSlate.addEventListener("mousemove", draw);

//eraser events on drawing slate
//drawing canvas events
const draw_slate = (e) => {
  if (!slatePainting) {
    return;
  }

  ctxSlate.lineWidth = lineWidth;
  ctxSlate.lineCap = "round";
  ctxSlate.lineJoin = "round";

  ctxSlate.lineTo(e.clientX - drawingSlateOffsetX, e.clientY);
  ctxSlate.stroke();
};

drawingSlate.addEventListener("mousedown", (e) => {
  slatePainting = true;
  startX = e.clientX;
  startY = e.clientY;
  ctxSlate.globalAlpha = alphaChannelValue;
  console.log("drawing slate mouse down");
});

drawingSlate.addEventListener("mouseup", (e) => {
  slatePainting = false;
  ctxSlate.stroke();
  ctxSlate.beginPath();
  console.log("drawing slate mouse up");
});

drawingSlate.addEventListener("mousemove", draw_slate);

//pdf code
function logSubmit(event) {
  event.preventDefault();

  ctx.clearRect(0, 0, pdfBoard.width, pdfBoard.height);
  ctxSlate.clearRect(0, 0, drawingSlate.width, drawingSlate.height);
  ctxTemp.clearRect(0, 0, tempSlate.width, tempSlate.height);
  restore_array = [];
  index = -1;
  console.log("cleared");

  console.log("pdf loaded");
  let filename = null;
  if (!fileInput.files[0]) {
    alert("Please select a file");
    return;
  } else {
    filename = fileInput.files[0].name;
  }
  const n = 3;
  let verifyPdf = filename.substring(filename.length - n);
  //to check selected file is pdf
  if (verifyPdf == "pdf") {
    console.log("file is pdf");
    var file = fileInput.files[0]; //getting the file
    var fileReader = new FileReader(); //will use the file reader to read data from selected file

    fileReader.onload = function () {
      var typedarray = new Uint8Array(this.result); //we do this cause we have the selected the file by browsing and beacuse
      // we dont have that new browsed file in our root directory

      //replaced the old function with the new api
      const loadingTask = pdfjsLib.getDocument(typedarray);
      loadingTask.promise.then((doc) => {
        // The document is loaded here...
        pdfDoc = doc;
        document.getElementById("page_count").textContent = doc.numPages;
        numPages = doc.numPages;
        renderPage(pageNum);
        reIntializeInputs();
      });
    };
    //Step 3:Read the file as ArrayBuffer
    fileReader.readAsArrayBuffer(file);
  } else {
    //file selected is not a pdf file
    alert("Please select a pdf file");
  }
}

function renderPage(num) {
  pageRendering = true;
  pdfDoc.getPage(num).then((page) => {
    const viewport = page.getViewport({ scale: scale });
    pdfBoard.height = viewport.height;
    pdfBoard.width = viewport.width;

    drawingSlate.width = pdfBoard.width;
    drawingSlate.height = pdfBoard.height;

    tempSlate.width = pdfBoard.width;
    tempSlate.height = pdfBoard.height;

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
    };

    var renderTask = page.render(renderContext);
    renderTask.promise.then(() => {
      pageRendering = false;
      if (pageNumPending !== null) {
        renderPage(pageNumPending);
        pageNumPending = null;
      }
      reIntializeInputs();
      if (ZoomSwitch) {
        DrawScaleImage();
      }
    });
  });
  document.getElementById("page_num").textContent = num;
}

function queueRenderPage(num) {
  if (pageRendering) {
    pageNumPending = num;
  } else {
    renderPage(num);
  }
}

//to go back to previous pdf page
function onPrevPage() {
  // scale = 1.5;
  ZoomSwitch = false;
  // setting
  if (pageNum <= 1) {
    return;
  }
  replaceData();
  pageNum--;
  queueRenderPage(pageNum);
  console.log("rendered previous pages");
  restoreState();
  console.log("state restored");
  // alphaInput.value = 1;
  // ctxSlate.globalAlpha = alphaChannelValue;
}

//to go  to next pdf page
function onNextPage() {
  // scale = 1.5;
  ZoomSwitch = false;
  // setting
  if (pdfDoc == null) {
    return;
  }
  if (pageNum >= pdfDoc.numPages) {
    return;
  }

  pageNum++;
  saveState();
  queueRenderPage(pageNum);
}
//image scaling function
function DrawScaleImage() {
  console.log("drawing");
  var hRatio = pdfBoard.width / img.width;
  var vRatio = pdfBoard.height / img.height;
  var ratio = Math.min(hRatio, vRatio);
  ctxSlate.drawImage(
    img,
    0,
    0,
    img.width,
    img.height,
    0,
    0,
    img.width * ratio,
    img.height * ratio
  );
}
//changes the scale in ctx context to zoom out
function zoomOut() {
  ZoomSwitch = true;
  preScaledImg = drawingSlate.toDataURL("image/png");
  img = new Image();
  img.src = preScaledImg;

  scale -= 0.1;
  if (scale < 1.4) {
    scale = 1.4;
    console.log("minimum zoom");
  }
  renderPage(pageNum);
}

//changes the scale in ctx context to zoom in

function zoomIn() {
  ZoomSwitch = true;
  preScaledImg = drawingSlate.toDataURL("image/png");
  img = new Image();
  img.src = preScaledImg;

  scale += 0.1;
  if (scale > 1.7) {
    scale = 1.7;
    console.log("maximum zoom");
  }
  renderPage(pageNum);
}

document.getElementById("next").addEventListener("click", onNextPage);
document.getElementById("prev").addEventListener("click", onPrevPage);
document.getElementById("zoomIn").addEventListener("click", zoomIn);
document.getElementById("zoomOut").addEventListener("click", zoomOut);

//functionality functions
function clear() {
  ctx.clearRect(0, 0, pdfBoard.width, pdfBoard.height);
  ctxTemp.clearRect(0, 0, tempSlate.width, tempSlate.height);
  ctxSlate.clearRect(0, 0, drawingSlate.width, drawingSlate.height);
  location.reload();
}

//saving & restoring state
let imageData = [];
let page_no = null;

function saveState() {
  page_no = pageNum - 1;
  imageData[page_no] = drawingSlate.toDataURL("image/png"); // create a Image Element
  if (imageData[pageNum]) {
    console.log("image alrready exists");
    restoreState();
  }

  // ctx.save();
}

function restoreState() {
  ctxSlate.clearRect(0, 0, drawingSlate.width, drawingSlate.height);
  console.log("in restore ");

  ctxSlate.clearRect(0, 0, drawingSlate.width, drawingSlate.height);
  console.log("in restore ");
  img.src = imageData[pageNum];

  img.onload = function () {
    hRatio = pdfBoard.width / img.width;
    vRatio = pdfBoard.height / img.height;
    ratio = Math.min(hRatio, vRatio);
    console.log("hratio is " + hRatio);
    ctxSlate.drawImage(
      img,
      0,
      0,
      img.width,
      img.height,
      0,
      0,
      img.width * ratio,
      img.height * ratio
    );
  };

  // old solution withgout image scaling
  // ctxSlate.clearRect(0, 0, pdfBoard.width, pdfBoard.height);
  // let destinationImage = new Image();
  // destinationImage.onload = function () {
  //   ctxSlate.drawImage(destinationImage, 0, 0);
  // };
  // destinationImage.src = imageData[pageNum];
}

function replaceData() {
  page_no = pageNum;
  imageData[page_no] = drawingSlate.toDataURL("image/png"); // create a Image Element
}
