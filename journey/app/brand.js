/* The product brand. This is the only place the shipped name lives.
 *
 * Three names are deliberately separate:
 *   - PRODUCT.name  the brand on the box, the tab title, and the docs
 *   - CASE.title    the individual case ("The Vanishing of Clara Hale")
 *   - CASE.kick     the in-fiction series on the album cover ("Pine Hollow
 *                   Case Files"), which is world-building, not branding, and
 *                   should not change when the product ships a case set in
 *                   another town.
 *
 * Loaded by index.html before the case pack and the engine.
 */
window.PRODUCT = {
  name: 'The Case Desk',
  company: 'NextSteps.llc',
  tagline: 'Case files you work yourself.'
};
