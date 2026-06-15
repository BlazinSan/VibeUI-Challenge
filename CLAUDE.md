# CLAUDE.md

Implementation guide for this repository. It merges two inputs:

1. **Behavioral guidelines** — how to work (reduce common LLM coding mistakes).
2. **Project specification** — what to build (Vibe UI Challenge 2026 frozen-dumpling app).

Graphify is installed in this project; the graph-usage rules below are part of the required workflow.

---

# Working Guidelines

Behavioral guidelines to reduce common LLM coding mistakes. Merge with the project specification below.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

# graphify

- **graphify** (`.claude/skills/graphify/SKILL.md`) - any input to knowledge graph. Trigger: `/graphify`

When the user types `/graphify`, invoke the Skill tool with `skill: "graphify"` before doing anything else.

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

---

# Project Specification

## Mission

Build a competition-ready frontend for the Vibe UI Challenge 2026. The challenge theme is a food ordering system focused on frozen dumplings, university student resellers, order placement, delivery tracking, and admin operations. The final app should feel closer to Captain's Food Hub than a generic delivery app: warm, editorial, compact, trustworthy, food-photo led, and operationally useful.

This repository is already a Vite + Tailwind + vanilla JavaScript frontend. Do not restart from scratch. Upgrade the existing app fast and deliberately.

## Competition Context

- Event: Vibe UI Challenge 2026, 15 June 2026, 8:00 AM to 3:00 PM.
- Theme: food ordering system.
- Sponsor/business angle: frozen dumplings for university students.
- Primary users:
  - Students ordering frozen dumplings.
  - Students who resell dumplings for extra pocket money.
  - Admin/operators managing orders, customers, delivery progress, and ratings.
- Required or expected pages:
  - Customer landing/menu/order journey.
  - Student job/reseller application page.
  - Track order page.
  - Desktop-friendly admin dashboard and order/customer records.
- Evaluation pressure points:
  - 200+ simulated records for orders, meal history, tracking, and ratings.
  - Excellent mobile ordering flow.
  - Excellent desktop admin workflow.
  - Cross-browser layout continuity across Chrome, Safari, Firefox, and Edge.
  - Strong first impression: discounts, featured items, fast reorders, simple decisions.
  - Premium identity without red/yellow/green food-app cliches.
  - Sponsor/brand integration when assets are provided.

## Current Project Shape

- `package.json`: Vite dev/build scripts.
- `index.html`: customer header, admin sidebar, mobile bottom nav, cart drawer, modal shell.
- `src/css/index.css`: Tailwind base plus reusable component classes and animation helpers.
- `tailwind.config.js`: current colors, fonts, shadows.
- `src/js/app.js`: app startup, view routing, layout shell switching, cart/modal control.
- `src/js/store.js`: in-memory state, JSON loading, cart, checkout, simulated order updates, ratings.
- `src/js/data-loader.js`: querying/filtering/pagination and admin metrics.
- `src/js/views/customer.js`: home, catalog, checkout, tracking, reseller application, track-order page.
- `src/js/views/admin.js`: admin dashboard, orders, customers.
- `src/js/components/`: cards, tables, charts, tracking templates.
- `data/`: meals, customers, orders, delivery, ratings.

The app already has the required feature skeleton. The highest-value work is visual identity, frozen dumpling content/data alignment, mobile ordering polish, admin density, and sponsor-ready branding.

## Reference Design Direction: Captain's Food Hub

Use `https://captains-foodhub.vercel.app/` as the visual north star, not as a pixel-copy target.

Observed reference qualities:

- Warm cream/paper background, near-black text, restrained amber/brown accents.
- Large expressive display headlines paired with a clean sans-serif body font.
- Compact topbar with simple links and an order CTA.
- Real food photography as the main visual evidence.
- Status strip near the top showing ordering availability/payment/delivery context.
- Editorial sections: hero, food showcase, how it works, menu board, order form.
- Controls and cards are mostly 8px radius, not pill-heavy.
- Shadows are soft and occasional, not everywhere.
- Content is direct and local: availability, location, menu, order action, contact.

Adaptation for this challenge:

- Replace the current "Gourmet Kitchen / hot meals" identity with a frozen dumpling marketplace/reseller identity.
- Keep the app modern, but make it less luxury-restaurant and more student-commerce, campus-order, operationally credible.
- Avoid bright red, yellow, and green as brand colors. Small semantic status colors are acceptable only where needed, but keep them muted.

## Proposed Brand Theme

Working brand name: `Dumpling Desk` or `Campus Dumpling Co.`

Recommended final choice: `Dumpling Desk`

Why: It fits university students, resellers, order processing, and admin workflows. It is memorable without feeling childish.

Tone:

- Warm, focused, campus-smart.
- Fast ordering, freezer-ready packs, reseller-friendly margins.
- Clear enough for judges to understand within 10 seconds.

Visual palette:

- Paper: `#F7F2E8`
- Ink: `#151412`
- Soft panel: `#FFFAF2`
- Border: `#E7DDCF`
- Muted text: `#726A60`
- Soy amber accent: `#8B5B1F`
- Clay accent: `#B46A3C`
- Deep admin/nav: `#1E1B18`
- Cool operational blue: `#4A6473`
- Muted success: `#5E7463`
- Muted warning: `#9B7442`
- Muted danger: `#9A4E45`

Typography:

- Keep `Inter` for body and interface.
- Use a condensed, expressive display face for major headings if available through Google Fonts, for example `Bebas Neue`, `Oswald`, or `Archivo Black`.
- Do not use viewport-width font scaling. Use Tailwind responsive text sizes.
- Use 0 letter spacing unless a tiny uppercase label needs slight tracking.

Shape and spacing:

- Standard radius: `rounded-lg` / 8px.
- Larger feature panels can use 12px, but avoid the current repeated `rounded-[2rem]` look.
- Prefer full-width sections with constrained inner content.
- Avoid nested cards and decorative floating blobs.
- Use stable dimensions for product cards, image grids, icon buttons, counters, and dashboard tiles.

Imagery:

- Use real dumpling/frozen food imagery where possible.
- Hero should immediately show dumplings or freezer packs, not an abstract food mood.
- Product cards should use consistent image aspect ratios.
- If sponsor assets are supplied in `/assets/sponsor/`, integrate logo and colors in header/footer/sponsor strip without letting them overpower the app.

## Implementation Plan

### Phase 1: Rebrand the Shell

Files:

- `index.html`
- `tailwind.config.js`
- `src/css/index.css`

Tasks:

- Rename title/meta/header/footer from Gourmet Kitchen to Dumpling Desk.
- Replace logo mark with a clean text mark and simple line icon. If sponsor logo exists, add a "Partnered with" slot.
- Change the Tailwind palette to the proposed warm paper/ink/soy amber theme.
- Replace large rounded cards with 8px to 12px radii.
- Make desktop nav simple: Menu, Track, Reseller, Admin, Cart.
- Keep mobile bottom nav, but shorten labels: Home, Menu, Track, Resell, Cart.
- Add a top status strip under the header on the home page: ordering window, delivery/shipping note, payment options.

### Phase 2: Rewrite Customer Home for First-Attraction Psychology

File:

- `src/js/views/customer.js`

Home page structure:

1. Status strip: "Orders open today", "Frozen packs ship to your address", "Pay by online transfer or COD simulation".
2. Hero:
   - H1: `Dumpling Desk`
   - Support: "Frozen dumpling packs for campus orders, reseller batches, and quick family meals."
   - CTAs: `Order packs`, `Become a reseller`.
   - Hero visual: dumpling tray/freezer pack image.
3. Quick stats row:
   - `200+ simulated orders`
   - `Student reseller flow`
   - `Live tracking`
   - `Admin-ready dashboard`
4. Featured packs:
   - top 4 dumpling products.
   - include pack size, price, rating, freezer note.
5. How it works:
   - Choose packs.
   - Add delivery address.
   - Confirm payment.
   - Track shipment.
6. Fast reorder:
   - Keep existing recent-orders behavior, but restyle it compactly.

Important:

- The first viewport must say what the app is and show dumplings.
- Do not write explanatory in-app text about the UI features. Write customer-facing commerce copy.

### Phase 3: Convert Data and Product Language to Frozen Dumplings

Files:

- `data/meals.json`
- Possibly `data/ratings.json`, `data/orders.json`

Tasks:

- Rename meals into frozen dumpling packs, sampler boxes, sauces, freezer bundles, and student reseller cases.
- Categories should be relevant:
  - `Dumpling Packs`
  - `Sampler Boxes`
  - `Party Trays`
  - `Sauces`
  - `Reseller Cases`
  - `Add-ons`
- Use prices that make sense in local/student context. If using RM, update display labels throughout from `$` to `RM`.
- Add or repurpose fields in the UI if useful:
  - pack size
  - filling
  - freezer life
  - spice level
  - reseller margin
- Keep the total record volume: 50 products is fine, plus existing 250 customers, 300 orders, and 300 ratings.
- If time is limited, only update visible names/categories/descriptions/ingredients and leave schema unchanged.

### Phase 4: Upgrade Catalog and Product Cards

Files:

- `src/js/views/customer.js`
- `src/js/components/cards.js`
- `src/js/data-loader.js`

Tasks:

- Rename "Catalog" to "Menu Board" or "Pack Menu".
- Make filters mobile-friendly:
  - Search.
  - Category chips.
  - Sort by rating, price, reseller margin if implemented.
- Product card priorities:
  - image
  - product name
  - pack size/category
  - price
  - rating
  - "Add" button
- Add quick badges:
  - `Best seller`
  - `Reseller case`
  - `Freezer-ready`
- Keep card heights stable across the grid.
- Use compact 8px buttons and avoid oversized pill CTAs.

### Phase 5: Checkout Flow for Delivery Address and Payment

Files:

- `src/js/views/customer.js`
- `src/js/store.js`

Tasks:

- Make checkout language match the sponsor brief:
  - delivery address
  - contact number
  - payment method
  - order notes
  - shipment arranged after confirmation
- Add a clear order summary with subtotal, delivery fee simulation, and total.
- Ensure empty cart state routes back to menu.
- After placing order, tracking page should show shipment/order progress, not "cooking" language.

Suggested statuses:

- `received`: Order Received
- `confirmed`: Payment Confirmed
- `packing`: Packing Frozen Packs
- `shipped`: Out for Shipment
- `delivered`: Delivered

If changing statuses is too risky, map existing statuses to better labels in the UI only.

### Phase 6: Reseller Application Page

File:

- `src/js/views/customer.js`

Current page already exists as `renderApplyJob`. Polish it into a high-scoring page:

- H1: `Earn with Frozen Dumpling Orders`
- Explain student reseller value in customer-facing terms:
  - flexible campus side income
  - no kitchen required
  - collect orders from classmates
  - supplier handles frozen pack shipment
- Form fields:
  - full name
  - student ID
  - university
  - faculty
  - email
  - phone
  - campus selling plan
  - expected weekly orders
  - preferred pickup/shipping area
- Save to localStorage as currently done.
- Add success state/toast and route back to home or show a compact confirmation panel.

### Phase 7: Track Order Page

Files:

- `src/js/views/customer.js`
- `src/js/components/tracking.js`

Tasks:

- Keep order ID lookup.
- Make recent orders visible and tappable.
- Use shipment-friendly labels.
- Show:
  - order ID
  - status
  - pack/product
  - quantity
  - delivery estimate
  - delivery address snippet if available
  - driver/courier simulation
- Map visualization can remain mock, but restyle it as a route/status panel.

### Phase 8: Admin Desktop Workflow

Files:

- `src/js/views/admin.js`
- `src/js/components/table.js`
- `src/js/components/charts.js`
- `src/js/data-loader.js`

Goals:

- Dense, scannable, operational.
- Less marketing, more command center.
- Desktop-first but still usable on tablet.

Dashboard should show:

- Total revenue/orders.
- Active shipments.
- Pending payment/packing count if derivable.
- Average rating.
- Popular packs.
- Revenue trend.
- Order status distribution if quick to add.

Orders page:

- Search order/customer/product.
- Filter status.
- Inline status update.
- Keep table columns compact and avoid horizontal overflow on common desktop widths.

Customers page:

- Search by name/email/phone/location.
- Show order count and total spend.
- If time permits, add a customer detail drawer or expandable row.

### Phase 9: Responsiveness and Cross-Browser Polish

Must test:

- Mobile: 375 x 812.
- Tablet: 768 x 1024.
- Desktop: 1440 x 900.

Watch for:

- Text overflow in buttons/cards.
- Header overlap with main content.
- Mobile bottom nav covering forms.
- Cart drawer usable on mobile.
- Tables not breaking the viewport.
- Modal height and scroll on small screens.
- Food images loading and not stretching.

Browser continuity:

- Avoid experimental CSS unless already working.
- Use flex/grid with clear min/max constraints.
- Avoid CSS that depends on unsupported dynamic viewport units unless tested.
- Keep form controls native enough to work in Chrome, Edge, Firefox, and Safari.

## Design System Rules for This App

- Build the real app as first screen, not a landing-only facade.
- Use real food/product imagery.
- No red/yellow/green dominant palette.
- No purple-blue SaaS gradients.
- No decorative blobs/orbs.
- No nested cards.
- Use icons for common actions, but keep them consistent with existing inline SVG style unless adding an icon library is already justified.
- Use 8px radius for controls and most cards.
- Keep admin UI calm and dense.
- Keep customer UI warm, fast, and visual.
- All buttons must have text that fits at mobile width.
- All repeated cards need stable image and content dimensions.

## Suggested File-by-File Priorities

1. `tailwind.config.js`: palette, fonts, radius/shadow tokens if useful.
2. `src/css/index.css`: global background, typography, reusable `.panel`, `.button`, `.field`, status classes.
3. `index.html`: title, meta, header/nav/footer/cart labels.
4. `src/js/views/customer.js`: home, catalog labels, checkout, application, tracking.
5. `src/js/components/cards.js`: product card visual quality.
6. `src/js/components/tracking.js`: shipment labels and stepper.
7. `src/js/views/admin.js`: dashboard/admin wording and density.
8. `src/js/components/table.js`: order/customer table labels and status chips.
9. `data/meals.json`: frozen dumpling products and descriptions.

## Fast Win Checklist

- [ ] Brand says Dumpling Desk or final sponsor brand everywhere.
- [ ] Hero clearly communicates frozen dumpling ordering in first viewport.
- [ ] Customer can order, checkout, and track without confusion.
- [ ] Reseller application exists and feels intentional.
- [ ] Admin dashboard looks like a useful operations screen.
- [ ] Data volume remains 200+ records.
- [ ] Mobile ordering is polished.
- [ ] Desktop admin is polished.
- [ ] No major red/yellow/green food-app color theme.
- [ ] `npm run build` passes.

## Commands

Use the inner project directory:

```bash
cd VibeUI-competition-2026-main
npm install
npm run dev
npm run build
```

## Verification Routine

After implementation:

1. Run `npm run build`.
2. Start `npm run dev`.
3. Check home, menu, cart, checkout, tracking, reseller application, admin dashboard, admin orders, admin customers.
4. Test mobile and desktop viewport sizes.
5. Confirm no console errors.
6. Confirm images render.
7. Confirm cart state and localStorage flows still work.

## Risk Notes

- The project uses inline `onclick` handlers and global `window.app` bindings. Match that pattern for speed unless doing a focused cleanup.
- `store.placeOrder` currently stores only the first cart meal as `mealId` and total quantity for all items. This is acceptable for a competition mockup, but the order summary should visually communicate the full cart before checkout.
- Status names are used across store, tracking, tables, and filters. If changing status values, update all related mappings. Safer option: keep existing values and only change displayed labels.
- If using external images, prefer reliable URLs and consistent dimensions. Broken images will hurt the first impression.
- If sponsor assets appear in `/assets/sponsor/`, inspect them before final branding decisions and integrate them visibly but tastefully.

## Final Quality Bar

The result should make judges immediately understand:

- This is a frozen dumpling ordering platform.
- It supports student resellers.
- It has a complete customer flow.
- It has a serious admin/operations flow.
- It is responsive, visually distinctive, and not a generic food-delivery clone.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
