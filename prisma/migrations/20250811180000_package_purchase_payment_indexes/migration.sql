-- CreateIndex
CREATE UNIQUE INDEX "package_purchases_payment_provider_session_id_key" ON "package_purchases"("payment_provider_session_id");

-- CreateIndex
CREATE INDEX "package_purchases_payment_status_idx" ON "package_purchases"("payment_status");
