-- AlterTable
ALTER TABLE `sys_login_log`
    ADD COLUMN `session_token` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `sys_login_log_session_token_key` ON `sys_login_log`(`session_token`);
