Component({
  properties: {
    region: { type: Object, value: {} },
    tideInfo: { type: Object, value: {} },
    mode: { type: String, value: 'beachcombing' },
    selectedDate: { type: String, value: '' }
  },
  methods: {
    onTapReport() {
      wx.navigateTo({
        url: `/pages/region-detail/region-detail?id=${this.data.region.id}`
      });
    },
    onTapCard() {
      wx.navigateTo({
        url: `/pages/region-detail/region-detail?id=${this.data.region.id}`
      });
    }
  }
});
