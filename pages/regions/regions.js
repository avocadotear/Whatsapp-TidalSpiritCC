const regionService = require('../../services/region');
const tideService = require('../../services/tide');
const { formatDate } = require('../../utils/date');
const { getDistance, getTideAttribute, getRecommendations } = require('../../utils/tide-calc');

Page({
  data: {
    provinces: [],
    currentProvince: '附近',
    regions: [],
    mode: 'beachcombing',
    selectedDate: '',
    dates: [],
    searchKeyword: '',
    userLocation: null
  },

  onLoad() {
    const provinces = regionService.getProvinces();
    const today = new Date();
    const dates = this.generateDates(today);

    this.setData({
      provinces,
      selectedDate: formatDate(today, 'yyyy-MM-dd'),
      dates
    });
  },

  onShow() {
    const app = getApp();
    if (app.globalData.userLocation) {
      this.setData({ userLocation: app.globalData.userLocation });
      this.loadRegions();
    } else {
      this.loadRegions();
    }
  },

  generateDates(baseDate) {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + i);
      const attr = getTideAttribute(d);
      dates.push({
        date: formatDate(d, 'yyyy-MM-dd'),
        day: d.getDate(),
        weekDay: ['日', '一', '二', '三', '四', '五', '六'][d.getDay()],
        attribute: `${attr.tideType}(${attr.tidePeriod})`,
        isToday: i === 0
      });
    }
    return dates;
  },

  loadRegions() {
    const { currentProvince, userLocation, selectedDate, mode, searchKeyword } = this.data;
    let regions;

    if (searchKeyword) {
      regions = regionService.searchRegions(searchKeyword);
    } else if (currentProvince === '附近' && userLocation) {
      regions = regionService.getNearbyRegions(userLocation.latitude, userLocation.longitude, 100);
    } else if (currentProvince === '附近') {
      regions = regionService.getAllRegions();
    } else {
      regions = regionService.getRegionsByProvince(currentProvince);
    }

    if (userLocation) {
      regions = regions.map(r => ({
        ...r,
        distance: r.distance || getDistance(userLocation.latitude, userLocation.longitude, r.lat, r.lng)
      }));
    }

    const regionsWithTide = regions.map(r => {
      const tideData = tideService.getTideForRegion(r.id, new Date(selectedDate));
      const recs = getRecommendations(r.id, new Date(selectedDate), mode);
      const bestRec = recs.length > 0 ? recs.reduce((a, b) => a.score > b.score ? a : b) : null;

      let countdown = '';
      if (bestRec) {
        const now = new Date();
        const [bh, bm] = bestRec.start.split(':').map(Number);
        const target = new Date(selectedDate);
        target.setHours(bh, bm, 0);
        const diff = target - now;
        if (diff > 0) {
          const hours = Math.floor(diff / 3600000);
          countdown = `${hours}小时后`;
        }
      }

      return {
        ...r,
        tideInfo: {
          tides: tideData.tides,
          score: bestRec ? bestRec.score : 0,
          rating: bestRec ? bestRec.rating : '--',
          ratingClass: bestRec ? bestRec.ratingClass : 'normal',
          countdown
        }
      };
    });

    this.setData({ regions: regionsWithTide });
  },

  onSidebarSelect(e) {
    this.setData({ currentProvince: e.detail.item });
    this.loadRegions();
  },

  onSearch(e) {
    this.setData({ searchKeyword: e.detail.value });
    this.loadRegions();
  },

  onDateSelect(e) {
    const date = e.currentTarget.dataset.date;
    this.setData({ selectedDate: date });
    this.loadRegions();
  },

  toggleMode() {
    const mode = this.data.mode === 'beachcombing' ? 'fishing' : 'beachcombing';
    this.setData({ mode });
    this.loadRegions();
  },

  recalcDistance() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        const userLocation = { latitude: res.latitude, longitude: res.longitude };
        this.setData({ userLocation });
        getApp().globalData.userLocation = userLocation;
        this.loadRegions();
        wx.showToast({ title: '距离已更新', icon: 'success' });
      },
      fail: () => {
        wx.showToast({ title: '获取位置失败', icon: 'none' });
      }
    });
  }
});
