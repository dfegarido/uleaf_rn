# React Native 0.75 Optimization & Best Practices Guide

## Goal
Build a high-performance, scalable, and maintainable React Native app that targets smooth 60 FPS interactions, controlled memory usage, and predictable rendering.

---

## 1) Core Architecture (Mandatory)

### Use the New Architecture
- Enable and adopt:
  - Fabric (UI rendering)
  - TurboModules
  - JSI

### Why
- The old bridge adds JSON serialization overhead.
- The New Architecture reduces JS/native communication bottlenecks.

### Enable Hermes
Use Hermes in app config/build setup:

```js
enableHermes: true
```

Benefits:
- Smaller JS bundle size
- Faster startup time
- Lower memory usage

---

## 2) Performance Rules (Critical)

### Understand Thread Responsibilities
- JS Thread: logic, state updates, API orchestration
- UI Thread: layout, rendering, gestures, animations

### Rules
- Never block the JS thread longer than one frame budget (~16ms at 60Hz).
- Keep UI thread work lightweight and stable.

---

## 3) Rendering Optimization

### Prevent Unnecessary Re-renders
- Use `React.memo` for presentational/leaf components.
- Use `useMemo` for derived values.
- Use `useCallback` for handlers passed to children.

### Practical Rules
- Split large screens into smaller memoized sections.
- Avoid inline function literals in hot JSX paths.
- Keep prop references stable between renders.

---

## 4) List Optimization (Very Important)

### Prefer Virtualized Lists
- Use `FlatList` or `SectionList` for any non-trivial list.
- Avoid using `ScrollView` for large or unbounded data.

### Baseline FlatList Config

```tsx
<FlatList
  data={data}
  keyExtractor={(item) => item.id}
  renderItem={renderItem}
  getItemLayout={getItemLayout} // if fixed height
  initialNumToRender={10}
  windowSize={5}
/>
```

### Advanced
- Use `FlashList` for very large datasets or complex cell rendering.

---

## 5) Image Optimization

### Rules
- Prefer WebP where possible.
- Serve the right size for the display target (no oversized assets).
- Cache and prefetch important images.

### Common Libraries
- `react-native-fast-image`
- `expo-image` (if using Expo stack)

---

## 6) Bundle Size Optimization

### Rules
- Remove unused dependencies.
- Enable ProGuard/R8 minification on Android release builds.
- Use lazy loading / code splitting for heavy screens.

```js
const Screen = React.lazy(() => import('./Screen'));
```

---

## 7) Memory Management

### Avoid Leaks

```js
useEffect(() => {
  const sub = listener.addListener();
  return () => sub.remove();
}, []);
```

Common leak sources:
- Uncleared timers/listeners/subscriptions
- Async callbacks calling `setState` after unmount

---

## 8) API & Data Optimization

### Rules
- Lazy-load data by screen/section.
- Paginate all potentially large collections.
- Cache API responses when safe.

### Advanced
- Defer non-critical API calls until after first meaningful paint.

---

## 9) Animation Optimization

### Preferred
- `react-native-reanimated` for heavy/complex animations (UI thread-driven).

### Avoid
- JS-thread-driven animations for animation-heavy flows.

---

## 10) State Management Rules

### Guidelines
- Keep state local by default.
- Keep state minimal and normalized.

### Avoid
- Deep prop drilling for frequently changing values
- Overusing global state for ephemeral UI state

---

## 11) Debugging & Profiling (Mandatory)

Tools:
- Flipper
- React DevTools Profiler
- Platform profilers (Xcode Instruments / Android Studio Profiler)

Rule:
- Profile first, optimize second.

---

## 12) Startup Optimization

### Rules
- Defer heavy non-critical logic at app start.
- Lazy-load expensive screens/modules.
- Render critical UI first.

Examples:
- Delay analytics setup
- Delay background sync
- Delay non-essential logging

---

## 13) Common Anti-Patterns (Strictly Forbidden)

- ScrollView for large lists
- Heavy business logic inside render paths
- Inline arrow functions in hot JSX paths
- Large uncompressed images
- Unbounded re-renders
- Blocking JS thread
- Verbose `console.log` in production

### Disable Logs in Production

```js
if (!__DEV__) {
  console.log = () => {};
}
```

---

## 14) React Native 0.75 Notes

- Uses Yoga 3.1 layout engine
- Better support for percentage layouts
- New Architecture is production-ready

---

## 15) AI Coding Rules (Strict)

### Always
- Apply memoization where render churn is likely
- Optimize list rendering first
- Lazy-load expensive features
- Clean up effects/timers/listeners
- Keep components focused and small

### Never
- Block JS/UI threads with heavy synchronous work
- Fetch all data at once without pagination strategy
- Introduce avoidable rerenders in navigation roots
- Skip profiling when diagnosing performance issues

---

## 16) High-Impact Optimization Checklist

- Defer non-critical API calls after initial render
- Consider `FlatList -> FlashList` for heavy lists
- Compress and cache image assets
- Remove unused packages and dead code
- Stabilize props/context values to reduce rerenders

---

## Project-Specific Notes (iLeafU Buyer App)

Based on recent buyer-side review:
- Long-running live video usage is naturally heat-intensive (Agora + realtime listeners).
- Realtime unread chat listeners should stay lightweight and avoid frequent UI commits.
- Avoid repeated full-screen refresh bursts when network is unstable.
- Keep tab-level animations minimal and avoid always-on loops where possible.

---

## Final Rule
Performance is not about micro-optimizations. It is about finding and removing real bottlenecks with measurement-backed changes.
