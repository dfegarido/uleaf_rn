# Frontend Optimization Rollout Checklist

Reference: [react-native-0.75-optimization-best-practices](./react-native-0.75-optimization-best-practices.md)

## 1) Baseline profiling (run before each optimization wave)

Capture these scenarios on a release-like build:

- App cold start to first interactive screen
- Tab switches: `Shop -> Orders -> Live -> Cart -> Chat`
- Buyer `ScreenShop` load + pull-to-refresh
- Buyer chat list open + group chat open
- Buyer live list open + live stream enter/exit

Record:

- JS FPS / dropped frames
- UI FPS / dropped frames
- Memory trend (5-10 min session)
- CPU trend / thermal observation
- Network request bursts

## 2) Module review template

For each module/screen:

- [ ] Identify long-running listeners (`onSnapshot`, intervals, app-state loops)
- [ ] Ensure cleanup on unmount/focus loss
- [ ] Check rerender churn from context/props/inline handlers
- [ ] Verify list virtualization for large datasets
- [ ] Verify image decode/cache behavior
- [ ] Check non-critical fetches are deferred
- [ ] Remove noisy runtime logs in production paths

## 3) Frontend rollout order

- [ ] Global shell (`AppNavigation`, providers, shared hooks)
- [ ] Buyer high-traffic (`Shop`, `Chat`, `Live`)
- [ ] Buyer remaining (`Checkout`, `Orders`, `Profile`)
- [ ] Seller/Admin high-traffic (`Home`, listing/order/chat/live surfaces)
- [ ] Final pass: production logging + cleanup

## 4) Post-optimization verification

- [ ] Re-run baseline scenarios
- [ ] Compare before/after metrics per scenario
- [ ] Confirm no behavior regressions
- [ ] Document accepted regressions/tradeoffs (if any)

