App({
  globalData: {
    currentRegion: null,
    userLocation: null,
    userInfo: null
  },

  onLaunch() {
    this.getUserLocation();
  },

  getUserLocation() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.globalData.userLocation = {
          latitude: res.latitude,
          longitude: res.longitude
        };
      },
      fail: () => {
        this.globalData.userLocation = {
          latitude: 24.4798,
          longitude: 118.0894
        };
      }
    });
  }
});
