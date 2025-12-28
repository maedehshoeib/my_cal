# main.py (در ریشه پوشه tax-calculator-app)
import uvicorn
import sys
import os

# اضافه کردن backend به Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from backend.api import app

if __name__ == "__main__":
    # اجرای سرور
    # آدرس: http://localhost:8000
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000,
        reload=True  # بازآغازی خودکار هنگام تغییر فایل
    )
