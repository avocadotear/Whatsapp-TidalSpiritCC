const { toLunar, formatDate } = require('../../utils/date');
const { getTideAttribute } = require('../../utils/tide-calc');
const regionService = require('../../services/region');
const { getDistance } = require('../../utils/tide-calc');

Page({
  data: {
    year: 2026,
    month: 5,
    days: [],
    weekHeaders: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
    selectedDate: '',
    selectedAttr: null,
    nearbyRegions: [],
    tideExplain: ''
  },

  onLoad() {
    const today = new Date();
    this.setData({
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      selectedDate: formatDate(today, 'yyyy-MM-dd')
    });
    this.buildCalendar();
    this.loadNearbyRegions();
  },

  buildCalendar() {
    const { year, month } = this.data;
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = formatDate(new Date(), 'yyyy-MM-dd');

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push({ empty: true });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d);
      const dateStr = formatDate(date, 'yyyy-MM-dd');
      const lunar = toLunar(date);
      const attr = getTideAttribute(date);

      let attrClass = 'minor';
      if (attr.tideType === '大潮') attrClass = 'major';
      else if (attr.tideType === '中潮') attrClass = 'medium';
      else if (attr.tideType === '小潮') attrClass = 'small';

      days.push({
        day: d,
        dateStr,
        lunarDay: lunar.dayStr,
        attribute: `${attr.tideType}(${attr.tidePeriod})`,
        attrShort: attr.tideType,
        periodShort: attr.tidePeriod,
        attrClass,
        isToday: dateStr === today,
        isSelected: dateStr === this.data.selectedDate
      });
    }

    this.setData({ days });
  },

  onDayTap(e) {
    const dateStr = e.currentTarget.dataset.date;
    if (!dateStr) return;

    const date = new Date(dateStr);
    const attr = getTideAttribute(date);
    let explain = '';
    if (attr.tidePeriod === '活汛') {
      explain = '活汛期只是大潮小潮约又一种潮量区分方法';
    } else {
      explain = '死汛期潮差较小，赶海效果一般';
    }

    this.setData({
      selectedDate: dateStr,
      selectedAttr: attr,
      tideExplain: explain
    });
    this.buildCalendar();
  },

  prevMonth() {
    let { year, month } = this.data;
    month--;
    if (month < 1) { month = 12; year--; }
    this.setData({ year, month });
    this.buildCalendar();
  },

  nextMonth() {
    let { year, month } = this.data;
    month++;
    if (month > 12) { month = 1; year++; }
    this.setData({ year, month });
    this.buildCalendar();
  },

  goToday() {
    const today = new Date();
    this.setData({
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      selectedDate: formatDate(today, 'yyyy-MM-dd')
    });
    this.buildCalendar();
  },

  loadNearbyRegions() {
    const app = getApp();
    const loc = app.globalData.userLocation;
    let regions;
    if (loc) {
      regions = regionService.getRegionsWithDistance(loc.latitude, loc.longitude).slice(0, 8);
    } else {
      regions = regionService.getAllRegions().slice(0, 8).map(r => ({ ...r, distance: null }));
    }

    const favRegions = regionService.getFavoriteRegions();
    const allRegions = [...favRegions.map(r => ({ ...r, isFav: true })), ...regions.filter(r => !favRegions.find(f => f.id === r.id))];

    this.setData({ nearbyRegions: allRegions.slice(0, 10) });
  },

  goToRegion(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/region-detail/region-detail?id=${id}`
    });
  }
});
