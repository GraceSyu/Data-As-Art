//p5.js  basic structure ref from https://openprocessing.org/sketch/1433231 by SamuelYAN
let seed = Math.random() * 1000;
let fixedColors = ["#f5989d", "#ffe066", "#44b39f", "#5863b1", "#6cbbd4"];
let waveData;
let currentMonthIndex = 0;
let nextMonthIndex = 1;
let lerpAmt = 0;
let transitionSpeed = 1 / 150;


let waveSegmentLayers = [];
let overAllTexture;
let margin = 25;

let xOffset = 133; // ✅ 直接修改這個值來控制山體左右偏移
let nameXPositions = []; // 底部方塊用
let nameXPositionsForWave = []; // 山體與倒影用

let reflectionLayerTop, reflectionLayerBottom;
let blurZoneLayer;

function preload() {
  waveData = loadJSON("秋水data.json");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  frameRate(30);
  makeFilter();
  reflectionLayerTop = createGraphics(windowWidth, windowHeight);
  reflectionLayerBottom = createGraphics(windowWidth, windowHeight);
  blurZoneLayer = createGraphics(windowWidth, windowHeight);
  for (let i = 0; i < 1000; i++) {
    let g = createGraphics(windowWidth, windowHeight);
    g.noStroke();
    waveSegmentLayers.push(g);
  }
}

function draw() {
  background("#e6e3df");
  if (frameCount % 500 === 0) makeFilter();

  reflectionLayerTop.clear();
  reflectionLayerBottom.clear();
  blurZoneLayer.clear();
  for (let g of waveSegmentLayers) g.clear();

  let segmentCount = 0;
  let months = waveData.months;
  let names = waveData.names;
  let ageTypes = waveData.age_types;
  let amplitudes = waveData.amplitudes;
  let baseLine = height * 0.7;

  let currentMonth = months[currentMonthIndex];
  let nextMonth = months[nextMonthIndex];

  nameXPositions.length = 0;
  nameXPositionsForWave.length = 0;
  let spacing = (width - 2 * margin) / names.length;
  for (let i = 0; i <= names.length; i++) {
    nameXPositions.push(margin + spacing * i);
    nameXPositionsForWave.push(margin + spacing * i + xOffset);
  }


let ageTypeColorMap = {
  "child": "#f5989d",     // 粉色
  "teen": "#44b39f",      // 黃色
  "middleAge":"#d9bd4e", // 綠色
  "elder": "#353f87"      // 深藍
};

// 計算每個年齡層的總數量
// 依 JSON 中的 age_types 順序建立 waveShapes
let waveShapes = ageTypes.map((ageType, i) => {
  let color = ageTypeColorMap[ageType];
  let currentAmpArray = amplitudes[ageType][currentMonth];
  let nextAmpArray = amplitudes[ageType][nextMonth];
  let yValues = [];

  for (let j = 0; j <= names.length; j++) {
    let a = currentAmpArray[j] || 0;
    let b = nextAmpArray[j] || 0;
    let lerpedAmp = lerp(a, b, lerpAmt);
    if (abs(lerpedAmp) < 1e-3) {
      yValues.push(0);
      continue;
    }
    let mappedY = -map(lerpedAmp, 0, 12, 0, 400);
    let offset = (noise(j * 0.1, frameCount * 0.0025 + i * 10) - 0.5) * 30;
    yValues.push(mappedY + offset);
  }

  return { ageType, color, yValues };
});


 
// 顯示年份（左上角，小字）
push();
fill(50);
noStroke();
textAlign(LEFT, TOP);
textSize(20); // ✅ 小一點
textFont("sans-serif");

// let year = currentMonth.split("-")[0];
let year = 2024;
let yearText = year + " 年";
text(yearText, 50, 20);
pop();


// 顯示日子（中央，大字）
push();
fill(190);
noStroke();
textAlign(LEFT, TOP);
// textSize(200); // ✅ 大一點
textSize(20); // ✅ 大一點
textFont("sans-serif");


let dayText = currentMonth  +  " ~ " + nextMonth;
// text(dayText, width / 2, height / 2 -100);
let yearTextWidth = textWidth(yearText);

text(dayText, 50 + yearTextWidth + 10, 20);
pop();


  lerpAmt += transitionSpeed;
  if (lerpAmt >= 1) {
    lerpAmt = 0;
    currentMonthIndex = nextMonthIndex;
    nextMonthIndex = (nextMonthIndex + 1) % waveData.months.length;
  }
  // 👉 主波形區塊
  for (let j = 0; j < names.length; j++) {
    let segmentList = [];
    for (let shape of waveShapes) {
      let y0 = shape.yValues[max(j - 1, 0)];
      let y1 = shape.yValues[j];
      let y2 = shape.yValues[j + 1];
      let y3 = shape.yValues[min(j + 2, shape.yValues.length - 1)];
      segmentList.push({ color: shape.color, y0, y1, y2, y3, shape });
    }

    for (let s of segmentList) {
      if (s.y1 === 0 && s.y2 === 0) continue;
      if (!waveSegmentLayers[segmentCount]) {
        let g = createGraphics(windowWidth, windowHeight);
        g.noStroke();
        waveSegmentLayers.push(g);
      }

      let g = waveSegmentLayers[segmentCount++];
      g.clear();
      g.push();
      g.translate(0, baseLine);

      let x0 = nameXPositionsForWave[max(j - 1, 0)];
      let x1 = nameXPositionsForWave[j];
      let x2 = nameXPositionsForWave[j + 1];
      let x3 = nameXPositionsForWave[min(j + 2, nameXPositionsForWave.length - 1)];

      let safeMargin = 0.5;
      let cp1x = x1 + (x2 - x0) / 6;
      let cp1y = s.y1 + (s.y2 - s.y0) / 6;
      let cp2x = x2 - (x3 - x1) / 6;
      let cp2y = s.y2 - (s.y3 - s.y1) / 6;
      if (j === 0) {
        cp1x = x1 + (x2 - x0) / 3.5;
        cp1y = s.y1 + (s.y2 - s.y0) / 3.5;
        cp2x = x2 - (x3 - x1) / 3.5;
        cp2y = s.y2 - (s.y3 - s.y1) / 3.5;
      }
      
      let fillColor = color(s.color);
      fillColor.setAlpha(180);
      g.fill(fillColor);
      g.beginShape();
      g.vertex(x1, 0);
      g.vertex(x1, s.y1);
      g.bezierVertex(cp1x, cp1y, cp2x, cp2y, x2+0.35, s.y2);
      g.vertex(x2, 0);
      g.endShape(CLOSE);
      g.pop();
    }

    // 👉 倒影
    for (let shape of waveShapes) {
      if (shape.yValues[j] === 0 && shape.yValues[j + 1] === 0) continue;
      let x1 = nameXPositionsForWave[j];
      let x2 = nameXPositionsForWave[j + 1];
      let y1_mirror = baseLine - shape.yValues[j] * 0.3;
      let y2_mirror = baseLine - shape.yValues[j + 1] * 0.3;
      let splitY = lerp(y1_mirror, y2_mirror, 0.8);
      let c = color("#6cbbd4");
      c.setAlpha(30);

      reflectionLayerTop.push();
      reflectionLayerTop.noStroke();
      reflectionLayerTop.fill(c);
      reflectionLayerTop.beginShape();
      reflectionLayerTop.vertex(x1, baseLine);
      reflectionLayerTop.vertex(x1, y1_mirror);
      reflectionLayerTop.vertex(x2, y2_mirror);
      reflectionLayerTop.vertex(x2, baseLine);
      reflectionLayerTop.endShape(CLOSE);
      reflectionLayerTop.pop();

      reflectionLayerBottom.push();
      reflectionLayerBottom.noStroke();
      reflectionLayerBottom.fill(c);
      reflectionLayerBottom.beginShape();
      reflectionLayerBottom.vertex(x1, splitY);
      reflectionLayerBottom.vertex(x1, y1_mirror);
      reflectionLayerBottom.vertex(x2, y2_mirror);
      reflectionLayerBottom.vertex(x2, splitY);
      reflectionLayerBottom.endShape(CLOSE);
      reflectionLayerBottom.pop();
    }
  }

  // ✅ 額外補上左邊收邊段
  for (let shape of waveShapes) {
    if (shape.yValues[0] === 0 && shape.yValues[1] === 0) continue;

    let g = waveSegmentLayers[segmentCount++];
    g.clear();
    g.push();
    g.translate(0, baseLine);

    // let x0 = 0; // 畫面最左邊
    let x0 = -40;  // 往左推 40px
    let x1 = nameXPositionsForWave[0];
    let x2 = nameXPositionsForWave[1];

    // let y0 = 0;
    let y0 = -50;  // 往上移 50
    let y1 = shape.yValues[0];
    let y2 = shape.yValues[1];

 
    let cp1x = lerp(x0, x1, 0.1);      // 緩緩抬頭
    let cp1y = lerp(0, y1, 0.2);      

    let cp2x = lerp(x0, x1, 0.4);      // 不要太靠近 x1
    let cp2y = lerp(0, y1, 0.9);       // 不要太靠近 y1

    

    let fillColor = color(shape.color);
    fillColor.setAlpha(180);
    g.fill(fillColor);

    g.beginShape();
    g.vertex(x0, 0);
    g.vertex(x0, y0);
    g.bezierVertex(cp1x, cp1y, cp2x, cp2y, x1+0.35, y1);
    g.vertex(x1, 0);
    g.endShape(CLOSE);

    g.pop();
  }

  // 顯示所有圖層
  for (let g of waveSegmentLayers) image(g, 0, 0);
  image(overAllTexture, 0, 0);
  image(reflectionLayerTop, 0, 0);

  // 📌 波光與漸層
  push();
  let grad = drawingContext.createLinearGradient(0, baseLine, 0, height);
  grad.addColorStop(0.0, 'rgba(88, 99, 177,1)');
  grad.addColorStop(0.6, 'rgba(88, 99, 177,0.5)');
  grad.addColorStop(1.0, 'rgba(88, 99, 177, 0)');
  drawingContext.fillStyle = grad;
  drawingContext.fillRect(0, baseLine, width, height - baseLine);

  let stepY = 10;
  for (let y = baseLine; y < height; y += stepY) {
    for (let x = 0; x < width; x += 15) {
      let n = noise(frameCount * 0.01, y * 0.01, x * 0.01);
      if (n > 0.5) {
        let alpha = map(n, 0.65, 1, 0, 80);
        fill(80, 90, 166, alpha);
        ellipse(x, y, random(200, 100), 10);
      }
    }
  }
  pop();

  // drawNameBoxes();
  let shouldDrawNameBoxes = false;
  for (let ageType of ageTypes) {
    let total = amplitudes[ageType][currentMonth].reduce((a, b) => a + b, 0);
    if (total > 0) {
      shouldDrawNameBoxes = true;
      break;
    }
  }
  if (shouldDrawNameBoxes) {
    drawNameBoxes();
  }
  
 
  
}


function drawNameBoxes() {
  let names = waveData.names;
  let boxWidth = 200;
  let boxHeight = 30;
  let y = height - 40;
  let baseLine = height * 0.5;

  textAlign(CENTER, CENTER);
  textSize(15);
  textFont("sans-serif");

  for (let i = 0; i < names.length; i++) {
    let x = (nameXPositions[i] + nameXPositions[i + 1]) / 2;
    // 輔助線
    drawVerticalGradientLine(x, baseLine,y);
    fill(255, 230);
    stroke(200);
    rect(x - boxWidth / 2, y, boxWidth, boxHeight, 6);
    fill(30);
    noStroke();
    let fullText = names[i];
    let displayText = fullText;
    let padding = 8;
    let maxWidth = boxWidth - padding;
    while (textWidth(displayText) > maxWidth && displayText.length > 0) {
      displayText = displayText.substring(0, displayText.length - 1);
    }
    if (displayText !== fullText) {
      displayText = displayText.substring(0, max(0, displayText.length - 1)) + "…";
    }
    text(displayText, x, y + boxHeight / 2);
  }
}

function drawVerticalGradientLine(x, top, bottom) {
  let totalSteps = 6;
  for (let j = 0; j < totalSteps; j++) {
    let y1 = lerp(top, bottom, j / totalSteps);
    let y2 = lerp(top, bottom, (j + 1) / totalSteps);
    let t = j / totalSteps;
    let alpha = t < 0.2 ? 100 : t < 0.8 ? map(t, 0.2, 0.8, 60, 10) : map(t, 0.8, 1, 10, 90);
    stroke(88, 99, 177, alpha);
    // strokeWeight(1);
    stroke(88, 99, 177, 0); // 最後一個參數是 alpha，0 表示完全透明

    line(x, y1, x, y2);
  }
}

function makeFilter() {
  overAllTexture = createGraphics(windowWidth, windowHeight);
  overAllTexture.loadPixels();
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      let n = noise(i * 0.01, j * 0.01);
      let alpha = map(n, 0, 1, 0, 25);
    }
  }
  overAllTexture.updatePixels();
}
