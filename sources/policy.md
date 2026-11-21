# 替代采购规则

仅考虑图中明确的替代关系。库存、交期、预算和供应商风险须同时通过。

## 可执行规则（人工编写）

```json policy
{
  "max_supplier_risk": 0.2,
  "require_released_supplier": true,
  "ranking": [
    "lead_days",
    "total_cost",
    "sku"
  ]
}
```

选择交期最短的方案；同交期时选择总价较低者。供应商暂停通知优先于风险分数。
