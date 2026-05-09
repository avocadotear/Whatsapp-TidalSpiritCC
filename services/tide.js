const tideCalc = require('../utils/tide-calc');
const realTideData = require('../data/real-tide-data');

function getTideForRegion(regionId, date) {
  const region = getRegionById(regionId);

  // Try real data first
  if (region && region.stationId) {
    const real = realTideData.getRealTideData(region.stationId, date);
    if (real) {
      const periods = tideCalc.getTidePeriods(real.tides);
      const summary = tideCalc.getHighLowSummary(real.tides);
      return {
        tides: real.tides,
        attribute: real.attribute,
        moonPhase: tideCalc.getMoonPhase(date),
        periods,
        summary
      };
    }
  }

  // Fallback to calculated data
  const tides = tideCalc.getTideForDate(regionId, date);
  const attribute = tideCalc.getTideAttribute(date);
  const moonPhase = tideCalc.getMoonPhase(date);
  const periods = tideCalc.getTidePeriods(tides);
  const summary = tideCalc.getHighLowSummary(tides);

  return { tides, attribute, moonPhase, periods, summary };
}

function getFullTideData(regionId, date, mode) {
  const region = getRegionById(regionId);

  // Try real data first
  if (region && region.stationId) {
    const real = realTideData.getRealTideData(region.stationId, date);
    if (real) {
      const periods = tideCalc.getTidePeriods(real.tides);
      const summary = tideCalc.getHighLowSummary(real.tides);
      const sunrise = real.sunrise;
      const sunset = real.sunset;
      const curve = tideCalc.generateTideCurve(real.tides, sunrise, sunset);
      const flowSpeed = tideCalc.getFlowSpeedData(real.tides);

      // Use real beach recommendations if available, otherwise calculate
      let recommendations;
      if (real.beachRecommendations && real.beachRecommendations.length > 0) {
        recommendations = real.beachRecommendations;
      } else {
        recommendations = tideCalc.getRecommendations(regionId, date, mode || 'beachcombing');
      }

      return {
        tides: real.tides,
        attribute: real.attribute,
        moonPhase: tideCalc.getMoonPhase(date),
        periods,
        summary,
        recommendations,
        flowSpeed,
        environmental: real.environmental,
        sunrise,
        sunset,
        curve,
        windDirection: real.windDirection,
        windLevel: real.windLevel,
        windSpeed: real.windSpeed,
        waveHeight: real.waveHeight,
        hasRealData: true
      };
    }
  }

  // Fallback to calculated data
  const basic = getTideForRegion(regionId, date);
  const recommendations = tideCalc.getRecommendations(regionId, date, mode || 'beachcombing');
  const flowSpeed = tideCalc.getFlowSpeedData(basic.tides);
  const environmental = tideCalc.getEnvironmentalData(regionId, date);
  const sunriseObj = tideCalc.getSunriseSunset(region ? region.lat : 24.48, region ? region.lng : 118.09, date);
  const curve = tideCalc.generateTideCurve(basic.tides, sunriseObj.sunrise, sunriseObj.sunset);

  return {
    ...basic,
    recommendations,
    flowSpeed,
    environmental,
    sunrise: sunriseObj.sunrise,
    sunset: sunriseObj.sunset,
    curve,
    windDirection: '',
    windLevel: '',
    windSpeed: '',
    waveHeight: '',
    hasRealData: false
  };
}

function getMonthTides(regionId, year, month) {
  return tideCalc.getTideForMonth(regionId, year, month);
}

function getRegionById(regionId) {
  const { regions } = require('../data/regions');
  return regions.find(r => r.id === regionId);
}

module.exports = { getTideForRegion, getFullTideData, getMonthTides };
