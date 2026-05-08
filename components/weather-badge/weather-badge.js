Component({
  properties: {
    temperature: { type: Number, value: 0 },
    weather: { type: String, value: '晴' },
    humidity: { type: Number, value: 70 }
  },
  computed: {},
  methods: {},
  data: {
    weatherIcons: { '晴': '☀️', '多云': '⛅', '阴': '☁️', '雨': '🌧️', '雷阵雨': '⛈️' }
  }
});
