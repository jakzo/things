export interface ShaderScript {
  source: string;
  attributes: string[];
  uniforms: string[];
}

export class ShaderScript {
  attributes: string[];
  uniforms: string[];

  constructor(public source: string) {
    Object.assign(this, this.getVarsFromSource(source));
  }

  private getVarsFromSource(source: string) {
    // TODO: Fix this up
    const attributes = [];
    const uniforms = [];
    for (const scriptLine of source.split(';')) {
      const parts = /\w+/g.exec(scriptLine);
      if (!parts) continue;
      if (parts[0] == 'attribute') attributes.push(parts[2]);
      else if (parts[0] == 'uniform') uniforms.push(parts[2]);
    }

    return {
      attributes,
      uniforms,
    };
  }
}

// TODO: Build transformer to minify shader scripts and precompute var names
// TODO: Build VSCode extension to syntax highlight shader scripts
export const shader = (strs: TemplateStringsArray) => {
  if (strs.length !== 1) throw new Error('shader cannot have interpolations');
  return new ShaderScript(strs[0]);
};
