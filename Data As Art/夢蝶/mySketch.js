// //p5.js  basic structure ref from https://openprocessing.org/sketch/2308862 by Oliver Chang
let bgGraphics, butterflyGraphics, overAllTexture;
let butterflyList = [];
let allColorSets;
let table;

let grid = []; // 用來儲存右邊每一格方框的位置與大小
let numGrids = 29; // ← 你可以依畫面高度調整方框數量
// let orangeCirclesLayer;
let uniqueTownNames = [];
let highlightIndex = 0;                                                                                                                                                                              
let lastHighlightTime = 0;
let highlightInterval = 15; //控制動化的速度 數值遇到愈慢
let startGridX;

let minDistance = 100; // 最小間距，避免蝴蝶重疊
let pushStrength = 20; // 推開的強度
let maxIterations = 100; // 🔹 定義最大推開計算次數，避免無窮迴圈

let spotlightMaskGraphics;

function preload() {
  theShader = new p5.Shader(this.renderer, vert, frag);
  table = loadTable("夢蝶_winter.csv", "header");
}



function setup() {
  createCanvas(windowWidth, windowHeight);
  spotlightMaskGraphics = createGraphics(width, height);
  pixelDensity(1);
  background(100);
  
  // 設定顏色對應表
  allColorSets = {
    幼兒照顧: [color("#D96281"), color("#fa7fcc")], // 深玫瑰紅 & 橙紅色
    旅遊: [ color("#1461fa"), color("#4F9DDE")], 
    理財: [color("#e07407"), color("#faa843")], // 琥珀黃 & 亮黃色
    養生: [color("#2E8B57"), color("#78ff8a")] // 海洋綠 & 黃綠色
    
  };

  bgGraphics = createGraphics(width, height, WEBGL);
  butterflyGraphics = createGraphics(width, height);

  // 背景紋理
  overAllTexture = createGraphics(width, height);
  overAllTexture.loadPixels();
  for (let i = 0; i < width + 50; i++) {
    for (let o = 0; o < height + 50; o++) {
      overAllTexture.set(i, o, color(200, noise(i / 10, (i * o) / 300) * random([1, 10, 50, 100])));
    }
  }
  overAllTexture.updatePixels();

  // 讀取數據
  let longitudes = table.getColumn("longitude").map(parseFloat);
  let latitudes = table.getColumn("latitude").map(parseFloat);
  let classifications = table.getColumn("classification_type");
  let borrowedQuantities = table.getColumn("borrowed_quantity").map(parseFloat);

  let lonMin = min(longitudes);
  let lonMax = max(longitudes);
  let latMin = min(latitudes);
  let latMax = max(latitudes);

  for (let i = 0; i < table.getRowCount(); i++) {
    let lon = longitudes[i];
    let lat = latitudes[i];
    let category = classifications[i];
    let borrowedQuantity = borrowedQuantities[i];

    // 經緯度映射到畫布座標
    let rightMargin = 200; // 預留給右側方框的寬度（可視情況調整）
    let x = map(lon, lonMin, lonMax, 50, width - rightMargin);
    let y = map(lat, latMin, latMax, height - 80, 80);    
    // let y = map(lat, latMin, latMax, height - 50, 50);


 
    
    // **根據借閱數量決定蝴蝶大小**
    let butterflySize;

  //級距範圍
  if (borrowedQuantity <= 10) {
    butterflySize = random(0.2, 0.28);
  } else if (borrowedQuantity <= 22) {
    butterflySize = random(0.29, 0.3);
  } else if (borrowedQuantity <= 43) {
    butterflySize = random(0.32, 0.35);
  } else if (borrowedQuantity <= 59) {
    butterflySize = random(0.36, 0.38);
  } else {
    butterflySize = random(0.4, 0.45);
  }
    let colors = allColorSets[category] || [color(255), color(200)];
    
    // **先建立 Butterfly**
    let townName = table.getString(i, "townName"); // 🆕 加在這裡
    let newButterfly = new Butterfly({
      p: createVector(x, y),
      size: butterflySize,
      category,
      colors,
      townName // 🆕 傳進去
    });

    // **再調整位置，避免重疊**
    newButterfly.p = avoidOverlap(newButterfly.p, butterflySize, newButterfly);

    // **最後加入 butterflyList**
    butterflyList.push(newButterfly);

    uniqueTownNames = [
      ...new Set(butterflyList
        .filter(b => b.townName !== undefined)
        .sort((a, b) => a.p.x - b.p.x)
        .map(b => b.townName))
    ];
    numGrids = uniqueTownNames.length;

  }

      // 🔶 初始化 orangeCirclesLayer 和 grid
    // orangeCirclesLayer = createGraphics(width, height);

    let gridSpacing = height / numGrids*0.98;
    let gridWidth = 120;
    let gridHeight = gridSpacing ;
    startGridX = width - 130;




      


    for (let i = 0; i < numGrids; i++) {
      let x = startGridX;
      let y = i * gridSpacing;
      grid.push({ x, y, width: gridWidth, height: gridHeight });
    }

    // 取得唯一 townName 並依照 x 座標排序（用於依序亮燈）
    //採用固定排序方式 
     const fixedOrder =["龍井區", "梧棲區", "大肚區", "清水區", "沙鹿區", "大安區", "南屯區", "大甲區", "西屯區", "烏日區", "大雅區", "西區", "南區", "外埔區", "神岡區", "中區", "大里區", "東區", "北屯區", "北區", "潭子區", "霧峰區", "太平區", "后里區", "豐原區", "石岡區", "新社區", "東勢區", "和平區"]; // 你想要的順序
     uniqueTownNames = fixedOrder.filter(town => 
      butterflyList.some(b => b.townName === town)
     );
      numGrids = uniqueTownNames.length;

}


function draw() {
  
  bgGraphics.shader(theShader);
  butterflyGraphics.fill(0, 10);
  butterflyGraphics.rect(0, 0, width, height);

  bgGraphics.rect(0, 0, width, height);
  image(bgGraphics, 0, 0);

  push();
  butterflyGraphics.push();
  butterflyGraphics.blendMode(SCREEN);
  butterflyGraphics.image(bgGraphics, 0, 0);
  butterflyGraphics.pop();
  butterflyGraphics.image(butterflyGraphics, 1, sin(frameCount / 10), width, height);
  image(butterflyGraphics, 0, 0);
  pop();

  push();
  butterflyGraphics.blendMode(MULTIPLY);
  butterflyGraphics.image(overAllTexture, 0, 0);
  pop();
  push();
  blendMode(MULTIPLY);
  image(overAllTexture, 0, 0);
  pop();


let townToHighlight = uniqueTownNames[highlightIndex];
let highlightCenters = butterflyList.filter(b => b.townName === townToHighlight).map(b => b.p);
for (let b of butterflyList) {
  b.update();
  b.display(butterflyGraphics,  townToHighlight, highlightCenters);
}
// 🎯 製作 spotlight 遮罩
drawSpotlightMask(highlightCenters);

// 🎯 套用 MULTIPLY 遮罩（白=保留，黑=遮蔽）
push();
butterflyGraphics.blendMode(MULTIPLY);
butterflyGraphics.image(spotlightMaskGraphics, 0, 0);
pop();

      // 🔶 控制依序亮燈
    if (frameCount - lastHighlightTime > highlightInterval) {
      highlightIndex = (highlightIndex + 1) % uniqueTownNames.length;
      lastHighlightTime = frameCount;
    }

    // 🔶 繪製右側方框
    drawGrid();
 
  // 清空遮罩
  spotlightMaskGraphics.clear();
  
  // 🔶 每一個 highlight center 畫出 spotlight（可多個）
  for (let c of highlightCenters) {
    let g = spotlightMaskGraphics;
    let shaderRadius = 400;
    let gradient = g.drawingContext.createRadialGradient(c.x, c.y, 0, c.x, c.y, shaderRadius);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(1, "rgba(0,0,0,0.3)");
    g.drawingContext.fillStyle = gradient;
    g.noStroke();
    g.ellipse(c.x, c.y, shaderRadius * 2);
  }

  // 疊加遮罩，讓周圍變暗
  push();
  blendMode(MULTIPLY);
  image(spotlightMaskGraphics, 0, 0);
  pop();
}




function avoidOverlap(pos, size, butterfly) {
  if (!butterfly) {
    console.warn("⚠️ avoidOverlap() 內的 butterfly 為 undefined，請檢查 setup()！");
    return pos;
  }

  let iterations = 0;
  let adjusted = false;
  let maxIterations = 50; // **最多推擠 50 次，避免無限迴圈**

  do {
    adjusted = false;
    for (let b of butterflyList) {
      let d = dist(pos.x, pos.y, b.p.x, b.p.y);
      // let d = dist(this.p.x, this.p.y, highlightCenter.x, highlightCenter.y);

      let minDist = size * 50 + b.size * 50 + 100; // 最小間距

      if (d < minDist) {
        // **計算推開方向**
        let pushDir = p5.Vector.sub(pos, b.p);
        pushDir.setMag(20); // 推開的強度

        // **被推開時旋轉**
        butterfly.rotation += radians(random(-5, 5)); // 旋轉 ±5 度
        b.rotation += radians(random(-5, 5)); // 另一隻蝴蝶也稍微旋轉

        pos.add(pushDir);
        b.p.sub(pushDir.mult(0.5));

        adjusted = true;
      }
    }
    iterations++;
  } while (adjusted && iterations < maxIterations);

  // **確保蝴蝶不超出畫布**
  pos.x = constrain(pos.x, 50, width - 50);
  pos.y = constrain(pos.y, 50, height - 50);
  return pos;
}
function drawOrangeCircles() {
  let townToHighlight = uniqueTownNames[highlightIndex];

  for (let b of butterflyList) {
    if (b.townName === townToHighlight) {
      let ctx = orangeCirclesLayer.drawingContext;
      ctx.shadowBlur = 80;
      ctx.shadowColor = "rgba(240, 168, 33, 0.7)";
      orangeCirclesLayer.noStroke();
      orangeCirclesLayer.fill(255, 80);
      orangeCirclesLayer.ellipse(b.p.x, b.p.y, b.size * 100 * 3);
      ctx.shadowBlur = 0;
    }
  }
}

function drawGrid() {
  for (let i = 0; i < uniqueTownNames.length && i < numGrids; i++) {
    let town = uniqueTownNames[i];
    let cell = grid[i];
    let isHighlighted = i === highlightIndex;

    noStroke();
    fill(isHighlighted ? color(255, 165, 0) : color(200));
    rect(cell.x + 50, cell.y, cell.width, cell.height + 6, 6);

    fill(0);
    textSize(12);
    textAlign(LEFT, CENTER);
    text(town, cell.x + 58, cell.y + 1 + cell.height / 2);
  }
}

function drawSpotlightMask(highlightCenters) {
  spotlightMaskGraphics.blendMode(ADD);  // 讓多個白色光圈可以加起來

  let g = spotlightMaskGraphics;
  g.clear();

  // step1: 整塊遮罩先填滿黑色
  g.noStroke();
  g.fill(0,100);
  g.rect(0, 0, width, height);

  // step2: 每個 highlight center 畫白→黑的 radial gradient
  for (let c of highlightCenters) {
    let ctx = g.drawingContext;
    let r = 150; // 半徑，可自行微調

    let gradient = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, r);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(1, "rgba(0,0,0,1)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(c.x, c.y, r, 0, TWO_PI);
    ctx.fill();
  }
}
