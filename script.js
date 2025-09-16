// ===== WebGL background (your full code) =====
const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl", { premultipliedAlpha: false });
const img = document.getElementById("sourceImage");

const setCanvasSize = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
};
setCanvasSize();

const vsSource = `
  attribute vec2 position;
  void main(){ gl_Position = vec4(position, 0.0, 1.0); }
`;
const fsSource = document.getElementById("fragShader").textContent;

const createShader = (type, source) => {
  const s = gl.createShader(type);
  gl.shaderSource(s, source);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error("Shader error:", gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
};

const vs = createShader(gl.VERTEX_SHADER, vsSource);
const fs = createShader(gl.FRAGMENT_SHADER, fsSource);
const program = gl.createProgram();
gl.attachShader(program, vs); gl.attachShader(program, fs);
gl.linkProgram(program); gl.useProgram(program);

// buffer
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
const position = gl.getAttribLocation(program, "position");
gl.enableVertexAttribArray(position);
gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

// uniforms
const uniforms = {
  resolution: gl.getUniformLocation(program, "iResolution"),
  time: gl.getUniformLocation(program, "iTime"),
  mouse: gl.getUniformLocation(program, "iMouse"),
  texture: gl.getUniformLocation(program, "iChannel0"),
};

// mouse tracking
let mouse = [0,0];
canvas.addEventListener("mousemove", (e)=>{ mouse = [e.clientX, canvas.height - e.clientY]; });

// texture
const texture = gl.createTexture();
const setupTexture = () => {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
};
if (img.complete) setupTexture(); else img.onload = setupTexture;

// render loop
const startTime = performance.now();
const render = () => {
  const t = (performance.now() - startTime) / 1000;
  gl.viewport(0,0,canvas.width,canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.uniform3f(uniforms.resolution, canvas.width, canvas.height, 1.0);
  gl.uniform1f(uniforms.time, t);
  gl.uniform4f(uniforms.mouse, mouse[0], mouse[1], 0, 0);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(uniforms.texture, 0);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  requestAnimationFrame(render);
};
window.addEventListener("resize", setCanvasSize);
render();

// ===== Reveal on scroll =====
const io = new IntersectionObserver((entries)=>{
  entries.forEach(en=>{
    if (en.isIntersecting){ en.target.classList.add('revealed'); io.unobserve(en.target); }
  });
},{ threshold:0.15 });
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

// ===== Contact form (AJAX) =====
const form = document.getElementById('contactForm');
const msg = document.getElementById('formMsg');
if (form) {
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    msg.textContent = 'Sending…';
    const fd = new FormData(form);
    try{
      const res = await fetch(form.action, { method:'POST', body:fd });
      const json = await res.json();
      if (json.ok) { msg.textContent = 'Thanks! We will reply shortly.'; form.reset(); }
      else { msg.textContent = json.error || 'Something went wrong. Please email contact@fortepianoacademy.net'; }
    }catch(err){
      msg.textContent = 'Network error — please email contact@fortepianoacademy.net';
    }
  });
}