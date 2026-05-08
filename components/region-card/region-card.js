Component({
  properties: {
    region: { type: Object, value: {} }
  },
  methods: {
    onTap() {
      wx.navigateTo({
        url: `/pages/region-detail/region-detail?id=${this.data.region.id}`
      });
    }
  }
});
