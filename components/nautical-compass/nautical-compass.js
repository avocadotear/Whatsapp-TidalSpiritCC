Component({
  properties: {
    windDirection: { type: String, value: '东北风' },
    windLevel: { type: String, value: '2级' },
    windSpeed: { type: String, value: '7.2km/h' },
    waveHeight: { type: String, value: '0.5' },
    tideType: { type: String, value: '中潮' }
  },

  data: {
    suggestion: '',
    waveDirection: '东南',
    heading: 0,
    compassAvailable: false
  },

  observers: {
    'windDirection, windLevel, tideType'() {
      this._generateSuggestion();
      setTimeout(() => this.drawCompass(), 100);
    }
  },

  lifetimes: {
    ready() {
      this._rotation = 0;
      this._deviceHeading = 0;
      this._targetRotation = 0;
      this._animTimer = null;
      this._compassStarted = false;
      this._generateSuggestion();
      setTimeout(() => {
        this.drawCompass();
        this._startRotation();
        this._startCompass();
      }, 300);
    },

    detached() {
      if (this._animTimer) clearInterval(this._animTimer);
      this._stopCompass();
    }
  },

  methods: {
    _startCompass() {
      const that = this;
      wx.startCompass({
        success() {
          that._compassStarted = true;
          that.setData({ compassAvailable: true });
          wx.onCompassChange(function (res) {
            that._deviceHeading = res.direction;
            that.setData({ heading: Math.round(res.direction) });
          });
        },
        fail() {
          // Compass not available, use simulated rotation
          that.setData({ compassAvailable: false });
        }
      });
    },

    _stopCompass() {
      if (this._compassStarted) {
        wx.stopCompass();
        wx.offCompassChange();
      }
    },

    _generateSuggestion() {
      const { windDirection, windLevel, tideType } = this.data;
      const dirs = {
        '北风': '南', '东北风': '西南', '东风': '西', '东南风': '西北',
        '南风': '北', '西南风': '东北', '西风': '东', '西北风': '东南'
      };

      const levelNum = parseInt(windLevel) || 2;
      const oppDir = dirs[windDirection] || '东';

      const waveDirs = {
        '北风': '东北', '东北风': '东', '东风': '东南', '东南风': '南',
        '南风': '西南', '西南风': '西', '西风': '西北', '西北风': '北'
      };
      const waveDir = waveDirs[windDirection] || '东南';
      this.setData({ waveDirection: waveDir });

      const angles = {
        '北风': 0, '东北风': 45, '东风': 90, '东南风': 135,
        '南风': 180, '西南风': 225, '西风': 270, '西北风': 315
      };
      this._targetRotation = (angles[windDirection] || 45) * Math.PI / 180;

      let suggestion;
      if (levelNum >= 5) {
        suggestion = `当前${windDirection}${windLevel}，风浪较大，不建议外出赶海，注意安全`;
      } else if (levelNum >= 3) {
        suggestion = `当前${windDirection}${windLevel}，建议前往${oppDir}侧背风区域赶海`;
      } else if (tideType === '大潮') {
        suggestion = `今日${windDirection}，风力较小，大潮日非常适合赶海，推荐前往${oppDir}侧礁石区域`;
      } else {
        suggestion = `当前${windDirection}${windLevel}，海面平稳，可前往${oppDir}侧滩涂区域赶海`;
      }

      this.setData({ suggestion });
    },

    _startRotation() {
      this._animTimer = setInterval(() => {
        if (this.data.compassAvailable) {
          // When compass is active, the dial rotates opposite to heading
          this._rotation = -this._deviceHeading * Math.PI / 180;
        } else {
          // Slow idle rotation when no compass
          this._rotation += 0.003;
        }
        this.drawCompass();
      }, 50);
    },

    drawCompass() {
      const query = this.createSelectorQuery();
      query.select('#compassCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res[0]) return;
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          const dpr = wx.getWindowInfo().pixelRatio;
          const size = res[0].width;
          canvas.width = size * dpr;
          canvas.height = size * dpr;
          ctx.scale(dpr, dpr);

          this.renderCompass(ctx, size);
        });
    },

    renderCompass(ctx, size) {
      const cx = size / 2;
      const cy = size / 2;
      const r = size / 2 - 10;

      ctx.clearRect(0, 0, size, size);

      // Background
      const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      bgGrad.addColorStop(0, 'rgba(18, 42, 69, 0.9)');
      bgGrad.addColorStop(0.7, 'rgba(13, 30, 50, 0.95)');
      bgGrad.addColorStop(1, 'rgba(10, 22, 40, 0.98)');
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = bgGrad;
      ctx.fill();

      // Outer glow
      ctx.save();
      ctx.shadowColor = 'rgba(45, 200, 160, 0.3)';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(45, 200, 160, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Inner ring
      ctx.beginPath();
      ctx.arc(cx, cy, r - 8, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(139, 164, 184, 0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // The dial rotates — either by compass or idle animation
      const dialRotation = this._rotation;

      // Degree ticks — rotate with dial
      for (let i = 0; i < 360; i += 5) {
        const angle = (i - 90) * Math.PI / 180 + dialRotation;
        const isMajor = i % 90 === 0;
        const isMedium = i % 30 === 0;
        const tickLen = isMajor ? 12 : isMedium ? 8 : 4;
        const innerR = r - 8 - tickLen;

        ctx.beginPath();
        ctx.moveTo(cx + innerR * Math.cos(angle), cy + innerR * Math.sin(angle));
        ctx.lineTo(cx + (r - 8) * Math.cos(angle), cy + (r - 8) * Math.sin(angle));
        ctx.strokeStyle = isMajor ? 'rgba(45, 200, 160, 0.8)' : 'rgba(139, 164, 184, 0.3)';
        ctx.lineWidth = isMajor ? 2 : 1;
        ctx.stroke();
      }

      // Direction labels rotate with dial
      const directions = [
        { label: 'N', angle: -90 },
        { label: 'E', angle: 0 },
        { label: 'S', angle: 90 },
        { label: 'W', angle: 180 }
      ];

      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      directions.forEach(d => {
        const angle = d.angle * Math.PI / 180 + dialRotation;
        const labelR = r - 28;
        const x = cx + labelR * Math.cos(angle);
        const y = cy + labelR * Math.sin(angle);

        ctx.fillStyle = d.label === 'N' ? '#E74C3C' : 'rgba(232, 240, 242, 0.7)';
        ctx.fillText(d.label, x, y);
      });

      // Degree labels at 30° intervals
      ctx.font = '8px sans-serif';
      ctx.fillStyle = 'rgba(139, 164, 184, 0.5)';
      for (let i = 0; i < 360; i += 30) {
        if (i % 90 === 0) continue; // Skip cardinal directions
        const angle = (i - 90) * Math.PI / 180 + dialRotation;
        const labelR = r - 28;
        const x = cx + labelR * Math.cos(angle);
        const y = cy + labelR * Math.sin(angle);
        ctx.fillText(`${i}`, x, y);
      }

      // Fixed pointer (always points up = north direction on screen)
      ctx.save();
      ctx.translate(cx, cy);

      // North pointer (red, always up)
      ctx.beginPath();
      ctx.moveTo(0, -(r * 0.45));
      ctx.lineTo(-6, -(r * 0.15));
      ctx.lineTo(0, -(r * 0.2));
      ctx.lineTo(6, -(r * 0.15));
      ctx.closePath();
      ctx.fillStyle = '#E74C3C';
      ctx.fill();

      // South pointer (green, always down)
      ctx.beginPath();
      ctx.moveTo(0, r * 0.45);
      ctx.lineTo(-6, r * 0.15);
      ctx.lineTo(0, r * 0.2);
      ctx.lineTo(6, r * 0.15);
      ctx.closePath();
      ctx.fillStyle = '#2D8B6F';
      ctx.fill();

      ctx.restore();

      // Wind direction indicator (small arrow at edge, rotates with wind)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(this._targetRotation);
      ctx.beginPath();
      ctx.moveTo(0, -(r * 0.62));
      ctx.lineTo(-4, -(r * 0.55));
      ctx.lineTo(0, -(r * 0.57));
      ctx.lineTo(4, -(r * 0.55));
      ctx.closePath();
      ctx.fillStyle = '#F5A623';
      ctx.globalAlpha = 0.7;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();

      // Center circle
      const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 8);
      centerGrad.addColorStop(0, '#8BA4B8');
      centerGrad.addColorStop(0.5, '#5A7A8A');
      centerGrad.addColorStop(1, '#3A5A6A');
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fillStyle = centerGrad;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx - 2, cy - 2, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fill();
    }
  }
});
