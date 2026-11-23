from playwright.sync_api import sync_playwright
from pathlib import Path
from shutil import which
import json

ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/'index.html').read_text(encoding='utf-8')
css=(ROOT/'style.css').read_text(encoding='utf-8')
js=(ROOT/'script.js').read_text(encoding='utf-8')
data=json.loads((ROOT/'data'/'sales_data.json').read_text(encoding='utf-8'))
import re
html=re.sub(r'<link[^>]*rel="stylesheet"[^>]*>', '',html)
html=re.sub(r'<script.*?</script>', '',html,flags=re.DOTALL)
css=css.split('\n',1)[1]
results={}
with sync_playwright() as p:
  chromium_path=which('chromium') or which('chromium-browser')
  launch_options={'headless':True}
  if chromium_path:
    launch_options['executable_path']=chromium_path
  browser=p.chromium.launch(**launch_options)
  page=browser.new_page(viewport={'width':1440,'height':950},device_scale_factor=1)
  errors=[]
  page.on('pageerror',lambda exc: errors.append(str(exc)))
  page.set_content(html, wait_until='domcontentloaded')
  page.add_style_tag(content=css)
  page.evaluate('window.fetch = async function() { return new Response(JSON.stringify(window.TEST_SALES_DATA), {status:200,headers:{"content-type":"application/json"}}); }')
  page.evaluate('(records)=>{window.TEST_SALES_DATA=records}',data)
  page.add_script_tag(content=js)
  page.wait_for_function('window.SalesSenseTest && window.SalesSenseTest.getRecords().length===198',timeout=15000)
  records=page.evaluate('window.SalesSenseTest.getRecords().length')
  revenue=page.locator('#kpiRevenue').inner_text()
  qty=page.locator('#kpiQuantity').inner_text()
  avg=page.locator('#kpiDiscount').inner_text()
  assert records==198, records
  assert revenue=='1,061,007.89 u', revenue
  assert qty=='4,681',qty
  assert avg=='14.95%',avg
  for c in ['trendChart','regionChart','categoryChart','repChart','customerChart','paymentChart','channelChart','scatterChart','topChart','quantityChart']:
    assert page.locator('#'+c+' svg').count()==1, c
  page.screenshot(path=str(ROOT/'screenshots'/'dashboard_desktop.png'),full_page=True)
  # data-aware agent
  page.locator('#agentInput').fill('Wilayah dengan revenue tertinggi?')
  page.locator('#agentForm button').click()
  agentText=page.locator('.assistant-bubble').last.locator('p').inner_text()
  assert 'Segmen dengan revenue terbesar' in agentText, agentText
  assert 'North' in agentText or 'South' in agentText or 'West' in agentText or 'East' in agentText
  assert 'GROUP BY region' in page.locator('#agentTrace').inner_text()
  page.locator('#regionFilter').select_option('North')
  north=page.evaluate('window.SalesSenseTest.getFiltered().length')
  assert north>0 and north<198,north
  assert page.locator('#kpiTransactions').inner_text()==str(north)
  assert page.locator('#regionChart svg').count()==1
  page.locator('#resetFilters').click()
  assert page.locator('#kpiTransactions').inner_text()=='198'
  page.locator('#agent').screenshot(path=str(ROOT/'screenshots'/'agent_playground.png'))
  results['desktop']={'rows':records,'revenue':revenue,'quantity':qty,'average_discount':avg,'agent_reply':agentText,'north_rows':north,'charts_validated':10,'js_page_errors':errors}
  assert not errors, errors
  mobile=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True)
  mobile.set_content(html,wait_until='domcontentloaded')
  mobile.add_style_tag(content=css)
  mobile.evaluate('window.fetch = async function() { return new Response(JSON.stringify(window.TEST_SALES_DATA), {status:200,headers:{"content-type":"application/json"}}); }')
  mobile.evaluate('(records)=>{window.TEST_SALES_DATA=records}',data)
  mobile.add_script_tag(content=js)
  mobile.wait_for_function('window.SalesSenseTest && window.SalesSenseTest.getRecords().length===198',timeout=15000)
  mobile.screenshot(path=str(ROOT/'screenshots'/'dashboard_mobile.png'),full_page=True)
  overflow=mobile.evaluate('document.documentElement.scrollWidth-document.documentElement.clientWidth')
  results['mobile']={'horizontal_overflow_px':overflow,'kpi_transactions':mobile.locator('#kpiTransactions').inner_text()}
  assert overflow<=1,overflow
  browser.close()
(ROOT/'tests'/'test_results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(results,ensure_ascii=False,indent=2))
