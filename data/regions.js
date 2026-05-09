const regions = [
  // 福建 - 原有区域（已关联真实站点）
  { id: 1, name: '石井', city: '南安市', district: '石井镇', province: '福建', lat: 24.5903, lng: 118.3412, type: 'both', desc: '闽南热门赶海点，滩涂广阔，适合捡螺挖蛤', stationId: '572' },
  { id: 2, name: '集美', city: '厦门市', district: '集美区', province: '福建', lat: 24.5736, lng: 118.1008, type: 'both', desc: '厦门北岸赶海胜地，海鲜丰富', stationId: '1372' },
  { id: 3, name: '一国两制', city: '厦门市', district: '海沧区', province: '福建', lat: 24.4569, lng: 118.0156, type: 'both', desc: '厦门经典赶海点，礁石区域丰富', stationId: '1371' },
  { id: 4, name: '后渚', city: '泉州市', district: '洛江区', province: '福建', lat: 24.9127, lng: 118.6834, type: 'both', desc: '泉州湾赶海点，盛产花蛤', stationId: '561' },
  { id: 5, name: '围头', city: '晋江市', district: '金井镇', province: '福建', lat: 24.4238, lng: 118.5672, type: 'both', desc: '围头湾赶海钓鱼两相宜', stationId: '570' },
  { id: 6, name: '金门头', city: '厦门市', district: '翔安区', province: '福建', lat: 24.5121, lng: 118.2547, type: 'fishing', desc: '面朝金门，钓鱼好去处', stationId: '577' },
  { id: 7, name: '石码', city: '龙海市', district: '石码镇', province: '福建', lat: 24.4492, lng: 117.8167, type: 'both', desc: '九龙江入海口，海产丰富', stationId: '580' },
  { id: 8, name: '东山岛', city: '漳州市', district: '东山县', province: '福建', lat: 23.7012, lng: 117.4293, type: 'both', desc: '福建最美海岛之一，赶海天堂', stationId: '589' },

  // 福建 - 新增真实站点
  { id: 21, name: '沙埕港', city: '福鼎市', district: '沙埕镇', province: '福建', lat: 27.1867, lng: 120.4382, type: 'both', desc: '闽东北天然良港，滩涂赶海资源丰富', stationId: '506' },
  { id: 22, name: '三沙', city: '霞浦县', district: '三沙镇', province: '福建', lat: 26.9203, lng: 120.1834, type: 'both', desc: '霞浦滩涂摄影圣地，赶海拾贝好去处', stationId: '508' },
  { id: 23, name: '赛岐', city: '福安市', district: '赛岐镇', province: '福建', lat: 26.9612, lng: 119.6534, type: 'both', desc: '三都澳畔赶海点，海产品种丰富', stationId: '510' },
  { id: 24, name: '黄岐', city: '连江县', district: '黄岐镇', province: '福建', lat: 26.3312, lng: 119.8456, type: 'both', desc: '马祖列岛对岸，礁石赶海胜地', stationId: '521' },
  { id: 25, name: '崇武', city: '惠安县', district: '崇武镇', province: '福建', lat: 24.8812, lng: 118.9134, type: 'both', desc: '崇武古城海岸，半月湾赶海', stationId: '558' },
  { id: 26, name: '深沪港', city: '晋江市', district: '深沪镇', province: '福建', lat: 24.6212, lng: 118.6656, type: 'fishing', desc: '深沪湾渔港，海钓天堂', stationId: '566' },
  { id: 27, name: '厦门港', city: '厦门市', district: '思明区', province: '福建', lat: 24.4812, lng: 118.0734, type: 'both', desc: '厦门本岛周边赶海，交通便利', stationId: '574' },
  { id: 28, name: '白屿', city: '漳浦县', district: '古雷镇', province: '福建', lat: 23.8312, lng: 117.6134, type: 'both', desc: '漳浦沿海赶海点，贝壳丰富', stationId: '582' },
  { id: 29, name: '将军澳', city: '漳浦县', district: '六鳌镇', province: '福建', lat: 23.9212, lng: 117.7234, type: 'both', desc: '六鳌半岛赶海，紫菜养殖基地', stationId: '586' },
  { id: 30, name: '平潭', city: '福州市', district: '平潭县', province: '福建', lat: 25.5012, lng: 119.7912, type: 'both', desc: '平潭岛赶海天堂，蓝眼泪观赏地', stationId: '545' },
  { id: 31, name: '平海湾', city: '莆田市', district: '秀屿区', province: '福建', lat: 25.2312, lng: 119.0834, type: 'both', desc: '莆田平海湾滩涂赶海', stationId: '1331' },
  { id: 32, name: '马尾港', city: '福州市', district: '马尾区', province: '福建', lat: 25.9812, lng: 119.4534, type: 'fishing', desc: '闽江入海口，江海交汇钓点', stationId: '533' },
  { id: 33, name: '西洋岛', city: '宁德市', district: '霞浦县', province: '福建', lat: 26.5612, lng: 120.2134, type: 'both', desc: '宁德外海岛屿赶海，海产丰富', stationId: '515' },
  { id: 34, name: '官前湾', city: '漳州市', district: '龙海区', province: '福建', lat: 24.3512, lng: 117.9534, type: 'both', desc: '漳州沿海赶海点，适合亲子', stationId: '1220' },

  // 河北（无真实数据，回退算法）
  { id: 9, name: '南戴河', city: '秦皇岛市', district: '抚宁区', province: '河北', lat: 39.7956, lng: 119.4742, type: 'both', desc: '北方赶海胜地，滩涂平坦' },
  { id: 10, name: '月坨岛', city: '唐山市', district: '乐亭县', province: '河北', lat: 39.1234, lng: 119.0876, type: 'beachcombing', desc: '渤海湾赶海点，盛产皮皮虾' },

  // 山东（无真实数据，回退算法）
  { id: 11, name: '金沙滩', city: '青岛市', district: '黄岛区', province: '山东', lat: 35.9423, lng: 120.1867, type: 'both', desc: '青岛著名海滩，赶海挖蛤好去处' },
  { id: 12, name: '红岛', city: '青岛市', district: '城阳区', province: '山东', lat: 36.1856, lng: 120.2534, type: 'both', desc: '胶州湾赶海点，蛤蜊之乡' },
  { id: 13, name: '养马岛', city: '烟台市', district: '牟平区', province: '山东', lat: 37.4512, lng: 121.5934, type: 'both', desc: '黄海赶海点，海参鲍鱼产地' },

  // 浙江（无真实数据，回退算法）
  { id: 14, name: '嵊泗列岛', city: '舟山市', district: '嵊泗县', province: '浙江', lat: 30.7262, lng: 122.4512, type: 'fishing', desc: '东海渔场，海钓天堂' },
  { id: 15, name: '南麂岛', city: '温州市', district: '平阳县', province: '浙江', lat: 27.4634, lng: 121.0789, type: 'both', desc: '国家级海洋自然保护区，物种丰富' },

  // 广西（无真实数据，回退算法）
  { id: 16, name: '涠洲岛', city: '北海市', district: '海城区', province: '广西', lat: 21.0434, lng: 109.1156, type: 'both', desc: '中国最年轻火山岛，赶海圣地' },

  // 广东（无真实数据，回退算法）
  { id: 17, name: '深汕特别区', city: '深圳市', district: '深汕区', province: '广东', lat: 22.8712, lng: 115.3456, type: 'both', desc: '深圳东部赶海点，交通便利' },
  { id: 19, name: '特军澳', city: '汕尾市', district: '城区', province: '广东', lat: 22.7523, lng: 115.3678, type: 'both', desc: '粤东赶海点，海鲜品种多' },

  // 山东（无真实数据，回退算法）
  { id: 18, name: '棹（zhào）岛', city: '烟台市', district: '长岛县', province: '山东', lat: 37.9234, lng: 120.7456, type: 'fishing', desc: '渤海深处的钓鱼乐园' },

  // 海南（无真实数据，回退算法）
  { id: 20, name: '秀英港', city: '海口市', district: '秀英区', province: '海南', lat: 20.0234, lng: 110.2876, type: 'both', desc: '海南赶海点，热带海产丰富' }
];

module.exports = {
  regions
};
