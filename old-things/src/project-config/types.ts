import { MaybePromise } from '../util-types';

export interface ProjectConfigSpecialProps {
  gitignored?: string[];
}

export interface ProjectConfig extends ProjectConfigSpecialProps {
  [command: string]: ToolConfigGetter<any>[] | string[] | undefined;
}

export interface ProjectConfigInitialized extends Required<ProjectConfigSpecialProps> {
  [command: string]: ToolConfig<any>[] | string[];
}

export type ToolCommand<C> = (config: C, cwd: string) => Promise<void>;

export interface ToolConfig<C> {
  toolDef: ToolDef<C>;
  requiredDependencies: string[];
  config: C;
  getConfigFiles: ConfigFileGetter<C>;
}

export interface ToolDef<C> {
  name: string;
  commands: { default: ToolCommand<C> } & { [command: string]: ToolCommand<C> };
}

export type ToolConfigGetter<C> = (dependencies: Set<string>) => ToolConfig<C>;

export type Tool<C> = (config: C) => ToolConfigGetter<C>;

export interface GeneratedConfigFile {
  path: string;
  contents: string;
}
export type ConfigFileGetter<C> = (config: C, gitignoreGlobs: Set<string>) => GeneratedConfigFile[];

export interface ProjectConfigModule {
  default: MaybePromise<ProjectConfig>;
}
