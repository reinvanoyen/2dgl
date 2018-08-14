"use strict";

class Renderer {

  constructor(canvasEl) {

    this.gl = canvasEl.getContext('webgl');
    this.program = null;
  }

  createShader(type, src) {

    const shader = this.gl.createShader(type);

    this.gl.shaderSource(shader, src);
    this.gl.compileShader(shader);

    const success = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);

    if (success) {
      return shader;
    }

    console.log(this.gl.getShaderInfoLog(shader));
    this.gl.deleteShader(shader);
  }

  createProgram(vertexShader, fragmentShader) {

    this.program = this.gl.createProgram();

    this.gl.attachShader(this.program, vertexShader);
    this.gl.attachShader(this.program, fragmentShader);

    this.gl.linkProgram(this.program);

    const success = this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS);

    if (success) {

      this.positionBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);

      this.positionAttrLocation = this.gl.getAttribLocation(this.program, 'a_position');
      this.resolutionUniformLocation = this.gl.getUniformLocation(this.program, 'u_resolution');
      this.translationUniformLocation = this.gl.getUniformLocation(this.program, 'u_translation');
      this.colorUniformLocation = this.gl.getUniformLocation(this.program, 'u_color');

      return this.program;
    }

    console.log(this.gl.getProgramInfoLog(this.program));
    this.gl.deleteProgram(this.program);
  }

  render() {

    // Tell WebGL how to convert from clip space to pixels
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

    // Clear
    this.gl.clear(renderer.gl.COLOR_BUFFER_BIT);

    // Tell it to use our program (pair of shaders)
    this.gl.useProgram(this.program);

    // Turn on the attribute
    this.gl.enableVertexAttribArray(this.positionAttrLocation);

    // Bind the position buffer.
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);

    renderRectangle(
      this.gl,
      this.positionAttrLocation,
      this.colorUniformLocation,
      this.resolutionUniformLocation,
      this.translationUniformLocation,
      100, 100, // width & height
      [0, 1, 0, 1], // color r, g, b, a
      [100, 0] // translation
    );
  }
}

function renderRectangle(gl, positionAttrLocation, colorUniformLocation, resolutionLocation, translationLocation, width, height, color, translation) {

  let x1 = 0;
  let x2 = width;
  let y1 = 0;
  let y2 = height;

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    x1, y1,
    x2, y1,
    x1, y2,
    x1, y2,
    x2, y1,
    x2, y2
  ]), gl.STATIC_DRAW);

  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  let size = 2;          // 2 components per iteration
  let type = gl.FLOAT;   // the data is 32bit floats
  let normalize = false; // don't normalize the data
  let stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  let offset = 0;        // start at the beginning of the buffer

  gl.vertexAttribPointer(positionAttrLocation, size, type, normalize, stride, offset);

  // set the resolution
  gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
  gl.uniform4f(colorUniformLocation, color[0], color[1], color[2], color[3]);
  gl.uniform2f(translationLocation, translation[0], translation[1]);

  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

const vertexShaderSrc = `
  attribute vec2 a_position;
  
  uniform vec2 u_resolution;
  uniform vec2 u_translation;
  
  void main() {
  
    vec2 position = a_position + u_translation;
  
    // convert the position from pixels to 0.0 to 1.0
    vec2 zeroToOne = position / u_resolution;
    
    // convert from 0->1 to 0->2
    vec2 zeroToTwo = zeroToOne * 2.0;
    
    // convert from 0->2 to -1->+1 (clipspace)
    vec2 clipSpace = zeroToTwo - 1.0;
    
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
  }
`;

const fragmentShaderSrc = `

  precision mediump float;
  
  uniform vec4 u_color;

  void main() {
    gl_FragColor = u_color;
  }
`;

const renderer = new Renderer(document.getElementById('canvas'));

const vertexShader = renderer.createShader(renderer.gl.VERTEX_SHADER, vertexShaderSrc);
const fragmentShader = renderer.createShader(renderer.gl.FRAGMENT_SHADER, fragmentShaderSrc);

renderer.createProgram(vertexShader, fragmentShader);
renderer.render();