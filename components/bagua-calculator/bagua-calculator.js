Component({
  properties: {
    tideType: { type: String, value: '中潮' },
    moonPhase: { type: String, value: '上弦月' },
    moonIcon: { type: String, value: '' },
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
    resultText: '',
    resultDetail: '',
    resultBestTime: '',
    resultTips: '',
    resultItems: '',
    isCalculating: false,
    showResult: false
  },

  lifetimes: {
    ready() {
      this._rotation = 0;
      this._abacusPhase = 0;
      this._outerRingPhase = 0;
      this._particlePhase = 0;
      this._baseSpeed = 0.006;
      this._animTimer = null;
      this._isCalculating = false;
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
      const { tideType, moonPhase, windLevel, waveHeight, windDirection, lunarDay } = this.data;
      this.setData({
        factors: [
          { label: '潮况', value: tideType },
          { label: '月相', value: moonPhase || '上弦月' },
          { label: '风力', value: windLevel },
          { label: '浪高', value: waveHeight ? waveHeight + 'm' : '0.5m' },
          { label: '农历', value: lunarDay || '初十' },
          { label: '风向', value: windDirection }
        ]
      });
    },

    onTapCalculate() {
      if (this._isCalculating) return;
      this._isCalculating = true;

      this.setData({
        isCalculating: true,
        showResult: false,
        resultLevel: '测算中',
        resultClass: 'pending',
        resultText: '',
        resultDetail: '',
        resultBestTime: '',
        resultTips: '',
        resultItems: ''
      });

      this._baseSpeed = 0.05;

      const steps = [
        { delay: 500, text: '感应天地潮汐之气...' },
        { delay: 1100, text: '推算八卦方位潮势...' },
        { delay: 1700, text: '测算风云水气流向...' },
        { delay: 2300, text: '算珠归位，天道已成...' },
      ];

      steps.forEach(s => {
        setTimeout(() => {
          if (this._isCalculating) {
            this.setData({ resultText: s.text });
          }
        }, s.delay);
      });

      setTimeout(() => {
        this._baseSpeed = 0.006;
        this._isCalculating = false;
        this._showResult();
      }, 3200);
    },

    _showResult() {
      const { tideType, moonPhase, windLevel, waveHeight, windDirection } = this.data;

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

      // Determine best time windows based on tide type
      let bestTime, areaType;
      if (tideType === '大潮') {
        bestTime = '退潮后2-3小时（约13:00-16:00），滩涂露出面积最大';
        areaType = '开阔滩涂、沙洲、礁石区';
      } else if (tideType === '中潮') {
        bestTime = '退潮后1-2小时，注意观察潮位变化';
        areaType = '近岸滩涂、礁石边缘';
      } else {
        bestTime = '低潮前后1小时，注意涨潮时间';
        areaType = '近岸浅滩、沙地';
      }

      // Build detailed prediction
      let resultLevel, resultClass, resultText, resultDetail, resultTips, resultItems;

      if (score >= 80) {
        resultLevel = '大吉';
        resultClass = 'excellent';
        resultText = this._pick([
          '今日天时地利俱佳，海气清明，潮退深远。乃赶海之上上签也。',
          '卦象显示今日水气汇聚，潮汐大退，海天一色，实为赶海良辰。',
          '天象昭示今日风平浪静，大潮退去，海底宝藏尽现，机不可失。'
        ]);
        resultDetail = '综合天时、地利、潮势分析，今日赶海条件极佳。潮差大、风浪小，能见度好，滩涂露出面积广。是近期最佳的赶海时机。';
        resultTips = '建议携带充足容器，预计收获颇丰。注意防晒，多带饮用水。可前往远滩深挖。';
        resultItems = '水桶、铲子、手套、防晒霜、防滑鞋、充足饮用水、手机防水袋';
      } else if (score >= 60) {
        resultLevel = '吉';
        resultClass = 'good';
        resultText = this._pick([
          '今日潮汐平稳，风浪适中，适合赶海出行。卦象中吉，宜前往近岸。',
          '海况尚可，潮退有序，虽非大潮之日，亦可收获些许海味。',
          '今日运势中上，海水清朗，适合亲子赶海。注意潮位，适时返回。'
        ]);
        resultDetail = '今日赶海条件良好。潮汐平稳有序，风力适中，适合大多数赶海活动。建议选择退潮时段出行。';
        resultTips = '注意潮位变化，不要走得太远。新手建议在近岸活动，有经验者可稍深入。';
        resultItems = '水桶、小铲、手套、防滑鞋、饮用水';
      } else if (score >= 40) {
        resultLevel = '小凶';
        resultClass = 'normal';
        resultDetail = '今日赶海条件一般。风浪稍大，潮差不显著，滩涂露出有限。建议有经验者前往，新手可择日再来。';
        resultTips = '务必注意安全，远离礁石深处。密切关注潮位变化，随时准备返回。建议结伴同行。';
        resultItems = '水桶、手套、防滑鞋、哨子（应急用）、手机充满电';
        if (windNum >= 4) {
          resultText = '今日风势较猛，海面波涛起伏。卦象示警，宜谨慎行事，不宜深入。';
        } else {
          resultText = this._pick([
            '今日潮势平平，海底沙泥不露。卦象平平，勉强可行，但收获有限。',
            '海况尚可但不甚理想，潮汐退幅不大。赶海需耐心，浅滩处或有小获。'
          ]);
        }
      } else {
        resultLevel = '大凶';
        resultClass = 'bad';
        resultText = this._pick([
          '今日风急浪高，海气混沌。卦象大凶，不宜涉足海滨，静待佳期。',
          '天象不利，潮汐紊乱，风浪交加。切记安全为上，今日不宜赶海。'
        ]);
        resultDetail = '今日赶海条件恶劣。风力较大，浪高超安全范围，潮汐条件不理想。强烈建议不要外出赶海，尤其是夜间和礁石区域。';
        resultTips = '今日不建议赶海。如必须前往海边，仅限安全区域观潮。绝对不要靠近礁石和深水区。看好儿童，远离浪花。';
        resultItems = '不建议出行。若已到海边，请确保手机畅通、告知他人行踪。';
      }

      this.setData({
        isCalculating: false,
        showResult: true,
        resultLevel,
        resultClass,
        resultText,
        resultDetail,
        resultBestTime: bestTime,
        resultTips,
        resultItems,
        resultArea: areaType
      });
    },

    _pick(arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    },

    _startAnimation() {
      this._animTimer = setInterval(() => {
        this._rotation += this._baseSpeed;
        this._abacusPhase += (this._isCalculating ? 0.35 : 0.08);
        this._outerRingPhase += 0.003;
        this._particlePhase += 0.02;
        this.drawBagua();
      }, 45);
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
      const r = size / 2 - 6;

      ctx.clearRect(0, 0, size, size);

      // Deep background
      const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      bgGrad.addColorStop(0, 'rgba(22, 48, 78, 0.9)');
      bgGrad.addColorStop(0.6, 'rgba(12, 30, 50, 0.95)');
      bgGrad.addColorStop(1, 'rgba(8, 18, 32, 0.98)');
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = bgGrad;
      ctx.fill();

      // Outer energy ring 1 (counter-rotating)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-this._outerRingPhase);
      const ring1R = r - 2;
      for (let i = 0; i < 36; i++) {
        const angle = (i * Math.PI * 2 / 36);
        const len = i % 3 === 0 ? 8 : 4;
        const alpha = 0.15 + Math.sin(this._particlePhase + i * 0.3) * 0.1;
        ctx.strokeStyle = `rgba(245, 200, 100, ${alpha})`;
        ctx.lineWidth = i % 3 === 0 ? 1.5 : 0.8;
        ctx.beginPath();
        ctx.moveTo(ring1R * Math.cos(angle), ring1R * Math.sin(angle));
        ctx.lineTo((ring1R - len) * Math.cos(angle), (ring1R - len) * Math.sin(angle));
        ctx.stroke();
      }
      ctx.restore();

      // Outer energy ring 2 (forward rotating)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(this._outerRingPhase * 1.5);
      const ring2R = r - 14;
      for (let i = 0; i < 24; i++) {
        const angle = (i * Math.PI * 2 / 24);
        const alpha = 0.1 + Math.sin(this._particlePhase * 0.8 + i * 0.5) * 0.08;
        ctx.strokeStyle = `rgba(45, 200, 160, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ring2R * Math.cos(angle), ring2R * Math.sin(angle));
        ctx.lineTo((ring2R - 5) * Math.cos(angle), (ring2R - 5) * Math.sin(angle));
        ctx.stroke();
      }
      ctx.restore();

      // Outer glow ring
      ctx.save();
      const glowIntensity = this._isCalculating ? 0.5 : 0.25;
      ctx.shadowColor = `rgba(245, 166, 35, ${glowIntensity})`;
      ctx.shadowBlur = this._isCalculating ? 25 : 10;
      ctx.beginPath();
      ctx.arc(cx, cy, r - 1, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(245, 166, 35, ${glowIntensity})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // Trigram ring (main rotation)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(this._rotation);

      const trigrams = ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤'];
      const trigramColors = [
        '#E74C3C', '#F5A623', '#E74C3C', '#2D8B6F',
        '#3498DB', '#9B59B6', '#3498DB', '#2D8B6F'
      ];

      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI / 4) - Math.PI / 2;
        const tr = r * 0.72;
        const x = tr * Math.cos(angle);
        const y = tr * Math.sin(angle);

        // Background circle
        ctx.beginPath();
        ctx.arc(x, y, 14, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(12, 28, 48, 0.9)';
        ctx.fill();
        ctx.strokeStyle = trigramColors[i];
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = trigramColors[i];
        ctx.fillText(trigrams[i], x, y);
      }

      // Connecting octagon lines
      ctx.strokeStyle = 'rgba(245, 166, 35, 0.12)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (let i = 0; i <= 8; i++) {
        const angle = (i * Math.PI / 4) - Math.PI / 2;
        const tr = r * 0.72;
        const x = tr * Math.cos(angle);
        const y = tr * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Inner decorative ring
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.52, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(245, 166, 35, 0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();

      // Central area
      ctx.save();
      ctx.translate(cx, cy);

      const innerR = r * 0.42;

      // Inner glow circle
      const yyGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, innerR);
      yyGrad.addColorStop(0, 'rgba(245, 166, 35, 0.2)');
      yyGrad.addColorStop(0.6, 'rgba(245, 166, 35, 0.06)');
      yyGrad.addColorStop(1, 'rgba(245, 166, 35, 0.02)');
      ctx.beginPath();
      ctx.arc(0, 0, innerR, 0, Math.PI * 2);
      ctx.fillStyle = yyGrad;
      ctx.fill();
      ctx.strokeStyle = 'rgba(245, 166, 35, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Energy wave during calculation
      if (this._isCalculating) {
        const waveR = innerR * (0.4 + (this._abacusPhase % 3) * 0.2);
        const waveAlpha = Math.max(0, 0.2 - (this._abacusPhase % 3) * 0.07);
        ctx.beginPath();
        ctx.arc(0, 0, waveR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(245, 200, 100, ${waveAlpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Abacus beads on track
      const beadCount = 7;
      const beadR = this._isCalculating ? 5.5 : 4.5;
      const trackR = innerR * 0.65;

      for (let i = 0; i < beadCount; i++) {
        const phase = this._abacusPhase + i * (Math.PI * 2 / beadCount);
        const wobble = this._isCalculating ? 0.8 : 0.3;
        const bx = trackR * Math.cos(phase) * wobble;
        const by = trackR * Math.sin(phase);

        // Bead glow
        ctx.beginPath();
        ctx.arc(bx, by, beadR + 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 166, 35, ${this._isCalculating ? 0.12 : 0.06})`;
        ctx.fill();

        // Bead body
        const beadGrad = ctx.createRadialGradient(bx - 1, by - 1, 0, bx, by, beadR);
        beadGrad.addColorStop(0, '#F5E0A0');
        beadGrad.addColorStop(0.4, '#D4A543');
        beadGrad.addColorStop(1, '#8B6914');
        ctx.beginPath();
        ctx.arc(bx, by, beadR, 0, Math.PI * 2);
        ctx.fillStyle = beadGrad;
        ctx.fill();
      }

      // Center dot
      const centerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 5);
      centerGrad.addColorStop(0, '#FFF5D0');
      centerGrad.addColorStop(0.5, '#F5D89A');
      centerGrad.addColorStop(1, '#D4A543');
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fillStyle = centerGrad;
      ctx.fill();

      ctx.restore();

      // Floating particles (more during calculation)
      const pCount = this._isCalculating ? 20 : 10;
      for (let i = 0; i < pCount; i++) {
        const seed = i * 137.508;
        const angle = this._particlePhase * 0.5 + seed;
        const distBase = r * 0.4 + (i % 3) * r * 0.15;
        const dist = distBase + Math.sin(this._particlePhase + seed) * 8;
        const px = cx + dist * Math.cos(angle);
        const py = cy + dist * Math.sin(angle);
        const alpha = 0.1 + Math.sin(this._particlePhase * 0.7 + seed) * 0.1;
        const pr = this._isCalculating ? 2 : 1.2;

        const colors = [
          `rgba(245, 200, 100, ${alpha})`,
          `rgba(45, 200, 160, ${alpha * 0.7})`,
          `rgba(200, 180, 255, ${alpha * 0.5})`
        ];

        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fillStyle = colors[i % 3];
        ctx.fill();
      }
    }
  }
});
