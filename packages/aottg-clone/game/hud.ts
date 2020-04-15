/**
 * HUD object.
 * @class
 * @param element {Element} Displayed DOM element.
 */
var Hud = function(element) {
  this.element = element;
};

/**
 * Shows or hides the HUD object on the screen.
 * @param hide {boolean} True hides the object.
 */
Hud.prototype.show = function(hide) {
  var parent = this.element.parentNode;
  if (hide) {
    if (parent) parent.removeChild(this.element);
  } else if (!parent) Hud.container.appendChild(this.element);
};

/**
 * Element to add the HUD objects to (the one with the canvas in it).
 * @type Element
 */
Hud.element = null;
