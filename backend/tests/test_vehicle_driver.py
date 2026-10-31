"""Driver auto-fill: regular driver, absent driver skipped, and the day's substitute remembered."""

import datetime as dt

from tests.conftest import TODAY
from tests.test_core_flow import challan, purchase


def suggestion(w, vehicle_id, on=TODAY):
    return w.get(f"/masters/vehicles/{vehicle_id}/driver", on=str(on))


def mark(w, staff_id, status, on=TODAY):
    r = w.c.put(
        "/api/v1/labour/attendance",
        json={"entries": [{"date": str(on), "staff_id": staff_id, "status": status}]},
        headers=w.h,
    )
    assert r.status_code == 200, r.text


def test_regular_driver_then_substitute_when_absent(world, accountant):
    tractor, regular = world.tractor["id"], world.driver["id"]
    spare = world.post(
        "/masters/staff", {"name": "Spare Driver", "role": "driver", "wage_type": "daily", "wage_amount": "900"}
    )

    s = suggestion(world, tractor)
    assert s == {"driver_id": regular, "source": "regular", "regular_driver_id": regular, "regular_absent": False,
                 "absent_driver_ids": []}  # fmt: skip

    # regular driver absent: nobody is suggested, the form asks the munshi to pick
    mark(world, regular, "absent")
    s = suggestion(world, tractor)
    assert s["driver_id"] is None and s["regular_absent"] and s["absent_driver_ids"] == [regular]

    # the munshi picks the spare once; the vehicle's next entries that day get the spare
    purchase(world, "10", "2000")
    challan(world, "1", driver_id=spare["id"])
    s = world.c.get(f"/api/v1/masters/vehicles/{tractor}/driver", params={"on": str(TODAY)}, headers=accountant).json()
    assert s["driver_id"] == spare["id"] and s["source"] == "today"

    # next day the regular driver is back (not marked absent)
    tomorrow = TODAY + dt.timedelta(days=1)
    assert suggestion(world, tractor, tomorrow)["driver_id"] == regular


def test_substitute_used_on_a_present_day_and_unknown_vehicle(world):
    purchase(world, "10", "2000")
    spare = world.post(
        "/masters/staff", {"name": "Spare", "role": "driver", "wage_type": "daily", "wage_amount": "900"}
    )
    challan(world, "1", driver_id=spare["id"])  # regular is present but the munshi chose someone else
    assert suggestion(world, world.tractor["id"])["driver_id"] == spare["id"]

    # a vehicle with no regular driver and no trips yet
    assert suggestion(world, world.loader["id"])["driver_id"] is None
    assert world.c.get("/api/v1/masters/vehicles/9999/driver", headers=world.h).status_code == 404
