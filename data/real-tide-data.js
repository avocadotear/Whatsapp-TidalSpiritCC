const rawData = require('./fujian-tide-data');

const tideData = rawData.tide_data || [];
const stationList = rawData.metadata.all_stations_in_fujian || [];

// Build index: stationId -> dateStr -> record
const dataByStationAndDate = {};
tideData.forEach(record => {
  const sid = record.station_id;
  const qd = record.query_date;
  if (!dataByStationAndDate[sid]) dataByStationAndDate[sid] = {};
  dataByStationAndDate[sid][qd] = record;
});

function parseHeight(h) {
  const n = parseFloat(h);
  return isNaN(n) ? null : n;
}

function parseScore(s) {
  if (!s) return 0;
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function getRealTideData(stationId, date) {
  // Try multiple date formats
  const d = new Date(date);
  const formats = [
    `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`,
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  ];

  let record = null;
  const stationData = dataByStationAndDate[String(stationId)];
  if (stationData) {
    for (const fmt of formats) {
      if (stationData[fmt]) {
        record = stationData[fmt];
        break;
      }
    }
  }
  if (!record) return null;

  // Convert rise_tides / fall_tides to unified tides array
  const tides = [];

  // Each rise_tide: start→end is rising, end time = high tide peak
  (record.rise_tides || []).forEach(rt => {
    if (rt.end_time && rt.end_time !== '23:59') {
      const h = parseHeight(rt.height);
      if (h !== null) {
        tides.push({ time: rt.end_time, height: h, type: 'high' });
      }
    }
  });

  // Each fall_tide: start→end is falling, end time = low tide point
  (record.fall_tides || []).forEach(ft => {
    if (ft.end_time && ft.end_time !== '23:59' && ft.start_time !== '00:01') {
      const h = parseHeight(ft.height);
      if (h !== null) {
        tides.push({ time: ft.end_time, height: h, type: 'low' });
      }
    }
  });

  // Also add start points where meaningful
  (record.rise_tides || []).forEach(rt => {
    if (rt.start_time && rt.start_time !== '00:01') {
      const h = parseHeight(rt.height);
      // Rise start is typically low point
    }
  });

  (record.fall_tides || []).forEach(ft => {
    if (ft.start_time && ft.start_time !== '00:01' && ft.end_time !== '23:59') {
      const h = parseHeight(ft.height);
      if (h !== null) {
        tides.push({ time: ft.start_time, height: h, type: 'high' });
      }
    }
  });

  // Deduplicate by time and sort
  const seen = new Set();
  const uniqueTides = [];
  tides.forEach(t => {
    if (!seen.has(t.time)) {
      seen.add(t.time);
      uniqueTides.push(t);
    }
  });
  uniqueTides.sort((a, b) => {
    const [ah, am] = a.time.split(':').map(Number);
    const [bh, bm] = b.time.split(':').map(Number);
    return (ah * 60 + am) - (bh * 60 + bm);
  });

  // Build beach recommendations from real data
  const beachRecommendations = (record.beach_times || []).map((bt, idx) => {
    const score = parseScore(bt.score);
    let rating, ratingClass;
    if (score >= 67) { rating = '优'; ratingClass = 'excellent'; }
    else if (score >= 40) { rating = '好'; ratingClass = 'good'; }
    else if (score >= 20) { rating = '一般'; ratingClass = 'normal'; }
    else { rating = '差'; ratingClass = 'bad'; }

    return {
      index: idx + 1,
      start: bt.start_time,
      end: bt.end_time,
      score: Math.round(score),
      rating,
      ratingClass
    };
  });

  // Environmental data from real record
  const environmental = {
    airTemp: '--',
    waterTemp: record.water_temp ? `${record.water_temp}` : '--',
    humidity: '--',
    pressure: record.pressure || '--',
    radiation: '--',
    visibility: '--',
    waveHeight: record.wave_height ? `${record.wave_height}m` : '--',
    windLevel: record.wind_level || '--',
    windSpeed: record.wind_speed || '--'
  };

  return {
    tides: uniqueTides,
    attribute: {
      tideType: record.tide_condition || '中潮',
      tidePeriod: record.tide_condition === '大潮' ? '活汛' : '死汛',
      lunarDay: null,
      dayStr: record.lunar_date || ''
    },
    sunrise: record.sunrise || '06:00',
    sunset: record.sunset || '18:00',
    environmental,
    windDirection: record.wind_direction || '',
    windLevel: record.wind_level || '',
    windSpeed: record.wind_speed || '',
    waveHeight: record.wave_height || '',
    beachRecommendations,
    hasRealData: true
  };
}

function getAllStations() {
  return stationList.map(s => ({
    stationId: s.station_id,
    name: s.station_name,
    city: s.city,
    fullName: s.full_name,
    url: s.url
  }));
}

function getStationById(stationId) {
  return stationList.find(s => s.station_id === String(stationId));
}

function getAvailableDates(stationId) {
  const stationData = dataByStationAndDate[String(stationId)];
  return stationData ? Object.keys(stationData).sort() : [];
}

module.exports = {
  getRealTideData,
  getAllStations,
  getStationById,
  getAvailableDates
};
