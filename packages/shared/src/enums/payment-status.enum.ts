/**
 * Package purchase payment lifecycle.
 * PAID and USED are defined by architecture flow; PENDING represents checkout-initiated purchases.
 */
export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  USED = 'USED',
}
