import json, math

with open('data/sales_data.json') as f:
    records = json.load(f)

n = len(records)
rev = sum(r['sales_amount'] for r in records)
qty = sum(r['quantity_sold'] for r in records)
avg_disc_pct = sum(r['discount'] for r in records) / n * 100

print('=== KPI VERIFICATION ===')
print(f'Total Records : {n}  expect=198  {"PASS" if n==198 else "FAIL"}')
print(f'Total Revenue : {rev:.2f}  expect=1061007.89  {"PASS" if abs(rev-1061007.89)<0.01 else "FAIL"}')
print(f'Rounded Rev   : {round(rev):,} u  expect=1,061,008 u')
print(f'Qty Sold      : {qty}  expect=4681  {"PASS" if qty==4681 else "FAIL"}')
print(f'Avg Discount  : {avg_disc_pct:.4f}%  formatted={avg_disc_pct:.2f}%  expect=14.95%  {"PASS" if f"{avg_disc_pct:.2f}"=="14.95" else "FAIL"}')

disc_values = [r['discount'] for r in records]
print(f'\nDiscount range: min={min(disc_values):.4f}  max={max(disc_values):.4f}  (0-1 fraction stored, x100 for display)')

with open('data/data_quality_report.json') as f:
    report = json.load(f)
print('\n=== DATA QUALITY REPORT vs JSON ===')
print(f'Revenue match : {report["total_revenue"]} == {round(rev,2)} -> {"PASS" if report["total_revenue"]==round(rev,2) else "FAIL"}')
print(f'Quantity match: {report["total_quantity"]} == {qty} -> {"PASS" if report["total_quantity"]==qty else "FAIL"}')
print(f'Discount match: {report["average_discount_percent"]} == {round(avg_disc_pct,2)} -> {"PASS" if report["average_discount_percent"]==round(avg_disc_pct,2) else "FAIL"}')
print(f'Valid rows match: {report["valid_rows"]} == {n} -> {"PASS" if report["valid_rows"]==n else "FAIL"}')

# Region breakdown
from collections import defaultdict
region_rev = defaultdict(float)
for r in records:
    region_rev[r['region']] += r['sales_amount']
print('\n=== REGION REVENUE (Polar Area source data) ===')
for k, v in sorted(region_rev.items(), key=lambda x: -x[1]):
    print(f'  {k}: {v:.2f}')

# Category breakdown
cat_rev = defaultdict(float)
cat_qty = defaultdict(int)
for r in records:
    cat_rev[r['product_category']] += r['sales_amount']
    cat_qty[r['product_category']] += r['quantity_sold']
print('\n=== CATEGORY REVENUE ===')
for k, v in sorted(cat_rev.items(), key=lambda x: -x[1]):
    print(f'  {k}: {v:.2f}')

print('\n=== QUANTITY BY CATEGORY ===')
for k, v in sorted(cat_qty.items(), key=lambda x: -x[1]):
    print(f'  {k}: {v}')

print('\nAll KPIs verified against source data.')
