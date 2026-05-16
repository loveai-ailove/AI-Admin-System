-- CreateTable
CREATE TABLE `sys_oper_log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `username` VARCHAR(191) NULL,
    `module` VARCHAR(50) NOT NULL,
    `oper_type` ENUM('CREATE', 'UPDATE', 'DELETE', 'QUERY', 'IMPORT', 'EXPORT', 'LOGIN', 'LOGOUT', 'OTHER') NOT NULL,
    `description` VARCHAR(500) NULL,
    `method` VARCHAR(10) NULL,
    `request_url` VARCHAR(191) NULL,
    `request_param` TEXT NULL,
    `response` TEXT NULL,
    `ip` VARCHAR(50) NULL,
    `status` ENUM('ACTIVE', 'DISABLED') NOT NULL DEFAULT 'ACTIVE',
    `error_msg` TEXT NULL,
    `oper_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `cost_time` INTEGER NULL,

    INDEX `sys_oper_log_user_id_idx`(`user_id`),
    INDEX `sys_oper_log_oper_time_idx`(`oper_time`),
    INDEX `sys_oper_log_module_idx`(`module`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_login_log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `username` VARCHAR(50) NULL,
    `ip` VARCHAR(50) NULL,
    `user_agent` VARCHAR(191) NULL,
    `status` ENUM('SUCCESS', 'FAIL') NOT NULL DEFAULT 'SUCCESS',
    `login_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `logout_time` DATETIME(3) NULL,
    `msg` VARCHAR(500) NULL,

    INDEX `sys_login_log_user_id_idx`(`user_id`),
    INDEX `sys_login_log_login_time_idx`(`login_time`),
    INDEX `sys_login_log_username_idx`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sys_oper_log` ADD CONSTRAINT `sys_oper_log_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `sys_user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sys_login_log` ADD CONSTRAINT `sys_login_log_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `sys_user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
