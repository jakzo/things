export const gitignoreToGlob = (gitignoreLines: string[]): string[] =>
  Array.prototype.concat(
    ...gitignoreLines.map(rawLine => {
      let line = rawLine.trim();
      if (
        line.length === 0 ||
        line[0] === '#' ||
        // TODO: How should I handle this?
        line[0] === '!'
      )
        return [];

      if (line[0] !== '/') line = `**/${line}`;
      else line = line.substring(1);

      if (line[line.length - 1] === '/') {
        return [`${line}**`];
      }

      return [line, `${line}/**`];
    }),
  );
