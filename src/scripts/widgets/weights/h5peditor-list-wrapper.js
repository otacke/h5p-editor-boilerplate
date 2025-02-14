import Util from '@scripts/services/util.js';

export default class ListWrapper {

  /**
   * Unfortunately, H5P Group has been made aware of issues with their H5PEditor.List class years ago including
   * pull requests to fix the issues, but they have not addressed them. This class is a workaround to fix things
   * needed as a wrapper, but other things would need wrapping, too.
   * @class
   * @param {H5PEditor.List} list List to fix.
   * @param {object} [callbacks] Callbacks to call when the list changes.
   * @param {function} [callbacks.onChanged] Callback to call when the list changes.
   */
  constructor(list, callbacks = {}) {
    this.callbacks = Util.extend({
      onChanged: () => {}
    }, callbacks);

    this.list = list;
    this.lastListValue = this.list.getValue();

    this.dom = document.querySelector('label[for="' + this.list.getId() + '"]')?.parentElement;

    // This will fail if someone uses other list widgets with their own DOM structure.
    const domH5PEditorList = this.dom.querySelector(`#${this.list.getId()}`);
    const domH5PEditorVerticalTabs = this.dom.querySelector('.h5p-vtabs ol');
    (domH5PEditorList ?? domH5PEditorVerticalTabs)?.addEventListener('mouseup', (event) => {
      if (event.target.classList.contains('h5peditor-button') && event.target.classList.contains('remove')) {
        return;
      }

      this.handleChanged();
    });

    this.dom.addEventListener('change', (event) => {
      this.handleChanged();
    });

    this.list.on('addedItem', () => {
      this.handleChanged();
    });

    this.list.on('removedItem', () => {

      /*
       * Workaround for VerticalTabs allowing to remove all items even when a minimum value is set.
       * Pull request for VerticalTabs widget to fix this issue dates back to Nov 2022. Who
       * wants to bet when H5P Group will address this issue (HFP-3989, H5P-3599)?
       * @see {@link https://github.com/h5p/h5p-editor-vertical-tabs/pull/3}
       */
      if (this.list.field.min && (this.list.getValue() ?? []).length < this.list.field.min) {
        this.list.addItem();
        window.requestAnimationFrame(() => {
          const event = new KeyboardEvent('keypress', { keyCode: 32, which: 32, bubbles: true });
          domH5PEditorVerticalTabs?.querySelector('.h5p-vtab-a')?.dispatchEvent(event);
        });
      }

      this.handleChanged();
    });
  }

  /**
   * Handle list changed. Does not handle different types of changes differently. Callee will need to figure that out.
   */
  handleChanged() {
    const listValue = this.list.getValue();

    const listCountChanged = this.lastListValue?.length !== listValue?.length;
    const listOrderChanged = !listCountChanged && this.lastListValue?.some((item, index) => item !== listValue[index]);

    if (listCountChanged || listOrderChanged) {
      this.callbacks.onChanged(listValue);
    }

    this.lastListValue = listValue;
  }

  /**
   * Get values from list.
   * @returns {*[]|undefined} List values.
   */
  getValue() {
    return this.list.getValue();
  }
}
