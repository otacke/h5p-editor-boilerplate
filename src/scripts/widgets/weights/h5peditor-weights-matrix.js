import Util from '@services/util.js';
import './h5peditor-weights-matrix.scss';

export default class WeightsMatrix {
  constructor(params = {}, callbacks = {}) {
    this.params = Util.extend({
      uuid: '',
      decimal_precision: 1000
    }, params);

    this.callbacks = Util.extend({
      onUpdated: () => {}
    }, callbacks);

    this.cellParams = [];

    this.dom = document.createElement('div');
    this.dom.classList.add('h5peditor-choice-explorer-weights-matrix');
    this.dom.setAttribute('id', params.uuid);

    this.dom.addEventListener('keydown', () => {
      window.requestAnimationFrame(() => {
        this.callbacks.onUpdated();
      });
    });
  }

  getDOM() {
    return this.dom;
  }

  /**
   * Update.
   * @param {object[]} params Parameters.
   * @param {object[]} decisions Decisions.
   * @param {object[]} targets Targets.
   */
  update(params = [], decisions = [], targets = []) {
    this.dom.innerHTML = '';
    this.cellParams = [];

    this.setGridColumnsTemplate(Array(targets.length + 1).fill('1fr').join(' '));

    // Add top row
    this.dom.append(this.createLabel(''));
    targets.forEach((target) => {
      this.dom.append(this.createLabel(target.label));
    });

    // Add decision rows
    decisions.forEach((decision) => {
      this.dom.append(this.createLabel(decision.label));

      const weights = params.find((weight) => weight.decisionId === decision.id);
      targets.forEach((target) => {
        const field = this.createInputField(weights, target);
        this.dom.append(field);

        this.addCellParam(decision.id, target.id, field);
      });
    });

    this.callbacks.onUpdated();
  }

  setGridColumnsTemplate(template) {
    this.dom.style.setProperty('--template-columns', template);
  }

  /**
   * Create label element.
   * @param {string} text Label text.
   * @returns {HTMLLabelElement} Label element.
   */
  createLabel(text) {
    const label = document.createElement('div');
    label.classList.add('h5peditor-choice-explorer-weights-matrix-label');
    label.innerHTML = text ?? '';
    return label;
  }

  /**
   * Create input field for the matrix.
   * @param {object} weights Weights object.
   * @param {object} target Target object.
   * @returns {HTMLInputElement} Input field element.
   */
  createInputField(weights, target) {
    const field = document.createElement('input');
    field.classList.add('h5peditor-text', 'h5peditor-choice-explorer-weights-matrix-input');
    field.type = 'number';
    field.step = 1 / this.params.decimal_precision;
    field.value = weights?.targets?.find((weight) => weight.targetId === target.id)?.weight ?? 0;
    return field;
  }

  /**
   * Add cell parameter to cellParams.
   * @param {string} decisionId Decision ID.
   * @param {string} targetId Target ID.
   * @param {HTMLInputElement} field Input field element.
   */
  addCellParam(decisionId, targetId, field) {
    let decisionField = this.cellParams.find((param) => param.decisionId === decisionId);
    if (!decisionField) {
      decisionField = { decisionId, targets: [] };
      this.cellParams.push(decisionField);
    }
    decisionField.targets.push({ targetId, field });
  }

  /**
   * Get cell parameters.
   * @returns {object[]} Cell parameters structured to match semantics.
   */
  getCellParams() {
    return this.cellParams;
  }

  /**
   * Check whether the matrix fielrs are all valid.
   * @returns {boolean} True, if matrix is valid, else false.
   */
  isValid() {
    return this.cellParams.every((params) =>
      params.targets.every((target) => this.isFieldValid(target.field))
    );
  }

  /**
   * Check whether a weight field is valid.
   * @param {HTMLInputElement} field Input field.
   * @returns {boolean} True, if field is valid, else false.
   */
  isFieldValid(field) {
    const value = parseFloat(field?.value);
    const valueIsNumber = typeof value === 'number' && !isNaN(value);
    const valueMeetsPrecision =
      value === Math.round(value * this.params.decimal_precision) / this.params.decimal_precision;

    return valueIsNumber && valueMeetsPrecision;
  }
}
