-- CreateIndex
CREATE UNIQUE INDEX "players_guest_token_hash_key" ON "players"("guest_token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "coordinator_accesses_token_hash_key" ON "coordinator_accesses"("token_hash");
