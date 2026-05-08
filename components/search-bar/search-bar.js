Component({
  properties: {
    placeholder: { type: String, value: '输入要查找地方（两边按钮确认）' }
  },
  data: {
    value: ''
  },
  methods: {
    onInput(e) {
      this.setData({ value: e.detail.value });
      this.triggerEvent('input', { value: e.detail.value });
    },
    onConfirm(e) {
      this.triggerEvent('search', { value: e.detail.value });
    },
    onClear() {
      this.setData({ value: '' });
      this.triggerEvent('search', { value: '' });
    }
  }
});
