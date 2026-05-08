const tideCalc = require('../utils/tide-calc');

function getTideForRegion(regionId, date) {
  const tides = tideCalc.getTideForDate(regionId, date);
  const attribute = tideCalc.getTideAttribute(date);
  const moonPhase = tideCalc.getMoonPhase(date);
  const periods = tideCalc.getTidePeriods(tides);
  const summary = tideCalc.getHighLowSummary(tides);

  return { tides, attribute, moonPhase, periods, summary };
}

function getFullTideData(regionId, date, mode) {
  const basic = getTideForRegion(regionId, date);
  const recommendations = tideCalc.getRecommendations(regionId, date, mode || 'beachcombing');
  const flowSpeed = tideCalc.getFlowSpeedData(basic.tides);
  const environmental = tideCalc.getEnvironmentalData(regionId, date);
  const sunrise = tideCalc.getSunriseSunset(24.48, 118.09, date);
  const curve = tideCalc.generateTideCurve(basic.tides, sunrise.sunrise, sunrise.sunset);

  return {
    ...basic,
    recommendations,
    flowSpeed,
    environmental,
    sunrise: sunrise.sunrise,
    sunset: sunrise.sunset,
    curve
  };
}

function getMonthTides(regionId, year, month) {
  return tideCalc.getTideForMonth(regionId, year, month);
}

module.exports = { getTideForRegion, getFullTideData, getMonthTides };
