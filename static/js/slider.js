/**
 * Simple no BS dual-handle range slider.
 * Author: Phixyn
 *
 * TODO:
 * - Documentation
 * - destroy() method to remove all listeners
 */
class DualRangeSlider {
  constructor(container, options = {}) {
    // Container can be passed either as a querySelector value or as the
    // actual DOM element.
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    this.min = options.min || 0;
    this.max = options.max || 100;
    this.valueMin = options.valueMin ?? this.min;
    this.valueMax = options.valueMax ?? this.max;
    this.step = options.step || 1;
    this.onChange = options.onChange || (() => { });

    this.activeHandle = null;
    this.createSlider();
    this.attachEvents();
    this.update();
  }

  createSlider() {
    this.container.innerHTML = `
      <div class="range-slider__track">
        <div class="range-slider__fill"></div>
      </div>
      <div class="range-slider__handle" data-handle="min" role="slider" tabindex="0" aria-valuemin="${this.min}" aria-valuemax="${this.max}" aria-valuenow="${this.valueMin}" aria-label="Minimum value">
        <div class="range-slider__label"></div>
      </div>
      <div class="range-slider__handle" data-handle="max" role="slider" tabindex="0" aria-valuemin="${this.min}" aria-valuemax="${this.max}" aria-valuenow="${this.valueMax}" aria-label="Maximum value">
        <div class="range-slider__label"></div>
      </div>
`;

    this.track = this.container.querySelector('.range-slider__track');
    this.fill = this.container.querySelector('.range-slider__fill');
    this.handleMin = this.container.querySelector('[data-handle="min"]');
    this.handleMax = this.container.querySelector('[data-handle="max"]');
    this.labelMin = this.handleMin.querySelector('.range-slider__label');
    this.labelMax = this.handleMax.querySelector('.range-slider__label');
  }

  /**
   * Creates and attaches event handlers for the slider and its parts.
   */
  attachEvents() {
    const startDrag = (e, handle) => {
      e.preventDefault();
      e.stopPropagation();

      this.activeHandle = handle;
      handle.classList.add('dragging');
      document.body.style.cursor = 'grabbing';

      document.addEventListener('pointermove', onDrag);
      document.addEventListener('pointerup', endDrag);
    };

    /**
     * Handler for slider handle(s) dragging.
     */
    const onDrag = (e) => {
      if (!this.activeHandle) return;

      const clientX = e.clientX;
      const rect = this.track.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const value = this.min + percent * (this.max - this.min);
      const snappedValue = Math.round(value / this.step) * this.step;

      if (this.activeHandle.dataset.handle === 'min') {
        this.valueMin = Math.min(snappedValue, this.valueMax - this.step);
      } else {
        this.valueMax = Math.max(snappedValue, this.valueMin + this.step);
      }

      this.update();
      this.onChange(this.valueMin, this.valueMax);
    };

    const endDrag = () => {
      if (this.activeHandle) {
        this.activeHandle.classList.remove('dragging');
        this.activeHandle = null;
        document.body.style.cursor = '';

        document.removeEventListener('pointermove', onDrag);
        document.removeEventListener('pointerup', endDrag);
      }
    };

    this.handleMin.addEventListener('pointerdown', (e) => startDrag(e, this.handleMin));
    this.handleMax.addEventListener('pointerdown', (e) => startDrag(e, this.handleMax));

    /**
     * Handler for clicks on the slider track.
     * Moves the closest handle to the position of the click.
     */
    const trackClick = (e) => {
      if (this.activeHandle) {
        // Don't handle if already dragging
        return;
      }

      const clientX = e.clientX;
      const rect = this.track.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const clickValue = this.min + percent * (this.max - this.min);

      // Determine which handle is closer
      const distToMin = Math.abs(clickValue - this.valueMin);
      const distToMax = Math.abs(clickValue - this.valueMax);

      const snappedValue = Math.round(clickValue / this.step) * this.step;

      if (distToMin <= distToMax) {
        this.valueMin = Math.min(snappedValue, this.valueMax - this.step);
      } else {
        this.valueMax = Math.max(snappedValue, this.valueMin + this.step);
      }

      this.update();
      this.onChange(this.valueMin, this.valueMax);
    };

    this.track.addEventListener('pointerdown', trackClick);

    // Keyboard support
    const handleKeyDown = (e, handle) => {
      const isMin = handle.dataset.handle === 'min';
      let newValue;
      const largeStep = (this.max - this.min) / 10;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowUp':
          e.preventDefault();
          newValue = (isMin ? this.valueMin : this.valueMax) + this.step;
          break;
        case 'ArrowLeft':
        case 'ArrowDown':
          e.preventDefault();
          newValue = (isMin ? this.valueMin : this.valueMax) - this.step;
          break;
        case 'PageUp':
          e.preventDefault();
          newValue = (isMin ? this.valueMin : this.valueMax) + largeStep;
          break;
        case 'PageDown':
          e.preventDefault();
          newValue = (isMin ? this.valueMin : this.valueMax) - largeStep;
          break;
        case 'Home':
          e.preventDefault();
          newValue = this.min;
          break;
        case 'End':
          e.preventDefault();
          newValue = this.max;
          break;
        default:
          return;
      }

      if (isMin) {
        this.valueMin = Math.max(this.min, Math.min(newValue, this.valueMax - this.step));
      } else {
        this.valueMax = Math.min(this.max, Math.max(newValue, this.valueMin + this.step));
      }

      this.update();
      this.onChange(this.valueMin, this.valueMax);
    };

    this.handleMin.addEventListener('keydown', (e) => handleKeyDown(e, this.handleMin));
    this.handleMax.addEventListener('keydown', (e) => handleKeyDown(e, this.handleMax));
  }

  /**
   * Visually updates the slider and its ARIA attributes.
   */
  update() {
    const percentMin = ((this.valueMin - this.min) / (this.max - this.min)) * 100;
    const percentMax = ((this.valueMax - this.min) / (this.max - this.min)) * 100;

    this.handleMin.style.left = `${percentMin}%`;
    this.handleMax.style.left = `${percentMax}%`;

    this.fill.style.left = `${percentMin}%`;
    this.fill.style.right = `${100 - percentMax}%`;

    const roundedMin = Math.round(this.valueMin);
    const roundedMax = Math.round(this.valueMax);

    this.labelMin.textContent = roundedMin;
    this.labelMax.textContent = roundedMax;

    // Update ARIA attributes
    this.handleMin.setAttribute('aria-valuenow', roundedMin);
    this.handleMin.setAttribute('aria-valuemin', this.min);
    this.handleMin.setAttribute('aria-valuemax', this.max);
    this.handleMin.setAttribute('aria-valuetext', `${roundedMin}`);

    this.handleMax.setAttribute('aria-valuenow', roundedMax);
    this.handleMax.setAttribute('aria-valuemin', this.min);
    this.handleMax.setAttribute('aria-valuemax', this.max);
    this.handleMax.setAttribute('aria-valuetext', `${roundedMax}`);
  }

  setMin(value) {
    this.min = value;
    this.valueMin = Math.max(this.valueMin, this.min);
    this.valueMax = Math.max(this.valueMax, this.min);
    this.update();
  }

  setMax(value) {
    this.max = value;
    this.valueMin = Math.min(this.valueMin, this.max);
    this.valueMax = Math.min(this.valueMax, this.max);
    this.update();
  }

  /**
   * Sets values for the slider handles.
   *
   * @param {number} min - Value for the left handle.
   * @param {number} max - Value for the right handle.
   */
  setValues(min, max) {
    // Set values, but clamp them to the current this.min and this.max
    // Not sure if we should log a warning when clamping values
    this.valueMin = Math.max(this.min, Math.min(min, this.max));
    this.valueMax = Math.max(this.min, Math.min(max, this.max));

    // Swap values if they seem in the wrong order, but not sure if I should
    // do this or just throw an exception :D
    if (this.valueMin > this.valueMax) {
      [this.valueMin, this.valueMax] = [this.valueMax, this.valueMin];
    }

    this.update();
    this.onChange(this.valueMin, this.valueMax);
  }

  /**
   * Returns the current slider handle values in an object.
   *
   * @returns Object containing the value of the left and right handles.
   */
  getValues() {
    return { min: this.valueMin, max: this.valueMax };
  }
}
