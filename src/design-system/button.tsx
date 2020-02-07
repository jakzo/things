import React, { FC } from 'react';

export interface DesignSystem {
  x: number;
}

export interface ButtonProps {
  onClick(): void;
}

export const createButton = (_ds: DesignSystem): FC<ButtonProps> => {
  return function Button({ children }) {
    return <button>{children}</button>;
  };
};
