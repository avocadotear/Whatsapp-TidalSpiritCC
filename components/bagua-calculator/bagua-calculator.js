Component({
  properties: {
    tideType: { type: String, value: '中潮' },
    moonPhase: { type: String, value: '上弦月' },
    moonIcon: { type: String, value: '🌓' },
    windLevel: { type: String, value: '2级' },
    waveHeight: { type: String, value: '0.5' },
    windDirection: { type: String, value: '东北风' },
    lunarDay: { type: String, value: '' },
    tideHeight: { type: String, value: '' }
  },

  data: {
    factors: [],
    resultLevel: '--',
    resultClass: 'pending',
    resultText: '点击中央八卦开始测算今日赶海运势',
    isCalculating: false,
    showResult: false,
    calcProgress: 0
  },

  lifetimes: {
    ready() {
      this._rotation = 0;
      this._abacusPhase = 0;
      this._baseSpeed = 0.008;
      this._animTimer = null;
      this._isCalculating = false;
      this._calcStep = 0;
      this._buildFactors();
      setTimeout(() => {
        this.drawBagua();
        this._startAnimation();
      }, 300);
    },

    detached() {
      if (this._animTimer) clearInterval(this._animTimer);
    }
  },

  methods: {
    _buildFactors() {
      const { tideType, moonPhase, moonIcon, windLevel, waveHeight, windDirection, lunarDay } = this.data;
      this.setData({
        factors: [
          { icon: '🌊', label: '潮况', value: tideType },
          { icon: moonIcon || '🌓', label: '月相', value: moonPhase || '上弦月' },
          { icon: '💨', label: '风力', value: windLevel },
          { icon: '🔥', label: '浪高', value: waveHeight ? waveHeight + 'm' : '0.5m' },
          { icon: '📅', label: '农历', value: lunarDay || '初十' },
          { icon: '🧭', label: '风向', value: windDirection }
        ]
      });
    },

    onTapCalculate() {
      if (this._isCalculating) return;
      this._isCalculating = true;
      this._calcStep = 0;

      this.setData({
        isCalculating: true,
        showResult: false,
        resultLevel: '测算中...',
        resultClass: 'pending',
        resultText: ''
      });

      // Speed up rotation for dramatic effect
      this._baseSpeed = 0.06;

      // Multi-step calculation animation
      const steps = [
        { delay: 600, progress: 20, text: '正在感应天时...' },
        { delay: 1200, progress: 40, text: '推算潮汐方位...' },
        { delay: 1800, progress: 60, text: '测算风向水气...' },
        { delay: 2400, progress: 80, text: '算珠运算中...' },
        { delay: 3200, progress: 100, text: '' }
      ];

      steps.forEach((step) => {
        setTimeout(() => {
          if (step.text) {
            this.setData({ resultText: step.text, calcProgress: step.progress });
          }
        }, step.delay);
      });

      // Final result
      setTimeout(() => {
        this._baseSpeed = 0.008;
        this._isCalculating = false;
        this._showResult();
      }, 3500);
    },

    _showResult() {
      const { tideType, moonPhase, windLevel, waveHeight, tideHeight } = this.data;

      let score = 50;
      if (tideType === '大潮') score += 25;
      else if (tideType === '中潮') score += 15;
      else if (tideType === '小潮') score += 5;
      else score -= 5;

      if (moonPhase === '满月' || moonPhase === '新月') score += 15;
      else if (moonPhase === '上弦月' || moonPhase === '下弦月') score += 8;

      const windNum = parseInt(windLevel) || 2;
      if (windNum <= 2) score += 15;
      else if (windNum <= 3) score += 10;
      else if (windNum <= 4) score += 0;
      else score -= 15;

      const waveNum = parseFloat(waveHeight) || 0.5;
      if (waveNum < 0.5) score += 10;
      else if (waveNum < 1.0) score += 5;
      else if (waveNum < 1.5) score += 0;
      else score -= 10;

      score = Math.max(0, Math.min(100, score));

      let resultLevel, resultClass, resultText;
      if (score >= 80) {
        resultLevel = '极佳';
        resultClass = 'excellent';
        resultText = this._pickText([
          '今日海气稳定，退潮时间长，非常适合前往滩涂赶海。大潮日潮差大，滩涂露出面积广，收获满满。',
          '天时地利人和，今日潮汐条件极佳。建议趁退潮时段前往礁石区域，海货丰富。',
          '今日海况完美，风力柔顺，潮位理想。赶海的好日子，带上工具出发吧！'
        ]);
      } else if (score >= 60) {
        resultLevel = '很好';
        resultClass = 'good';
        resultText = this._pickText([
          '今日海况不错，适合赶海出行。建议选择退潮时段前往，注意潮位变化。',
          '今日条件良好，可以放心赶海。风力适中，注意防晒和防滑。',
          '海面较为平稳，赶海条件较好。建议早点出发，趁着退潮收获。'
        ]);
      } else if (score >= 40) {
        resultLevel = '一般';
        resultClass = 'normal';
        resultText = this._pickText([
          '今日赶海条件一般，建议有经验的赶海者前往，新手可选择更好的日子。',
          '海况尚可，但风浪稍大。若前往赶海，请注意安全，不要走太远。'
        ]);
      } else {
        resultLevel = '不推荐';
        resultClass = 'bad';
        resultText = this._pickText([
          '今日风浪较急，不建议夜间靠近礁石。如必须前往，请做好安全防护。',
          '海况不佳，潮汐条件不理想。建议改日出海，安全第一。'
        ]);
      }

      this.setData({
        isCalculating: false,
        showResult: true,
        resultLevel,
        resultClass,
        resultText,
        calcProgress: 100
      });
    },

    _pickText(arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    },

    _startAnimation() {
      this._animTimer = setInterval(() => {
        this._rotation += this._baseSpeed;
        this._abacusPhase += (this._isCalculating ? 0.3 : 0.1);
        this.drawBagua();
      }, 50);
    },

    drawBagua() {
      const query = this.createSelectorQuery();
      query.select('#baguaCanvas')
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

          this.renderBagua(ctx, size);
        });
    },

    renderBagua(ctx, size) {
      const cx = size / 2;
      const cy = size / 2;
      const r = size / 2 - 8;

      ctx.clearRect(0, 0, size, size);

      // Background
      const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      bgGrad.addColorStop(0, 'rgba(18, 42, 69, 0.85)');
      bgGrad.addColorStop(1, 'rgba(10, 22, 40, 0.95)');
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = bgGrad;
      ctx.fill();

      // Outer ring glow
      ctx.save();
      const glowIntensity = this._isCalculating ? 0.45 : 0.25;
      ctx.shadowColor = `rgba(245, 166, 35, ${glowIntensity})`;
      ctx.shadowBlur = this._isCalculating ? 20 : 12;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(245, 166, 35, ${glowIntensity + 0.1})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // Rotating trigram ring
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(this._rotation);

      const trigrams = ['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷'];
      const trigramColors = [
        'rgba(231, 76, 60, 0.8)', 'rgba(241, 196, 15, 0.8)',
        'rgba(231, 76, 60, 0.8)', 'rgba(46, 204, 113, 0.8)',
        'rgba(52, 152, 219, 0.8)', 'rgba(155, 89, 182, 0.8)',
        'rgba(52, 152, 219, 0.8)', 'rgba(46, 204, 113, 0.8)'
      ];

      ctx.font = '16px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI / 4) - Math.PI / 2;
        const tr = r * 0.72;
        const x = tr * Math.cos(angle);
        const y = tr * Math.sin(angle);

        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(18, 42, 69, 0.8)';
        ctx.fill();
        ctx.strokeStyle = trigramColors[i];
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = trigramColors[i];
        ctx.fillText(trigrams[i], x, y);
      }

      // Connecting lines
      ctx.strokeStyle = 'rgba(245, 166, 35, 0.1)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < 8; i++) {
        const angle1 = (i * Math.PI / 4) - Math.PI / 2;
        const angle2 = ((i + 1) * Math.PI / 4) - Math.PI / 2;
        const tr = r * 0.72;
        ctx.beginPath();
        ctx.moveTo(tr * Math.cos(angle1), tr * Math.sin(angle1));
        ctx.lineTo(tr * Math.cos(angle2), tr * Math.sin(angle2));
        ctx.stroke();
      }

      // Inner decorative ring
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.52, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(245, 166, 35, 0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();

      // Central area
      ctx.save();
      ctx.translate(cx, cy);

      const yinYangR = r * 0.38;

      // Outer ring
      ctx.beginPath();
      ctx.arc(0, 0, yinYangR, 0, Math.PI * 2);
      const yyGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, yinYangR);
      yyGrad.addColorStop(0, 'rgba(245, 166, 35, 0.3)');
      yyGrad.addColorStop(1, 'rgba(245, 166, 35, 0.05)');
      ctx.fillStyle = yyGrad;
      ctx.fill();
      ctx.strokeStyle = 'rgba(245, 166, 35, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Abacus beads
      const beadCount = 5;
      const beadR = this._isCalculating ? 7 : 6;
      const beadOrbitR = yinYangR * 0.6;

      for (let i = 0; i < beadCount; i++) {
        const phase = this._abacusPhase + i * (Math.PI * 2 / beadCount);
        const wobble = this._isCalculating ? 0.6 : 0.3;
        const bx = beadOrbitR * Math.cos(phase) * wobble;
        const by = beadOrbitR * Math.sin(phase);

        ctx.beginPath();
        ctx.arc(bx, by, beadR + 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(245, 166, 35, 0.15)';
        ctx.fill();

        const beadGrad = ctx.createRadialGradient(bx - 1, by - 1, 0, bx, by, beadR);
        beadGrad.addColorStop(0, '#F5D89A');
        beadGrad.addColorStop(0.5, '#D4A543');
        beadGrad.addColorStop(1, '#8B6914');
        ctx.beginPath();
        ctx.arc(bx, by, beadR, 0, Math.PI * 2);
        ctx.fillStyle = beadGrad;
        ctx.fill();
      }

      // Center dot
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      const centerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 4);
      centerGrad.addColorStop(0, '#F5D89A');
      centerGrad.addColorStop(1, '#D4A543');
      ctx.fillStyle = centerGrad;
      ctx.fill();

      ctx.restore();

      // Particle effect
      const particleCount = this._isCalculating ? 12 : 6;
      for (let i = 0; i < particleCount; i++) {
        const angle = this._rotation * 2 + i * Math.PI / (particleCount / 2);
        const dist = r * (0.55 + Math.sin(this._abacusPhase + i) * 0.1);
        const px = cx + dist * Math.cos(angle);
        const py = cy + dist * Math.sin(angle);
        const alpha = 0.15 + Math.sin(this._abacusPhase + i * 0.5) * 0.1;

        ctx.beginPath();
        ctx.arc(px, py, this._isCalculating ? 2 : 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 200, 100, ${alpha})`;
        ctx.fill();
      }

      // Tap prompt text when not calculating and no result
      if (!this.data.isCalculating && !this.data.showResult) {
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = `rgba(245, 200, 100, ${0.5 + Math.sin(this._abacusPhase * 0.3) * 0.3})`;
        ctx.fillText('点击测算', cx, cy + r + 2);
        ctx.textAlign = 'start';
      }
    }
  }
});
