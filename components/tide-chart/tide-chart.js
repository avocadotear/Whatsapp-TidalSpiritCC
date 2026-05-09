Component({
  properties: {
    tides: { type: Array, value: [] },
    curve: { type: Array, value: [] },
    flowSpeed: { type: Array, value: [] },
    sunrise: { type: String, value: '06:00' },
    sunset: { type: String, value: '18:00' },
    mode: { type: String, value: 'beachcombing' },
    canvasId: { type: String, value: 'tideCanvas' },
    windDirection: { type: String, value: '' },
    windLevel: { type: String, value: '' },
    tideType: { type: String, value: '' }
  },

  data: {
    showTooltip: false,
    tooltipTime: '',
    tooltipHeight: '',
    tooltipTrend: '',
    tooltipAdvice: '',
    tooltipSeaState: '',
    tooltipStyle: ''
  },

  observers: {
    'curve, tides, mode'() {
      if (this.data.curve.length > 0) {
        this._updateMaxH();
        setTimeout(() => this.drawChart(), 100);
      }
    }
  },

  lifetimes: {
    ready() {
      this._breathPhase = 0;
      this._breathTimer = null;
      this._dragMinute = -1;
      this._hideTimer = null;
      this._canvasWidth = 0;
      this._canvasHeight = 0;
      this._cachedCanvas = null;
      this._cachedCtx = null;
      this._dpr = wx.getWindowInfo().pixelRatio;
      this._padding = { top: 30, right: 50, bottom: 30, left: 40 };
      this._maxH = 6;
      this._hasVibrated = false;

      this._updateMaxH();
      if (this.data.curve.length > 0) {
        setTimeout(() => {
          this._initCanvas();
          this._startBreathAnimation();
        }, 300);
      } else {
        this._startBreathAnimation();
      }
    },

    detached() {
      if (this._breathTimer) clearInterval(this._breathTimer);
      if (this._hideTimer) clearTimeout(this._hideTimer);
    }
  },

  methods: {
    _updateMaxH() {
      const curve = this.data.curve;
      if (!curve.length) { this._maxH = 6; return; }
      let maxVal = 0;
      for (const p of curve) {
        if (p.height > maxVal) maxVal = p.height;
      }
      const tides = this.data.tides;
      for (const t of tides) {
        if (t.height > maxVal) maxVal = t.height;
      }
      this._maxH = Math.ceil(maxVal + 0.5);
      if (this._maxH < 2) this._maxH = 2;
    },

    _initCanvas() {
      const query = this.createSelectorQuery();
      query.select('#tideCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res[0]) return;
          this._cachedCanvas = res[0].node;
          this._cachedCtx = this._cachedCanvas.getContext('2d');
          this._canvasWidth = res[0].width;
          this._canvasHeight = res[0].height;
          this._cachedCanvas.width = res[0].width * this._dpr;
          this._cachedCanvas.height = res[0].height * this._dpr;
          this.drawChart();
        });
    },

    _startBreathAnimation() {
      this._breathTimer = setInterval(() => {
        this._breathPhase += 0.05;
        if (this._breathPhase > Math.PI * 2) this._breathPhase -= Math.PI * 2;
        if (this._cachedCtx && this.data.curve.length > 0) {
          this.drawChart();
        }
      }, 80);
    },

    onTouchStart(e) {
      if (this._hideTimer) { clearTimeout(this._hideTimer); this._hideTimer = null; }
      if (e.touches.length !== 1) return;

      // Haptic feedback on first touch
      if (!this._hasVibrated) {
        this._hasVibrated = true;
        wx.vibrateShort({ type: 'light' });
      }

      const touchX = e.touches[0].x;
      this._updateDragAt(touchX);
      this.drawChart();
    },

    onTouchMove(e) {
      if (e.touches.length !== 1) return;
      this._updateDragAt(e.touches[0].x);
      this.drawChart();
    },

    onTouchEnd() {
      this._hideTimer = setTimeout(() => {
        this.setData({ showTooltip: false });
        this._dragMinute = -1;
        this.drawChart();
      }, 3000);
    },

    _updateDragAt(touchX) {
      const p = this._padding;
      const chartW = this._canvasWidth - p.left - p.right;
      if (chartW <= 0) return;

      const minute = Math.round(((touchX - p.left) / chartW) * 1440);
      if (minute < 0 || minute > 1440) return;
      this._dragMinute = minute;

      const { curve, tides } = this.data;
      if (!curve.length) return;

      let closest = curve[0];
      let minDist = Infinity;
      for (const pt of curve) {
        const d = Math.abs(pt.minute - minute);
        if (d < minDist) { minDist = d; closest = pt; }
      }

      // Trend
      const idx = curve.indexOf(closest);
      let trend = '平稳';
      if (idx > 0 && idx < curve.length - 1) {
        const diff = curve[idx + 1].height - curve[idx - 1].height;
        if (diff > 0.05) trend = '涨潮中';
        else if (diff < -0.05) trend = '退潮中';
      }

      // Next tide event
      let nextEvent = '';
      for (const t of tides) {
        const tMin = this.timeToMin(t.time);
        if (tMin >= closest.minute) {
          const label = t.type === 'high' ? '满潮' : '干潮';
          nextEvent = `${label} ${t.time} ${t.height}m`;
          break;
        }
      }

      // Advice
      let seaState, advice;
      if (closest.height < 1.5) {
        seaState = '潮位较低，滩涂露出';
        advice = trend.includes('退') ? '非常适合' : '适合';
      } else if (closest.height < 3) {
        seaState = '海面平稳';
        advice = '一般';
      } else {
        seaState = '潮位较高，注意安全';
        advice = '不建议';
      }

      // Tooltip position: flip based on which half of screen
      const midX = this._canvasWidth / 2;
      let tooltipStyle;
      if (touchX < midX) {
        tooltipStyle = `left: ${touchX + 20}px; right: auto;`;
      } else {
        tooltipStyle = `right: ${this._canvasWidth - touchX + 20}px; left: auto;`;
      }

      this.setData({
        showTooltip: true,
        tooltipTime: closest.time,
        tooltipHeight: closest.height.toFixed(1) + 'm',
        tooltipTrend: trend,
        tooltipAdvice: advice,
        tooltipSeaState: seaState + (nextEvent ? '  ' + nextEvent : ''),
        tooltipStyle
      });
    },

    drawChart() {
      const ctx = this._cachedCtx;
      if (!ctx) return;
      const w = this._canvasWidth;
      const h = this._canvasHeight;
      if (w <= 0 || h <= 0) return;

      ctx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);
      this.renderChart(ctx, w, h);
    },

    renderChart(ctx, w, h) {
      const { curve, tides, flowSpeed, sunrise, sunset, mode } = this.data;
      const padding = this._padding;
      const chartW = w - padding.left - padding.right;
      const chartH = h - padding.top - padding.bottom;
      const maxH = this._maxH;

      ctx.clearRect(0, 0, w, h);

      // Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#0A1628');
      bgGrad.addColorStop(0.5, '#0D1F35');
      bgGrad.addColorStop(1, '#0A1628');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      this.drawSeaFog(ctx, w, h);

      ctx.save();
      ctx.beginPath();
      ctx.rect(padding.left, 0, chartW, h);
      ctx.clip();

      const toX = (min) => padding.left + (min / 1440) * chartW;
      const toY = (val) => padding.top + (1 - val / maxH) * chartH;

      this.drawGrid(ctx, padding, chartW, chartH, maxH, toX, toY);
      this.drawDayNightFill(ctx, curve, sunrise, sunset, toX, toY, h, padding);
      this.drawTideCurve(ctx, curve, toX, toY);

      if (mode === 'fishing' && flowSpeed.length > 0) {
        this.drawFlowSpeed(ctx, flowSpeed, toX, padding, chartH);
      }

      this.drawPeakMarkers(ctx, tides, toX, toY);
      this.drawCurrentTimeGlow(ctx, curve, toX, toY, padding, h);

      if (this._dragMinute >= 0 && curve.length) {
        this.drawDragCrosshair(ctx, curve, toX, toY, padding, w, h);
      }

      ctx.restore();
      this.drawLegend(ctx, w, h, mode);
    },

    drawDragCrosshair(ctx, curve, toX, toY, padding, w, h) {
      const minute = this._dragMinute;

      let closest = curve[0];
      let minDist = Infinity;
      for (const p of curve) {
        const d = Math.abs(p.minute - minute);
        if (d < minDist) { minDist = d; closest = p; }
      }

      const x = toX(closest.minute);
      const y = toY(closest.height);

      // Vertical crosshair line
      ctx.strokeStyle = 'rgba(245, 166, 35, 0.6)';
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, h - padding.bottom);
      ctx.stroke();

      // Horizontal guide line — fixed: was using h instead of w
      ctx.strokeStyle = 'rgba(245, 166, 35, 0.3)';
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();

      // Glow dot on curve
      ctx.save();
      ctx.shadowColor = 'rgba(245, 166, 35, 0.9)';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#F5A623';
      ctx.fill();
      ctx.restore();

      // White border on dot
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Height + time label
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#F5A623';

      // Background pill for label (manual roundRect for compatibility)
      const label = `${closest.time}  ${closest.height.toFixed(1)}m`;
      const tw = ctx.measureText(label).width + 12;
      const lx = x - tw / 2;
      const ly = y - 30;

      ctx.fillStyle = 'rgba(10, 22, 40, 0.85)';
      this._roundRect(ctx, lx, ly, tw, 18, 4);
      ctx.fill();
      ctx.strokeStyle = 'rgba(245, 166, 35, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#F5A623';
      ctx.fillText(label, x, ly + 13);
      ctx.textAlign = 'start';
    },

    _roundRect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.arc(x + w - r, y + r, r, -Math.PI / 2, 0);
      ctx.lineTo(x + w, y + h - r);
      ctx.arc(x + w - r, y + h - r, r, 0, Math.PI / 2);
      ctx.lineTo(x + r, y + h);
      ctx.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
      ctx.lineTo(x, y + r);
      ctx.arc(x + r, y + r, r, Math.PI, Math.PI * 1.5);
      ctx.closePath();
    },

    drawSeaFog(ctx, w, h) {
      const breathAlpha = 0.03 + Math.sin(this._breathPhase) * 0.015;
      const fogGrad = ctx.createRadialGradient(w * 0.3, h * 0.5, 0, w * 0.3, h * 0.5, w * 0.6);
      fogGrad.addColorStop(0, `rgba(20, 60, 100, ${breathAlpha + 0.02})`);
      fogGrad.addColorStop(1, 'rgba(20, 60, 100, 0)');
      ctx.fillStyle = fogGrad;
      ctx.fillRect(0, 0, w, h);

      const fogGrad2 = ctx.createRadialGradient(w * 0.7, h * 0.4, 0, w * 0.7, h * 0.4, w * 0.5);
      fogGrad2.addColorStop(0, `rgba(15, 50, 80, ${breathAlpha + 0.01})`);
      fogGrad2.addColorStop(1, 'rgba(15, 50, 80, 0)');
      ctx.fillStyle = fogGrad2;
      ctx.fillRect(0, 0, w, h);
    },

    drawGrid(ctx, padding, chartW, chartH, maxH, toX, toY) {
      ctx.font = '10px sans-serif';

      for (let i = 0; i <= maxH; i++) {
        const y = toY(i);
        ctx.strokeStyle = 'rgba(139, 164, 184, 0.1)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartW, y);
        ctx.stroke();
        ctx.fillStyle = 'rgba(139, 164, 184, 0.6)';
        ctx.fillText(`${i}`, padding.left - 18, y + 4);
      }

      for (let hour = 0; hour <= 24; hour++) {
        const x = toX(hour * 60);
        const isMajor = hour % 3 === 0;
        ctx.strokeStyle = isMajor ? 'rgba(139, 164, 184, 0.15)' : 'rgba(139, 164, 184, 0.05)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, padding.top + chartH);
        ctx.stroke();
        if (isMajor) {
          ctx.fillStyle = 'rgba(139, 164, 184, 0.6)';
          ctx.fillText(`${hour}:00`, x - 12, padding.top + chartH + 16);
        }
      }
    },

    drawDayNightFill(ctx, curve, sunrise, sunset, toX, toY, h, padding) {
      const sunriseMin = this.timeToMin(sunrise);
      const sunsetMin = this.timeToMin(sunset);
      const dayCurve = curve.filter(p => p.minute >= sunriseMin && p.minute <= sunsetMin);
      const nightCurve1 = curve.filter(p => p.minute < sunriseMin);
      const nightCurve2 = curve.filter(p => p.minute > sunsetMin);

      if (dayCurve.length > 1) {
        const grad = ctx.createLinearGradient(0, toY(this._maxH), 0, toY(0));
        grad.addColorStop(0, 'rgba(45, 180, 140, 0.08)');
        grad.addColorStop(0.5, 'rgba(30, 120, 100, 0.12)');
        grad.addColorStop(1, 'rgba(20, 80, 70, 0.05)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(toX(dayCurve[0].minute), toY(0));
        dayCurve.forEach(p => ctx.lineTo(toX(p.minute), toY(p.height)));
        ctx.lineTo(toX(dayCurve[dayCurve.length - 1].minute), toY(0));
        ctx.closePath();
        ctx.fill();
      }

      const fillNight = (pts) => {
        if (pts.length < 2) return;
        ctx.fillStyle = 'rgba(10, 30, 55, 0.4)';
        ctx.beginPath();
        ctx.moveTo(toX(pts[0].minute), toY(0));
        pts.forEach(p => ctx.lineTo(toX(p.minute), toY(p.height)));
        ctx.lineTo(toX(pts[pts.length - 1].minute), toY(0));
        ctx.closePath();
        ctx.fill();
      };
      fillNight(nightCurve1);
      fillNight(nightCurve2);
    },

    drawTideCurve(ctx, curve, toX, toY) {
      if (curve.length < 2) return;
      const breathAlpha = 0.5 + Math.sin(this._breathPhase) * 0.15;

      // Fill area
      ctx.beginPath();
      ctx.moveTo(toX(curve[0].minute), toY(0));
      for (let i = 0; i < curve.length; i++) {
        ctx.lineTo(toX(curve[i].minute), toY(curve[i].height));
      }
      ctx.lineTo(toX(curve[curve.length - 1].minute), toY(0));
      ctx.closePath();

      const fillGrad = ctx.createLinearGradient(0, toY(this._maxH), 0, toY(0));
      fillGrad.addColorStop(0, `rgba(45, 200, 160, ${breathAlpha * 0.15})`);
      fillGrad.addColorStop(0.4, `rgba(30, 140, 120, ${breathAlpha * 0.1})`);
      fillGrad.addColorStop(1, 'rgba(20, 80, 70, 0.02)');
      ctx.fillStyle = fillGrad;
      ctx.fill();

      // Main stroke with glow
      ctx.save();
      ctx.shadowColor = `rgba(45, 200, 160, ${breathAlpha * 0.6})`;
      ctx.shadowBlur = 8 + Math.sin(this._breathPhase) * 3;

      const strokeGrad = ctx.createLinearGradient(
        toX(curve[0].minute), 0, toX(curve[curve.length - 1].minute), 0
      );
      strokeGrad.addColorStop(0, '#1A6B5A');
      strokeGrad.addColorStop(0.3, '#2D9B7F');
      strokeGrad.addColorStop(0.7, '#2D8B6F');
      strokeGrad.addColorStop(1, '#1A6B5A');

      ctx.strokeStyle = strokeGrad;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(toX(curve[0].minute), toY(curve[0].height));
      for (let i = 1; i < curve.length; i++) {
        const prev = curve[i - 1];
        const curr = curve[i];
        const cpx = (toX(prev.minute) + toX(curr.minute)) / 2;
        ctx.quadraticCurveTo(toX(prev.minute), toY(prev.height), cpx, (toY(prev.height) + toY(curr.height)) / 2);
      }
      ctx.lineTo(toX(curve[curve.length - 1].minute), toY(curve[curve.length - 1].height));
      ctx.stroke();
      ctx.restore();

      // Bloom/glow layer
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.strokeStyle = '#2D9B7F';
      ctx.lineWidth = 6;
      ctx.filter = 'blur(3px)';
      ctx.beginPath();
      ctx.moveTo(toX(curve[0].minute), toY(curve[0].height));
      for (let i = 1; i < curve.length; i++) {
        const prev = curve[i - 1];
        const curr = curve[i];
        const cpx = (toX(prev.minute) + toX(curr.minute)) / 2;
        ctx.quadraticCurveTo(toX(prev.minute), toY(prev.height), cpx, (toY(prev.height) + toY(curr.height)) / 2);
      }
      ctx.stroke();
      ctx.restore();
      ctx.filter = 'none';
    },

    drawFlowSpeed(ctx, flowSpeed, toX, padding, chartH) {
      const maxSpeed = Math.max(...flowSpeed.map(f => f.speed), 0.5);
      ctx.strokeStyle = '#E74C3C';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      flowSpeed.forEach((f, i) => {
        const x = toX(i * 10);
        const y = padding.top + chartH - (f.speed / maxSpeed) * chartH * 0.3;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    },

    drawPeakMarkers(ctx, tides, toX, toY) {
      tides.forEach(tide => {
        const min = this.timeToMin(tide.time);
        const x = toX(min);
        const y = toY(tide.height);

        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fillStyle = tide.type === 'high' ? 'rgba(231, 76, 60, 0.2)' : 'rgba(52, 152, 219, 0.2)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = tide.type === 'high' ? '#E74C3C' : '#3498DB';
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = '9px sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillText(`${tide.time} ${tide.height}m`, x - 20, tide.type === 'high' ? y - 12 : y + 16);
      });
    },

    drawCurrentTimeGlow(ctx, curve, toX, toY, padding, h) {
      const now = new Date();
      const currentMin = now.getHours() * 60 + now.getMinutes();

      let closest = null;
      let minDist = Infinity;
      for (const p of curve) {
        const d = Math.abs(p.minute - currentMin);
        if (d < minDist) { minDist = d; closest = p; }
      }
      if (!closest) return;

      const x = toX(closest.minute);
      const y = toY(closest.height);
      const breathVal = Math.sin(this._breathPhase);
      const breathScale = 1 + breathVal * 0.3;

      ctx.beginPath();
      ctx.arc(x, y, 18 * breathScale, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(45, 200, 160, 0.06)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, 12 * breathScale, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(45, 200, 160, 0.12)';
      ctx.fill();

      ctx.save();
      ctx.shadowColor = 'rgba(45, 220, 170, 0.8)';
      ctx.shadowBlur = 10 + breathVal * 4;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#2DD4AA';
      ctx.fill();
      ctx.restore();

      ctx.strokeStyle = 'rgba(45, 212, 170, 0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, h - padding.bottom);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = 'bold 9px sans-serif';
      ctx.fillStyle = '#2DD4AA';
      ctx.fillText('现在', x - 10, padding.top - 5);
    },

    drawLegend(ctx, w, h, mode) {
      const y = 12;
      ctx.font = '9px sans-serif';

      ctx.fillStyle = 'rgba(45, 139, 111, 0.4)';
      ctx.fillRect(10, y - 6, 12, 12);
      ctx.fillStyle = '#8BA4B8';
      ctx.fillText('白天', 25, y + 4);

      ctx.fillStyle = 'rgba(13, 43, 78, 0.8)';
      ctx.fillRect(60, y - 6, 12, 12);
      ctx.fillStyle = '#8BA4B8';
      ctx.fillText('夜间', 75, y + 4);

      if (mode === 'fishing') {
        ctx.strokeStyle = '#E74C3C';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(110, y);
        ctx.lineTo(122, y);
        ctx.stroke();
        ctx.fillStyle = '#8BA4B8';
        ctx.fillText('流速', 126, y + 4);
      }

      ctx.beginPath();
      ctx.arc(mode === 'fishing' ? 160 : 110, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#2DD4AA';
      ctx.fill();
      ctx.fillStyle = '#8BA4B8';
      ctx.fillText('现在', (mode === 'fishing' ? 168 : 118), y + 4);
    },

    timeToMin(str) {
      const [h, m] = str.split(':').map(Number);
      return h * 60 + m;
    }
  }
});
