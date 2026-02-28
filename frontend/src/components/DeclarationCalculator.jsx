// src/components/DeclarationCalculator.jsx - کامل با لوگو
import React, { useState, useCallback } from 'react';
import axios from 'axios';
import './DeclarationCalculator.css';

const API_BASE_URL = '/api/v1';

export default function DeclarationCalculator() {
  // State ها
  const [taxpayerInfo, setTaxpayerInfo] = useState({
    taxpayer_name: '',
    taxpayer_id: '',
    previous_year_income: ''
  });

  const [activities, setActivities] = useState([
    { id: 1, code: '1', name: '', activity_type: 'goods', activity_percentage: '', non_specialized_percentage: '', sales: '' }
  ]);

  const [profitLoss, setProfitLoss] = useState({
    goods_sales: '',
    service_sales: '',
    goods_cogs: '',
    service_cogs: '',
    admin_expenses: ''
  });

  const [otherDeductions, setOtherDeductions] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // فرمت کردن اعداد
  const formatCurrency = useCallback((num) => {
    if (!num) return '0 ریال';
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      minimumFractionDigits: 0
    }).format(parseInt(num));
  }, []);

  // پارس اعداد فارسی/لاتین
  const parseNumber = useCallback((value) => {
    if (!value) return 0;
    return parseInt(value.toString().replace(/[^\d]/g, '')) || 0;
  }, []);

  // تغییر اطلاعات مودی
  const handleTaxpayerChange = useCallback((field, value) => {
    setTaxpayerInfo(prev => ({
      ...prev,
      [field]: field === 'previous_year_income' ? value : value
    }));
  }, []);

  // تغییر فعالیت
  const handleActivityChange = useCallback((id, field, value) => {
    setActivities(prev => prev.map(activity => 
      activity.id === id 
        ? { ...activity, [field]: field.includes('percentage') || field === 'sales' ? value : value }
        : activity
    ));
  }, []);

  // اضافه کردن فعالیت جدید
  const addActivity = useCallback(() => {
    const newId = Math.max(...activities.map(a => a.id)) + 1;
    setActivities(prev => [...prev, {
      id: newId,
      code: newId.toString(),
      name: '',
      activity_type: 'goods',
      activity_percentage: '',
      non_specialized_percentage: '',
      sales: ''
    }]);
  }, [activities]);

  // حذف فعالیت
  const removeActivity = useCallback((id) => {
    if (activities.length > 1) {
      setActivities(prev => prev.filter(activity => activity.id !== id));
    }
  }, [activities.length]);

  // تغییر صورت سود و زیان
  const handlePLChange = useCallback((field, value) => {
    setProfitLoss(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // محاسبه اظهارنامه
  const handleCalculate = useCallback(async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      // آماده‌سازی داده‌ها
      const requestData = {
        taxpayer_name: taxpayerInfo.taxpayer_name.trim(),
        taxpayer_id: taxpayerInfo.taxpayer_id.trim(),
        previous_year_income: parseNumber(taxpayerInfo.previous_year_income),
        activities: activities.map(activity => ({
          code: activity.code,
          name: activity.name.trim(),
          activity_type: activity.activity_type,
          activity_percentage: parseNumber(activity.activity_percentage),
          non_specialized_percentage: parseNumber(activity.non_specialized_percentage),
          sales: parseNumber(activity.sales)
        })).filter(activity => activity.name && activity.sales > 0),
        profit_loss: {
          goods_sales: parseNumber(profitLoss.goods_sales),
          service_sales: parseNumber(profitLoss.service_sales),
          goods_cogs: parseNumber(profitLoss.goods_cogs),
          service_cogs: parseNumber(profitLoss.service_cogs),
          admin_expenses: parseNumber(profitLoss.admin_expenses)
        },
        other_deductions: parseNumber(otherDeductions)
      };

      // اعتبارسنجی ساده
      if (!requestData.taxpayer_name) throw new Error('نام مودی الزامی است');
      if (!requestData.taxpayer_id) throw new Error('شناسه ملی/اقتصادی الزامی است');
      if (requestData.activities.length === 0) throw new Error('حداقل یک فعالیت معتبر وارد کنید');

      // ارسال به API
      const response = await axios.post(`${API_BASE_URL}/calculate`, requestData, {
        timeout: 10000
      });

      setResult(response.data);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message;
      setError(Array.isArray(errorMsg) ? errorMsg.join(' | ') : errorMsg);
    } finally {
      setLoading(false);
    }
  }, [taxpayerInfo, activities, profitLoss, otherDeductions]);

  return (
    <div className="declaration-calculator" dir="rtl">
      {/* Header با لوگو */}
      <header className="header">
        {/* لوگو وسوق */}
        <div className="logo-container">
          <img 
            src="/Logo-Vosouq.png" 
            alt="وسوق" 
            className="main-logo"
          />
        </div>
        
        {/* عنوان */}
        <div className="header-content">
          <h1> ماشین حساب تبصره 100</h1>
          <p>محاسبه خودکار مالیات عملکرد اشخاص حقیقی و حقوقی</p>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          ⚠️ {error}
        </div>
      )}

      {/* اطلاعات مودی */}
      <section className="section taxpayer-section">
        <h2>👤 اطلاعات مودی</h2>
        <div className="form-grid">
          <div className="form-group">
            <label>نام و نام خانوادگی *</label>
            <input
              value={taxpayerInfo.taxpayer_name}
              onChange={(e) => handleTaxpayerChange('taxpayer_name', e.target.value)}
              placeholder="احمد محمدی"
            />
          </div>
          <div className="form-group">
            <label>شناسه ملی / اقتصادی *</label>
            <input
              value={taxpayerInfo.taxpayer_id}
              onChange={(e) => handleTaxpayerChange('taxpayer_id', e.target.value)}
              placeholder="14001234567"
            />
          </div>
          <div className="form-group">
            <label>درآمد سال قبل (ریال)</label>
            <input
              value={taxpayerInfo.previous_year_income}
              onChange={(e) => handleTaxpayerChange('previous_year_income', e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
      </section>

      {/* جدول فعالیت‌ها */}
      <section className="section activities-section">
        <div className="section-header">
          <h2>🏢 نسبت سود فعالیت</h2>
          <button onClick={addActivity} className="btn-add" disabled={loading}>
            ➕ فعالیت جدید
          </button>
        </div>
        <div className="table-container">
          <table className="activities-table">
            <thead>
              <tr>
                <th>کد</th>
                <th>شرح فعالیت</th>
                <th>نوع</th>
                <th>% فعالیت</th>
                <th>% ناویژگی</th>
                <th>فروش (ریال)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {activities.map((activity) => (
                <tr key={activity.id}>
                  <td><input value={activity.code} onChange={(e) => handleActivityChange(activity.id, 'code', e.target.value)} className="input-small" /></td>
                  <td><input value={activity.name} onChange={(e) => handleActivityChange(activity.id, 'name', e.target.value)} placeholder="فروش کالا" /></td>
                  <td>
                    <select value={activity.activity_type} onChange={(e) => handleActivityChange(activity.id, 'activity_type', e.target.value)}>
                      <option value="goods">کالا</option>
                      <option value="services">خدمات</option>
                      <option value="industrial">صنعتی</option>
                    </select>
                  </td>
                  <td><input value={activity.activity_percentage} onChange={(e) => handleActivityChange(activity.id, 'activity_percentage', e.target.value)} className="input-small" /></td>
                  <td><input value={activity.non_specialized_percentage} onChange={(e) => handleActivityChange(activity.id, 'non_specialized_percentage', e.target.value)} className="input-small" /></td>
                  <td><input value={activity.sales} onChange={(e) => handleActivityChange(activity.id, 'sales', e.target.value)} className="input-number" /></td>
                  <td>
                    <button 
                      onClick={() => removeActivity(activity.id)} 
                      className="btn-delete"
                      disabled={activities.length === 1 || loading}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* صورت سود و زیان */}
      <section className="section pl-section">
        <h2>📊 صورت سود و زیان</h2>
        <div className="form-grid">
          <div className="form-group">
            <label>فروش کالا (ریال)</label>
            <input value={profitLoss.goods_sales} onChange={(e) => handlePLChange('goods_sales', e.target.value)} />
          </div>
          <div className="form-group">
            <label>فروش خدمات (ریال)</label>
            <input value={profitLoss.service_sales} onChange={(e) => handlePLChange('service_sales', e.target.value)} />
          </div>
          <div className="form-group">
            <label>بهای تمام شده کالا (ریال)</label>
            <input value={profitLoss.goods_cogs} onChange={(e) => handlePLChange('goods_cogs', e.target.value)} />
          </div>
          <div className="form-group">
            <label>بهای تمام شده خدمات (ریال)</label>
            <input value={profitLoss.service_cogs} onChange={(e) => handlePLChange('service_cogs', e.target.value)} />
          </div>
          <div className="form-group">
            <label>هزینه‌های اداری و عمومی (ریال)</label>
            <input value={profitLoss.admin_expenses} onChange={(e) => handlePLChange('admin_expenses', e.target.value)} />
          </div>
          <div className="form-group full-width">
            <label>سایر کسورات قانونی (ریال)</label>
            <input 
              value={otherDeductions} 
              onChange={(e) => setOtherDeductions(e.target.value)}
              placeholder="بیمه، شهرداری و ..."
            />
          </div>
        </div>
      </section>

      {/* دکمه محاسبه */}
      <div className="calculate-section">
        <button 
          onClick={handleCalculate} 
          disabled={loading}
          className="btn-calculate"
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              در حال محاسبه...
            </>
          ) : (
            '🧮 محاسبه اظهارنامه'
          )}
        </button>
      </div>

      {/* نتایج */}
      {result && (
        <section className="results-section">
          <h2>📈 نتایج محاسبه</h2>
          
          {/* خلاصه مالی */}
          <div className="summary-cards">
            <div className="summary-card">
              <div className="summary-label">سود ناخالص</div>
              <div className="summary-value">
                {formatCurrency(result.data.profit_loss_statement.gross_profit)}
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-label">سود خالص</div>
              <div className="summary-value">
                {formatCurrency(result.data.profit_loss_statement.net_profit)}
              </div>
            </div>
            <div className="summary-card highlight">
              <div className="summary-label">درآمد مشمول مالیات</div>
              <div className="summary-value">
                {formatCurrency(result.data.deductions_and_exemptions.taxable_income)}
              </div>
            </div>
          </div>

          {/* سه سناریو */}
          <div className="scenarios-grid">
            {Object.entries(result.data.tax_scenarios).map(([key, scenario]) => (
              <div key={key} className={`scenario-card ${key}`}>
                <div className="scenario-title">{scenario.method}</div>
                <div className="scenario-tax">
                  <span>مالیات:</span>
                  <strong>{formatCurrency(scenario.final_tax)}</strong>
                </div>
                {scenario.reduction_amount > 0 && (
                  <div className="scenario-discount">
                    تخفیف: <strong style={{color: '#4caf50'}}>
                      {formatCurrency(scenario.reduction_amount)}
                    </strong>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
