export enum ActionType {
  /** Input is triggered once when the button is pressed down. */
  DOWN,
  /** Input is triggered while the button is held down. */
  HOLD,
  /** Input is triggered once when the button is released. */
  UP,
  /** Input is triggered the amount (force) that the button is pressed down. */
  AMOUNT,
}

export enum AxisDirection {
  POSITIVE,
  NEGATIVE,
}

export interface InputActions {
  [action: string]: ActionType;
}

export type InputState<T extends InputActions> = {
  [A in keyof T]: T[A] extends ActionType.AMOUNT ? number : boolean;
};

export interface DeviceBindings<T extends InputActions> {
  button: {
    [id: number]: Partial<{ [K in keyof T]: true }>;
  };
  axis: {
    [id: number]: Partial<
      { [K in keyof T]: T[K] extends ActionType.AMOUNT ? AxisDirection : never }
    >;
  };
}

export type DefaultBindings<T extends InputActions> = {
  keyboardMouse: DeviceBindings<T>;
  gamepad: DeviceBindings<T>;
};

interface InputManagerOpts<T extends InputActions> {
  actions: T;
  defaultBindings: DefaultBindings<T>;
}
export interface InputManager<T extends InputActions> extends InputManagerOpts<T> {}
export class InputManager<T> {
  devices: { [id: string]: InputDevice<T>[] };
  addedGamepads = new Set<number>();

  constructor(opts: InputManagerOpts<T>) {
    Object.assign(this, opts);

    this.devices = {
      keyboardMouse: [new KeyboardMouseDevice(this.actions, opts.defaultBindings.keyboardMouse)],
    };
    this.updateGampads();
  }

  updateGampads() {
    const gamepads = navigator.getGamepads();
    for (const gamepad of gamepads) {
      if (!gamepad) continue;
      if (this.addedGamepads.has(gamepad.index) === gamepad.connected) continue;
      if (gamepad.connected) {
        const device = new GamepadDevice(gamepad, this.actions, this.defaultBindings.gamepad);
        if (this.devices[gamepad.id]) this.devices[gamepad.id].push(device);
        else this.devices[gamepad.id] = [device];
        this.addedGamepads.add(gamepad.index);
      } else {
        const devices = this.devices[gamepad.id];
        if (!devices) continue;
        const deviceIdx = devices.findIndex(
          device => (device as GamepadDevice<T>).prevState.index === gamepad.index,
        );
        if (deviceIdx === -1) continue;
        this.devices[gamepad.id].splice(deviceIdx, 1);
        this.addedGamepads.delete(gamepad.index);
      }
    }
    return gamepads;
  }

  receiveInputs(): InputState<T> {
    const gamepads = this.updateGampads();
    const inputs = (Object.fromEntries(
      Object.entries(this.actions).map(([action, type]) => [
        action,
        type === ActionType.AMOUNT ? 0 : false,
      ]),
    ) as unknown) as InputState<T>;
    for (const devicesOfId of Object.values(this.devices)) {
      for (const device of devicesOfId) {
        device.updateState(gamepads);
        for (const [action, value] of Object.entries(device.state)) {
          const type = this.actions[action];
          inputs[action as keyof T] =
            type === ActionType.AMOUNT
              ? Math.min(Math.max(inputs[action] as number, value), 1)
              : inputs[action] || value;
          if (type === ActionType.DOWN || type === ActionType.UP) {
            (device.state[action] as unknown) = false;
          }
        }
      }
    }
    return inputs;
  }
}

export abstract class InputDevice<T extends InputActions> {
  constructor(
    /** Identifier unique to the type of device (eg. `xbox-controller`). */
    public id: string,
    /** Game actions for reference. */
    public actions: T,
    /** Bindings from device inputs to game actions. */
    public bindings: DeviceBindings<T>,
  ) {}

  /**
   * Absolute position on screen of the cursor.
   * Only set if the cursor has been moved to an absolute position since state was last updated.
   */
  cursorPos?: {
    x: number;
    y: number;
  };

  /** Current state of game actions based on bound inputs. */
  state: Partial<InputState<T>> = {};

  /**
   * Updates the `state` and `cursorPos` properties before the input manager reads them.
   * All one-time events in the `state` object and `cursorPos` will be reset by the input manager
   * after calling this.
   */
  abstract updateState(gamepads: Gamepad[]): void;

  /** Called when the game gets input focus. Attach event listeners here. */
  abstract onGameFocus(canvas: HTMLCanvasElement): void;
  /** Called when the game gets input focus. Detach event listeners here. */
  abstract onGameBlur(): void;
}

export class KeyboardMouseDevice<T extends InputActions> extends InputDevice<T> {
  canvas: HTMLCanvasElement;
  document?: Document;

  constructor(actions: T, bindings: DeviceBindings<T>) {
    super('Keyboard and Mouse', actions, bindings);
  }

  updateState() {}

  onGameFocus(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.document = canvas.ownerDocument || undefined;

    this.canvas.addEventListener('keydown', this.onKeyDown);
    this.canvas.addEventListener('keyup', this.onKeyUp);
    this.canvas.addEventListener('mousedown', this.onMouseDown);
    this.canvas.addEventListener('mouseup', this.onMouseUp);
    if (this.document) this.document.addEventListener('mousemove', this.onMouseMove);
  }

  onGameBlur() {
    this.canvas.removeEventListener('keydown', this.onKeyDown);
    this.canvas.removeEventListener('keyup', this.onKeyUp);
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    this.canvas.removeEventListener('mouseup', this.onMouseUp);
    if (this.document) this.document.removeEventListener('mousemove', this.onMouseMove);
  }

  private onButton(id: number, isPressed: boolean) {
    const bindings = this.bindings.button[id];
    if (!bindings) return;
    for (const action in bindings) {
      (this.state[action] as unknown) =
        this.actions[action] === ActionType.AMOUNT ? (isPressed ? 1 : 0) : isPressed;
    }
  }

  private onKeyDown = (evt: KeyboardEvent) => {
    this.onButton(evt.keyCode, true);
  };

  private onKeyUp = (evt: KeyboardEvent) => {
    this.onButton(evt.keyCode, false);
  };

  private onMouseDown = (evt: MouseEvent) => {
    this.onButton(evt.button, true);
  };

  private onMouseUp = (evt: MouseEvent) => {
    this.onButton(evt.button, false);
  };

  private onMouseMove = (evt: MouseEvent) => {
    if ((evt.currentTarget as Document).pointerLockElement) {
      // TODO
      // if (this.state.cursorPosRelative) {
      //   this.state.cursorPosRelative.x += evt.movementX;
      //   this.state.cursorPosRelative.y += evt.movementY;
      // } else {
      //   this.state.cursorPosRelative = { x: evt.movementX, y: evt.movementY };
      // }
    } else {
      this.cursorPos = { x: evt.clientX, y: evt.clientY };
    }
  };
}

export class GamepadDevice<T extends InputActions> extends InputDevice<T> {
  prevState: Gamepad;

  constructor(gamepad: Gamepad, actions: T, bindings: DeviceBindings<T>) {
    super(gamepad.id, actions, bindings);
    this.prevState = gamepad;
  }

  updateState(gamepads: Gamepad[]) {
    const gamepad = gamepads[this.prevState.index];

    for (const [id, bindings] of Object.entries(this.bindings.button)) {
      for (const action in bindings) {
        const button = gamepad.buttons[(id as unknown) as number];
        if (!button) continue;
        const type = this.actions[action];
        (this.state[action] as unknown) =
          type === ActionType.AMOUNT
            ? button.value
            : type === ActionType.HOLD
            ? button.pressed
            : button.pressed && this.prevState.buttons[(id as unknown) as number].pressed;
      }
    }
    for (const [id, bindings] of Object.entries(this.bindings.axis)) {
      for (const [action, dir] of Object.entries(bindings)) {
        const axis = gamepad.axes[(id as unknown) as number] || 0;
        (this.state[action] as unknown) = Math.max(
          0,
          dir === AxisDirection.POSITIVE ? axis : -axis,
        );
      }
    }

    this.prevState = gamepad;
  }

  // TODO: Implement the `gamepadchanged` event when it becomes available
  onGameFocus() {}
  onGameBlur() {}
}
