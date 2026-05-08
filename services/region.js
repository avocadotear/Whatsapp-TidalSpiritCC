const { regions } = require('../data/regions');
const { getDistance } = require('../utils/tide-calc');

function getAllRegions() {
  return regions;
}

function getRegionById(id) {
  return regions.find(r => r.id === id) || null;
}

function searchRegions(keyword) {
  if (!keyword) return regions;
  const kw = keyword.toLowerCase();
  return regions.filter(r =>
    r.name.toLowerCase().includes(kw) ||
    r.city.toLowerCase().includes(kw) ||
    r.district.toLowerCase().includes(kw) ||
    r.province.toLowerCase().includes(kw)
  );
}

function getRegionsByProvince(province) {
  if (!province || province === '全部') return regions;
  if (province === '我的') return getFavoriteRegions();
  if (province === '常用') return regions.slice(0, 8);
  return regions.filter(r => r.province === province);
}

function getRegionsWithDistance(lat, lng) {
  return regions.map(r => ({
    ...r,
    distance: getDistance(lat, lng, r.lat, r.lng)
  })).sort((a, b) => a.distance - b.distance);
}

function getNearbyRegions(lat, lng, maxDistance) {
  maxDistance = maxDistance || 100;
  return getRegionsWithDistance(lat, lng).filter(r => r.distance <= maxDistance);
}

function getProvinces() {
  const provs = [...new Set(regions.map(r => r.province))];
  return ['我的', '常用', '附近', ...provs];
}

function toggleFavorite(regionId) {
  let favs = getFavoriteIds();
  const idx = favs.indexOf(regionId);
  if (idx >= 0) favs.splice(idx, 1);
  else favs.push(regionId);
  wx.setStorageSync('favoriteRegionIds', favs);
  return idx < 0;
}

function isFavorite(regionId) {
  return getFavoriteIds().includes(regionId);
}

function getFavoriteRegions() {
  const favIds = getFavoriteIds();
  return regions.filter(r => favIds.includes(r.id));
}

function getFavoriteIds() {
  return wx.getStorageSync('favoriteRegionIds') || [];
}

module.exports = {
  getAllRegions,
  getRegionById,
  searchRegions,
  getRegionsByProvince,
  getRegionsWithDistance,
  getNearbyRegions,
  getProvinces,
  toggleFavorite,
  isFavorite,
  getFavoriteRegions
};
