import ListWrapper from './h5peditor-list-wrapper.js';
import WeightsMatrix from './h5peditor-weights-matrix.js';
import './h5peditor-weights.scss';

const DECIMAL_PRECISION = 1000;

export default class Weights {

  /**
   * @class
   * @param {object} parent Parent element in semantics.
   * @param {object} field Semantics field properties.
   * @param {object} params Parameters entered in editor form.
   * @param {function} setValue Callback to set parameters.
   */
  constructor(parent, field, params, setValue) {
    this.parent = parent;
    this.field = field;
    this.params = params;

    this.setValue = setValue;

    // Callbacks to call when parameters change
    this.changes = [];

    // Let parent handle ready callbacks of children
    this.passReadies = true;

    this.$container = H5P.jQuery('<div>', { class: 'h5peditor-choice-explorer-weights' });

    const matrixUUID = H5P.createUUID();
    this.dom = this.buildDOM(matrixUUID);

    this.matrix = new WeightsMatrix(
      {
        uuid: matrixUUID,
        decimalPrecision: DECIMAL_PRECISION,
        dictionary: this.dictionary
      },
      {
        onUpdated: () => {
          this.updateValues();
        }
      }
    );
    this.dom.append(this.matrix.getDOM());

    this.fieldInstance = new H5PEditor.widgets[this.field.type](this.parent, this.field, this.params, this.setValue);

    if (this.fieldInstance.changes) {
      this.fieldInstance.changes.push(() => {
        this.handleFieldChange();
      });
    }

    this.$errors = this.$container.get(0).querySelector('.h5p-errors');

    this.parent.ready(() => {
      this.decisionsList = new ListWrapper(
        H5PEditor.findField('decisions', this.parent),
        {
          onChanged: () => {
            window.requestAnimationFrame(() => {
              this.matrix.update(this.params, this.decisionsList.getValue(), this.targetsList.getValue());
            });
          }
        }
      );
      if ((this.decisionsList.getValue() ?? []).length === 0) {
        this.decisionsList.addItem();
      }

      this.targetsList = new ListWrapper(
        H5PEditor.findField('targets', this.parent),
        {
          onChanged: () => {
            window.requestAnimationFrame(() => {
              this.matrix.update(this.params, this.decisionsList.getValue(), this.targetsList.getValue());
            });
          }
        }
      );
      if ((this.targetsList.getValue() ?? []).length === 0) {
        this.targetsList.list.addItem();
      }

      if (!this.params) {
        this.params = [
          {
            decisionId: this.decisionsList.getValue()[0].id,
            targets: [{ targetId: this.targetsList.getValue()[0].id, weight: 0 }]
          }
        ];
      }

      this.matrix.update(this.params, this.decisionsList.getValue(), this.targetsList.getValue());
    });
  }

  /**
   * Build the DOM structure.
   * @param {string} uuid UUID for the matrix.
   * @returns {HTMLDivElement} DOM element.
   */
  buildDOM(uuid) {
    const dom = this.$container.get(0);

    if (this.field.label) {
      const label = this.createLabel(uuid);
      dom.append(label);

      if (this.field.description) {
        const description = this.createDescription();
        dom.append(description);
      }
    }

    return dom;
  }

  /**
   * Create label element.
   * @param {string} matrixUUID UUID for the matrix.
   * @returns {HTMLLabelElement} Label element.
   */
  createLabel(matrixUUID) {
    const label = document.createElement('label');
    label.classList.add('h5peditor-label');
    label.setAttribute('for', matrixUUID);
    label.innerHTML = this.field.label;

    return label;
  }

  /**
   * Create description element.
   * @returns {HTMLDivElement} Description element.
   */
  createDescription() {
    const description = document.createElement('div');
    description.classList.add('h5peditor-field-description');
    description.innerHTML = this.field.description;

    return description;
  }

  /**
   * Append field to wrapper. Invoked by H5P core.
   * @param {H5P.jQuery} $wrapper Wrapper.
   */
  appendTo($wrapper) {
    $wrapper.get(0).append(this.$container.get(0));
  }

  /**
   * Validate current values. Invoked by H5P core.
   * @returns {boolean} True, if current value is valid, else false.
   */
  validate() {
    return this.matrix.isValid();
  }

  /**
   * Remove self. Invoked by H5P core.
   */
  remove() {
    this.$container.get(0).remove();
  }

  /**
   * Handle change of field.
   */
  handleFieldChange() {
    this.params = this.fieldInstance.params;
    this.changes.forEach((change) => {
      change(this.params);
    });
  }

  /**
   * Update values from fields and save them.
   */
  updateValues() {
    const newParams = this.matrix.getCellParams().map((params) => ({
      decisionId: params.decisionId,
      targets: params.targets.map((target) => ({
        targetId: target.targetId,
        weight: Math.round(parseFloat(target.field.value) * DECIMAL_PRECISION) / DECIMAL_PRECISION
      }))
    }));

    this.params = newParams;
    this.setValue(this.field, newParams);
  }
}
