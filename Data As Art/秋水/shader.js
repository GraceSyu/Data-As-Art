var vert = `
		precision highp float;

    // attributes, in
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    attribute vec2 aTexCoord;

    // attributes, out
    varying vec3 var_vertPos;
    varying vec3 var_vertNormal;
    varying vec2 var_vertTexCoord;
		varying vec4 var_centerGlPosition;
    
    // matrices
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    uniform mat3 uNormalMatrix;
		uniform float u_time;


    void main() {
      vec3 pos = aPosition;
			vec4 posOut = uProjectionMatrix * uModelViewMatrix * vec4(pos, 1.0);
      gl_Position = posOut;

      // set out value
      var_vertPos      = pos;
      var_vertNormal   =  aNormal;
      var_vertTexCoord = aTexCoord;
			var_centerGlPosition = uProjectionMatrix * uModelViewMatrix * vec4(0., 0., 0.,1.0);
    }
`;


var frag = `

precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_turbulence;
uniform float u_contrast;

#define F3 0.3333333
#define G3 0.1666667

vec3 random3(vec3 c) {
  float j = 4096.0 * sin(dot(c, vec3(17.0, 59.4, 15.0)));
  vec3 r;
  r.z = fract(512.0 * j);
  j *= 0.125;
  r.x = fract(512.0 * j);
  j *= 0.125;
  r.y = fract(512.0 * j);
  return r - 0.5;
}

float simplex3d(vec3 p) {
  vec3 s = floor(p + dot(p, vec3(F3)));
  vec3 x = p - s + dot(s, vec3(G3));
  vec3 e = step(vec3(0.0), x - x.yzx);
  vec3 i1 = e * (1.0 - e.zxy);
  vec3 i2 = 1.0 - e.zxy * (1.0 - e);
  vec3 x1 = x - i1 + G3;
  vec3 x2 = x - i2 + 2.0 * G3;
  vec3 x3 = x - 1.0 + 3.0 * G3;
  vec4 w, d;
  w.x = dot(x, x);
  w.y = dot(x1, x1);
  w.z = dot(x2, x2);
  w.w = dot(x3, x3);
  w = max(0.6 - w, 0.0);
  d.x = dot(random3(s), x);
  d.y = dot(random3(s + i1), x1);
  d.z = dot(random3(s + i2), x2);
  d.w = dot(random3(s + 1.0), x3);
  w *= w;
  w *= w;
  d *= w;
  return dot(d, vec4(52.0));
}

const mat3 rot1 = mat3(-0.37, 0.36, 0.85, -0.14, -0.93, 0.34, 0.92, 0.01, 0.4);
const mat3 rot2 = mat3(-0.55, -0.39, 0.74, 0.33, -0.91, -0.24, 0.77, 0.12, 0.63);
const mat3 rot3 = mat3(-0.71, 0.52, -0.47, -0.08, -0.72, -0.68, -0.7, -0.45, 0.56);

float simplex3d_fractal(vec3 m) {
  return 0.5333333 * simplex3d(m * rot1)
       + 0.2666667 * simplex3d(2.0 * m * rot2)
       + 0.1333333 * simplex3d(4.0 * m * rot3)
       + 0.0666667 * simplex3d(8.0 * m);
}

void main() {
  vec2 p = gl_FragCoord.xy / u_resolution.xy;
  vec3 p3 = vec3(p, u_time * 0.000005);
  vec3 p4 = vec3(p, u_time * 0.00005);

  float value = simplex3d(p4 * 0.5 * u_turbulence);
  value *= simplex3d_fractal(p3 * 2.0 * u_turbulence + 8.0);

  // 對比加強並正規化
  value = 0.5 + 0.5 * value;
  value = pow(value, u_contrast); // u_contrast 建議 2.5

  // 🎯 三階門檻
  float t1 = 0.2;
  float t2 = 0.4;

  vec3 color;
  if (value < t1) {
    color = vec3(0.0);     // 黑
  } else if (value < t2) {
    color = vec3(0.5);     // 灰
  } else {
    color = vec3(1.0);     // 白
  }

  gl_FragColor = vec4(color, 1.0);
}





`;