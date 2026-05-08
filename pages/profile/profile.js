const regionService = require('../../services/region');
const config = require('../../utils/config');

Page({
  data: {
    userInfo: null,
    userId: '',
    favorites: [],
    version: '1.0.0'
  },

  onLoad() {
    const userId = wx.getStorageSync('userId') || 'ID:' + Math.floor(Math.random() * 100000000);
    wx.setStorageSync('userId', userId);
    const userName = '游客_' + userId.slice(-5);
    this.setData({
      userId,
      userInfo: { nickName: userName },
      version: config.app.version
    });
  },

  onShow() {
    this.setData({ favorites: regionService.getFavoriteRegions() });
  },

  goToRegion(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/region-detail/region-detail?id=${id}`
    });
  },

  removeFavorite(e) {
    const id = e.currentTarget.dataset.id;
    regionService.toggleFavorite(id);
    this.setData({ favorites: regionService.getFavoriteRegions() });
    wx.showToast({ title: '已取消收藏', icon: 'success' });
  },

  openSettings() {
    wx.showActionSheet({
      itemList: ['清理缓存', '配置识别API'],
      success: (res) => {
        if (res.tapIndex === 0) this.clearCache();
        if (res.tapIndex === 1) this.configureApi();
      }
    });
  },

  clearCache() {
    wx.showModal({
      title: '清理缓存',
      content: '确定清理所有缓存数据？收藏和历史记录将被清除。',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync();
          this.setData({ favorites: [] });
          wx.showToast({ title: '缓存已清理', icon: 'success' });
        }
      }
    });
  },

  configureApi() {
    wx.showModal({
      title: '配置识别API',
      content: '当前识别功能使用Mock数据。如需接入真实API，请在 utils/config.js 中配置 identify.baseUrl 和 identify.apiKey。',
      showCancel: false
    });
  },

  showHelp() {
    wx.showModal({
      title: '潮汐表帮助文档',
      content: '1. 地区页：浏览全国赶海点，切换赶海/钓鱼模式\n2. 地图页：在地图上查看赶海点位置\n3. 潮历页：查看月度潮汐日历\n4. 鱼库页：拍照识别海洋物种\n5. 我的页：管理收藏和设置',
      showCancel: false
    });
  },

  showPrivacy() {
    wx.showModal({
      title: '隐私协议',
      content: '潮汐精灵尊重您的隐私。我们仅收集位置信息用于计算距离，所有数据存储在本地设备上。注：无需登录可使用。',
      showCancel: false
    });
  }
});
