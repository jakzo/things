export interface DesignSystem {
  style: {
    gridSize: number;
    colors: {
      primary: Color;
      secondary: Color;
    };
  };
}

/** Each property is a CSS color string. */
interface Color {
  main: string;
  light: string;
  dark: string;
}
