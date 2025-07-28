// p5.js  basic structure ref from https://openprocessing.org/sketch/2468735 by Vamoss
const TOTAL = 10000;
let particles = [];
let img, pixelBuffer;
let allColors, selectedColors;
let slowColors, fastColors;

function preload() {
  img = loadImage("秋水_spring.png"); // 讀入 PNG 圖片
  // img = loadImage("data07-no.png");  // 讀入 PNG 圖片
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(0);
  strokeWeight(0.5);
  imageMode(CORNER);

  img.loadPixels(); // 準備像素資料
  pixelBuffer = img.pixels;

  // 春天
  slowColors = [color("#020f14"), color("#035727"), color("#17f702")]; //深冬
  fastColors = [color("#f0ea2e"), color("#69c9f5"), color("#f70727")]; //秋
  
  // 夏天 
  //  slowColors = [color("#084d36"), color("#020f14"), color("#01452e")]; //深冬
  //  fastColors = [ color("#5EF09D"), color("#95e3f5"), color("#37eb23")]; //秋

 
  // 秋
  // slowColors = [color("#B66FC9"), color("#5EF09D"), color("#3FC4F5")]; //冬
  // fastColors = [color("#FFBF52"), color("#D95F74"), color("#ED9DE8")]; //秋

  // 冬天
  // slowColors = [color("#0839ff"), color("#153282"), color("#020f14")]; //冬
  // fastColors = [color("#ffffff"), color("#0839ff"), color("#6dd2f7")]; //秋
  
  for (let i = 0; i < TOTAL; i++) {
    particles.push({
      x: random(width),
      y: random(height),
      vx: 0,
      vy: 0,
      colorIndex: floor(random(3)),
    });
  }

  // selectColors();
  frameRate(60);
}

function draw() {
  background(0, 10);
  strokeWeight(3);

  const vel = 1.8; // 固定速度
  for (let p of particles) {
    if (random() < 0.05) {
      p.x = random(width);
      p.y = random(height);
      p.vx = 0;
      p.vy = 0;
    }

  

    // 流速改變
    let val = getValue(p.x, p.y); // val 代表「越暗越大」
    let angle = val * TWO_PI + PI / 3;
    let speed = map(val, 0, 1, 0.1, 7); // ← 明亮 → 慢，暗 → 快

    p.vx += cos(angle) * speed;
    p.vy += sin(angle) * speed;

    //隨機顏色v1
    // stroke(p.color);

    // 根據流速取得顏色(快:紅  慢:藍)v2 & v3
    let c = getColorBySpeed(speed, p.colorIndex);
    stroke(c);

    line(p.x, p.y, p.x + p.vx, p.y + p.vy);

    p.x += p.vx;
    p.y += p.vy;

    p.vx *= 0.5;
    p.vy *= 0.5;

    if (p.x > width) p.x = 0;
    if (p.y > height) p.y = 0;
    if (p.x < 0) p.x = width;
    if (p.y < 0) p.y = height;
  }
}

function getValue(x, y) {
  let ix = floor(map(x, 0, width, 0, img.width));
  let iy = floor(map(y, 0, height, 0, img.height));
  ix = constrain(ix, 0, img.width - 1);
  iy = constrain(iy, 0, img.height - 1);
  let index = 4 * (iy * img.width + ix);
  const r = pixelBuffer[index] / 255;
  const g = pixelBuffer[index + 1] / 255;
  const b = pixelBuffer[index + 2] / 255;
  const bright = 1 - (r + g + b) / 3; // 改為暗的轉向
  return bright * 1; // ← 這裡固定為「原本拉桿三」的最小值：1
}


// 指定快慢速的顏色組合v3
function getColorBySpeed(speed, index) {
  // 將 speed 映射到 0~1（低速為 0，高速為 1）
  let t = constrain(map(speed, 0.3, 3, 0, 1), 0, 1);

  // 為了色彩多樣性：每顆粒子用自己的顏色編號
  let idx = floor(random(3)); // 3 是顏色數量

  // 慢速與快速顏色對應做插值
  let c1 = slowColors[index];
  let c2 = fastColors[index];
  return lerpColor(c1, c2, t);
}
