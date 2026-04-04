# Implementation tickets (church app prototype)

Ordered work items derived from [`../plans/04-04-2026-church-app-prototype-technical-plan.md`](../plans/04-04-2026-church-app-prototype-technical-plan.md).

| Order | Ticket | Focus |
|------:|--------|--------|
| 1 | [`01-shell-navigation-give-and-config.md`](01-shell-navigation-give-and-config.md) | Shell, four tabs, **Give** as external-only center action, routes, config foundation |
| 2 | [`02-tab-sermons-youtube.md`](02-tab-sermons-youtube.md) | **Sermons** tab — YouTube list, detail player, live banner |
| 3 | [`03-tab-events-wordpress.md`](03-tab-events-wordpress.md) | **Events** tab — WordPress page, external sign-up links |
| 4 | [`04-tab-about-wordpress.md`](04-tab-about-wordpress.md) | **About** tab — WordPress page |
| 5 | [`05-polish-cross-cutting-and-docs.md`](05-polish-cross-cutting-and-docs.md) | Env consistency, branding, errors, README |

**Give** is implemented in ticket **01** (not a separate screen). **About** and **Events** share WordPress rendering patterns—do **03** before or merge shared components early when starting **04**.
