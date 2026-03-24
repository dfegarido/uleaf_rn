# Frontend Optimization Verification

Use this report after each optimization batch.

## Test environment

- App version:
- Device / OS:
- Build type (Debug/Release):
- Network condition:
- Date:

## Scenarios

1. Cold start to first interactive screen
2. Tab switching (`Shop -> Orders -> Live -> Cart -> Chat`)
3. Buyer `ScreenShop` load + refresh
4. Chat list + open conversation
5. Live list + stream enter/exit

## Before vs After metrics

| Scenario | JS FPS (before) | JS FPS (after) | UI FPS (before) | UI FPS (after) | Memory before | Memory after | Notes |
|---|---:|---:|---:|---:|---:|---:|---|
| Cold start |  |  |  |  |  |  |  |
| Tab switching |  |  |  |  |  |  |  |
| Buyer shop |  |  |  |  |  |  |  |
| Chat |  |  |  |  |  |  |  |
| Live |  |  |  |  |  |  |  |

## Regression checks

- [ ] Buyer browse/badges/filters still work correctly
- [ ] Chat unread badge and chat open flows are correct
- [ ] Live entry/exit still works
- [ ] Checkout/profile/orders flows unaffected
- [ ] No new warnings/errors in console during normal use

## Summary

- Primary bottlenecks fixed:
- Remaining bottlenecks:
- Next optimization targets:

