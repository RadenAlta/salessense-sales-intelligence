#!/usr/bin/env python3
"""Create auditable JSON data from official 200_sales_data.csv workshop input."""
import csv, json, datetime, hashlib
from collections import Counter
from pathlib import Path

root=Path(__file__).resolve().parent
source=root/'data'/'200_sales_data_original.csv'
OUTPUT=root/'data'/'sales_data.json'
REPORT=root/'data'/'data_quality_report.json'
required=['Product_ID','Sale_Date','Sales_Rep','Region','Sales_Amount','Quantity_Sold','Product_Category','Unit_Cost','Unit_Price','Customer_Type','Discount','Payment_Method','Sales_Channel','Region_and_Sales_Rep']
valid=[]; issues=[]
with source.open(encoding='utf-8-sig',newline='') as f:
    reader=csv.reader(f)
    header=next(reader)
    header[0]=header[0].replace('ï»¿','').lstrip('\ufeff')
    for lineno,row in enumerate(reader,2):
        try:
            if len(row)<14: raise ValueError('kurang dari 14 kolom')
            d=dict(zip(required,row[:14]))
            if any(not str(d[k]).strip() for k in required):raise ValueError('kolom penting kosong')
            for cat,allowed in {'Region':['North','South','East','West'],'Customer_Type':['New','Returning'],'Sales_Channel':['Online','Retail'],'Payment_Method':['Cash','Credit Card','Bank Transfer'],'Product_Category':['Clothing','Furniture','Food','Electronics']}.items():
                if d[cat] not in allowed:raise ValueError(f'{cat} tidak valid: {d[cat]!r}')
            try:dt=datetime.datetime.strptime(d['Sale_Date'],'%m/%d/%Y')
            except: raise ValueError('format tanggal tidak valid')
            amount=float(d['Sales_Amount']); quantity=int(d['Quantity_Sold']); discount=float(d['Discount']); cost=float(d['Unit_Cost']); price=float(d['Unit_Price'])
            if not(0<=discount<=1 and amount>=0 and quantity>0 and cost>=0 and price>=0):raise ValueError('nilai numerik di luar rentang wajar')
            rec={
                'transaction_id':f'SALE-{lineno-1:04d}',
                'product_id':d['Product_ID'],
                'date':dt.strftime('%Y-%m-%d'),
                'sales_rep':d['Sales_Rep'],
                'region':d['Region'],
                'sales_amount':round(amount,2),
                'quantity_sold':quantity,
                'product_category':d['Product_Category'],
                'unit_cost':cost,
                'unit_price':price,
                'customer_type':d['Customer_Type'],
                'discount':discount,
                'payment_method':d['Payment_Method'],
                'sales_channel':d['Sales_Channel'],
            }
            valid.append(rec)
        except Exception as e:issues.append({'source_line':lineno,'reason':str(e),'raw_row':row[:18]})
assert len(valid)+len(issues)==lineno-1
OUTPUT.write_text(json.dumps(valid,ensure_ascii=False,indent=2),encoding='utf-8')
report={
 'source_file':source.name,
 'source_url':'https://drive.google.com/file/d/1gIV-unupWtXoHMMqwHdFqwoZGo9I-80S/view',
 'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),
 'received_rows':len(valid)+len(issues),
 'valid_rows':len(valid),
 'excluded_rows':len(issues),
 'exclusions':issues,
 'date_range':{'min':min(r['date'] for r in valid),'max':max(r['date'] for r in valid)},
 'total_revenue':round(sum(r['sales_amount'] for r in valid),2),
 'total_quantity':sum(r['quantity_sold'] for r in valid),
 'average_discount_percent':round(100*sum(r['discount'] for r in valid)/len(valid),2),
 'revenue_currency':'dataset tidak menyebutkan mata uang; UI menggunakan satuan generik (unit)',
 'validation_policy':'Baris tidak lengkap/kolom bergeser/diskon tidak masuk akal dikeluarkan. Sales_Amount dipakai langsung, bukan dihitung dari qty x Unit_Price karena data sumber tidak konsisten.'
}
REPORT.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:report[k] for k in ['received_rows','valid_rows','excluded_rows','total_revenue','total_quantity','average_discount_percent']},indent=2))
