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
    tooltipSeaState: ''
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
      this._offsetX = 0;
      this._scaleX = 1;
      this._touchStartX = 0;
      this._touchStartY = 0;
      this._lastMoveX = 0;
      this._velocity = 0;
      this._isDragging = false;
      this._isPinching = false;
      this._pinchStartDist = 0;
      this._pinchStartScale = 1;
      this._longPressTimer = null;
      this._breathPhase = 0;
      this._breathTimer = null;
      this._animFrameId = null;

      if (this.data.curve.length > 0) {
        setTimeout(() => this.drawChart(), 300);
      }
      this._startBreathAnimation();
    },

    detached() {
      if (this._breathTimer) clearInterval(this._breathTimer);
      if (this._longPressTimer) clearTimeout(this._longPressTimer);
      if (this._animFrameId) cancelAnimationFrame(this._animFrameId);
    }
  },

  methods: {
    _startBreathAnimation() {
      this._breathTimer = setInterval(() => {
        this._breathPhase += 0.05;
        if (this._breathPhase > Math.PI * 2) this._breathPhase -= Math.PI * 2;
        if (this.data.curve.length > 0) {
          this.drawChart();
        }
      }, 80);
    },

    onTouchStart(e) {
      if (e.touches.length === 1) {
        this._touchStartX = e.touches[0].x;
        this._touchStartY = e.touches[0].y;
        this._lastMoveX = e.touches[0].x;
        this._isDragging = false;
        this._velocity = 0;

        this._longPressTimer = setTimeout(() => {
          this._showTooltipAt(this._touchStartX);
        }, 500);
      } else if (e.touches.length === 2) {
        clearTimeout(this._longPressTimer);
        this._isPinching = true;
        const dx = e.touches[1].x - e.touches[0].x;
        const dy = e.touches[1].y - e.touches[0].y;
        this._pinchStartDist = Math.sqrt(dx * dx + dy * dy);
        this._pinchStartScale = this._scaleX;
      }
    },

    onTouchMove(e) {
      if (e.touches.length === 1 && !this._isPinching) {
        const dx = e.touches[0].x - this._touchStartX;
        if (Math.abs(dx) > 5) {
          clearTimeout(this._longPressTimer);
          this._isDragging = true;
        }

        if (this._isDragging) {
          const moveX = e.touches[0].x - this._lastMoveX;
          this._velocity = moveX;
          this._offsetX += moveX;
          this._lastMoveX = e.touches[0].x;
          this._showTooltipAt(e.touches[0].x);
          this.drawChart();
        }
      } else if (e.touches.length === 2 && this._isPinching) {
        const dx = e.touches[1].x - e.touches[0].x;
        const dy = e.touches[1].y - e.touches[0].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const ratio = dist / this._pinchStartDist;
        this._scaleX = Math.max(1, Math.min(5, this._pinchStartScale * ratio));
        this.drawChart();
      }
    },

    onTouchEnd(e) {
      clearTimeout(this._longPressTimer);

      if (this._isDragging && !this._isPinching) {
        this._startInertia();
      }

      if (e.touches.length === 0) {
        this._isPinching = false;
        setTimeout(() => {
          this.setData({ showTooltip: false });
        }, 2000);
      }
    },

    _startInertia() {
      const decay = () => {
        if (Math.abs(this._velocity) < 0.5) return;
        this._offsetX += this._velocity;
        this._velocity *= 0.92;
        this.drawChart();
        this._animFrameId = requestAnimationFrame(decay);
      };
      this._animFrameId = requestAnimationFrame(decay);
    },

    _showTooltipAt(touchX) {
      const query = this.createSelectorQuery();
      query.select('#tideCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res[0]) return;
          const width = res[0].width;
          const padding = { left: 40, right: 50 };
          const chartW = width - padding.left - padding.right;

          const scaledW = chartW * this._scaleX;
          const adjustedX = touchX - padding.left - this._offsetX;
          const ratio = adjustedX / scaledW;
          const minute = Math.round(ratio * 1440);

          if (minute < 0 || minute > 1440) return;

          const { curve, tides } = this.data;
          // Find closest curve point
          let closest = curve[0];
          let minDist = Infinity;
          for (const p of curve) {
            const d = Math.abs(p.minute - minute);
            if (d < minDist) { minDist = d; closest = p; }
          }

          // Determine trend
          const idx = curve.indexOf(closest);
          let trend = '平稳';
          if (idx > 0 && idx < curve.length - 1) {
            const diff = curve[idx + 1].height - curve[idx - 1].height;
            if (diff > 0.05) trend = '正在涨潮';
            else if (diff < -0.05) trend = '正在退潮';
          }

          // Sea state analysis
          let seaState = '海面平稳';
          let advice = '一般';
          if (closest.height < 1.5) {
            seaState = '潮位较低，可前往滩涂区域';
            advice = trend === '正在退潮' ? '非常适合' : '适合';
          } else if (closest.height < 3) {
            seaState = '海面较平，注意潮位变化';
            advice = '一般';
          } else {
            seaState = '潮位较高，注意安全';
            advice = '不建议';
          }

          this.setData({
            showTooltip: true,
            tooltipTime: closest.time,
            tooltipHeight: closest.height.toFixed(1) + 'm',
            tooltipTrend: trend,
            tooltipAdvice: advice,
            tooltipSeaState: seaState
          });
        });
    },

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

      // Apply offset and scale
      const scaledW = chartW * this._scaleX;

      ctx.clearRect(0, 0, w, h);

      // Deep ocean background with gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#0A1628');
      bgGrad.addColorStop(0.5, '#0D1F35');
      bgGrad.addColorStop(1, '#0A1628');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Deep sea fog effect
      this.drawSeaFog(ctx, w, h);

      ctx.save();
      ctx.beginPath();
      ctx.rect(padding.left, 0, chartW, h);
      ctx.clip();

      const toX = (min) => padding.left + (min / 1440) * scaledW + this._offsetX;
      const maxH = 6;
      const toY = (val) => padding.top + (1 - val / maxH) * chartH;

      this.drawGrid(ctx, padding, scaledW, chartH, maxH, toX, toY, w);
      this.drawDayNightFill(ctx, curve, sunrise, sunset, toX, toY, h, padding);
      this.drawTideCurve(ctx, curve, toX, toY);

      if (mode === 'fishing' && flowSpeed.length > 0) {
        this.drawFlowSpeed(ctx, flowSpeed, toX, padding, chartH);
      }

      this.drawPeakMarkers(ctx, tides, toX, toY);
      this.drawCurrentTimeGlow(ctx, curve, toX, toY, padding, h);
      ctx.restore();

      this.drawLegend(ctx, w, h, mode);
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

    drawGrid(ctx, padding, chartW, chartH, maxH, toX, toY, totalW) {
      ctx.strokeStyle = 'rgba(139, 164, 184, 0.1)';
      ctx.lineWidth = 0.5;
      ctx.font = '10px sans-serif';
      ctx.fillStyle = 'rgba(139, 164, 184, 0.6)';

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
        if (x >= padding.left - 5 && x <= totalW - padding.right + 5) {
          ctx.beginPath();
          ctx.moveTo(x, padding.top);
          ctx.lineTo(x, padding.top + chartH);
          ctx.stroke();
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
        const grad = ctx.createLinearGradient(0, toY(6), 0, toY(0));
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

      // Gradient fill under curve
      ctx.beginPath();
      ctx.moveTo(toX(curve[0].minute), toY(0));
      for (let i = 0; i < curve.length; i++) {
        ctx.lineTo(toX(curve[i].minute), toY(curve[i].height));
      }
      ctx.lineTo(toX(curve[curve.length - 1].minute), toY(0));
      ctx.closePath();

      const fillGrad = ctx.createLinearGradient(0, toY(6), 0, toY(0));
      fillGrad.addColorStop(0, `rgba(45, 200, 160, ${breathAlpha * 0.15})`);
      fillGrad.addColorStop(0.4, `rgba(30, 140, 120, ${breathAlpha * 0.1})`);
      fillGrad.addColorStop(1, 'rgba(20, 80, 70, 0.02)');
      ctx.fillStyle = fillGrad;
      ctx.fill();

      // Main curve with glow
      ctx.save();
      ctx.shadowColor = `rgba(45, 200, 160, ${breathAlpha * 0.6})`;
      ctx.shadowBlur = 8 + Math.sin(this._breathPhase) * 3;

      const strokeGrad = ctx.createLinearGradient(
        toX(curve[0].minute), 0,
        toX(curve[curve.length - 1].minute), 0
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
        ctx.quadraticCurveTo(
          toX(prev.minute), toY(prev.height),
          cpx, (toY(prev.height) + toY(curr.height)) / 2
        );
      }
      ctx.lineTo(toX(curve[curve.length - 1].minute), toY(curve[curve.length - 1].height));
      ctx.stroke();
      ctx.restore();

      // Soft blur edge effect - draw a wider, more transparent version
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
        ctx.quadraticCurveTo(
          toX(prev.minute), toY(prev.height),
          cpx, (toY(prev.height) + toY(curr.height)) / 2
        );
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

        // Glow ring
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        const glowColor = tide.type === 'high' ? 'rgba(231, 76, 60, 0.2)' : 'rgba(52, 152, 219, 0.2)';
        ctx.fillStyle = glowColor;
        ctx.fill();

        // Main dot
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = tide.type === 'high' ? '#E74C3C' : '#3498DB';
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Label
        ctx.font = '9px sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        const label = `${tide.time} ${tide.height}m`;
        const textY = tide.type === 'high' ? y - 12 : y + 16;
        ctx.fillText(label, x - 20, textY);
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

      // Outer ripple
      ctx.beginPath();
      ctx.arc(x, y, 18 * breathScale, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(45, 200, 160, 0.06)';
      ctx.fill();

      // Middle ring
      ctx.beginPath();
      ctx.arc(x, y, 12 * breathScale, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(45, 200, 160, 0.12)';
      ctx.fill();

      // Inner glow
      ctx.save();
      ctx.shadowColor = 'rgba(45, 220, 170, 0.8)';
      ctx.shadowBlur = 10 + breathVal * 4;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#2DD4AA';
      ctx.fill();
      ctx.restore();

      // Vertical line
      ctx.strokeStyle = 'rgba(45, 212, 170, 0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, h - padding.bottom);
      ctx.stroke();
      ctx.setLineDash([]);

      // Time label
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
      ctx.fillStyle = '#2DD4AA';
      ctx.fill();
      ctx.fillStyle = '#8BA4B8';
      ctx.fillText('现在', (mode === 'fishing' ? 188 : 138), y + 4);
    },

    timeToMin(str) {
      const [h, m] = str.split(':').map(Number);
      return h * 60 + m;
    }
  }
});
