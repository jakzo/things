import { Renderer } from './render';
import { InitError } from './error';
import { ShaderScript } from './shader-scripts/shader-script';

export interface ShaderAttributes {
  [varName: string]: number;
}
export interface ShaderUniforms {
  [varName: string]: WebGLUniformLocation;
}

export interface ShaderOpts {
  vertexScript: ShaderScript;
  fragmentScript: ShaderScript;
  renderer: Renderer;
}
export interface Shader extends ShaderOpts {}
export class Shader {
  vertexShader: WebGLShader;
  fragmentShader: WebGLShader;
  program: WebGLProgram;
  varLocations: {
    attributes: ShaderAttributes;
    uniforms: ShaderUniforms;
  };

  constructor(opts: ShaderOpts) {
    Object.assign(this, opts);

    try {
      this.vertexShader = this.initShader(this.renderer.gl.VERTEX_SHADER, this.vertexScript);
      this.fragmentShader = this.initShader(this.renderer.gl.FRAGMENT_SHADER, this.fragmentScript);
      this.program = this.initProgram(this.vertexShader, this.fragmentShader);
    } catch (err) {
      this.cleanup();
      throw err;
    }

    this.varLocations = this.getVariableLocations([this.vertexScript, this.fragmentScript]);
  }

  private initShader(
    type: WebGLRenderingContextBase['VERTEX_SHADER'] | WebGLRenderingContextBase['FRAGMENT_SHADER'],
    script: ShaderScript,
  ) {
    const { gl } = this.renderer;

    const shader = gl.createShader(type);
    if (!shader) throw new InitError('create shader');

    gl.shaderSource(shader, script.source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new InitError('compile shader', { info: gl.getShaderInfoLog(shader) });
    }

    return shader;
  }

  private initProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader) {
    const { gl } = this.renderer;

    const program = gl.createProgram();
    if (!program) throw new InitError('create program');

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new InitError('link program', { info: gl.getProgramInfoLog(program) });
    }

    gl.useProgram(program);
    return program;
  }

  private getVariableLocations(scripts: ShaderScript[]) {
    const { gl } = this.renderer;

    return {
      attributes: Object.fromEntries(
        scripts
          .flatMap(script => script.attributes)
          .map(name => [name, gl.getAttribLocation(this.program, name)]),
      ),
      uniforms: Object.fromEntries(
        scripts
          .flatMap(script => script.uniforms)
          .map(name => {
            const loc = gl.getUniformLocation(this.program, name);
            if (!loc) throw new InitError('get location of uniform');
            return [name, loc];
          }),
      ),
    };
  }

  /** Call before destroying to free GPU resources. */
  cleanup() {
    const { gl } = this.renderer;
    gl.deleteShader(this.vertexShader);
    gl.deleteShader(this.fragmentShader);
    gl.deleteProgram(this.program);
  }
}
