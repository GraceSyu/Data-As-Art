class Butterfly {
  constructor({ p, size = 1, category = "旅遊", colors, townName }) {
    this.p = p;
    this.size = size;
    this.targetSize = this.size;
    this.wingOffset = random(100);
    this.wingSpeed = random(0.0002, 0.0005);
    this.v = createVector(random(-2, 2), random(-2, 2));
    this.rotation = random(-PI / 8, PI / 8);
    this.rotationSpeed = random(-0.02, 0.02);

    this.category = category;
    this.townName = townName; // ✅ 加在這裡

    this.colors = colors || allColorSets["旅遊"];
    console.log(this.category );
    // ✅ 設定顏色 翅膀外框
    this.butterflyColor = {
      r: red(this.colors[0]),
      g: green(this.colors[0]),
      b: blue(this.colors[0])
    };
  // 翅膀內部填色
    this.butterflyMinColor = {
      r: red(this.colors[1]),
      g: green(this.colors[1]),
      b: blue(this.colors[1])
    };
    //蝴蝶旋轉設定 
    this.rotation = random(-PI / 8, PI / 8); // 初始旋轉角度
    this.rotationSpeed = random(-0.02, 0.02); // 旋轉速度
  
    this.noiseOffsetX = random(1000);
    this.noiseOffsetY = random(1000);
  }
  update() {
    let t = frameCount * 0.01; // 時間變數
    let noiseStrength = 3; // 控制飛行範圍
  
  
    // 10% 機率讓翅膀拍動加快
    if (random(1) < 0.1) {
      this.wingBoost = random(2, 5); // 加速 2~5 倍
    } else {
      this.wingBoost = lerp(this.wingBoost, 1, 0.05); // 逐漸回到正常速度
    }
    // 使用 Perlin Noise 來更新位置，讓飛行更自然
    let noiseX = noise(this.noiseOffsetX + t) * noiseStrength - noiseStrength / 2;
    let noiseY = noise(this.noiseOffsetY + t) * noiseStrength - noiseStrength / 2;
    // 🔹 讓蝴蝶旋轉有輕微擺動
    this.rotation += this.rotationSpeed * sin(frameCount * 0.1);
    this.size = lerp(this.size, this.targetSize, 0.05);

    // this.v.add(createVector(noiseX, noiseY)); // 增加隨機移動方向
    // this.v.limit(2); // 限制最大速度
    // this.p.add(this.v); // 更新位置
  
    // 邊界處理：讓蝴蝶在畫面內循環
    if (this.p.x > width) this.p.x = 0;
    if (this.p.x < 0) this.p.x = width;
    if (this.p.y > height) this.p.y = 0;
    if (this.p.y < 0) this.p.y = height;
  
  }
  
  

  display(g, highlightedTownName, highlightCenters) {
    let bodyW = 20 * this.size;  
    let bodyH = 150 * this.size;
    let w = (width / 4) * this.size; 
    let h = (height / 4) * this.size;
    let rez = 0.019999;
    let r = 5 * this.size;
    let span = 6 * this.size;
  
    let isHighlighted = this.townName === highlightedTownName;
  
    // ✅ 遮罩用：找出與所有 highlightCenters 中距離最近的距離
    let d = Infinity;
    for (let hc of highlightCenters) {
      let distToCenter = dist(this.p.x, this.p.y, hc.x, hc.y);
      if (distToCenter < d) d = distToCenter;
    }
  
    let spotlightRadius = 300;
    let alphaMask = isHighlighted ? 255 : map(d, spotlightRadius, spotlightRadius + 600, 200, 50);
    alphaMask = constrain(alphaMask, 50, 255);
  
    g.push();
    g.translate(this.p.x, this.p.y);  // ✅ 移到蝴蝶位置
    g.rotate(this.rotation);
    g.scale(this.size);  // ✅ 統一縮放比例
  
    // 🟠 光圈發光效果（已 translate）
    if (isHighlighted) {
      let ctx = g.drawingContext;
      ctx.shadowBlur = 50;
      ctx.shadowColor = "rgba(240, 168, 33, 0.6)";
      g.noStroke();
      g.fill(255, 180);
      g.ellipse(0, 0, this.size * 100);  // 發光圈
      ctx.shadowBlur = 0;
    }
  
    // 🦋 身體
    g.push();
    g.blendMode(LIGHTEST);
    g.translate(0, -80 * this.size);
    this.drawBody(g, bodyW, bodyH, rez, r, span, alphaMask); // ✅ 傳入 alphaMask
    g.pop();
  
    // 🦋 觸鬚
    g.push();
    g.blendMode(SCREEN);
    g.translate(0, -60 * this.size);
    this.drawTentacles(g, rez);
    g.pop();
  
    // 🦋 右翅膀
    g.push();
    g.blendMode(SCREEN);
    g.translate(bodyW / 2, 0);
    g.strokeWeight(2 * this.size);
    this.drawWing(g, w, h, rez, r, span, alphaMask); // ✅ 傳入 alphaMask
    g.pop();
  
    // 🦋 左翅膀（鏡像）
    g.push();
    g.blendMode(SCREEN);
    g.translate(-bodyW / 2, 0);
    g.scale(-1, 1);
    g.strokeWeight(2 * this.size);
    this.drawWing(g, w, h, rez, r, span, alphaMask); // ✅ 傳入 alphaMask
    g.pop();
  
    g.pop();
  }
  
  
  
  // 上半翅膀會跟著townname亮起
  drawWing(g, w, h, rez, r, span) {
    let strength = 200;
  
    // 🔶 上半身翅膀外框
    g.push();
    g.rotate(
      PI * -0.02 + PI * -0.02 * sin(this.wingOffset + millis() * this.wingSpeed * 0.6)
    );
    g.noFill();
    g.strokeWeight(5 * this.size);
  
    // 儲存高亮狀態
    let isHighlighted = this.townName === uniqueTownNames[highlightIndex];
    // 🟡 加入簡單遮罩效果（距離畫面中心）
    let d = dist(this.p.x, this.p.y, width / 2, height / 2); // 可改成任意中心
    let spotlightRadius = 300;
  
    let alphaMask = 255;
    if (!isHighlighted) {
      alphaMask = map(d, spotlightRadius, spotlightRadius + 500, 200, 50);
      alphaMask = constrain(alphaMask, 50, 255);
    }
  
    // 在使用 fill()/stroke() 的地方套用 alphaMask，例如：
    g.fill(255, 180, 50, alphaMask);
    
    for (let y = 1; y < (h * 1.8); y += span) {
      for (let x = 1; x < (w * 0.8) + (w * 0.8) * sqrt(y / strength); x += span) {
        let isEdge = (
          y < span ||
          y >= h * 1.5 - span ||
          x < span ||
          x >= (w * 0.8) + (w * 0.8) * sqrt(y / strength) - span
        );
  
        let v = createVector(x, -y * sqrt(x / strength));
  
        // 顏色計算（與外框相同）
        let clr = color(
          map(y, 0, h, this.butterflyMinColor.r, this.butterflyColor.r),
          map(y, 0, h, this.butterflyMinColor.g, this.butterflyColor.g),
          map(y, 0, h, this.butterflyMinColor.b, this.butterflyColor.b)
        );
  
        if (isEdge) {
          clr.setAlpha(alphaMask);
          g.stroke(clr);
          g.line(x, -y * sqrt(x / (strength + 50)), v.x, v.y);
        }
  
        // 🔶 如果是高亮區域，也補上同色內部圓點填充
        if (isHighlighted && !isEdge) {
          clr.setAlpha(80);
          g.noStroke();
          g.fill(clr);
          g.ellipse(v.x, v.y, span * 1.2);
        }
      }
    }
    g.pop();
  
    // 🔶 下半身翅膀（保持原樣）
    g.push();
    g.rotate(
      PI * 0.02 + PI * 0.02 * sin(this.wingOffset + millis() * this.wingSpeed)
    );
    
     isHighlighted = this.townName === uniqueTownNames[highlightIndex];
    
    if (isHighlighted) {
      let ctx = g.drawingContext;
      ctx.shadowBlur = 20;
      ctx.shadowColor = "rgba(255, 200, 50, 0.7)";
    }
    
    g.noStroke();
    g.fill(
      map(h, 0, h, this.butterflyMinColor.r, this.butterflyColor.r),
      map(h, 0, h, this.butterflyMinColor.g, this.butterflyColor.g),
      map(h, 0, h, this.butterflyMinColor.b, this.butterflyColor.b),
      100
    );
    
    for (let y = 1; y < (h * 1.2); y += span) {
      for (let x = 1; x < (w * 0.5) + (w * 0.5) * sqrt(y / strength); x += span) {
        let v = createVector(x, y * sqrt(x / strength));
        g.ellipse(v.x, v.y, span * 1.5);
      }
    }
    
    g.drawingContext.shadowBlur = 0;  // ✅ 結尾要重設
    g.pop();
    
  }
  
  
  
  
  
    drawBody(g, bodyW, bodyH, rez, r, span) {
      for (let y = 0; y < bodyH; y += 1) {
        let rate = sin(map(y, 0, bodyH, PI, PI * 0.05));
        for (let x = -bodyW * rate; x < bodyW * rate; x += 2) {
          let offset = noise(x * rez, -y * rez, x / y - frameCount / 7);
          let clr = color(
            map(
              y,
              0,
              bodyH,
              this.butterflyMinColor.r + offset * this.butterflyColor.r,
              this.butterflyColor.r
            ),
            map(
              y,
              0,
              bodyH,
              this.butterflyMinColor.g + offset * this.butterflyColor.g,
              this.butterflyColor.g
            ),
            map(
              y,
              0,
              bodyH,
              this.butterflyMinColor.b + offset * this.butterflyColor.b,
              this.butterflyColor.b
            )
          );
          clr.setAlpha(20);
          g.fill(clr);
          g.ellipse(x, y, (bodyW / 2) * rate);
        }
      }
    }
  
    drawTentacles(g, rez) {
      g.push();
      let clr = color(
        this.butterflyMinColor.r +
          noise(333 * rez, -333 * rez, 100) * this.butterflyColor.r,
        this.butterflyMinColor.g +
          noise(133 * rez, -333 * rez, 200) * this.butterflyColor.g,
        this.butterflyMinColor.b +
          noise(333 * rez, -333 * rez, 1) * this.butterflyColor.b
      );
  
      let anlge = PI * 0.03 * sin(frameCount / 11);
      g.fill(clr);
      g.rotate(anlge);
      for (let x = 0; x < 100; x += 1) {
        let y = map(x, 0, 100, -80, -40);
        g.ellipse(-x - 4, sqrt(pow(x, 2.1) / 1200) * y, 3);
        g.ellipse(x + 4, sqrt(pow(x, 2.1) / 1200) * y, 3);
        if (x >= 99) {
          g.ellipse(-x - 4, sqrt(pow(x, 2.1) / 1200) * y, 12, 6);
          g.ellipse(x + 4, sqrt(pow(x, 2.1) / 1200) * y, 12, 6);
        }
      }
      g.pop();
    }
  }
  