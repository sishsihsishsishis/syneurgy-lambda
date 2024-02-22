import * as actions from './actions.mjs';

const handleStripeWebhook = async (db, stripe, event, user_email = null, subscription_id = null) => {
  switch (event.type) {
    case 'account.updated':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event account.updated
      break;
    case 'account.application.authorized':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event account.application.authorized
      break;
    case 'account.application.deauthorized':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event account.application.deauthorized
      break;
    case 'account.external_account.created':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event account.external_account.created
      break;
    case 'account.external_account.deleted':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event account.external_account.deleted
      break;
    case 'account.external_account.updated':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event account.external_account.updated
      break;
    case 'application_fee.created':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event application_fee.created
      break;
    case 'application_fee.refunded':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event application_fee.refunded
      break;
    case 'application_fee.refund.updated':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event application_fee.refund.updated
      break;
    case 'balance.available':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event balance.available
      break;
    case 'billing_portal.configuration.created':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event billing_portal.configuration.created
      break;
    case 'billing_portal.configuration.updated':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event billing_portal.configuration.updated
      break;
    case 'billing_portal.session.created':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event billing_portal.session.created
      break;
    case 'capability.updated':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event capability.updated
      break;
    case 'cash_balance.funds_available':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event cash_balance.funds_available
      break;
    case 'charge.captured':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event charge.captured
      break;
    case 'charge.expired':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event charge.expired
      break;
    case 'charge.failed':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event charge.failed
      break;
    case 'charge.pending':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event charge.pending
      break;
    case 'charge.refunded':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event charge.refunded
      break;
    case 'charge.succeeded':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event charge.succeeded
      break;
    case 'charge.updated':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event charge.updated
      break;
    case 'charge.dispute.closed':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event charge.dispute.closed
      break;
    case 'charge.dispute.created':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event charge.dispute.created
      break;
    case 'charge.dispute.funds_reinstated':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event charge.dispute.funds_reinstated
      break;
    case 'charge.dispute.funds_withdrawn':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event charge.dispute.funds_withdrawn
      break;
    case 'charge.dispute.updated':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event charge.dispute.updated
      break;
    case 'charge.refund.updated':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event charge.refund.updated
      break;
    case 'checkout.session.async_payment_failed':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event checkout.session.async_payment_failed
      break;
    case 'checkout.session.async_payment_succeeded':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event checkout.session.async_payment_succeeded
      break;
    case 'checkout.session.completed':
      await actions.handleCheckoutSessionCompleted(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event checkout.session.completed
      break;
    case 'checkout.session.expired':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event checkout.session.expired
      break;
    case 'climate.order.canceled':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event climate.order.canceled
      break;
    case 'climate.order.created':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event climate.order.created
      break;
    case 'climate.order.delayed':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event climate.order.delayed
      break;
    case 'climate.order.delivered':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event climate.order.delivered
      break;
    case 'climate.order.product_substituted':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event climate.order.product_substituted
      break;
    case 'climate.product.created':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event climate.product.created
      break;
    case 'climate.product.pricing_updated':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event climate.product.pricing_updated
      break;
    case 'coupon.created':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event coupon.created
      break;
    case 'coupon.deleted':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event coupon.deleted
      break;
    case 'coupon.updated':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event coupon.updated
      break;
    case 'credit_note.created':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event credit_note.created
      break;
    case 'credit_note.updated':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event credit_note.updated
      break;
    case 'credit_note.voided':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event credit_note.voided
      break;
    case 'customer.created':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event customer.created
      break;
    case 'customer.deleted':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event customer.deleted
      break;
    case 'customer.updated':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event customer.updated
      break;
    case 'customer.discount.created':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event customer.discount.created
      break;
    case 'customer.discount.deleted':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event customer.discount.deleted
      break;
    case 'customer.discount.updated':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event customer.discount.updated
      break;
    case 'customer.source.created':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event customer.source.created
      break;
    case 'customer.source.deleted':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event customer.source.deleted
      break;
    case 'customer.source.expiring':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event customer.source.expiring
      break;
    case 'customer.source.updated':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event customer.source.updated
      break;
    case 'customer.subscription.created':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event customer.subscription.created
      break;
    case 'customer.subscription.deleted':
      await actions.handleCustomerSubscriptionDeleted(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event customer.subscription.deleted
      break;
    case 'customer.subscription.paused':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event customer.subscription.paused
      break;
    case 'customer.subscription.pending_update_applied':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event customer.subscription.pending_update_applied
      break;
    case 'customer.subscription.pending_update_expired':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event customer.subscription.pending_update_expired
      break;
    case 'customer.subscription.resumed':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event customer.subscription.resumed
      break;
    case 'customer.subscription.trial_will_end':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event customer.subscription.trial_will_end
      break;
    case 'customer.subscription.updated':
      await actions.handleCustomerSubscriptionUpdated(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event customer.subscription.updated
      break;
    case 'customer.tax_id.created':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event customer.tax_id.created
      break;
    case 'customer.tax_id.deleted':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event customer.tax_id.deleted
      break;
    case 'customer.tax_id.updated':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event customer.tax_id.updated
      break;
    case 'customer_cash_balance_transaction.created':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event customer_cash_balance_transaction.created
      break;
    case 'file.created':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event file.created
      break;
    case 'financial_connections.account.created':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event financial_connections.account.created
      break;
    case 'financial_connections.account.deactivated':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event financial_connections.account.deactivated
      break;
    case 'financial_connections.account.disconnected':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event financial_connections.account.disconnected
      break;
    case 'financial_connections.account.reactivated':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event financial_connections.account.reactivated
      break;
    case 'financial_connections.account.refreshed_balance':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event financial_connections.account.refreshed_balance
      break;
    case 'financial_connections.account.refreshed_transactions':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event financial_connections.account.refreshed_transactions
      break;
    case 'identity.verification_session.canceled':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event identity.verification_session.canceled
      break;
    case 'identity.verification_session.created':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event identity.verification_session.created
      break;
    case 'identity.verification_session.processing':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event identity.verification_session.processing
      break;
    case 'identity.verification_session.requires_input':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event identity.verification_session.requires_input
      break;
    case 'identity.verification_session.verified':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event identity.verification_session.verified
      break;
    case 'invoice.created':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event invoice.created
      break;
    case 'invoice.deleted':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event invoice.deleted
      break;
    case 'invoice.finalization_failed':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event invoice.finalization_failed
      break;
    case 'invoice.finalized':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event invoice.finalized
      break;
    case 'invoice.marked_uncollectible':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event invoice.marked_uncollectible
      break;
    case 'invoice.paid':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event invoice.paid
      break;
    case 'invoice.payment_action_required':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event invoice.payment_action_required
      break;
    case 'invoice.payment_failed':
      await actions.handleInvoicePaymentFailed(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event invoice.payment_failed
      break;
    case 'invoice.payment_succeeded':
      await actions.handleInvoicePaymentSucceeded(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event invoice.payment_succeeded
      break;
    case 'invoice.sent':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event invoice.sent
      break;
    case 'invoice.upcoming':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event invoice.upcoming
      break;
    case 'invoice.updated':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event invoice.updated
      break;
    case 'invoice.voided':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event invoice.voided
      break;
    case 'invoiceitem.created':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event invoiceitem.created
      break;
    case 'invoiceitem.deleted':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event invoiceitem.deleted
      break;
    case 'issuing_authorization.created':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event issuing_authorization.created
      break;
    case 'issuing_authorization.updated':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event issuing_authorization.updated
      break;
    case 'issuing_card.created':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event issuing_card.created
      break;
    case 'issuing_card.updated':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event issuing_card.updated
      break;
    case 'issuing_cardholder.created':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event issuing_cardholder.created
      break;
    case 'issuing_cardholder.updated':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event issuing_cardholder.updated
      break;
    case 'issuing_dispute.closed':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event issuing_dispute.closed
      break;
    case 'issuing_dispute.created':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event issuing_dispute.created
      break;
    case 'issuing_dispute.funds_reinstated':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event issuing_dispute.funds_reinstated
      break;
    case 'issuing_dispute.submitted':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event issuing_dispute.submitted
      break;
    case 'issuing_dispute.updated':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event issuing_dispute.updated
      break;
    case 'issuing_token.created':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event issuing_token.created
      break;
    case 'issuing_token.updated':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event issuing_token.updated
      break;
    case 'issuing_transaction.created':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event issuing_transaction.created
      break;
    case 'issuing_transaction.updated':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event issuing_transaction.updated
      break;
    case 'mandate.updated':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event mandate.updated
      break;
    case 'payment_intent.amount_capturable_updated':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event payment_intent.amount_capturable_updated
      break;
    case 'payment_intent.canceled':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event payment_intent.canceled
      break;
    case 'payment_intent.created':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event payment_intent.created
      break;
    case 'payment_intent.partially_funded':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event payment_intent.partially_funded
      break;
    case 'payment_intent.payment_failed':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event payment_intent.payment_failed
      break;
    case 'payment_intent.processing':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event payment_intent.processing
      break;
    case 'payment_intent.requires_action':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event payment_intent.requires_action
      break;
    case 'payment_intent.succeeded':
      await actions.handlePaymentIntentSucceeded(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event payment_intent.succeeded
      break;
    case 'payment_link.created':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event payment_link.created
      break;
    case 'payment_link.updated':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event payment_link.updated
      break;
    case 'payment_method.attached':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event payment_method.attached
      break;
    case 'payment_method.automatically_updated':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event payment_method.automatically_updated
      break;
    case 'payment_method.detached':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event payment_method.detached
      break;
    case 'payment_method.updated':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event payment_method.updated
      break;
    case 'payout.canceled':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event payout.canceled
      break;
    case 'payout.created':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event payout.created
      break;
    case 'payout.failed':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event payout.failed
      break;
    case 'payout.paid':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event payout.paid
      break;
    case 'payout.reconciliation_completed':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event payout.reconciliation_completed
      break;
    case 'payout.updated':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event payout.updated
      break;
    case 'person.created':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event person.created
      break;
    case 'person.deleted':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event person.deleted
      break;
    case 'person.updated':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event person.updated
      break;
    case 'plan.created':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event plan.created
      break;
    case 'plan.deleted':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event plan.deleted
      break;
    case 'plan.updated':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event plan.updated
      break;
    case 'price.created':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event price.created
      break;
    case 'price.deleted':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event price.deleted
      break;
    case 'price.updated':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event price.updated
      break;
    case 'product.created':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event product.created
      break;
    case 'product.deleted':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event product.deleted
      break;
    case 'product.updated':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event product.updated
      break;
    case 'promotion_code.created':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event promotion_code.created
      break;
    case 'promotion_code.updated':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event promotion_code.updated
      break;
    case 'quote.accepted':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event quote.accepted
      break;
    case 'quote.canceled':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event quote.canceled
      break;
    case 'quote.created':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event quote.created
      break;
    case 'quote.finalized':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event quote.finalized
      break;
    case 'radar.early_fraud_warning.created':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event radar.early_fraud_warning.created
      break;
    case 'radar.early_fraud_warning.updated':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event radar.early_fraud_warning.updated
      break;
    case 'refund.created':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event refund.created
      break;
    case 'refund.updated':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event refund.updated
      break;
    case 'reporting.report_run.failed':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event reporting.report_run.failed
      break;
    case 'reporting.report_run.succeeded':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event reporting.report_run.succeeded
      break;
    case 'review.closed':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event review.closed
      break;
    case 'review.opened':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event review.opened
      break;
    case 'setup_intent.canceled':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event setup_intent.canceled
      break;
    case 'setup_intent.created':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event setup_intent.created
      break;
    case 'setup_intent.requires_action':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event setup_intent.requires_action
      break;
    case 'setup_intent.setup_failed':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event setup_intent.setup_failed
      break;
    case 'setup_intent.succeeded':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event setup_intent.succeeded
      break;
    case 'sigma.scheduled_query_run.created':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event sigma.scheduled_query_run.created
      break;
    case 'source.canceled':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event source.canceled
      break;
    case 'source.chargeable':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event source.chargeable
      break;
    case 'source.failed':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event source.failed
      break;
    case 'source.mandate_notification':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event source.mandate_notification
      break;
    case 'source.refund_attributes_required':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event source.refund_attributes_required
      break;
    case 'source.transaction.created':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event source.transaction.created
      break;
    case 'source.transaction.updated':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event source.transaction.updated
      break;
    case 'subscription_schedule.aborted':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event subscription_schedule.aborted
      break;
    case 'subscription_schedule.canceled':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event subscription_schedule.canceled
      break;
    case 'subscription_schedule.completed':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event subscription_schedule.completed
      break;
    case 'subscription_schedule.created':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event subscription_schedule.created
      break;
    case 'subscription_schedule.expiring':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event subscription_schedule.expiring
      break;
    case 'subscription_schedule.released':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event subscription_schedule.released
      break;
    case 'subscription_schedule.updated':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event subscription_schedule.updated
      break;
    case 'tax.settings.updated':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event tax.settings.updated
      break;
    case 'tax_rate.created':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event tax_rate.created
      break;
    case 'tax_rate.updated':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event tax_rate.updated
      break;
    case 'terminal.reader.action_failed':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event terminal.reader.action_failed
      break;
    case 'terminal.reader.action_succeeded':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event terminal.reader.action_succeeded
      break;
    case 'test_helpers.test_clock.advancing':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event test_helpers.test_clock.advancing
      break;
    case 'test_helpers.test_clock.created':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event test_helpers.test_clock.created
      break;
    case 'test_helpers.test_clock.deleted':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event test_helpers.test_clock.deleted
      break;
    case 'test_helpers.test_clock.internal_failure':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event test_helpers.test_clock.internal_failure
      break;
    case 'test_helpers.test_clock.ready':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event test_helpers.test_clock.ready
      break;
    case 'topup.canceled':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event topup.canceled
      break;
    case 'topup.created':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event topup.created
      break;
    case 'topup.failed':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event topup.failed
      break;
    case 'topup.reversed':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event topup.reversed
      break;
    case 'topup.succeeded':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event topup.succeeded
      break;
    case 'transfer.created':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event transfer.created
      break;
    case 'transfer.reversed':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event transfer.reversed
      break;
    case 'transfer.updated':
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
      // Then define and call a function to handle the event transfer.updated
      break;
    // ... handle other event types
    default:
      await actions.handleDefault(db, stripe, event, user_email, subscription_id);
  }
};

export {
  handleStripeWebhook,
};
