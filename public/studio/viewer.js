import { buildModel, cross, unit } from "./geometry.js";
const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
function multiply(a, b) {
  const r = new Float32Array(16);
  for (let c = 0; c < 4; c++)
    for (let i = 0; i < 4; i++)
      for (let k = 0; k < 4; k++) r[c * 4 + i] += a[k * 4 + i] * b[c * 4 + k];
  return r;
}
const vertex = `attribute vec3 aPosition;attribute vec3 aNormal;attribute vec3 aColor;attribute float aMaterial;uniform mat4 uMatrix;varying vec3 vNormal;varying vec3 vColor;varying vec3 vPosition;varying float vMaterial;void main(){vNormal=aNormal;vColor=aColor;vPosition=aPosition;vMaterial=aMaterial;gl_Position=uMatrix*vec4(aPosition,1.0);}`;
const fragment = `precision mediump float;varying vec3 vNormal;varying vec3 vColor;varying vec3 vPosition;varying float vMaterial;uniform float uUnlit;void main(){vec3 n=normalize(vNormal);float light=.52+.40*max(dot(n,normalize(vec3(-.4,.9,.7))),0.)+.12*max(dot(n,normalize(vec3(.8,.35,-.6))),0.);float grain=1.;if(vMaterial>.5&&vMaterial<1.5){float wave=sin(vPosition.x*115.+sin(vPosition.z*17.)*2.+sin(vPosition.x*23.+vPosition.z*36.)*.7);grain=.97+.03*wave;}if(vMaterial>1.5)light+=pow(max(dot(n,normalize(vec3(-.3,1.,1.))),0.),18.)*.22;gl_FragColor=vec4(vColor*grain*mix(light,1.,uUnlit),1.);}`;
export class Viewer {
  constructor(canvas, onViewChange) {
    this.canvas = canvas;
    this.onViewChange = onViewChange;
    this.yaw = 0.72;
    this.pitch = 0.34;
    this.zoom = 1;
    this.view = "perspective";
    this.wire = false;
    this.auto = false;
    this.drag = null;
    this.design = null;
    this.lastTime = 0;
    try {
      this.gl = canvas.getContext("webgl", {
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
      });
      if (this.gl) this.init();
    } catch (e) {
      this.gl = null;
    }
    if (!this.gl) this.useSoftware();
    else
      canvas.addEventListener("webglcontextlost", (e) => {
        e.preventDefault();
        this.useSoftware();
        this.attach();
        this.render();
      });
    this.attach();
    this.observer = new ResizeObserver(() => this.render());
    this.observer.observe(this.canvas);
    this.animate = this.animate.bind(this);
    document.addEventListener?.("visibilitychange", () => {
      if (!document.hidden && this.auto) this.scheduleAnimation();
    });
  }
  useSoftware() {
    const previous = this.canvas;
    const replacement = document.createElement("canvas");
    replacement.id = previous.id;
    for (const name of ["aria-label", "role"]) {
      const value = previous.getAttribute(name);
      if (value !== null) replacement.setAttribute(name, value);
    }
    replacement.tabIndex = 0;
    previous.replaceWith(replacement);
    this.gl = null;
    this.drag = null;
    this.canvas = replacement;
    this.ctx = replacement.getContext("2d");
    if (this.observer) {
      this.observer.disconnect();
      this.observer.observe(replacement);
    }
  }
  init() {
    const gl = this.gl;
    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        throw Error(gl.getShaderInfoLog(s));
      return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl.VERTEX_SHADER, vertex));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS))
      throw Error("Renderer initialization failed");
    gl.useProgram(p);
    this.program = p;
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    for (const [name, size, offset] of [
      ["aPosition", 3, 0],
      ["aNormal", 3, 12],
      ["aColor", 3, 24],
      ["aMaterial", 1, 36],
    ]) {
      const loc = gl.getAttribLocation(p, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 40, offset);
    }
    this.matrixLoc = gl.getUniformLocation(p, "uMatrix");
    this.unlitLoc = gl.getUniformLocation(p, "uUnlit");
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 0);
  }
  attach() {
    const c = this.canvas;
    c.style.touchAction = "none";
    c.addEventListener("pointerdown", (e) => {
      this.drag = { x: e.clientX, y: e.clientY };
      c.setPointerCapture(e.pointerId);
    });
    c.addEventListener("pointermove", (e) => {
      if (!this.drag) return;
      this.view = "custom";
      this.yaw -= (e.clientX - this.drag.x) * 0.009;
      this.pitch = Math.max(
        0.08,
        Math.min(1.3, this.pitch + (e.clientY - this.drag.y) * 0.006),
      );
      this.drag = { x: e.clientX, y: e.clientY };
      this.render();
    });
    c.addEventListener("pointerup", () => {
      this.drag = null;
    });
    c.addEventListener("pointercancel", () => (this.drag = null));
    c.addEventListener("lostpointercapture", () => (this.drag = null));
    c.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        this.zoom = Math.max(
          0.45,
          Math.min(2.7, this.zoom * Math.exp(-e.deltaY * 0.001)),
        );
        this.render();
      },
      { passive: false },
    );
    c.addEventListener("keydown", (e) => {
      if (
        [
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
          "+",
          "-",
          "=",
        ].includes(e.key)
      ) {
        e.preventDefault();
        if (e.key.startsWith("Arrow")) this.view = "custom";
        if (e.key === "ArrowLeft") this.yaw += 0.14;
        if (e.key === "ArrowRight") this.yaw -= 0.14;
        if (e.key === "ArrowUp") this.pitch = Math.min(1.3, this.pitch + 0.1);
        if (e.key === "ArrowDown")
          this.pitch = Math.max(0.08, this.pitch - 0.1);
        if (["+", "="].includes(e.key))
          this.zoom = Math.min(2.7, this.zoom * 1.12);
        if (e.key === "-") this.zoom = Math.max(0.45, this.zoom / 1.12);
        this.render();
      }
    });
  }
  update(d) {
    const key = JSON.stringify(d);
    this.design = d;
    if (key !== this.meshKey) {
      this.meshKey = key;
      this.data = buildModel(d);
      this.lowData = buildModel(d, true);
    }
    this.render();
  }
  fit() {
    this.yaw = 0.72;
    this.pitch = 0.34;
    this.zoom = 1;
    this.view = "perspective";
    this.render();
  }
  setView(v) {
    if (v === "top") {
      this.pitch = 1.56;
      this.yaw = 0;
    } else if (v === "front") {
      this.pitch = 0.06;
      this.yaw = 0;
    } else this.fit();
    this.view = v;
    this.render();
  }
  get auto() {
    return this._auto || false;
  }
  set auto(enabled) {
    this._auto = !!enabled;
    this.lastTime = 0;
    if (enabled) this.scheduleAnimation();
  }
  scheduleAnimation() {
    if (this.animationPending || document.hidden || !this.auto) return;
    this.animationPending = true;
    requestAnimationFrame(this.animate);
  }
  animate(t) {
    this.animationPending = false;
    if (!this.auto || document.hidden) return;
    if (!this.drag) {
      this.yaw += this.lastTime ? Math.min(t - this.lastTime, 50) * 0.00018 : 0;
      this.view = "custom";
      this.render();
    }
    this.lastTime = t;
    this.scheduleAnimation();
  }
  camera(width, height) {
    const d = this.design;
    const target = [0, d.height / 200, 0];
    const eye = [
      Math.sin(this.yaw) * Math.cos(this.pitch) * 6,
      target[1] + Math.sin(this.pitch) * 6,
      Math.cos(this.yaw) * Math.cos(this.pitch) * 6,
    ];
    const z = unit(eye.map((v, i) => v - target[i])),
      x = unit(cross([0, 1, 0], z)),
      y = cross(z, x);
    const view = new Float32Array([
      x[0],
      y[0],
      z[0],
      0,
      x[1],
      y[1],
      z[1],
      0,
      x[2],
      y[2],
      z[2],
      0,
      -dot(x, eye),
      -dot(y, eye),
      -dot(z, eye),
      1,
    ]);
    const aspect = width / height;
    const dimensions = [d.width / 100, d.height / 100, d.depth / 100];
    const extent = (axis) =>
      dimensions.reduce((sum, v, i) => sum + v * Math.abs(axis[i]), 0);
    const vsize =
      Math.max(0.1, extent(x) / (aspect * 0.8), extent(y) / 0.58) / this.zoom;
    const scaleX = 2 / (vsize * aspect),
      scaleY = 2 / vsize;
    const projection = new Float32Array([
      scaleX,
      0,
      0,
      0,
      0,
      scaleY,
      0,
      0,
      0,
      0,
      -2 / 30,
      0,
      0,
      0,
      -1,
      1,
    ]);
    return { matrix: multiply(projection, view), x, y, z, target, size: vsize };
  }
  render() {
    if (!this.design) return;
    const c = this.canvas;
    const rect = c.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(devicePixelRatio || 1, this.gl ? 2 : 1);
    const width = Math.round(rect.width * dpr),
      height = Math.round(rect.height * dpr);
    if (c.width !== width) c.width = width;
    if (c.height !== height) c.height = height;
    const cam = this.camera(c.width, c.height);
    this.currentCam = cam;
    if (this.gl) this.renderGL(cam);
    else
      drawSoftware(
        this.ctx,
        this.lowData,
        c.width,
        c.height,
        cam,
        this.wire,
        true,
      );
    this.onViewChange?.();
  }
  renderGL(cam) {
    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.program);
    gl.uniformMatrix4fv(this.matrixLoc, false, cam.matrix);
    const draw = (data, type, unlit = 0) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
      gl.uniform1f(this.unlitLoc, unlit);
      gl.drawArrays(type, 0, data.length / 10);
    };
    const floor = [];
    const extent = 8;
    const color = [0.928, 0.922, 0.903];
    const push = (x, y, z, c) => floor.push(x, y, z, 0, 1, 0, ...c, 0);
    for (const p of [
      [-extent, 0, -extent],
      [extent, 0, -extent],
      [extent, 0, extent],
      [-extent, 0, -extent],
      [extent, 0, extent],
      [-extent, 0, extent],
    ])
      push(...p, color);
    draw(new Float32Array(floor), gl.TRIANGLES, 1);
    const grid = [];
    const gc = [0.875, 0.872, 0.854];
    for (let i = -30; i <= 30; i++) {
      const v = i * 0.2;
      grid.push(
        v,
        0.001,
        -6,
        0,
        1,
        0,
        ...gc,
        0,
        v,
        0.001,
        6,
        0,
        1,
        0,
        ...gc,
        0,
        -6,
        0.001,
        v,
        0,
        1,
        0,
        ...gc,
        0,
        6,
        0.001,
        v,
        0,
        1,
        0,
        ...gc,
        0,
      );
    }
    draw(new Float32Array(grid), gl.LINES, 1);
    // Opaque concentric ellipses approximate a soft contact shadow without textures.
    const shadow = [];
    const w = this.design.width / 100,
      z = this.design.depth / 100;
    for (let ring = 10; ring > 0; ring--) {
      const mix = ring / 10;
      const shade = 0.928 - (1 - mix) * 0.12;
      for (let i = 0; i < 48; i++) {
        const a = (i / 48) * Math.PI * 2,
          b = ((i + 1) / 48) * Math.PI * 2;
        for (const p of [
          [0, 0.003 + (10 - ring) * 0.0001, 0],
          [
            Math.cos(a) * w * 0.55 * mix,
            0.003 + (10 - ring) * 0.0001,
            Math.sin(a) * z * 0.55 * mix,
          ],
          [
            Math.cos(b) * w * 0.55 * mix,
            0.003 + (10 - ring) * 0.0001,
            Math.sin(b) * z * 0.55 * mix,
          ],
        ])
          shadow.push(...p, 0, 1, 0, shade, shade * 0.995, shade * 0.975, 0);
      }
    }
    draw(new Float32Array(shadow), gl.TRIANGLES, 1);
    draw(this.data, gl.TRIANGLES);
    if (this.wire) {
      const lines = [];
      const src = this.lowData;
      for (let i = 0; i < src.length; i += 30)
        for (const [a, b] of [
          [0, 10],
          [10, 20],
          [20, 0],
        ])
          for (const o of [a, b])
            lines.push(...src.slice(i + o, i + o + 6), 0.22, 0.29, 0.25, 0);
      gl.depthFunc(gl.LEQUAL);
      draw(new Float32Array(lines), gl.LINES, 1);
      gl.depthFunc(gl.LESS);
    }
  }
  get mode() {
    return this.gl ? "WebGL" : "Software 3D";
  }
}
function project(p, cam, w, h) {
  const delta = p.map((v, i) => v - cam.target[i]);
  return [
    w / 2 + (dot(delta, cam.x) * h) / cam.size,
    h / 2 - (dot(delta, cam.y) * h) / cam.size,
    dot(delta, cam.z),
  ];
}
export function drawSoftware(
  ctx,
  data,
  w,
  h,
  cam,
  wire = false,
  floor = false,
) {
  ctx.clearRect(0, 0, w, h);
  if (floor) {
    ctx.fillStyle = "#eeece7";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#deddd5";
    ctx.lineWidth = 1;
    for (let i = -20; i <= 20; i++)
      for (const line of [
        [
          [i * 0.2, 0, -4],
          [i * 0.2, 0, 4],
        ],
        [
          [-4, 0, i * 0.2],
          [4, 0, i * 0.2],
        ],
      ]) {
        const a = project(line[0], cam, w, h),
          b = project(line[1], cam, w, h);
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.stroke();
      }
    const ground = project([0, 0, 0], cam, w, h);
    const grad = ctx.createRadialGradient(
      ground[0],
      ground[1],
      2,
      ground[0],
      ground[1],
      h * 0.25,
    );
    grad.addColorStop(0, "#202c2924");
    grad.addColorStop(1, "#202c2900");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }
  const faces = [];
  for (let i = 0; i < data.length; i += 30) {
    const a = project([...data.slice(i, i + 3)], cam, w, h),
      b = project([...data.slice(i + 10, i + 13)], cam, w, h),
      c = project([...data.slice(i + 20, i + 23)], cam, w, h);
    const n = unit(
      [3, 4, 5].map((k) => data[i + k] + data[i + k + 10] + data[i + k + 20]),
    );
    const light = 0.58 + 0.4 * Math.max(0, dot(n, unit([-0.4, 0.9, 0.7])));
    const rgb = [data[i + 6], data[i + 7], data[i + 8]].map((x) =>
      Math.min(255, Math.round(x * 255 * light)),
    );
    faces.push({
      p: [a, b, c],
      depth: (a[2] + b[2] + c[2]) / 3,
      rgb,
      color: `rgb(${rgb.join(",")})`,
    });
  }
  // Per-pixel depth prevents intersecting furniture parts from showing through
  // one another in thumbnails and in the software-rendering fallback.
  const pixels = floor
    ? ctx.getImageData?.(0, 0, w, h)
    : ctx.createImageData?.(w, h);
  if (pixels?.data) {
    const depth = new Float32Array(w * h);
    depth.fill(-Infinity);
    for (const f of faces) {
      const [a, b, c] = f.p;
      const area =
        (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
      if (Math.abs(area) < 1e-7) continue;
      const left = Math.max(0, Math.floor(Math.min(a[0], b[0], c[0]))),
        right = Math.min(w - 1, Math.ceil(Math.max(a[0], b[0], c[0])));
      const top = Math.max(0, Math.floor(Math.min(a[1], b[1], c[1]))),
        bottom = Math.min(h - 1, Math.ceil(Math.max(a[1], b[1], c[1])));
      for (let y = top; y <= bottom; y++)
        for (let x = left; x <= right; x++) {
          const px = x + 0.5,
            py = y + 0.5,
            u =
              ((b[1] - c[1]) * (px - c[0]) + (c[0] - b[0]) * (py - c[1])) /
              area,
            v =
              ((c[1] - a[1]) * (px - c[0]) + (a[0] - c[0]) * (py - c[1])) /
              area,
            t = 1 - u - v;
          if (u < -0.00001 || v < -0.00001 || t < -0.00001) continue;
          const z = u * a[2] + v * b[2] + t * c[2],
            idx = y * w + x;
          if (z <= depth[idx]) continue;
          depth[idx] = z;
          const off = idx * 4;
          pixels.data[off] = f.rgb[0];
          pixels.data[off + 1] = f.rgb[1];
          pixels.data[off + 2] = f.rgb[2];
          pixels.data[off + 3] = 255;
        }
    }
    ctx.putImageData(pixels, 0, 0);
    if (!wire) return;
  }
  faces.sort((a, b) => a.depth - b.depth);
  for (const f of faces) {
    ctx.beginPath();
    ctx.moveTo(...f.p[0].slice(0, 2));
    ctx.lineTo(...f.p[1].slice(0, 2));
    ctx.lineTo(...f.p[2].slice(0, 2));
    ctx.closePath();
    ctx.fillStyle = f.color;
    if (!pixels?.data) ctx.fill();
    ctx.strokeStyle = wire ? "#45584c" : f.color;
    ctx.lineWidth = wire ? 0.45 : 0.35;
    ctx.stroke();
  }
}
const thumbnailCache = new Map();
export function thumbnail(canvas, d) {
  const w = 220,
    h = 132;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (thumbnailCache.has(d.id)) {
    ctx.drawImage(thumbnailCache.get(d.id), 0, 0);
    return;
  }
  const target = [0, (d.height / 100) * 0.45, 0];
  const z = unit([0.65, 0.42, 1]),
    x = unit(cross([0, 1, 0], z)),
    y = cross(z, x);
  drawSoftware(ctx, buildModel(d, true), w, h, {
    target,
    x,
    y,
    z,
    size: (Math.max(d.width, d.height, d.depth) / 100) * 1.45,
  });
  thumbnailCache.set(d.id, canvas);
}
