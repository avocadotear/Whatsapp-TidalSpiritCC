const { toLunar } = require('./date');

function seededRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function dateSeed(regionId, date) {
  const d = new Date(date);
  return regionId * 10000 + d.getFullYear() * 400 + (d.getMonth() + 1) * 32 + d.getDate();
}

function getTideForDate(regionId, date) {
  const d = new Date(date);
  const lunar = toLunar(d);
  const rng = seededRandom(dateSeed(regionId, date));

  const lunarDay = lunar.day;
  let baseAmplitude;
  if ([1, 2, 15, 16, 17, 29, 30].includes(lunarDay)) baseAmplitude = 2.5;
  else if ([3, 4, 13, 14, 18, 19, 28].includes(lunarDay)) baseAmplitude = 2.0;
  else if ([5, 6, 11, 12, 20, 21, 27].includes(lunarDay)) baseAmplitude = 1.5;
  else baseAmplitude = 1.0;

  const amplitude = baseAmplitude + (rng() - 0.5) * 0.4;
  const baseLine = 2.8 + (rng() - 0.5) * 0.6;

  const firstHighHour = 0 + rng() * 3;
  const tides = [];
  const interval = 6.2 + (rng() - 0.5) * 0.4;

  for (let i = 0; i < 4; i++) {
    const hour = firstHighHour + i * interval;
    if (hour >= 24) break;
    const isHigh = i % 2 === 0;
    const h = Math.floor(hour);
    const m = Math.round((hour - h) * 60);
    const height = isHigh
      ? baseLine + amplitude * (0.9 + rng() * 0.2)
      : baseLine - amplitude * (0.8 + rng() * 0.3);

    tides.push({
      time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
      height: Math.round(Math.max(0.1, height) * 10) / 10,
      type: isHigh ? 'high' : 'low'
    });
  }

  if (tides.length < 4) {
    const lastHour = parseFloat(tides[tides.length - 1].time.replace(':', '.'));
    const nextHour = lastHour + interval;
    if (nextHour < 24) {
      const isHigh = tides.length % 2 === 0;
      const h = Math.floor(nextHour);
      const m = Math.round((nextHour - h) * 60);
      tides.push({
        time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
        height: Math.round((isHigh ? baseLine + amplitude : baseLine - amplitude) * 10) / 10,
        type: isHigh ? 'high' : 'low'
      });
    }
  }

  return tides;
}

function getTideForMonth(regionId, year, month) {
  const result = {};
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    result[day] = {
      tides: getTideForDate(regionId, date),
      attribute: getTideAttribute(date)
    };
  }
  return result;
}

function getMoonPhase(date) {
  const lunar = toLunar(date);
  const day = lunar.day;
  if (day <= 2 || day >= 29) return { phase: '新月', icon: '🌑', value: 0 };
  if (day <= 7) return { phase: '上弦月', icon: '🌓', value: 0.25 };
  if (day <= 9) return { phase: '盈凸月', icon: '🌔', value: 0.4 };
  if (day <= 17) return { phase: '满月', icon: '🌕', value: 0.5 };
  if (day <= 21) return { phase: '亏凸月', icon: '🌖', value: 0.6 };
  if (day <= 24) return { phase: '下弦月', icon: '🌗', value: 0.75 };
  return { phase: '残月', icon: '🌘', value: 0.9 };
}

function getTideAttribute(date) {
  const lunar = toLunar(date);
  const day = lunar.day;
  let tideType, tidePeriod;

  if ([1, 2, 15, 16, 17, 29, 30].includes(day)) {
    tideType = '大潮';
    tidePeriod = '活汛';
  } else if ([3, 4, 13, 14, 18, 19, 28].includes(day)) {
    tideType = '中潮';
    tidePeriod = '活汛';
  } else if ([5, 6, 11, 12, 20, 21, 27].includes(day)) {
    tideType = '小潮';
    tidePeriod = '死汛';
  } else {
    tideType = '微潮';
    tidePeriod = '死汛';
  }

  return { tideType, tidePeriod, lunarDay: day, dayStr: lunar.dayStr };
}

function getTidePeriods(tides) {
  if (!tides || tides.length < 2) return [];
  const periods = [];
  for (let i = 0; i < tides.length - 1; i++) {
    const curr = tides[i];
    const next = tides[i + 1];
    periods.push({
      start: curr.time,
      end: next.time,
      status: curr.type === 'low' ? '涨潮' : '退潮',
      startHeight: curr.height,
      endHeight: next.height,
      change: Math.round(Math.abs(next.height - curr.height) * 10) / 10
    });
  }
  return periods;
}

function getHighLowSummary(tides) {
  const highs = tides.filter(t => t.type === 'high');
  const lows = tides.filter(t => t.type === 'low');
  return {
    highs: highs.map(t => ({ time: t.time, height: t.height, label: '满潮' })),
    lows: lows.map(t => ({ time: t.time, height: t.height, label: '干潮' }))
  };
}

function getBestBeachcombingTime(tides) {
  const lows = tides.filter(t => t.type === 'low');
  return lows.map(low => {
    const [h, m] = low.time.split(':').map(Number);
    const startMin = Math.max(0, h * 60 + m - 90);
    const endMin = Math.min(1440, h * 60 + m + 90);
    return {
      start: `${String(Math.floor(startMin / 60)).padStart(2, '0')}:${String(startMin % 60).padStart(2, '0')}`,
      end: `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`,
      lowPoint: low
    };
  });
}

function getBestFishingTime(tides) {
  const results = [];
  for (let i = 0; i < tides.length - 1; i++) {
    const curr = tides[i];
    const next = tides[i + 1];
    const [h1, m1] = curr.time.split(':').map(Number);
    const [h2, m2] = next.time.split(':').map(Number);
    const midMin = Math.floor(((h1 * 60 + m1) + (h2 * 60 + m2)) / 2);
    const startMin = Math.max(0, midMin - 60);
    const endMin = Math.min(1440, midMin + 60);
    results.push({
      start: `${String(Math.floor(startMin / 60)).padStart(2, '0')}:${String(startMin % 60).padStart(2, '0')}`,
      end: `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`,
      highPoint: curr.type === 'high' ? curr : next
    });
  }
  return results;
}

function getRecommendations(regionId, date, mode) {
  const tides = getTideForDate(regionId, date);
  const attr = getTideAttribute(date);
  const windows = mode === 'fishing' ? getBestFishingTime(tides) : getBestBeachcombingTime(tides);
  const rng = seededRandom(dateSeed(regionId, date) + (mode === 'fishing' ? 1000 : 0));

  let baseScore;
  if (attr.tideType === '大潮') baseScore = 85;
  else if (attr.tideType === '中潮') baseScore = 70;
  else if (attr.tideType === '小潮') baseScore = 50;
  else baseScore = 30;

  return windows.map((w, index) => {
    const variance = Math.floor((rng() - 0.5) * 20);
    const score = Math.min(99, Math.max(1, baseScore + variance));
    let rating;
    if (score >= 80) rating = '优';
    else if (score >= 60) rating = '好';
    else if (score >= 40) rating = '一般';
    else rating = '差';

    return {
      index: index + 1,
      start: w.start,
      end: w.end,
      score,
      rating,
      ratingClass: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'normal' : 'bad',
      lowPoint: w.lowPoint || null,
      highPoint: w.highPoint || null
    };
  });
}

function getFlowSpeedData(tides) {
  const data = [];
  for (let minute = 0; minute < 1440; minute += 10) {
    const hour = minute / 60;
    let speed = 0;
    for (let i = 0; i < tides.length; i++) {
      const [h, m] = tides[i].time.split(':').map(Number);
      const tideHour = h + m / 60;
      const dist = Math.abs(hour - tideHour);
      if (dist < 3) {
        const factor = tides[i].type === 'high' ? 0.3 : 0.5;
        speed += factor * Math.cos((dist / 3) * Math.PI) * tides[i].height * 0.15;
      }
    }
    data.push({
      time: `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`,
      speed: Math.round(Math.abs(speed) * 100) / 100
    });
  }
  return data;
}

function getEnvironmentalData(regionId, date) {
  const rng = seededRandom(dateSeed(regionId, date) + 5000);
  const d = new Date(date);
  const month = d.getMonth() + 1;
  const baseTemp = month >= 5 && month <= 9 ? 25 : month >= 3 && month <= 11 ? 18 : 10;

  const sunrise = getSunriseSunset(24.48, 118.09, date);

  return {
    sunrise: sunrise.sunrise,
    sunset: sunrise.sunset,
    airTemp: Math.round((baseTemp + (rng() - 0.5) * 8) * 10) / 10,
    waterTemp: Math.round((baseTemp - 2 + (rng() - 0.5) * 4) * 10) / 10,
    humidity: Math.round(65 + rng() * 25),
    pressure: Math.round(1010 + (rng() - 0.5) * 10),
    radiation: `Max ${Math.round(800 + rng() * 400)}`,
    visibility: `${Math.round(5 + rng() * 20)}km`,
    waveHeight: `${Math.round((0.1 + rng() * 0.5) * 10) / 10}m`,
    windLevel: `${Math.round(2 + rng() * 4)}级`,
    windSpeed: `${Math.round((3 + rng() * 12) * 10) / 10}km/h`
  };
}

function getSunriseSunset(lat, lng, date) {
  const d = new Date(date);
  const dayOfYear = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
  const declination = 23.45 * Math.sin((2 * Math.PI / 365) * (dayOfYear - 81));
  const latRad = lat * Math.PI / 180;
  const decRad = declination * Math.PI / 180;
  const hourAngle = Math.acos(-Math.tan(latRad) * Math.tan(decRad));
  const hourAngleDeg = hourAngle * 180 / Math.PI;

  const noon = 12 - lng / 15 + 8;
  const sunriseHour = noon - hourAngleDeg / 15;
  const sunsetHour = noon + hourAngleDeg / 15;

  const toTimeStr = (h) => {
    const hours = Math.floor(h);
    const minutes = Math.round((h - hours) * 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  return { sunrise: toTimeStr(sunriseHour), sunset: toTimeStr(sunsetHour) };
}

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function generateTideCurve(tides, sunrise, sunset) {
  const points = [];
  const sunriseMin = timeToMinutes(sunrise);
  const sunsetMin = timeToMinutes(sunset);

  for (let minute = 0; minute < 1440; minute += 10) {
    let height = 2.5;
    for (const tide of tides) {
      const tideMin = timeToMinutes(tide.time);
      const dist = (minute - tideMin) / 60;
      const amplitude = tide.type === 'high' ? tide.height - 2.5 : 2.5 - tide.height;
      height += amplitude * Math.exp(-dist * dist / 4) * (tide.type === 'high' ? 1 : -1);
    }
    points.push({
      minute,
      time: `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`,
      height: Math.round(Math.max(0, height) * 100) / 100,
      isDaytime: minute >= sunriseMin && minute <= sunsetMin
    });
  }
  return points;
}

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

module.exports = {
  getTideForDate,
  getTideForMonth,
  getMoonPhase,
  getTideAttribute,
  getTidePeriods,
  getHighLowSummary,
  getBestBeachcombingTime,
  getBestFishingTime,
  getRecommendations,
  getFlowSpeedData,
  getEnvironmentalData,
  getSunriseSunset,
  getDistance,
  generateTideCurve,
  timeToMinutes
};
