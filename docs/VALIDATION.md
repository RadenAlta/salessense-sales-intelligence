# Quality validation and limitations

The metrics below are reproducible against `data/sales_data.json` and match the IBM Bob review on 23 November 2026.

| Check | Result |
| --- | --- |
| Record count | 198 (3 of 201 source rows rejected) |
| Sum of `sales_amount` | 1,061,007.89 unspecified units |
| Sum of `quantity_sold` | 4,681 |
| Average discount | 14.95% |
| Top region (revenue) | North, 317,372.74 units |
| Charts rendered | 10, including regional polar area |
| Browser Playwright | Passed in Chromium with offline SVG chart fallback |
| Mobile horizontal overflow | 0 px at tested 390 px viewport |
| Browser page exceptions | 0 in the recorded local test |

## How to repeat checks

From the project folder:

```powershell
py verify_kpi.py
py verify_agent.py
node --check script.js
py -m pip install playwright
py -m playwright install chromium
py tests/test_dashboard.py
```

### Known limitations

- The **Insight Agent is rule-based** and only handles predefined intent families. It does not use IBM Granite or call an LLM.
- The workshop source CSV contains malformed/incomplete rows. Three are removed; values are not fabricated to fill gaps.
- Monetary units are **unspecified**. No currency is assumed.
- Browser regression test uses offline chart fallback; it cannot certify third-party CDN uptime.
- No production database, login, deployment telemetry, or real-time API is included.

## Privacy

Only UI screenshots generated from the project, code, validated educational dataset, and generic test output are public. Private IBM Bob session screenshots, account email, submission documents and form responses are intentionally omitted.
