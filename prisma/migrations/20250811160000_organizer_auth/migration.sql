-- CreateTable
CREATE TABLE "organizer_refresh_tokens" (
    "id" TEXT NOT NULL,
    "organizer_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizer_refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizer_refresh_tokens_token_hash_key" ON "organizer_refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "organizer_refresh_tokens_organizer_id_idx" ON "organizer_refresh_tokens"("organizer_id");

-- CreateIndex
CREATE INDEX "organizer_refresh_tokens_expires_at_idx" ON "organizer_refresh_tokens"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "organizer_accounts_email_key" ON "organizer_accounts"("email");

-- AddForeignKey
ALTER TABLE "organizer_refresh_tokens" ADD CONSTRAINT "organizer_refresh_tokens_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "organizer_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
