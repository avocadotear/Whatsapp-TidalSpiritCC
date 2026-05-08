const identifyService = require('../../services/identify');

Page({
  data: {
    searchKeyword: '',
    result: null,
    imagePath: '',
    history: [],
    isIdentifying: false,
    showResult: false
  },

  onShow() {
    this.setData({ history: identifyService.getHistory() });
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const imagePath = res.tempFiles[0].tempFilePath;
        this.setData({ imagePath, isIdentifying: true, showResult: false });
        this.doIdentify(imagePath);
      }
    });
  },

  takePhoto() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      success: (res) => {
        const imagePath = res.tempFiles[0].tempFilePath;
        this.setData({ imagePath, isIdentifying: true, showResult: false });
        this.doIdentify(imagePath);
      }
    });
  },

  async doIdentify(imagePath) {
    try {
      const res = await identifyService.identifySpecies(imagePath);
      if (res.success) {
        this.setData({
          result: res.data,
          isIdentifying: false,
          showResult: true
        });
        identifyService.saveHistory({
          ...res.data,
          imagePath
        });
        this.setData({ history: identifyService.getHistory() });
      }
    } catch (e) {
      this.setData({ isIdentifying: false });
      wx.showToast({ title: '识别失败', icon: 'none' });
    }
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value });
  },

  searchByName() {
    const kw = this.data.searchKeyword;
    if (!kw) return;
    const history = identifyService.getHistory();
    const found = history.find(h => h.name.includes(kw));
    if (found) {
      this.setData({ result: found, showResult: true });
    } else {
      wx.showToast({ title: '未找到相关物种', icon: 'none' });
    }
  },

  viewHistoryItem(e) {
    const idx = e.currentTarget.dataset.index;
    const item = this.data.history[idx];
    this.setData({ result: item, showResult: true, imagePath: item.imagePath || '' });
  },

  clearHistory() {
    wx.showModal({
      title: '提示',
      content: '确定清空识别历史？',
      success: (res) => {
        if (res.confirm) {
          identifyService.clearHistory();
          this.setData({ history: [] });
          wx.showToast({ title: '已清空', icon: 'success' });
        }
      }
    });
  },

  closeResult() {
    this.setData({ showResult: false });
  }
});
