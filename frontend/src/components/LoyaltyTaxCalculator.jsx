// src/components/LoyaltyTaxCalculator.jsx - محاسبه مالیات علی‌الحساب با ضریب وفاداری
import React, { useState, useCallback } from 'react';
import './LoyaltyTaxCalculator.css';

// لیبل‌های سال‌ها
const YEAR_LABELS = ['امسال', 'سال قبل', 'دو سال قبل', 'سه سال قبل', 'چهار سال قبل'];

export default function LoyaltyTaxCalculator() {
  // State برای اطلاعات هویتی
  const [personalInfo, setPersonalInfo] = useState({
    fullName: '',
    economicCode: '',
    nationalCode: ''
  });

  // State برای اطلاعات مالی سه سال گذشته
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

  // State برای عملکرد مالیاتی ۵ سال گذشته
  const [taxPerformance, setTaxPerformance] = useState({
    taxFileHistory: [true, true, true, true, false], // سابقه تشکیل پرونده
    declarationHistory: [true, true, true, false, false], // سابقه تسلیم اظهارنامه
    onTimePayment: [true, true, false, true, false], // سابقه پرداخت سرموعد
    workfolderCompliance: [true, false, true, false, true], // سابقه انجام الزامات کارپوشه
    electronicInvoice: [true, true, true, false, false] // سابقه صورتحساب الکترونیکی
  });

  // State برای ماکزیمم درصد تخفیف
  const [maxDiscount, setMaxDiscount] = useState('');

  // State برای رکوردهای ذخیره شده
  const [savedRecords, setSavedRecords] = useState([]);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // فرمت کردن اعداد با جداکننده هزارگان
  const formatNumber = useCallback((value) => {
    if (!value) return '';
    const num = value.toString().replace(/[^\d]/g, '');
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }, []);

  // پارس اعداد
  const parseNumber = useCallback((value) => {
    if (!value) return 0;
    return parseInt(value.toString().replace(/[^\d]/g, '')) || 0;
  }, []);

  // تغییر اطلاعات هویتی
  const handlePersonalInfoChange = useCallback((field, value) => {
    setPersonalInfo(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // تغییر اطلاعات مالی سالانه
  const handleYearDataChange = useCallback((year, field, value) => {
    setYearData(prev => ({
      ...prev,
      [year]: {
        ...prev[year],
        [field]: value
      }
    }));
  }, []);

  // تغییر چک‌باکس‌های عملکرد مالیاتی
  const handlePerformanceChange = useCallback((category, yearIndex) => {
    setTaxPerformance(prev => ({
      ...prev,
      [category]: prev[category].map((val, idx) => idx === yearIndex ? !val : val)
    }));
  }, []);

  // محاسبه امتیاز عملکرد مالیاتی (نمره کل = تعداد تیک‌های انتخاب شده)
  const calculatePerformanceScore = useCallback(() => {
    let totalChecked = 0;

    Object.values(taxPerformance).forEach(category => {
      category.forEach(checked => {
        if (checked) totalChecked++;
      });
    });

    return totalChecked; // نمره کل = تعداد تیک‌ها
  }, [taxPerformance]);

  // محاسبه ضریب وفاداری
  // فرمول: ضریب وفاداری = نمره کل ÷ 25
  const calculateLoyaltyFactor = useCallback(() => {
    const totalScore = calculatePerformanceScore();
    // ضریب وفاداری = نمره کل تقسیم بر 25
    const loyaltyFactor = totalScore / 25;
    return Math.min(loyaltyFactor, 1); // حداکثر ۱
  }, [calculatePerformanceScore]);

  // محاسبه مالیات اولیه
  const handleCalculate = useCallback(async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      // بررسی فیلدهای اجباری
      if (!personalInfo.fullName || !personalInfo.nationalCode) {
        throw new Error('لطفاً نام و کد ملی را وارد کنید');
      }

      const loyaltyFactor = calculateLoyaltyFactor();
      const performanceScore = calculatePerformanceScore();
      
      // =============================================
      // مرحله ۱: محاسبات تعدیل
      // =============================================
      // فرمول تعدیل طبق فایل اکسل:
      // مقدار تعدیلی = مقدار اصلی + (ضریب تبدیل × مقدار اصلی)
      // یا: مقدار تعدیلی = مقدار اصلی × (1 + ضریب تبدیل)
      
      const adjustedYearData = {};
      Object.entries(yearData).forEach(([key, year]) => {
        const factor = parseFloat(year.conversionFactor) || 0;
        const declaredSales = parseNumber(year.declaredSales);
        const finalizedSales = parseNumber(year.finalizedSales);
        const declaredIncome = parseNumber(year.declaredIncome);
        const finalizedIncome = parseNumber(year.finalizedIncome);
        const declaredProfit = parseNumber(year.declaredProfit);
        const finalizedProfit = parseNumber(year.finalizedProfit);
        
        adjustedYearData[key] = {
          label: year.label,
          // فرمول: مقدار + (ضریب × مقدار) = مقدار × (1 + ضریب)
          declaredSalesAdj: declaredSales + (factor * declaredSales),
          finalizedSalesAdj: finalizedSales + (factor * finalizedSales),
          declaredIncomeAdj: declaredIncome + (factor * declaredIncome),
          finalizedIncomeAdj: finalizedIncome + (factor * finalizedIncome),
          declaredProfitAdj: declaredProfit + (factor * declaredProfit),
          finalizedProfitAdj: finalizedProfit + (factor * finalizedProfit),
          // مقادیر اصلی (بدون تعدیل)
          declaredSales,
          finalizedSales,
          declaredIncome,
          finalizedIncome,
          declaredProfit,
          finalizedProfit
        };
      });

      // =============================================
      // مرحله ۲: پیش‌بینی سال چهارم با رگرسیون خطی
      // =============================================
      // فرمول رگرسیون طبق فایل اکسل: y = bx + y0
      // b (ضریب افزایش) = میانگین افزایش سالیانه
      // b = ((مقدار_سال2 - مقدار_سال1) + (مقدار_سال3 - مقدار_سال2)) / 2
      // y0 (مبنای پایه) = مقدار_سال1 - (b × 1)
      // پیش‌بینی سال 4 = (4 × b) + y0
      
      const y3 = adjustedYearData.year3; // سال سوم قبل (قدیمی‌ترین)
      const y2 = adjustedYearData.year2; // سال دوم قبل
      const y1 = adjustedYearData.year1; // سال قبل (جدیدترین)

      // تابع محاسبه رگرسیون خطی
      const calcLinearRegression = (v1, v2, v3) => {
        // v1 = سال سوم قبل (قدیمی‌ترین)
        // v2 = سال دوم قبل
        // v3 = سال قبل (جدیدترین)
        
        // محاسبه b (ضریب افزایش)
        const b = ((v2 - v1) + (v3 - v2)) / 2;
        
        // محاسبه y0 (مبنای پایه)
        const y0 = v1 - (b * 1);
        
        // پیش‌بینی سال 4
        const prediction = (4 * b) + y0;
        
        return {
          b,
          y0,
          prediction: prediction > 0 ? prediction : 0 // جلوگیری از مقادیر منفی
        };
      };

      // محاسبه رگرسیون برای ابرازی
      const regressionDeclaredSales = calcLinearRegression(
        y3.declaredSalesAdj,
        y2.declaredSalesAdj,
        y1.declaredSalesAdj
      );
      
      const regressionDeclaredIncome = calcLinearRegression(
        y3.declaredIncomeAdj,
        y2.declaredIncomeAdj,
        y1.declaredIncomeAdj
      );
      
      const regressionDeclaredProfit = calcLinearRegression(
        y3.declaredProfitAdj,
        y2.declaredProfitAdj,
        y1.declaredProfitAdj
      );

      // محاسبه رگرسیون برای قطعی
      const regressionFinalizedSales = calcLinearRegression(
        y3.finalizedSalesAdj,
        y2.finalizedSalesAdj,
        y1.finalizedSalesAdj
      );
      
      const regressionFinalizedIncome = calcLinearRegression(
        y3.finalizedIncomeAdj,
        y2.finalizedIncomeAdj,
        y1.finalizedIncomeAdj
      );
      
      const regressionFinalizedProfit = calcLinearRegression(
        y3.finalizedProfitAdj,
        y2.finalizedProfitAdj,
        y1.finalizedProfitAdj
      );

      // محاسبه میانگین هم‌وزن شده سه سال
      // میانگین = (مقدار سال 1 + مقدار سال 2 + مقدار سال 3) / 3
      const avgDeclaredSales = (y3.declaredSalesAdj + y2.declaredSalesAdj + y1.declaredSalesAdj) / 3;
      const avgFinalizedSales = (y3.finalizedSalesAdj + y2.finalizedSalesAdj + y1.finalizedSalesAdj) / 3;
      const avgDeclaredIncome = (y3.declaredIncomeAdj + y2.declaredIncomeAdj + y1.declaredIncomeAdj) / 3;
      const avgFinalizedIncome = (y3.finalizedIncomeAdj + y2.finalizedIncomeAdj + y1.finalizedIncomeAdj) / 3;
      const avgDeclaredProfit = (y3.declaredProfitAdj + y2.declaredProfitAdj + y1.declaredProfitAdj) / 3;
      const avgFinalizedProfit = (y3.finalizedProfitAdj + y2.finalizedProfitAdj + y1.finalizedProfitAdj) / 3;

      // تخمین سال جاری: استفاده از پیش‌بینی رگرسیون
      const currentYearEstimate = {
        // پیش‌بینی با رگرسیون
        declaredSalesAdj: regressionDeclaredSales.prediction,
        finalizedSalesAdj: regressionFinalizedSales.prediction,
        declaredIncomeAdj: regressionDeclaredIncome.prediction,
        finalizedIncomeAdj: regressionFinalizedIncome.prediction,
        declaredProfitAdj: regressionDeclaredProfit.prediction,
        finalizedProfitAdj: regressionFinalizedProfit.prediction,
        
        // میانگین‌ها برای نمایش
        avgDeclaredSales,
        avgFinalizedSales,
        avgDeclaredIncome,
        avgFinalizedIncome,
        avgDeclaredProfit,
        avgFinalizedProfit,
        
        // ضرایب رگرسیون برای نمایش
        regressionCoefficients: {
          declaredSales: { b: regressionDeclaredSales.b.toFixed(2), y0: regressionDeclaredSales.y0.toFixed(2) },
          finalizedSales: { b: regressionFinalizedSales.b.toFixed(2), y0: regressionFinalizedSales.y0.toFixed(2) },
          declaredIncome: { b: regressionDeclaredIncome.b.toFixed(2), y0: regressionDeclaredIncome.y0.toFixed(2) },
          finalizedIncome: { b: regressionFinalizedIncome.b.toFixed(2), y0: regressionFinalizedIncome.y0.toFixed(2) },
          declaredProfit: { b: regressionDeclaredProfit.b.toFixed(2), y0: regressionDeclaredProfit.y0.toFixed(2) },
          finalizedProfit: { b: regressionFinalizedProfit.b.toFixed(2), y0: regressionFinalizedProfit.y0.toFixed(2) }
        }
      };

      // =============================================
      // مرحله ۳: محاسبه مالیات اولیه
      // =============================================
      // مالیات ابرازی اولیه = سود ابرازی تخمینی × 0.25
      // مالیات قطعی اولیه = سود قطعی تخمینی × 0.25
      const baseTaxDeclared = currentYearEstimate.declaredProfitAdj * 0.25;
      const baseTaxFinalized = currentYearEstimate.finalizedProfitAdj * 0.25;
      
      // =============================================
      // مرحله ۴: محاسبه ضریب وفاداری و تخفیف
      // =============================================
      // طبق فرمول فایل اکسل (شیت دوم - ردیف 35):
      // درصد تخفیف اعمالی = (مجموع وزن آیتم‌های مودی / ماکزیمم ضرایب مودیان نمونه) × ماکزیمم درصد تخفیف
      // مجموع وزن آیتم‌های مودی = نمره کل (تعداد تیک‌ها)
      // ماکزیمم ضرایب مودیان نمونه = 25
      // ماکزیمم درصد تخفیف = 50% (یا مقدار وارد شده توسط کاربر)
      
      const maxDiscountPercent = parseNumber(maxDiscount) || 50; // پیش‌فرض 50%
      const maxLoyaltyScore = 25; // ماکزیمم ضرایب طبق فایل اکسل
      
      // فرمول: (نمره_کل / 25) × ماکزیمم_درصد_تخفیف
      const actualDiscountPercent = (performanceScore / maxLoyaltyScore) * maxDiscountPercent;
      
      // =============================================
      // مرحله ۵: محاسبه مالیات نهایی
      // =============================================
      // مالیات ابرازی نهایی = مالیات ابرازی اولیه × (1 - تخفیف نهایی/100)
      // مالیات قطعی نهایی = مالیات قطعی اولیه × (1 - تخفیف نهایی/100)
      const discountMultiplier = 1 - (actualDiscountPercent / 100);
      const finalTaxDeclared = baseTaxDeclared * discountMultiplier;
      const finalTaxFinalized = baseTaxFinalized * discountMultiplier;
      
      // محاسبه مبلغ تخفیف برای نمایش
      const discountAmountDeclared = baseTaxDeclared - finalTaxDeclared;
      const discountAmountFinalized = baseTaxFinalized - finalTaxFinalized;

      setResult({
        loyaltyFactor: loyaltyFactor.toFixed(4),
        performanceScore: performanceScore, // نمره کل (تعداد تیک‌ها)
        // مالیات ابرازی
        baseTaxDeclared: baseTaxDeclared,
        discountAmountDeclared: discountAmountDeclared,
        finalTaxDeclared: finalTaxDeclared,
        // مالیات قطعی
        baseTaxFinalized: baseTaxFinalized,
        discountAmountFinalized: discountAmountFinalized,
        finalTaxFinalized: finalTaxFinalized,
        // سایر
        maxDiscountPercent: maxDiscountPercent,
        actualDiscountPercent: actualDiscountPercent.toFixed(2),
        loyaltyStatus: loyaltyFactor >= 0.8 ? 'عالی' : loyaltyFactor >= 0.6 ? 'خوب' : loyaltyFactor >= 0.4 ? 'متوسط' : 'ضعیف',
        adjustedYearData: adjustedYearData,
        currentYearEstimate: currentYearEstimate
      });

    } catch (err) {
      setError(err.message || 'خطا در محاسبه');
    } finally {
      setLoading(false);
    }
  }, [personalInfo, yearData, maxDiscount, calculateLoyaltyFactor, calculatePerformanceScore, parseNumber]);

  // ذخیره رکورد فعلی
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

  // خروجی Excel
  const handleExportExcel = useCallback(() => {
    if (savedRecords.length === 0) {
      setError('هیچ رکوردی برای خروجی وجود ندارد');
      return;
    }

    // ایجاد CSV
    const headers = [
      'نام و نام خانوادگی',
      'شماره اقتصادی',
      'کد ملی',
      'نمره کل',
      'ضریب وفاداری',
      'درصد تخفیف نهایی',
      'مالیات اولیه ابرازی',
      'مالیات اولیه قطعی',
      'مالیات ابرازی نهایی',
      'مالیات قطعی نهایی',
      'تاریخ ثبت'
    ];

    const csvContent = [
      '\uFEFF' + headers.join(','), // BOM for UTF-8
      ...savedRecords.map(record => [
        record.fullName,
        record.economicCode,
        record.nationalCode,
        record.performanceScore,
        record.loyaltyFactor,
        record.actualDiscountPercent + '%',
        Math.round(record.baseTaxDeclared),
        Math.round(record.baseTaxFinalized),
        Math.round(record.finalTaxDeclared),
        Math.round(record.finalTaxFinalized),
        record.createdAt
      ].join(','))
    ].join('\n');

    // دانلود فایل
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tax_records_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }, [savedRecords]);

  // حذف رکورد
  const handleDeleteRecord = useCallback((id) => {
    setSavedRecords(prev => prev.filter(record => record.id !== id));
  }, []);

  // رندر فیلدهای سالانه
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
                value={formatNumber(yearInfo.declaredSales)}
                onChange={(e) => handleYearDataChange(yearKey, 'declaredSales', e.target.value)}
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
                value={formatNumber(yearInfo.finalizedSales)}
                onChange={(e) => handleYearDataChange(yearKey, 'finalizedSales', e.target.value)}
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
                value={formatNumber(yearInfo.declaredIncome)}
                onChange={(e) => handleYearDataChange(yearKey, 'declaredIncome', e.target.value)}
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
                value={formatNumber(yearInfo.finalizedIncome)}
                onChange={(e) => handleYearDataChange(yearKey, 'finalizedIncome', e.target.value)}
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
                value={formatNumber(yearInfo.declaredProfit)}
                onChange={(e) => handleYearDataChange(yearKey, 'declaredProfit', e.target.value)}
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
                value={formatNumber(yearInfo.finalizedProfit)}
                onChange={(e) => handleYearDataChange(yearKey, 'finalizedProfit', e.target.value)}
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

  return (
    <div className="loyalty-tax-calculator">
      {/* هدر */}
      <header className="header">
        <div className="header-content">
          <h1>محاسبه مالیات علی‌الحساب</h1>
          <p>با در نظر گرفتن ضریب وفاداری</p>
        </div>
      </header>

      <div className="calculator-body">
        {/* بخش اطلاعات هویتی */}
        <section className="section personal-info-section">
          <h2 className="section-title">
            <span className="section-icon">👤</span>
            اطلاعات هویتی
          </h2>
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
                value={personalInfo.nationalCode}
                onChange={(e) => handlePersonalInfoChange('nationalCode', e.target.value)}
                placeholder="کد ملی را وارد کنید"
                maxLength={10}
              />
            </div>
          </div>
        </section>

        {/* بخش اطلاعات مالی */}
        <section className="section financial-info-section">
          <h2 className="section-title">
            <span className="section-icon">📊</span>
            اطلاعات مالی ۳ سال گذشته
          </h2>
          <div className="years-container">
            {Object.entries(yearData).map(([key, data]) => renderYearSection(key, data))}
          </div>
        </section>

        {/* بخش عملکرد مالیاتی ۵ سال گذشته */}
        <section className="section performance-section">
          <h2 className="section-title">
            <span className="section-icon">📈</span>
            عملکرد مالیاتی ۵ سال گذشته
          </h2>
          
          {/* سابقه تشکیل پرونده مالیاتی */}
          <div className="performance-row">
            <div className="performance-label">سابقه تشکیل پرونده مالیاتی</div>
            <div className="checkbox-group">
              {YEAR_LABELS.map((label, idx) => (
                <label key={`taxFile-${idx}`} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={taxPerformance.taxFileHistory[idx]}
                    onChange={() => handlePerformanceChange('taxFileHistory', idx)}
                  />
                  <span className="checkmark"></span>
                  <span className="checkbox-label">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* سابقه تسلیم اظهارنامه */}
          <div className="performance-row">
            <div className="performance-label">سابقه تسلیم اظهارنامه مالیاتی</div>
            <div className="checkbox-group">
              {YEAR_LABELS.map((label, idx) => (
                <label key={`declaration-${idx}`} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={taxPerformance.declarationHistory[idx]}
                    onChange={() => handlePerformanceChange('declarationHistory', idx)}
                  />
                  <span className="checkmark"></span>
                  <span className="checkbox-label">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* سابقه پرداخت سرموعد */}
          <div className="performance-row">
            <div className="performance-label">سابقه پرداخت سرموعد مالیات</div>
            <div className="checkbox-group">
              {YEAR_LABELS.map((label, idx) => (
                <label key={`payment-${idx}`} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={taxPerformance.onTimePayment[idx]}
                    onChange={() => handlePerformanceChange('onTimePayment', idx)}
                  />
                  <span className="checkmark"></span>
                  <span className="checkbox-label">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* سابقه انجام الزامات کارپوشه */}
          <div className="performance-row">
            <div className="performance-label">سابقه انجام الزامات کارپوشه</div>
            <div className="checkbox-group">
              {YEAR_LABELS.map((label, idx) => (
                <label key={`workfolder-${idx}`} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={taxPerformance.workfolderCompliance[idx]}
                    onChange={() => handlePerformanceChange('workfolderCompliance', idx)}
                  />
                  <span className="checkmark"></span>
                  <span className="checkbox-label">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* سابقه صورتحساب الکترونیکی */}
          <div className="performance-row">
            <div className="performance-label">سابقه انجام الزامات صورتحساب الکترونیکی</div>
            <div className="checkbox-group">
              {YEAR_LABELS.map((label, idx) => (
                <label key={`invoice-${idx}`} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={taxPerformance.electronicInvoice[idx]}
                    onChange={() => handlePerformanceChange('electronicInvoice', idx)}
                  />
                  <span className="checkmark"></span>
                  <span className="checkbox-label">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* ماکزیمم درصد تخفیف */}
          <div className="discount-section">
            <div className="input-group discount-input">
              <label>ماکزیمم درصد تخفیف (پیش‌فرض: 50%)</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  value={maxDiscount}
                  onChange={(e) => setMaxDiscount(e.target.value)}
                  placeholder="50"
                />
                <span className="unit">%</span>
              </div>
            </div>
          </div>
        </section>

        {/* دکمه محاسبه */}
        <div className="calculate-section">
          <button 
            className="calculate-btn"
            onClick={handleCalculate}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                در حال محاسبه...
              </>
            ) : (
              <>
                <span className="btn-icon">🧮</span>
                محاسبه ضریب وفاداری و مالیات نهایی
              </>
            )}
          </button>
        </div>

        {/* نمایش خطا */}
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {/* نمایش نتایج */}
        {result && (
          <section className="section results-section">
            <h2 className="section-title">
              <span className="section-icon">📋</span>
              نتایج محاسبه
            </h2>

            {/* الف) اطلاعات تعدیل‌شده سالانه */}
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
                        <td>{formatNumber(data.declaredSalesAdj)}</td>
                        <td>{formatNumber(data.finalizedSalesAdj)}</td>
                        <td>{formatNumber(data.declaredIncomeAdj)}</td>
                        <td>{formatNumber(data.finalizedIncomeAdj)}</td>
                        <td>{formatNumber(data.declaredProfitAdj)}</td>
                        <td>{formatNumber(data.finalizedProfitAdj)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ب) تخمین سال جاری با رگرسیون خطی */}
            <div className="current-year-estimate">
              <h3 className="subsection-title">ب) تخمین سال چهارم با رگرسیون خطی (y = bx + y0)</h3>
              
              {/* نمایش میانگین‌ها */}
              <div className="averages-section">
                <h4 className="mini-title">میانگین هم‌وزن شده سه سال</h4>
                <div className="estimate-grid compact">
                  <div className="estimate-item">
                    <span className="estimate-label">فروش ابرازی:</span>
                    <span className="estimate-value">{formatNumber(result.currentYearEstimate.avgDeclaredSales)} ریال</span>
                  </div>
                  <div className="estimate-item">
                    <span className="estimate-label">فروش قطعی:</span>
                    <span className="estimate-value">{formatNumber(result.currentYearEstimate.avgFinalizedSales)} ریال</span>
                  </div>
                  <div className="estimate-item">
                    <span className="estimate-label">درآمد ابرازی:</span>
                    <span className="estimate-value">{formatNumber(result.currentYearEstimate.avgDeclaredIncome)} ریال</span>
                  </div>
                  <div className="estimate-item">
                    <span className="estimate-label">درآمد قطعی:</span>
                    <span className="estimate-value">{formatNumber(result.currentYearEstimate.avgFinalizedIncome)} ریال</span>
                  </div>
                  <div className="estimate-item">
                    <span className="estimate-label">سود ابرازی:</span>
                    <span className="estimate-value">{formatNumber(result.currentYearEstimate.avgDeclaredProfit)} ریال</span>
                  </div>
                  <div className="estimate-item">
                    <span className="estimate-label">سود قطعی:</span>
                    <span className="estimate-value">{formatNumber(result.currentYearEstimate.avgFinalizedProfit)} ریال</span>
                  </div>
                </div>
              </div>

              {/* نمایش پیش‌بینی رگرسیون */}
              <div className="regression-section">
                <h4 className="mini-title">پیش‌بینی سال چهارم (رگرسیون)</h4>
                <div className="estimate-grid">
                  <div className="estimate-item">
                    <span className="estimate-label">فروش ابرازی تخمینی:</span>
                    <span className="estimate-value">{formatNumber(result.currentYearEstimate.declaredSalesAdj)} ریال</span>
                    <span className="regression-info">b={result.currentYearEstimate.regressionCoefficients.declaredSales.b}, y0={result.currentYearEstimate.regressionCoefficients.declaredSales.y0}</span>
                  </div>
                  <div className="estimate-item">
                    <span className="estimate-label">فروش قطعی تخمینی:</span>
                    <span className="estimate-value">{formatNumber(result.currentYearEstimate.finalizedSalesAdj)} ریال</span>
                    <span className="regression-info">b={result.currentYearEstimate.regressionCoefficients.finalizedSales.b}, y0={result.currentYearEstimate.regressionCoefficients.finalizedSales.y0}</span>
                  </div>
                  <div className="estimate-item">
                    <span className="estimate-label">درآمد ابرازی تخمینی:</span>
                    <span className="estimate-value">{formatNumber(result.currentYearEstimate.declaredIncomeAdj)} ریال</span>
                    <span className="regression-info">b={result.currentYearEstimate.regressionCoefficients.declaredIncome.b}, y0={result.currentYearEstimate.regressionCoefficients.declaredIncome.y0}</span>
                  </div>
                  <div className="estimate-item">
                    <span className="estimate-label">درآمد قطعی تخمینی:</span>
                    <span className="estimate-value">{formatNumber(result.currentYearEstimate.finalizedIncomeAdj)} ریال</span>
                    <span className="regression-info">b={result.currentYearEstimate.regressionCoefficients.finalizedIncome.b}, y0={result.currentYearEstimate.regressionCoefficients.finalizedIncome.y0}</span>
                  </div>
                  <div className="estimate-item highlight">
                    <span className="estimate-label">سود ابرازی تخمینی:</span>
                    <span className="estimate-value">{formatNumber(result.currentYearEstimate.declaredProfitAdj)} ریال</span>
                    <span className="regression-info">b={result.currentYearEstimate.regressionCoefficients.declaredProfit.b}, y0={result.currentYearEstimate.regressionCoefficients.declaredProfit.y0}</span>
                  </div>
                  <div className="estimate-item highlight">
                    <span className="estimate-label">سود قطعی تخمینی:</span>
                    <span className="estimate-value">{formatNumber(result.currentYearEstimate.finalizedProfitAdj)} ریال</span>
                    <span className="regression-info">b={result.currentYearEstimate.regressionCoefficients.finalizedProfit.b}, y0={result.currentYearEstimate.regressionCoefficients.finalizedProfit.y0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* نتایج مالیاتی */}
            <div className="tax-results">
              <h3 className="subsection-title">ج) نتایج مالیاتی</h3>
              <div className="results-grid">
                <div className="result-card">
                  <div className="result-label">نمره کل عملکرد</div>
                  <div className="result-value">
                    {result.performanceScore} از 25
                  </div>
                </div>
                <div className="result-card">
                  <div className="result-label">ضریب وفاداری</div>
                  <div className={`result-value loyalty-${result.loyaltyStatus === 'عالی' ? 'good' : result.loyaltyStatus === 'خوب' ? 'good' : result.loyaltyStatus === 'متوسط' ? 'medium' : 'poor'}`}>
                    {result.loyaltyFactor}
                  </div>
                  <div className={`loyalty-badge ${result.loyaltyStatus === 'عالی' ? 'good' : result.loyaltyStatus === 'خوب' ? 'good' : result.loyaltyStatus === 'متوسط' ? 'medium' : 'poor'}`}>
                    {result.loyaltyStatus}
                  </div>
                </div>
                <div className="result-card">
                  <div className="result-label">حداکثر تخفیف</div>
                  <div className="result-value">
                    {result.maxDiscountPercent}%
                  </div>
                </div>
                <div className="result-card highlight">
                  <div className="result-label">تخفیف نهایی</div>
                  <div className="result-value">
                    {result.actualDiscountPercent}%
                  </div>
                  <div className="result-formula">
                    (نمره کل / 25) × حداکثر تخفیف
                  </div>
                  <div className="result-calculation">
                    ({result.performanceScore} / 25) × {result.maxDiscountPercent}% = {result.actualDiscountPercent}%
                  </div>
                </div>
              </div>

              {/* جدول نتایج مالیاتی */}
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
                    <tr>
                      <td className="year-cell">مالیات اولیه (سود × 0.25)</td>
                      <td>{formatNumber(result.baseTaxDeclared)} ریال</td>
                      <td>{formatNumber(result.baseTaxFinalized)} ریال</td>
                    </tr>
                    <tr>
                      <td className="year-cell">تخفیف ({result.actualDiscountPercent}%)</td>
                      <td className="discount-cell">-{formatNumber(result.discountAmountDeclared)} ریال</td>
                      <td className="discount-cell">-{formatNumber(result.discountAmountFinalized)} ریال</td>
                    </tr>
                    <tr className="final-row">
                      <td className="year-cell">مالیات علی‌الحساب نهایی</td>
                      <td className="final-cell">{formatNumber(result.finalTaxDeclared)} ریال</td>
                      <td className="final-cell">{formatNumber(result.finalTaxFinalized)} ریال</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* دکمه ذخیره رکورد */}
            <div className="save-record-section">
              <button className="save-btn" onClick={handleSaveRecord}>
                <span className="btn-icon">💾</span>
                ذخیره رکورد فعلی
              </button>
            </div>
          </section>
        )}

        {/* جدول رکوردهای ثبت شده */}
        <section className="section records-section">
          <h2 className="section-title">
            <span className="section-icon">📁</span>
            جدول رکوردهای ثبت شده
          </h2>
          
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
                        <td>{formatNumber(Math.round(record.baseTaxDeclared))}</td>
                        <td>{formatNumber(Math.round(record.baseTaxFinalized))}</td>
                        <td>{formatNumber(Math.round(record.finalTaxDeclared))}</td>
                        <td>{formatNumber(Math.round(record.finalTaxFinalized))}</td>
                        <td>{record.createdAt}</td>
                        <td>
                          <button 
                            className="delete-btn"
                            onClick={() => handleDeleteRecord(record.id)}
                            title="حذف"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* دکمه خروجی Excel */}
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
