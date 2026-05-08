Component({
  properties: {
    items: { type: Array, value: [] },
    current: { type: String, value: '' }
  },
  methods: {
    onTap(e) {
      const item = e.currentTarget.dataset.item;
      this.triggerEvent('select', { item });
    }
  }
});
