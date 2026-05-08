const regionService = require('../../services/region');
const tideService = require('../../services/tide');
const { getDistance } = require('../../utils/tide-calc');
const { formatDate } = require('../../utils/date');

Page({
  data: {
    latitude: 24.4798,
    longitude: 118.0894,
    scale: 10,
    markers: [],
    selectedRegion: null,
    selectedTide: null,
    showSatellite: false
  },

  onLoad() {
    this.loadMarkers();
  },

  onShow() {
    const app = getApp();
    if (app.globalData.userLocation) {
      this.setData({
        latitude: app.globalData.userLocation.latitude,
        longitude: app.globalData.userLocation.longitude
      });
    }
  },

  loadMarkers() {
    const regions = regionService.getAllRegions();
    const markers = regions.map(r => ({
      id: r.id,
      latitude: r.lat,
      longitude: r.lng,
      title: r.name,
      width: 30,
      height: 30,
      callout: {
        content: r.name,
        color: '#FFFFFF',
        bgColor: '#0D2B4E',
        padding: 8,
        borderRadius: 6,
        display: 'BYCLICK',
        fontSize: 13
      },
      iconPath: r.type === 'fishing' ? '/images/tabbar/map-active.png' : '/images/tabbar/region-active.png'
    }));

    this.setData({ markers });
  },

  onMarkerTap(e) {
    const markerId = e.detail.markerId || e.markerId;
    const region = regionService.getRegionById(markerId);
    if (!region) return;

    const app = getApp();
    let distance = null;
    if (app.globalData.userLocation) {
      distance = getDistance(app.globalData.userLocation.latitude, app.globalData.userLocation.longitude, region.lat, region.lng);
    }

    const today = new Date();
    const tideData = tideService.getTideForRegion(region.id, today);
    const dateStr = formatDate(today, 'yyyy-MM-dd');

    let tideTimeStr = '';
    if (tideData.tides.length >= 2) {
      const low = tideData.tides.find(t => t.type === 'low');
      const high = tideData.tides.find(t => t.type === 'high');
      if (low) tideTimeStr = `${low.time}点~`;
      if (high) tideTimeStr += `${high.time}点`;
    }

    this.setData({
      selectedRegion: { ...region, distance },
      selectedTide: {
        date: dateStr,
        tideTime: tideTimeStr,
        attribute: `${tideData.attribute.tideType}(${tideData.attribute.tidePeriod})`
      }
    });
  },

  viewRegionDetail() {
    if (!this.data.selectedRegion) return;
    wx.navigateTo({
      url: `/pages/region-detail/region-detail?id=${this.data.selectedRegion.id}`
    });
  },

  closePopup() {
    this.setData({ selectedRegion: null, selectedTide: null });
  },

  moveToLocation() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({
          latitude: res.latitude,
          longitude: res.longitude,
          scale: 12
        });
        getApp().globalData.userLocation = { latitude: res.latitude, longitude: res.longitude };
      }
    });
  },

  toggleSatellite() {
    this.setData({ showSatellite: !this.data.showSatellite });
  }
});
