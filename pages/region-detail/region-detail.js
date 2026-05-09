const regionService = require('../../services/region');
const tideService = require('../../services/tide');
const { toLunar, formatDate } = require('../../utils/date');
const { getTideAttribute, getMoonPhase } = require('../../utils/tide-calc');

Page({
  data: {
    region: null,
    mode: 'beachcombing',
    selectedDate: '',
    lunar: {},
    attribute: {},
    moonPhase: {},
    tides: [],
    curve: [],
    flowSpeed: [],
    periods: [],
    summary: {},
    recommendations: [],
    environmental: {},
    sunrise: '',
    sunset: '',
    dates: [],
    isFavorite: false,
    showTideTable: false,
    hasRealData: false,
    windDirection: '',
    windLevel: '',
    waveHeight: ''
  },

  onLoad(options) {
    const regionId = parseInt(options.id);
    const region = regionService.getRegionById(regionId);
    if (!region) { wx.navigateBack(); return; }

    const today = new Date();
    const selectedDate = formatDate(today, 'yyyy-MM-dd');
    const dates = this.generateDates(today);
    const isFavorite = regionService.isFavorite(regionId);

    this.setData({ region, selectedDate, dates, isFavorite });
    wx.setNavigationBarTitle({ title: `${region.name}潮汐表` });
    this.loadTideData();
  },

  generateDates(baseDate) {
    const dates = [];
    for (let i = -1; i < 7; i++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + i);
      const attr = getTideAttribute(d);
      dates.push({
        date: formatDate(d, 'yyyy-MM-dd'),
        day: d.getDate(),
        attribute: `${attr.tideType}·${attr.tidePeriod}`,
        isToday: i === 0
      });
    }
    return dates;
  },

  loadTideData() {
    const { region, selectedDate, mode } = this.data;
    const date = new Date(selectedDate);
    const fullData = tideService.getFullTideData(region.id, date, mode);
    const lunar = toLunar(date);
    const moonPhase = getMoonPhase(date);

    this.setData({
      tides: fullData.tides,
      curve: fullData.curve,
      flowSpeed: fullData.flowSpeed,
      periods: fullData.periods,
      summary: fullData.summary,
      recommendations: fullData.recommendations,
      environmental: fullData.environmental,
      sunrise: fullData.sunrise,
      sunset: fullData.sunset,
      attribute: fullData.attribute,
      moonPhase,
      lunar,
      hasRealData: fullData.hasRealData,
      windDirection: fullData.windDirection || '',
      windLevel: fullData.windLevel || '',
      waveHeight: fullData.waveHeight || ''
    });
  },

  toggleMode() {
    const mode = this.data.mode === 'beachcombing' ? 'fishing' : 'beachcombing';
    this.setData({ mode });
    this.loadTideData();
  },

  onDateSelect(e) {
    const date = e.currentTarget.dataset.date;
    this.setData({ selectedDate: date });
    this.loadTideData();
  },

  prevDay() {
    const d = new Date(this.data.selectedDate);
    d.setDate(d.getDate() - 1);
    this.setData({ selectedDate: formatDate(d, 'yyyy-MM-dd') });
    this.loadTideData();
  },

  nextDay() {
    const d = new Date(this.data.selectedDate);
    d.setDate(d.getDate() + 1);
    this.setData({ selectedDate: formatDate(d, 'yyyy-MM-dd') });
    this.loadTideData();
  },

  toggleFavorite() {
    const isFavorite = regionService.toggleFavorite(this.data.region.id);
    this.setData({ isFavorite });
    wx.showToast({ title: isFavorite ? '已收藏' : '已取消收藏', icon: 'success' });
  },

  toggleTideTable() {
    this.setData({ showTideTable: !this.data.showTideTable });
  }
});
