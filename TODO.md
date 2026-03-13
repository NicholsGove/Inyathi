# TODO

- [x] Update recipient configuration in `backend/services/emailService.js` to support multiple recipient emails.
- [x] Update email footer display to show multiple recipient emails clearly.
- [x] Mark completion after edits.

## Cart + Checkout + Quote Integration (Revised)

- [x] Create `checkout.html` as a separate checkout page.
- [x] Update `products.html` cart links/CTA to point to `checkout.html`.
- [x] Replace modal enquire action with quantity + Add to Cart in `js/main.js`.
- [x] Implement checkout page flow in `js/main.js`:
  - [x] Pay in Card -> show bank details -> proceed to quote
  - [x] Pay in Cash -> direct proceed to quote
- [x] Prefill quote in `pricing.html` from cart + selected payment method in `js/main.js`.
- [ ] Add/adjust cart + checkout styles in `css/styles.css`.
- [ ] Validate end-to-end flow with existing quote submission unchanged.
