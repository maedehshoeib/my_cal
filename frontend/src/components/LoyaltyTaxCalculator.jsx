// src/components/LoyaltyTaxCalculator.jsx - محاسبه مالیات علی‌الحساب با ضریب وفاداری
import React, { useState, useCallback } from 'react';
import './LoyaltyTaxCalculator.css';

const YEAR_LABELS = ['امسال', 'سال قبل', 'دو سال قبل', 'سه سال قبل', 'چهار سال قبل'];

export default function LoyaltyTaxCalculator() {
  const [personalInfo, setPersonalInfo] = useState({
    fullName: '',
    economicCode: '',
    nationalCode: ''
  });

  const [yearData, setYearData] = useState({
    year3: {
      label: 'سال سوم قبل',
      declaredSales: '',
      finalizedSales: '',
      declaredIncome: '',
      finalizedIncome: '',
      declaredProfit: '',
      finalizedProfit: '',
      conversionFactor: ''
    },
    year2: {
      label: 'سال دوم قبل',
      declaredSales: '',
      finalizedSales: '',
      declaredIncome: '',
      finalizedIncome: '',
      declaredProfit: '',
      finalizedProfit: '',
      conversionFactor: ''
    },
    year1: {
      label: 'سال قبل',
      declaredSales: '',
      finalizedSales: '',
      declaredIncome: '',
      finalizedIncome: '',
      declaredProfit: '',
      finalizedProfit: '',
      conversionFactor: ''
    }
  });

  const [taxPerformance, setTaxPerformance] = useState({
    taxFileHistory: [true, true, true, true, false],
    declarationHistory: [true, true, true, false, false],
    onTimePayment: [true, true, false, true, false],
    workfolderCompliance: [true, false, true, false, true],
    electronicInvoice: [true, true, true, false, false]
  });

  const [maxDiscount, setMaxDiscount] = useState('');
  const [savedRecords, setSavedRecords] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ==================== توابع کمکی ====================
  const parseNumber = useCallback((value) => {
    if (!value && value !== 0) return 0;
    // حذف تمام کاراکترهای غیرعددی به جز ممیز اعشاری و علامت منفی
    const cleaned = value.toString().replace(/[^\d.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }, []);

  const formatNumber = useCallback((value) => {
    if (value === undefined || value === null) return '';
    
    const num = Number(value);
    if (isNaN(num)) return '';
    
    // برای اعداد بسیار بزرگ، به صورت فشرده نمایش بده
    if (Math.abs(num) >= 1e12) {
      return (num / 1e12).toFixed(2) + ' تریلیون';
    } else if (Math.abs(num) >= 1e9) {
      return (num / 1e9).toFixed(2) + ' میلیارد';
    } else if (Math.abs(num) >= 1e6) {
      return (num / 1e6).toFixed(2) + ' میلیون';
    }
    
    // نمایش اعداد با دقت کامل (بدون گرد کردن)
    return num.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 0 });
  }, []);

  const formatCurrency = useCallback((value) => {
    const formatted = formatNumber(value);
    return formatted ? `${formatted} ریال` : '';
  }, [formatNumber]);

  const formatInputNumber = useCallback((value) => {
    if (!value && value !== 0) return '';
    const num = parseNumber(value);
    if (num === 0 && value === '') return '';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }, [parseNumber]);

  // ==================== توابع مدیریت state ====================
  const handlePersonalInfoChange = useCallback((field, value) => {
    setPersonalInfo(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleYearDataChange = useCallback((year, field, value) => {
    // برای فیلدهای عددی، مقدار خام (بدون کاما) ذخیره شود
    if (field !== 'conversionFactor' && field !== 'label') {
      const rawValue = parseNumber(value).toString();
      setYearData(prev => ({
        ...prev,
        [year]: { ...prev[year], [field]: rawValue }
      }));
    } else {
      // برای ضریب تبدیل، مقدار را همانطور که هست ذخیره کن
      setYearData(prev => ({
        ...prev,
        [year]: { ...prev[year], [field]: value }
      }));
    }
  }, [parseNumber]);

  const handlePerformanceChange = useCallback((category, yearIndex) => {
    setTaxPerformance(prev => ({
      ...prev,
      [category]: prev[category].map((val, idx) => idx === yearIndex ? !val : val)
    }));
  }, []);

  const calculatePerformanceScore = useCallback(() => {
    let total = 0;
    Object.values(taxPerformance).forEach(cat => cat.forEach(v => v && total++));
    return total;
  }, [taxPerformance]);

  const calculateLoyaltyFactor = useCallback(() => {
    return Math.min(calculatePerformanceScore() / 25, 1);
  }, [calculatePerformanceScore]);

  // ==================== تابع محاسبه اصلی ====================
  const handleCalculate = useCallback(() => {
    // پاک کردن نتایج قبلی و شروع محاسبه جدید
    setLoading(true);
    setError('');
    setResult(null);
  
    try {
      // بررسی اطلاعات ضروری (از closure فعلی)
      if (!personalInfo.fullName || !personalInfo.nationalCode) {
        throw new Error('لطفاً نام و کد ملی را وارد کنید');
      }
  
      // محاسبه نمره عملکرد و ضریب وفاداری
      const performanceScore = calculatePerformanceScore();
      const loyaltyFactor = calculateLoyaltyFactor();
  
      // مرحله ۱: تعدیل با ضریب تبدیل (فقط روی فروش)
      const adjustedYearData = {};
      Object.entries(yearData).forEach(([key, year]) => {
        let factor = parseFloat(year.conversionFactor);
        if (isNaN(factor) || factor < 0) factor = 0;
  
        const ds = parseNumber(year.declaredSales);
        const fs = parseNumber(year.finalizedSales);
        const di = parseNumber(year.declaredIncome);
        const fi = parseNumber(year.finalizedIncome);
        const dp = parseNumber(year.declaredProfit);
        const fp = parseNumber(year.finalizedProfit);
  
        // نسبت درآمد و سود به فروش واقعی
        const declaredIncomeRatio = ds ? di / ds : 0;
        const finalizedIncomeRatio = fs ? fi / fs : 0;
        const declaredProfitRatio = ds ? dp / ds : 0;
        const finalizedProfitRatio = fs ? fp / fs : 0;
  
        const declaredSalesAdj = ds * factor;
        const finalizedSalesAdj = fs * factor;
  
        adjustedYearData[key] = {
          label: year.label,
          declaredSalesAdj,
          finalizedSalesAdj,
          declaredIncomeAdj: declaredSalesAdj * declaredIncomeRatio,
          finalizedIncomeAdj: finalizedSalesAdj * finalizedIncomeRatio,
          declaredProfitAdj: declaredSalesAdj * declaredProfitRatio,
          finalizedProfitAdj: finalizedSalesAdj * finalizedProfitRatio,
          declaredSales: ds,
          finalizedSales: fs,
          declaredIncome: di,
          finalizedIncome: fi,
          declaredProfit: dp,
          finalizedProfit: fp
        };
      });
  
      const y3 = adjustedYearData.year3;
      const y2 = adjustedYearData.year2;
      const y1 = adjustedYearData.year1;
  
      // تابع رگرسیون خطی ساده
      const calcLinearRegression = (v1, v2, v3) => {
        const b = ((v2 - v1) + (v3 - v2)) / 2;
        const y0 = v1 - b;
        const prediction = 4 * b + y0;
        return { b, y0, prediction: prediction > 0 ? prediction : 0 };
      };
  
      const regDeclSales = calcLinearRegression(y3.declaredSalesAdj, y2.declaredSalesAdj, y1.declaredSalesAdj);
      const regDeclIncome = calcLinearRegression(y3.declaredIncomeAdj, y2.declaredIncomeAdj, y1.declaredIncomeAdj);
      const regDeclProfit = calcLinearRegression(y3.declaredProfitAdj, y2.declaredProfitAdj, y1.declaredProfitAdj);
      const regFinSales = calcLinearRegression(y3.finalizedSalesAdj, y2.finalizedSalesAdj, y1.finalizedSalesAdj);
      const regFinIncome = calcLinearRegression(y3.finalizedIncomeAdj, y2.finalizedIncomeAdj, y1.finalizedIncomeAdj);
      const regFinProfit = calcLinearRegression(y3.finalizedProfitAdj, y2.finalizedProfitAdj, y1.finalizedProfitAdj);
  
      const avgDeclaredSales = (y3.declaredSalesAdj + y2.declaredSalesAdj + y1.declaredSalesAdj) / 3;
      const avgFinalizedSales = (y3.finalizedSalesAdj + y2.finalizedSalesAdj + y1.finalizedSalesAdj) / 3;
      const avgDeclaredIncome = (y3.declaredIncomeAdj + y2.declaredIncomeAdj + y1.declaredIncomeAdj) / 3;
      const avgFinalizedIncome = (y3.finalizedIncomeAdj + y2.finalizedIncomeAdj + y1.finalizedIncomeAdj) / 3;
      const avgDeclaredProfit = (y3.declaredProfitAdj + y2.declaredProfitAdj + y1.declaredProfitAdj) / 3;
      const avgFinalizedProfit = (y3.finalizedProfitAdj + y2.finalizedProfitAdj + y1.finalizedProfitAdj) / 3;
  
      const currentYearEstimate = {
        declaredSalesAdj: regDeclSales.prediction,
        finalizedSalesAdj: regFinSales.prediction,
        declaredIncomeAdj: regDeclIncome.prediction,
        finalizedIncomeAdj: regFinIncome.prediction,
        declaredProfitAdj: regDeclProfit.prediction,
        finalizedProfitAdj: regFinProfit.prediction,
        avgDeclaredSales,
        avgFinalizedSales,
        avgDeclaredIncome,
        avgFinalizedIncome,
        avgDeclaredProfit,
        avgFinalizedProfit,
        regressionCoefficients: {
          declaredSales: { b: regDeclSales.b, y0: regDeclSales.y0 },
          finalizedSales: { b: regFinSales.b, y0: regFinSales.y0 },
          declaredIncome: { b: regDeclIncome.b, y0: regDeclIncome.y0 },
          finalizedIncome: { b: regFinIncome.b, y0: regFinIncome.y0 },
          declaredProfit: { b: regDeclProfit.b, y0: regDeclProfit.y0 },
          finalizedProfit: { b: regFinProfit.b, y0: regFinProfit.y0 }
        }
      };
  
      const baseTaxDeclared = currentYearEstimate.declaredProfitAdj * 0.25;
      const baseTaxFinalized = currentYearEstimate.finalizedProfitAdj * 0.25;
  
      let maxDiscountPercent = parseFloat(maxDiscount);
      if (isNaN(maxDiscountPercent)) maxDiscountPercent = 50;
      maxDiscountPercent = Math.min(100, Math.max(0, maxDiscountPercent));
  
      const maxLoyaltyScore = 25;
      let actualDiscountPercent = (performanceScore / maxLoyaltyScore) * maxDiscountPercent;
      actualDiscountPercent = Math.min(actualDiscountPercent, maxDiscountPercent);
      actualDiscountPercent = Math.max(actualDiscountPercent, 0);
  
      const discountMultiplier = 1 - actualDiscountPercent / 100;
      const finalTaxDeclared = baseTaxDeclared * discountMultiplier;
      const finalTaxFinalized = baseTaxFinalized * discountMultiplier;
      const discountAmountDeclared = baseTaxDeclared - finalTaxDeclared;
      const discountAmountFinalized = baseTaxFinalized - finalTaxFinalized;
  
      setResult({
        loyaltyFactor: loyaltyFactor.toFixed(4),
        performanceScore,
        baseTaxDeclared,
        discountAmountDeclared,
        finalTaxDeclared,
        baseTaxFinalized,
        discountAmountFinalized,
        finalTaxFinalized,
        maxDiscountPercent,
        actualDiscountPercent: actualDiscountPercent.toFixed(2),
        loyaltyStatus: loyaltyFactor >= 0.8 ? 'عالی' : loyaltyFactor >= 0.6 ? 'خوب' : loyaltyFactor >= 0.4 ? 'متوسط' : 'ضعیف',
        adjustedYearData,
        currentYearEstimate
      });
  
    } catch (err) {
      setError(err.message || 'خطا در محاسبه');
      setResult(null); // اطمینان از پاک شدن نتایج در صورت خطا
    } finally {
      setLoading(false);
    }
  }, [calculateLoyaltyFactor, calculatePerformanceScore, parseNumber]);

  // ==================== توابع مدیریت رکوردها ====================
  const handleSaveRecord = useCallback(() => {
    if (!result || !personalInfo.fullName) {
      setError('لطفاً ابتدا محاسبه را انجام دهید');
      return;
    }
    const newRecord = {
      id: Date.now(),
      fullName: personalInfo.fullName,
      economicCode: personalInfo.economicCode,
      nationalCode: personalInfo.nationalCode,
      loyaltyFactor: result.loyaltyFactor,
      performanceScore: result.performanceScore,
      actualDiscountPercent: result.actualDiscountPercent,
      baseTaxDeclared: result.baseTaxDeclared,
      baseTaxFinalized: result.baseTaxFinalized,
      finalTaxDeclared: result.finalTaxDeclared,
      finalTaxFinalized: result.finalTaxFinalized,
      createdAt: new Date().toLocaleDateString('fa-IR')
    };
    setSavedRecords(prev => [...prev, newRecord]);
    setError('');
  }, [result, personalInfo]);

  const handleExportExcel = useCallback(() => {
    if (savedRecords.length === 0) {
      setError('هیچ رکوردی برای خروجی وجود ندارد');
      return;
    }
    const headers = [
      'نام و نام خانوادگی', 'شماره اقتصادی', 'کد ملی', 'نمره کل', 'ضریب وفاداری',
      'درصد تخفیف نهایی', 'مالیات اولیه ابرازی', 'مالیات اولیه قطعی',
      'مالیات ابرازی نهایی', 'مالیات قطعی نهایی', 'تاریخ ثبت'
    ];
    const csvContent = [
      '\uFEFF' + headers.join(','),
      ...savedRecords.map(r => [
        r.fullName, r.economicCode, r.nationalCode, r.performanceScore, r.loyaltyFactor,
        r.actualDiscountPercent, r.baseTaxDeclared, r.baseTaxFinalized,
        r.finalTaxDeclared, r.finalTaxFinalized, r.createdAt
      ].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tax_records_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }, [savedRecords]);

  const handleDeleteRecord = useCallback((id) => {
    setSavedRecords(prev => prev.filter(r => r.id !== id));
  }, []);

  // ==================== تابع رندر بخش سال ====================
  const renderYearSection = (yearKey, yearInfo) => (
    <div className="year-section" key={yearKey}>
      <h3 className="year-title">{yearInfo.label}</h3>
      <div className="year-fields">
        <div className="field-row">
          <div className="input-group">
            <label>فروش ابرازی</label>
            <div className="input-wrapper">
              <input 
                type="text" 
                inputMode="numeric"
                value={formatInputNumber(yearInfo.declaredSales)} 
                onChange={(e) => handleYearDataChange(yearKey, 'declaredSales', e.target.value)} 
                onBlur={(e) => {
                  if (!e.target.value) {
                    handleYearDataChange(yearKey, 'declaredSales', '0');
                  }
                }}
                placeholder="0" 
              />
              <span className="unit">ریال</span>
            </div>
          </div>
          <div className="input-group">
            <label>فروش قطعی شده</label>
            <div className="input-wrapper">
              <input 
                type="text" 
                inputMode="numeric"
                value={formatInputNumber(yearInfo.finalizedSales)} 
                onChange={(e) => handleYearDataChange(yearKey, 'finalizedSales', e.target.value)}
                onBlur={(e) => {
                  if (!e.target.value) {
                    handleYearDataChange(yearKey, 'finalizedSales', '0');
                  }
                }}
                placeholder="0" 
              />
              <span className="unit">ریال</span>
            </div>
          </div>
        </div>
        <div className="field-row">
          <div className="input-group">
            <label>درآمد ابرازی</label>
            <div className="input-wrapper">
              <input 
                type="text" 
                inputMode="numeric"
                value={formatInputNumber(yearInfo.declaredIncome)} 
                onChange={(e) => handleYearDataChange(yearKey, 'declaredIncome', e.target.value)}
                onBlur={(e) => {
                  if (!e.target.value) {
                    handleYearDataChange(yearKey, 'declaredIncome', '0');
                  }
                }}
                placeholder="0" 
              />
              <span className="unit">ریال</span>
            </div>
          </div>
          <div className="input-group">
            <label>درآمد قطعی شده</label>
            <div className="input-wrapper">
              <input 
                type="text" 
                inputMode="numeric"
                value={formatInputNumber(yearInfo.finalizedIncome)} 
                onChange={(e) => handleYearDataChange(yearKey, 'finalizedIncome', e.target.value)}
                onBlur={(e) => {
                  if (!e.target.value) {
                    handleYearDataChange(yearKey, 'finalizedIncome', '0');
                  }
                }}
                placeholder="0" 
              />
              <span className="unit">ریال</span>
            </div>
          </div>
        </div>
        <div className="field-row">
          <div className="input-group">
            <label>سود ابرازی</label>
            <div className="input-wrapper">
              <input 
                type="text" 
                inputMode="numeric"
                value={formatInputNumber(yearInfo.declaredProfit)} 
                onChange={(e) => handleYearDataChange(yearKey, 'declaredProfit', e.target.value)}
                onBlur={(e) => {
                  if (!e.target.value) {
                    handleYearDataChange(yearKey, 'declaredProfit', '0');
                  }
                }}
                placeholder="0" 
              />
              <span className="unit">ریال</span>
            </div>
          </div>
          <div className="input-group">
            <label>سود قطعی شده</label>
            <div className="input-wrapper">
              <input 
                type="text" 
                inputMode="numeric"
                value={formatInputNumber(yearInfo.finalizedProfit)} 
                onChange={(e) => handleYearDataChange(yearKey, 'finalizedProfit', e.target.value)}
                onBlur={(e) => {
                  if (!e.target.value) {
                    handleYearDataChange(yearKey, 'finalizedProfit', '0');
                  }
                }}
                placeholder="0" 
              />
              <span className="unit">ریال</span>
            </div>
          </div>
        </div>
        <div className="field-row single">
          <div className="input-group">
            <label>ضریب تبدیل سال (شاخص تولیدکننده بانک مرکزی)</label>
            <div className="input-wrapper">
              <input 
                type="text" 
                inputMode="decimal"
                value={yearInfo.conversionFactor} 
                onChange={(e) => handleYearDataChange(yearKey, 'conversionFactor', e.target.value)}
                placeholder="0.15" 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ==================== JSX اصلی ====================
  return (
    <div className="loyalty-tax-calculator">
      <header className="header">
        <div className="header-content">
          <h1>محاسبه مالیات علی‌الحساب</h1>
          <p>با در نظر گرفتن ضریب وفاداری</p>
        </div>
      </header>

      <div className="calculator-body">
        <section className="section personal-info-section">
          <h2 className="section-title"><span className="section-icon">👤</span> اطلاعات هویتی</h2>
          <div className="personal-fields">
            <div className="input-group">
              <label>نام و نام خانوادگی</label>
              <input 
                type="text" 
                value={personalInfo.fullName} 
                onChange={(e) => handlePersonalInfoChange('fullName', e.target.value)} 
                placeholder="نام و نام خانوادگی را وارد کنید" 
              />
            </div>
            <div className="input-group">
              <label>شماره اقتصادی</label>
              <input 
                type="text" 
                value={personalInfo.economicCode} 
                onChange={(e) => handlePersonalInfoChange('economicCode', e.target.value)} 
                placeholder="شماره اقتصادی را وارد کنید" 
              />
            </div>
            <div className="input-group">
              <label>کد ملی</label>
              <input 
                type="text" 
                inputMode="numeric"
                value={personalInfo.nationalCode} 
                onChange={(e) => {
                  // فقط اعداد مجاز باشند
                  const value = e.target.value.replace(/[^\d]/g, '');
                  if (value.length <= 10) {
                    handlePersonalInfoChange('nationalCode', value);
                  }
                }} 
                placeholder="کد ملی را وارد کنید" 
                maxLength={10} 
              />
            </div>
          </div>
        </section>

        <section className="section financial-info-section">
          <h2 className="section-title"><span className="section-icon">📊</span> اطلاعات مالی ۳ سال گذشته</h2>
          <div className="years-container">
            {Object.entries(yearData).map(([key, data]) => renderYearSection(key, data))}
          </div>
        </section>

        <section className="section performance-section">
          <h2 className="section-title"><span className="section-icon">📈</span> عملکرد مالیاتی ۵ سال گذشته</h2>
          {Object.entries(taxPerformance).map(([key, values]) => (
            <div className="performance-row" key={key}>
              <div className="performance-label">
                {key === 'taxFileHistory' && 'سابقه تشکیل پرونده مالیاتی'}
                {key === 'declarationHistory' && 'سابقه تسلیم اظهارنامه مالیاتی'}
                {key === 'onTimePayment' && 'سابقه پرداخت سرموعد مالیات'}
                {key === 'workfolderCompliance' && 'سابقه انجام الزامات کارپوشه'}
                {key === 'electronicInvoice' && 'سابقه انجام الزامات صورتحساب الکترونیکی'}
              </div>
              <div className="checkbox-group">
                {YEAR_LABELS.map((label, i) => (
                  <label key={`${key}-${i}`} className="checkbox-item">
                    <input type="checkbox" checked={values[i]} onChange={() => handlePerformanceChange(key, i)} />
                    <span className="checkmark"></span>
                    <span className="checkbox-label">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          <div className="discount-section">
            <div className="input-group discount-input">
              <label>ماکزیمم درصد تخفیف (پیش‌فرض: 50%)</label>
              <div className="input-wrapper">
                <input 
                  type="text" 
                  inputMode="numeric"
                  value={maxDiscount} 
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d]/g, '');
                    setMaxDiscount(value);
                  }} 
                  placeholder="50" 
                />
                <span className="unit">%</span>
              </div>
            </div>
          </div>
        </section>

        <div className="calculate-section">
          <button className="calculate-btn" onClick={handleCalculate} disabled={loading}>
            {loading ? <><span className="spinner"></span> در حال محاسبه...</> : <><span className="btn-icon">🧮</span> محاسبه ضریب وفاداری و مالیات نهایی</>}
          </button>
        </div>

        {error && <div className="error-message"><span className="error-icon">⚠️</span> {error}</div>}

        {result && (
          <section className="section results-section">
            <h2 className="section-title"><span className="section-icon">📋</span> نتایج محاسبه</h2>
            
            <div className="adjusted-data-section">
              <h3 className="subsection-title">الف) اطلاعات تعدیل‌شده سالانه</h3>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>سال</th>
                      <th>فروش ابرازی تعدیلی</th>
                      <th>فروش قطعی تعدیلی</th>
                      <th>درآمد ابرازی تعدیلی</th>
                      <th>درآمد قطعی تعدیلی</th>
                      <th>سود ابرازی تعدیلی</th>
                      <th>سود قطعی تعدیلی</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(result.adjustedYearData).map(([key, data]) => (
                      <tr key={key}>
                        <td className="year-cell">{data.label}</td>
                        <td>{formatCurrency(data.declaredSalesAdj)}</td>
                        <td>{formatCurrency(data.finalizedSalesAdj)}</td>
                        <td>{formatCurrency(data.declaredIncomeAdj)}</td>
                        <td>{formatCurrency(data.finalizedIncomeAdj)}</td>
                        <td>{formatCurrency(data.declaredProfitAdj)}</td>
                        <td>{formatCurrency(data.finalizedProfitAdj)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="current-year-estimate">
              <h3 className="subsection-title">ب) تخمین سال چهارم با رگرسیون خطی (y = bx + y0)</h3>
              
              <div className="averages-section">
                <h4 className="mini-title">میانگین هم‌وزن شده سه سال</h4>
                <div className="estimate-grid compact">
                  <div className="estimate-item">
                    <span className="estimate-label">فروش ابرازی:</span>
                    <span className="estimate-value">{formatCurrency(result.currentYearEstimate.avgDeclaredSales)}</span>
                  </div>
                  <div className="estimate-item">
                    <span className="estimate-label">فروش قطعی:</span>
                    <span className="estimate-value">{formatCurrency(result.currentYearEstimate.avgFinalizedSales)}</span>
                  </div>
                  <div className="estimate-item">
                    <span className="estimate-label">درآمد ابرازی:</span>
                    <span className="estimate-value">{formatCurrency(result.currentYearEstimate.avgDeclaredIncome)}</span>
                  </div>
                  <div className="estimate-item">
                    <span className="estimate-label">درآمد قطعی:</span>
                    <span className="estimate-value">{formatCurrency(result.currentYearEstimate.avgFinalizedIncome)}</span>
                  </div>
                  <div className="estimate-item">
                    <span className="estimate-label">سود ابرازی:</span>
                    <span className="estimate-value">{formatCurrency(result.currentYearEstimate.avgDeclaredProfit)}</span>
                  </div>
                  <div className="estimate-item">
                    <span className="estimate-label">سود قطعی:</span>
                    <span className="estimate-value">{formatCurrency(result.currentYearEstimate.avgFinalizedProfit)}</span>
                  </div>
                </div>
              </div>

              <div className="regression-section">
                <h4 className="mini-title">پیش‌بینی سال چهارم (رگرسیون)</h4>
                <div className="estimate-grid">
                  <div className="estimate-item">
                    <span className="estimate-label">فروش ابرازی تخمینی:</span>
                    <span className="estimate-value">{formatCurrency(result.currentYearEstimate.declaredSalesAdj)}</span>
                  </div>
                  <div className="estimate-item">
                    <span className="estimate-label">فروش قطعی تخمینی:</span>
                    <span className="estimate-value">{formatCurrency(result.currentYearEstimate.finalizedSalesAdj)}</span>
                  </div>
                  <div className="estimate-item">
                    <span className="estimate-label">درآمد ابرازی تخمینی:</span>
                    <span className="estimate-value">{formatCurrency(result.currentYearEstimate.declaredIncomeAdj)}</span>
                  </div>
                  <div className="estimate-item">
                    <span className="estimate-label">درآمد قطعی تخمینی:</span>
                    <span className="estimate-value">{formatCurrency(result.currentYearEstimate.finalizedIncomeAdj)}</span>
                  </div>
                  <div className="estimate-item highlight">
                    <span className="estimate-label">سود ابرازی تخمینی:</span>
                    <span className="estimate-value">{formatCurrency(result.currentYearEstimate.declaredProfitAdj)}</span>
                  </div>
                  <div className="estimate-item highlight">
                    <span className="estimate-label">سود قطعی تخمینی:</span>
                    <span className="estimate-value">{formatCurrency(result.currentYearEstimate.finalizedProfitAdj)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="tax-results">
              <h3 className="subsection-title">ج) نتایج مالیاتی</h3>
              
              <div className="results-grid">
                <div className="result-card">
                  <div className="result-label">نمره کل عملکرد</div>
                  <div className="result-value">{result.performanceScore} از 25</div>
                </div>
                
                <div className="result-card">
                  <div className="result-label">ضریب وفاداری</div>
                  <div className="result-value">{result.loyaltyFactor}</div>
                  <div className={`loyalty-badge ${result.loyaltyStatus}`}>{result.loyaltyStatus}</div>
                </div>
                
                <div className="result-card">
                  <div className="result-label">حداکثر تخفیف</div>
                  <div className="result-value">{result.maxDiscountPercent}%</div>
                </div>
                
                <div className="result-card highlight">
                  <div className="result-label">تخفیف نهایی</div>
                  <div className="result-value">{result.actualDiscountPercent}%</div>
                </div>
              </div>

              <div className="tax-summary-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>شرح</th>
                      <th>مالیات ابرازی</th>
                      <th>مالیات قطعی</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="base-tax-row">
                      <td className="base-tax-label">مالیات اولیه (سود × ۰.۲۵)</td>
                      <td className="base-tax-cell">{formatCurrency(result.baseTaxDeclared)}</td>
                      <td className="base-tax-cell">{formatCurrency(result.baseTaxFinalized)}</td>
                    </tr>
                    <tr>
                      <td>تخفیف ({result.actualDiscountPercent}%)</td>
                      <td className="discount-cell">-{formatCurrency(result.discountAmountDeclared)}</td>
                      <td className="discount-cell">-{formatCurrency(result.discountAmountFinalized)}</td>
                    </tr>
                    <tr className="final-row">
                      <td className="final-label">مالیات علی‌الحساب نهایی</td>
                      <td className="final-cell">{formatCurrency(result.finalTaxDeclared)}</td>
                      <td className="final-cell">{formatCurrency(result.finalTaxFinalized)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="save-record-section">
              <button className="save-btn" onClick={handleSaveRecord}>
                <span className="btn-icon">💾</span>
                ذخیره رکورد فعلی
              </button>
            </div>
          </section>
        )}

        <section className="section records-section">
          <h2 className="section-title"><span className="section-icon">📁</span> جدول رکوردهای ثبت شده</h2>
          
          {savedRecords.length === 0 ? (
            <div className="no-records">
              <span className="no-records-icon">📭</span>
              <p>هنوز رکوردی ثبت نشده است</p>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="records-table">
                  <thead>
                    <tr>
                      <th>ردیف</th>
                      <th>نام و نام خانوادگی</th>
                      <th>شماره اقتصادی</th>
                      <th>کد ملی</th>
                      <th>نمره کل</th>
                      <th>ضریب وفاداری</th>
                      <th>تخفیف نهایی</th>
                      <th>مالیات اولیه ابرازی</th>
                      <th>مالیات اولیه قطعی</th>
                      <th>مالیات ابرازی نهایی</th>
                      <th>مالیات قطعی نهایی</th>
                      <th>تاریخ</th>
                      <th>عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {savedRecords.map((record, index) => (
                      <tr key={record.id}>
                        <td>{index + 1}</td>
                        <td>{record.fullName}</td>
                        <td>{record.economicCode || '-'}</td>
                        <td>{record.nationalCode}</td>
                        <td>{record.performanceScore}/25</td>
                        <td>{record.loyaltyFactor}</td>
                        <td>{record.actualDiscountPercent}%</td>
                        <td>{formatCurrency(record.baseTaxDeclared)}</td>
                        <td>{formatCurrency(record.baseTaxFinalized)}</td>
                        <td>{formatCurrency(record.finalTaxDeclared)}</td>
                        <td>{formatCurrency(record.finalTaxFinalized)}</td>
                        <td>{record.createdAt}</td>
                        <td>
                          <button className="delete-btn" onClick={() => handleDeleteRecord(record.id)} title="حذف">
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="export-section">
                <button className="export-btn" onClick={handleExportExcel}>
                  <span className="btn-icon">📊</span>
                  خروجی Excel
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}