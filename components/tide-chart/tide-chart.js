Component({
  properties: {
    tides: { type: Array, value: [] },
    curve: { type: Array, value: [] },
    flowSpeed: { type: Array, value: [] },
    sunrise: { type: String, value: '06:00' },
    sunset: { type: String, value: '18:00' },
    mode: { type: String, value: 'beachcombing' },
    canvasId: { type: String, value: 'tideCanvas' }
  },

  observers: {
    'curve, tides, mode'() {
      if (this.data.curve.length > 0) {
        setTimeout(() => this.drawChart(), 100);
      }
    }
  },

  lifetimes: {
    ready() {
      if (this.data.curve.length > 0) {
        setTimeout(() => this.drawChart(), 300);
      }
    }
  },

  methods: {
    drawChart() {
      const query = this.createSelectorQuery();
      query.select('#tideCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res[0]) return;
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          const dpr = wx.getWindowInfo().pixelRatio;
          const width = res[0].width;
          const height = res[0].height;
          canvas.width = width * dpr;
          canvas.height = height * dpr;
          ctx.scale(dpr, dpr);

          this.renderChart(ctx, width, height);
        });
    },

    renderChart(ctx, w, h) {
      const { curve, tides, flowSpeed, sunrise, sunset, mode } = this.data;
      const padding = { top: 30, right: 50, bottom: 30, left: 40 };
      const chartW = w - padding.left - padding.right;
      const chartH = h - padding.top - padding.bottom;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#0A1628';
      ctx.fillRect(0, 0, w, h);

      const maxH = 6;
      const toX = (min) => padding.left + (min / 1440) * chartW;
      const toY = (val) => padding.top + (1 - val / maxH) * chartH;

      this.drawGrid(ctx, padding, chartW, chartH, maxH, toX, toY);
      this.drawDayNightFill(ctx, curve, sunrise, sunset, toX, toY, h, padding);
      this.drawTideCurve(ctx, curve, toX, toY);

      if (mode === 'fishing' && flowSpeed.length > 0) {
        this.drawFlowSpeed(ctx, flowSpeed, toX, padding, chartH);
      }

      this.drawPeakMarkers(ctx, tides, toX, toY);
      this.drawLegend(ctx, w, h, mode);
    },

    drawGrid(ctx, padding, chartW, chartH, maxH, toX, toY) {
      ctx.strokeStyle = 'rgba(139, 164, 184, 0.15)';
      ctx.lineWidth = 0.5;
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#8BA4B8';

      for (let i = 0; i <= maxH; i++) {
        const y = toY(i);
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartW, y);
        ctx.stroke();
        ctx.fillText(`${i}`, padding.left - 18, y + 4);
      }

      for (let hour = 0; hour <= 24; hour += 3) {
        const x = toX(hour * 60);
        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, padding.top + chartH);
        ctx.stroke();
        ctx.fillText(`${hour}:00`, x - 12, padding.top + chartH + 16);
      }
    },

    drawDayNightFill(ctx, curve, sunrise, sunset, toX, toY, h, padding) {
      const sunriseMin = this.timeToMin(sunrise);
      const sunsetMin = this.timeToMin(sunset);

      const dayCurve = curve.filter(p => p.minute >= sunriseMin && p.minute <= sunsetMin);
      const nightCurve1 = curve.filter(p => p.minute < sunriseMin);
      const nightCurve2 = curve.filter(p => p.minute > sunsetMin);

      if (dayCurve.length > 1) {
        ctx.fillStyle = 'rgba(45, 139, 111, 0.15)';
        ctx.beginPath();
        ctx.moveTo(toX(dayCurve[0].minute), toY(0));
        dayCurve.forEach(p => ctx.lineTo(toX(p.minute), toY(p.height)));
        ctx.lineTo(toX(dayCurve[dayCurve.length - 1].minute), toY(0));
        ctx.closePath();
        ctx.fill();
      }

      const fillNight = (pts) => {
        if (pts.length < 2) return;
        ctx.fillStyle = 'rgba(13, 43, 78, 0.6)';
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
      ctx.strokeStyle = '#2D8B6F';
      ctx.lineWidth = 2;
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
    },

    drawFlowSpeed(ctx, flowSpeed, toX, padding, chartH) {
      const maxSpeed = Math.max(...flowSpeed.map(f => f.speed), 0.5);
      ctx.strokeStyle = '#E74C3C';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      flowSpeed.forEach((f, i) => {
        const min = i * 10;
        const x = toX(min);
        const y = padding.top + chartH - (f.speed / maxSpeed) * chartH * 0.3;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
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
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = tide.type === 'high' ? '#E74C3C' : '#3498DB';
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.font = '9px sans-serif';
        ctx.fillStyle = '#FFFFFF';
        const label = `${tide.time} ${tide.height}m`;
        const textY = tide.type === 'high' ? y - 10 : y + 16;
        ctx.fillText(label, x - 20, textY);
      });
    },

    drawLegend(ctx, w, h, mode) {
      const y = 12;
      ctx.font = '9px sans-serif';

      ctx.fillStyle = 'rgba(45, 139, 111, 0.4)';
      ctx.fillRect(10, y - 6, 12, 12);
      ctx.fillStyle = '#8BA4B8';
      ctx.fillText('白天潮', 25, y + 4);

      ctx.fillStyle = 'rgba(13, 43, 78, 0.8)';
      ctx.fillRect(70, y - 6, 12, 12);
      ctx.fillStyle = '#8BA4B8';
      ctx.fillText('晚上汐', 85, y + 4);

      if (mode === 'fishing') {
        ctx.strokeStyle = '#E74C3C';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(130, y);
        ctx.lineTo(142, y);
        ctx.stroke();
        ctx.fillStyle = '#8BA4B8';
        ctx.fillText('流速', 146, y + 4);
      }

      ctx.beginPath();
      ctx.arc(mode === 'fishing' ? 180 : 130, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#9B59B6';
      ctx.fill();
      ctx.fillStyle = '#8BA4B8';
      ctx.fillText('赶海宜', (mode === 'fishing' ? 188 : 138), y + 4);
    },

    timeToMin(str) {
      const [h, m] = str.split(':').map(Number);
      return h * 60 + m;
    }
  }
});
