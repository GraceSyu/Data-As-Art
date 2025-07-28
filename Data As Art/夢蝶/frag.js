const frag = `
	#ifdef GL_ES
	precision mediump float;
	#endif

  #define PI 3.141592653589793
  #define TAU 6.283185307179586

	uniform vec2 u_resolution;
	uniform vec2 u_mouse;
	uniform float u_time;
	uniform sampler2D tex0;
  uniform vec2  u_noise_pan;
	varying vec2 vTexCoord;
  
#define pow2(x) (x * x)

const int samples = 8;
const float sigma = float(samples) * 0.25;

float gaussian(vec2 i) {
    return 1.0 / (2.0 * PI * pow2(sigma)) * exp(-((pow2(i.x) + pow2(i.y)) / (2.0 * pow2(sigma))));
}

vec3 blur(sampler2D sp, vec2 uv, vec2 scale) {
    vec3 col = vec3(0.0);
    float accum = 0.0;
    float weight;
    vec2 offset;
    
    for (int x = -samples / 2; x < samples / 2; ++x) {
        for (int y = -samples / 2; y < samples / 2; ++y) {
            offset = vec2(x, y);
            weight = gaussian(offset);
            col += texture2D(sp, uv + scale * offset).rgb * weight;
            accum += weight;
        }
    }
    
    return col / accum;
}


	float rand(vec2 c){
		return fract(sin(dot(c.xy ,vec2(12.9898,78.233))) * 43758.5453);
	}

	//	Classic Perlin 3D Noise 
	//	by Stefan Gustavson
	//
	vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
	vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
	vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

	float map(float value, float min1, float max1, float min2, float max2,bool limit) {
	
		float result =  min2 + (value - min1) * (max2 - min2) / (max1 - min1);
		return limit? (result>max2?max2:result):result;
	}

	float cnoise(vec3 P){
		vec3 Pi0 = floor(P); // Integer part for indexing
		vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
		Pi0 = mod(Pi0, 289.0);
		Pi1 = mod(Pi1, 289.0);
		vec3 Pf0 = fract(P); // Fractional part for interpolation
		vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
		vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
		vec4 iy = vec4(Pi0.yy, Pi1.yy);
		vec4 iz0 = Pi0.zzzz;
		vec4 iz1 = Pi1.zzzz;

		vec4 ixy = permute(permute(ix) + iy);
		vec4 ixy0 = permute(ixy + iz0);
		vec4 ixy1 = permute(ixy + iz1);

		vec4 gx0 = ixy0 / 7.0;
		vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
		gx0 = fract(gx0);
		vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
		vec4 sz0 = step(gz0, vec4(0.0));
		gx0 -= sz0 * (step(0.0, gx0) - 0.5);
		gy0 -= sz0 * (step(0.0, gy0) - 0.5);

		vec4 gx1 = ixy1 / 7.0;
		vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
		gx1 = fract(gx1);
		vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
		vec4 sz1 = step(gz1, vec4(0.0));
		gx1 -= sz1 * (step(0.0, gx1) - 0.5);
		gy1 -= sz1 * (step(0.0, gy1) - 0.5);

		vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
		vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
		vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
		vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
		vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
		vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
		vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
		vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

		vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
		g000 *= norm0.x;
		g010 *= norm0.y;
		g100 *= norm0.z;
		g110 *= norm0.w;
		vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
		g001 *= norm1.x;
		g011 *= norm1.y;
		g101 *= norm1.z;
		g111 *= norm1.w;

		float n000 = dot(g000, Pf0);
		float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
		float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
		float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
		float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
		float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
		float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
		float n111 = dot(g111, Pf1);

		vec3 fade_xyz = fade(Pf0);
		vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
		vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
		float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
		return 2.2 * n_xyz;
	}



float noise(vec2 p, float freq ){
	float unit = 1./freq;
	vec2 ij = floor(p/unit);
	vec2 xy = mod(p,unit)/unit;
	//xy = 3.*xy*xy-2.*xy*xy*xy;
	xy = .5*(1.-cos(PI*xy));
	float a = rand((ij+vec2(0.,0.)));
	float b = rand((ij+vec2(1.,0.)));
	float c = rand((ij+vec2(0.,1.)));
	float d = rand((ij+vec2(1.,1.)));
	float x1 = mix(a, b, xy.x);
	float x2 = mix(c, d, xy.x);
	return mix(x1, x2, xy.y);
}

float pNoise(vec2 p, int res){
	float persistance = .5;
	float n = 0.;
	float normK = 0.;
	float f = 4.;
	float amp = 1.;
	int iCount = 0;
	for (int i = 0; i<50; i++){
		n+=amp*noise(p, f);
		f*=2.;
		normK+=amp;
		amp*=persistance;
		if (iCount == res) break;
		iCount++;
	}
	float nf = n/normK;
	return nf*nf*nf*nf;
}

	void main(){

		vec2 st = vTexCoord;				
		st*=0.2;
		// /st+=vec2(0.8,0.5);
		 
		st.x *=u_resolution.x/u_resolution.y;
		st.y= 1.-st.y;
		
		
// 		st.x+=cnoise(vec3(st,u_time/50.))*pNoise(st*vec2(5.)+vec2(1000.),20)*0.1;
// 		st.y+=cnoise(vec3(st,u_time/50.+500.))*pNoise(st*vec2(5.)+vec2(1.),20)*0.1;
		
		st.x+=pNoise(st*vec2(1.)+vec2(1000.),20)*0.4;
		st.y+=pNoise(st*vec2(1.)+vec2(1.),20)*0.4;
		st.x+=cnoise(vec3(st,u_time/50.));
		st.y+=cnoise(vec3(st,u_time/50.+500.));
		// st.x+=pNoise(st*vec2(10.)+vec2(1000.),10)*0.01;
		// st.y+=pNoise(st*vec2(10.)+vec2(1.),10)*0.01;
		
		float z = 0.03;
		vec2 p1 = vec2(st.x + cnoise(vec3(st,500.))*0.3,
									 st.y + cnoise(vec3(st,50000.))*0.3);
		vec2 p2 = vec2(floor(st.x*20.),floor(st.y*30.));
		z+=length(p1-p2)/1000.;
	 
		float r = map(z,
		0.,pNoise(st*0.5,10)*8.,0.,1.,false) 
		* (0.1+0.5* pNoise(st*vec2(0.1)+vec2(10.),10))*1.
		- pNoise(vec2(st*vec2(1.))+vec2(10.),5)*1.
		- pNoise(vec2(st*vec2(1.))+vec2(200.),2)*1.
		; 
	  float g = map(z,
		0.,pNoise(st*vec2(0.5),20)*12.,0.,1.,false) 
		* (0.1+0.5* pNoise(st*vec2(0.1)+vec2(50.),10))*1.
		- pNoise(st*vec2(4.)+vec2(100.),5)*1.
		- pNoise(st*vec2(1.)+vec2(5000.),2)*1.
		;
		float b = map(z,
		0.,pNoise(st*vec2(0.5)+vec2(100.),20)*16.,0.,1.,false) 
		* (0.5+0.5* pNoise(st*vec2(0.1)+vec2(900.),10))*1.
		- pNoise(st*vec2(3.)+vec2(1000.),5)*1.
		- pNoise(st*vec2(4.)+vec2(90000.),2)*1.
		;
		vec3 color = vec3(r,g,b);
		 
		gl_FragColor= vec4(color,1.0);
	}
`;
