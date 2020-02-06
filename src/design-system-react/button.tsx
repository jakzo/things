import React, { FC } from 'react';

import { DesignSystem } from '../stdi/interfaces';

export interface ButtonProps {
  onClick(): void;
}

export const createButton = (_ds: DesignSystem): FC<ButtonProps> => {
  return function Button({ children }) {
    return <button>{children}</button>;
  };
};
