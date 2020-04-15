interface ErrorProps {
  [name: string]: unknown;
}

export class GameError extends Error {
  constructor(msg: string, props?: ErrorProps) {
    super(msg);
    Object.assign(this, props);
  }
}

export class InitError extends GameError {
  constructor(action: string, props?: ErrorProps) {
    super(`Cannot ${action}`);
    Object.assign(this, props);
  }
}
