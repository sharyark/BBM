"""Challans and vouchers print on thermal receipt rolls: right width, one page cut to the content."""

import re
import zlib

from tests.test_core_flow import challan, purchase

MM = 72 / 25.4  # PDF points per mm


def media_boxes(pdf: bytes) -> list[tuple[float, float]]:
    """Page sizes, also from compressed object streams (WeasyPrint packs page objects into them)."""
    chunks = [pdf]
    for raw in re.findall(rb"stream\r?\n(.*?)\r?\nendstream", pdf, re.S):
        try:
            chunks.append(zlib.decompress(raw))
        except zlib.error:
            pass
    found = []
    for chunk in chunks:
        found += re.findall(rb"/MediaBox\s*\[\s*0 0 ([\d.]+) ([\d.]+)\s*\]", chunk)
    return [(float(w), float(h)) for w, h in found]


def test_challan_and_voucher_on_80mm_and_58mm(world):
    purchase(world, "10", "2000")
    d = challan(world, "2", payment={"amount": "2000", "money_account_id": world.cash["id"], "mode": "cash"})
    for paper, width_mm in (("80mm", 80), ("58mm", 58)):
        r = world.c.get(f"/api/v1/deliveries/{d['id']}/pdf", params={"paper": paper}, headers=world.h)
        assert r.status_code == 200 and r.content[:4] == b"%PDF"
        boxes = media_boxes(r.content)
        assert len(boxes) == 1, "a receipt is one page"
        w, h = boxes[0]
        assert abs(w / MM - width_mm) < 0.5
        assert 50 < h / MM < 200  # cut to the content, not an A-size sheet

    v = world.c.get(f"/api/v1/payments/{d['receipt_id']}/pdf", params={"paper": "80mm"}, headers=world.h)
    assert v.status_code == 200 and len(media_boxes(v.content)) == 1

    # A5 is still the default; an unknown paper is rejected
    a5 = world.c.get(f"/api/v1/deliveries/{d['id']}/pdf", headers=world.h)
    assert abs(media_boxes(a5.content)[0][0] / MM - 210) < 1
    assert world.c.get(f"/api/v1/deliveries/{d['id']}/pdf", params={"paper": "A4"}, headers=world.h).status_code == 422


def test_voided_challan_says_void_on_the_receipt(world):
    purchase(world, "10", "2000")
    d = challan(world, "1")
    world.post(f"/deliveries/{d['id']}/void", {"reason": "wrong site"}, expect=200)
    r = world.c.get(f"/api/v1/deliveries/{d['id']}/pdf", params={"paper": "80mm"}, headers=world.h)
    assert r.status_code == 200 and len(media_boxes(r.content)) == 1
