# iLeafU Mobile App — Planned Technology Update (Summary for Review)

**Purpose of this document**  
To explain, in plain language, a planned update to the **iLeafU mobile app** (the software that runs on customers’ and sellers’ phones). This is **not** a redesign of features; it is an update to the **underlying technology** so the app stays reliable, secure, and compatible with Apple and Google’s requirements.

---

## What we are updating

- The app is built with **React Native**, a framework that lets one codebase support **iPhone (iOS)** and **Android**.
- We plan to move from the current version (**0.75**) to a newer supported version (**0.84**), which aligns with current tools and long-term support.

---

## Why this matters (business view)

- **App store readiness** — Apple and Google regularly expect apps to use current build tools and runtimes. Staying current reduces risk of being blocked or delayed at review time.
- **Security and stability** — Newer versions include fixes and improvements that help protect users and reduce crashes.
- **Performance** — The new version includes an updated JavaScript engine (**Hermes**) that can improve how smoothly the app feels.
- **Future work** — Staying on a supported stack makes it easier and faster to add features and fix bugs later.

---

## What is *not* changing (by default)

- We are **not** proposing to change your **business rules** (orders, flights, credits, roles, etc.) as part of this work unless we discover something that **must** be adjusted for compatibility.
- Your **website** and **cloud backend** are separate; this project is focused on the **mobile app** codebase and its **native** iOS/Android projects.

---

## What we need to touch (high level)

- **App foundation** — Core libraries that power screens, navigation, and animations.
- **Login and roles** — Confirm **Buyer**, **Seller**, **Admin**, and **Sub-admin** flows still work after the update (same app, different areas by user type).
- **Important features to re-check** — Examples: shopping and orders, seller tools, admin tools, **chat**, **live selling (video)**, and **camera** features (e.g. photos for listings or chat).
- **Build and release process** — Updating how we compile the app for TestFlight / Play Console so new builds install correctly.

---

## How we will verify quality

- **Before** the update: record a short list of “must work” behaviors on the current app (by role).
- **After** the update: run through the same list on **both iPhone and Android**, for **Buyer**, **Seller**, and **Admin** (and Sub-admin if you use it).
- Focus extra time on **chat**, **live video**, and **camera**, because those connect deeply to the phone’s hardware and are most sensitive to upgrades.

---

## Risks (honest, plain language)

- **Schedule uncertainty** — Some third-party tools (video, camera, messaging-related libraries) sometimes need extra alignment work; we build buffer time for that.
- **Unexpected bugs** — Even careful upgrades can surface small issues; we fix them during a dedicated testing window before release.
- **Your time** — We will need **someone on your side** to try the app on real devices and confirm day-to-day workflows feel correct.

---

## Suggested timeframe

These ranges assume **one primary developer** on the upgrade, with room for testing and fixes. Actual dates depend on how smoothly the third-party tools align.

| Phase | What happens | Typical duration |
|--------|----------------|------------------|
| **Preparation** | Confirm current app works; list critical tests by role | **About 1 week** |
| **Core upgrade** | Update the app foundation; get iOS and Android building again | **About 2–3 weeks** |
| **Alignment & fixes** | Adjust video, camera, and other integrations if needed | **About 1–2 weeks** |
| **Testing (Buyer / Seller / Admin)** | Full pass on both platforms, fix issues | **About 1–2 weeks** |
| **Release prep** | Build for stores, final checks, rollout plan | **About 1 week** |

**Overall planning range: roughly 6–9 weeks** from start to a confident release candidate.  
If problems appear with video or camera libraries, it may lean toward the **longer** end of that range.

---

## What we need from you (client)

- **Test accounts** — Working logins for **Buyer**, **Seller**, and **Admin** (and Sub-admin if used).
- **UAT window** — An agreed period when you or your team can try builds and report “pass / fail” on daily tasks.
- **Priority list** — If something is *must not break* for launch (e.g. checkout, live selling, a specific admin report), name it so we prioritize testing there first.

---

## Next step

- Review this summary and confirm you are comfortable with the **scope** (mobile app technology update) and the **rough timeline**.
- We can then share a short milestone plan (checkpoints and what you’ll see at each step) without technical jargon.

---

*Document for client review — React Native 0.75 → 0.84 upgrade initiative.*
