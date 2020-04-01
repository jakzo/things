import { readConfig, getCommands, isProjectConfigSpecialKey } from './config-file';
import chalk from 'chalk';
import { ToolConfig } from './types';

export const runCommand = async (opts: {
  dir: string;
  configRequireName?: string;
  command: string;
}) => {
  const config = await readConfig(opts.dir, opts.configRequireName);
  const commandToolConfigs =
    !isProjectConfigSpecialKey(opts.command) && (config[opts.command] as ToolConfig<any>[]);
  if (!commandToolConfigs) {
    throw new Error(
      [
        `Command does not exist in config: ${opts.command}`,
        `Possible commands are: ${getCommands(config).join(', ')}`,
      ].join('\n'),
    );
  }
  for (const toolConfig of commandToolConfigs) {
    const { toolDef } = toolConfig;
    console.log(chalk.blue(`Running ${toolDef.name}...`));
    const toolCommand = toolDef.commands[opts.command] || toolDef.commands.default;
    try {
      await toolCommand(toolConfig.config, opts.dir);
    } catch (err) {
      console.error(chalk.red(`Tool failed: ${toolDef.name}`));
      throw err;
    }
    console.log(chalk.green(`${toolDef.name} finished succesfully`));
  }
};
