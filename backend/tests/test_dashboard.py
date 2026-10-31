"""Dashboard: today vs yesterday, money moved today, fleet, stock, and profit only for the owner."""

from decimal import Decimal

from tests.conftest import TODAY
from tests.test_core_flow import challan, purchase


def test_dashboard_today_money_fleet_stock(world, accountant):
    purchase(world, "10", "2000")
    challan(world, "2", payment={"amount": "1000", "money_account_id": world.cash["id"], "mode": "cash"})
    voided = challan(world, "1")
    world.post(f"/deliveries/{voided['id']}/void", {"reason": "mistake"}, expect=200)

    d = world.get("/reports/dashboard")
    assert d["trips_today"] == 1 and Decimal(d["sales_today"]) == 6000
    assert len(d["daily"]) == 14 and d["daily"][-1] == {"date": str(TODAY), "sales": "6000.00", "trips": 1}
    # the voided challan's post + reversal is not "money moved"; the 1000 received is
    assert Decimal(d["money_in_today"]) == 1000

    tractor = next(v for v in d["vehicles"] if v["id"] == world.tractor["id"])
    assert tractor["trips"] == 1
    assert any(v["id"] == world.loader["id"] and v["trips"] == 0 for v in d["vehicles"])  # idle ones listed too

    assert {s["material"]: s["qty"] for s in d["stock"]}["Rait"] == "8.000"
    assert Decimal(d["profit_month"]["income"]) == 6000

    # the munshi sees everything except profit
    m = world.c.get("/api/v1/reports/dashboard", headers=accountant).json()
    assert m["profit_month"] is None and m["trips_today"] == 1
