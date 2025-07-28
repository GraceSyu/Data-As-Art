let brightnessMap = [];
let centers = [];
let lonMin, lonMax, latMin, latMax;
let table;
let perlinLayer;
let currentMonth = 'unknown';
let hasSaved = false; // 防止重複儲存

function preload() {
  table = loadTable('CloudNoiseTextureData.csv', 'csv', 'header');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  noiseDetail(8, 0.5);
  noiseSeed(2);

  perlinLayer = createGraphics(width, height);
  generatePerlinLayer(); // 畫出 Perlin 雜訊背景

  // 計算經緯度範圍
  lonMin = Infinity;
  lonMax = -Infinity;
  latMin = Infinity;
  latMax = -Infinity;

  for (let i = 0; i < table.getRowCount(); i++) {
    let lat = float(table.getString(i, "latitude"));
    let lon = float(table.getString(i, "longitude"));
    if (lat < latMin) latMin = lat;
    if (lat > latMax) latMax = lat;
    if (lon < lonMin) lonMin = lon;
    if (lon > lonMax) lonMax = lon;
  }

  // 建立 centers 資料
  centers = [];
  for (let i = 0; i < table.getRowCount(); i++) {
    let town = table.getString(i, "townName");
    let lat = float(table.getString(i, "latitude"));
    let lon = float(table.getString(i, "longitude"));
    let count = float(table.getString(i, "borrowCount"));

    // 安全取得月份欄位
    if (i === 0) {
      let columnNames = table.columns;
      if (columnNames.includes("month")) {
        currentMonth = table.getString(i, "month");
      }
    }

    if (count > 0) {
      let x = map(lon, lonMin, lonMax, 0, width);
      let y = map(lat, latMin, latMax, height, 0);
      let outerRadius = sqrt(count) * 2;
      centers.push({ x, y, outerRadius, townName: town });
    }
  }

  buildBrightnessMap();
  drawPerlinWithDataOverlay();
  noLoop();
}

function generatePerlinLayer() {
  perlinLayer.loadPixels();
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let n = noise(x * 0.005, y * 0.005);
      let c = n * 255;
      let idx = (x + y * width) * 4;
      perlinLayer.pixels[idx + 0] = c;
      perlinLayer.pixels[idx + 1] = c;
      perlinLayer.pixels[idx + 2] = c;
      perlinLayer.pixels[idx + 3] = 255;
    }
  }
  perlinLayer.updatePixels();
}

function buildBrightnessMap() {
    brightnessMap = [];
    for (let y = 0; y < height; y++) {
      brightnessMap[y] = [];
      for (let x = 0; x < width; x++) {
        let nearest = null;
        let minDist = Infinity;
        for (let c of centers) {
          let d = dist(x, y, c.x, c.y);
          if (d < minDist) {
            minDist = d;
            nearest = c;
          }
        }
  
        if (nearest) {
          let falloff = exp(-sq(minDist) / 15000); // ✅ 改小分母讓範圍內更暗
          let strength = map(nearest.outerRadius, 0, 200, 0, 0.8); // ✅ 提高上限
          let shade = 1.0 - falloff * strength;
          brightnessMap[y][x] = constrain(shade, 0, 1);
        } else {
          brightnessMap[y][x] = 1;
        }
      }
    }
  }
  

function drawPerlinWithDataOverlay() {
    loadPixels();
    perlinLayer.loadPixels();
  
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let idx = (x + y * width) * 4;
        let base = perlinLayer.pixels[idx] / 255;
  
        base *= 0.5; // ✅ 淡化整體 perlin 背景
  
        let shade = brightnessMap[y][x];
        let final = base * shade;
  
        let c = final * 255;
        pixels[idx + 0] = c;
        pixels[idx + 1] = c;
        pixels[idx + 2] = c;
        pixels[idx + 3] = 255;
      }
    }
  
    updatePixels();
  }
  

function draw() {
  // 自動儲存 PNG 圖（只執行一次）
  if (!hasSaved) {
    let filename = `png01`;
    saveCanvas(filename, 'png');
    hasSaved = true;
  }
} 
