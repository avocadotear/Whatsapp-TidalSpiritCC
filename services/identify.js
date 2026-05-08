const config = require('../utils/config');

const mockSpecies = [
  { name: '花蛤', latin: 'Ruditapes philippinarum', edible: true, confidence: 95, desc: '常见的食用贝类，味道鲜美，适合炒、煮、烤等多种烹饪方式。', category: '贝类' },
  { name: '海蛎子', latin: 'Crassostrea gigas', edible: true, confidence: 92, desc: '牡蛎的一种，富含锌和蛋白质，生吃或烤着吃都很美味。', category: '贝类' },
  { name: '海星', latin: 'Asteroidea', edible: false, confidence: 88, desc: '棘皮动物，有五条腕足，不建议食用。可在潮间带礁石上发现。', category: '棘皮动物' },
  { name: '螃蟹', latin: 'Brachyura', edible: true, confidence: 90, desc: '赶海常见收获，大小不一。小型螃蟹可做汤，大型螃蟹蒸煮皆宜。', category: '甲壳类' },
  { name: '海螺', latin: 'Gastropoda', edible: true, confidence: 87, desc: '常见海产，种类繁多，多数可食用。注意避免有毒品种。', category: '腹足类' },
  { name: '海胆', latin: 'Echinoidea', edible: true, confidence: 85, desc: '棘皮动物，刺多，可食用部分为其卵巢（海胆黄），味道鲜美。', category: '棘皮动物' },
  { name: '海参', latin: 'Holothuroidea', edible: true, confidence: 82, desc: '名贵海产品，营养价值极高，需要加工后食用。', category: '棘皮动物' },
  { name: '皮皮虾', latin: 'Oratosquilla oratoria', edible: true, confidence: 93, desc: '口虾蛄，肉质鲜美弹牙，蒸煮后食用最佳。', category: '甲壳类' },
  { name: '石斑鱼', latin: 'Epinephelus', edible: true, confidence: 78, desc: '名贵海水鱼类，肉质细嫩，清蒸最能体现其鲜味。', category: '鱼类' },
  { name: '海葵', latin: 'Actiniaria', edible: false, confidence: 86, desc: '刺胞动物，触手有刺细胞，不建议食用。常附着在礁石上。', category: '刺胞动物' },
  { name: '蛏子', latin: 'Sinonovacula constricta', edible: true, confidence: 91, desc: '常见的赶海收获，在沙滩上挖掘。清蒸、爆炒都很美味。', category: '贝类' },
  { name: '扇贝', latin: 'Pectinidae', edible: true, confidence: 89, desc: '贝壳呈扇形，肉质鲜嫩，蒜蓉粉丝蒸是经典做法。', category: '贝类' }
];

function identifySpecies(imagePath) {
  return new Promise((resolve) => {
    if (config.identify.enabled && config.identify.apiKey) {
      wx.uploadFile({
        url: config.identify.baseUrl,
        filePath: imagePath,
        name: 'image',
        header: { 'Authorization': `Bearer ${config.identify.apiKey}` },
        success: (res) => {
          try {
            const data = JSON.parse(res.data);
            resolve({ success: true, data });
          } catch (e) {
            resolve(mockIdentify());
          }
        },
        fail: () => resolve(mockIdentify())
      });
    } else {
      setTimeout(() => resolve(mockIdentify()), 800);
    }
  });
}

function mockIdentify() {
  const species = mockSpecies[Math.floor(Math.random() * mockSpecies.length)];
  return {
    success: true,
    data: { ...species, confidence: species.confidence - Math.floor(Math.random() * 10) }
  };
}

function getHistory() {
  return wx.getStorageSync('identifyHistory') || [];
}

function saveHistory(item) {
  let history = getHistory();
  history.unshift({ ...item, timestamp: Date.now() });
  if (history.length > 50) history = history.slice(0, 50);
  wx.setStorageSync('identifyHistory', history);
}

function clearHistory() {
  wx.removeStorageSync('identifyHistory');
}

module.exports = { identifySpecies, getHistory, saveHistory, clearHistory };
