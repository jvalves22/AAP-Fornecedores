-- CreateTable
CREATE TABLE `gpc001` (
    `id_usu` INTEGER NOT NULL AUTO_INCREMENT,
    `usu_nome` VARCHAR(100) NOT NULL,
    `usu_login` VARCHAR(100) NOT NULL,
    `usu_senha` VARCHAR(255) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    UNIQUE INDEX `gpc001_usu_login_key`(`usu_login`),
    PRIMARY KEY (`id_usu`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gpc002` (
    `id_for` INTEGER NOT NULL AUTO_INCREMENT,
    `for_pessoa` ENUM('FISICA', 'JURIDICA') NOT NULL,
    `for_razao` VARCHAR(150) NOT NULL,
    `for_fantasia` VARCHAR(150) NULL,
    `for_cpf` VARCHAR(11) NULL,
    `for_cnpj` VARCHAR(14) NULL,
    `for_ie` VARCHAR(20) NULL,
    `for_rg` VARCHAR(20) NULL,
    `for_end` VARCHAR(150) NOT NULL,
    `for_numero` VARCHAR(20) NOT NULL,
    `for_complemento` VARCHAR(100) NULL,
    `for_bairro` VARCHAR(100) NOT NULL,
    `for_cep` CHAR(8) NOT NULL,
    `cod_cid` INTEGER NOT NULL,
    `for_contato` VARCHAR(100) NULL,
    `for_email` VARCHAR(254) NULL,
    `for_telefone` VARCHAR(20) NULL,
    `for_celular` VARCHAR(20) NULL,
    `for_site` VARCHAR(255) NULL,
    `for_setor` VARCHAR(100) NULL,
    `for_obs` TEXT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `data_cadastro` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL,

    UNIQUE INDEX `gpc002_for_cpf_key`(`for_cpf`),
    UNIQUE INDEX `gpc002_for_cnpj_key`(`for_cnpj`),
    INDEX `gpc002_cod_cid_idx`(`cod_cid`),
    PRIMARY KEY (`id_for`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gp_cidades` (
    `id_cidades` INTEGER NOT NULL AUTO_INCREMENT,
    `cid_numero` CHAR(7) NOT NULL,
    `cid_nome` VARCHAR(100) NOT NULL,
    `cid_uf` CHAR(2) NOT NULL,

    UNIQUE INDEX `gp_cidades_cid_numero_key`(`cid_numero`),
    INDEX `gp_cidades_cid_uf_cid_nome_idx`(`cid_uf`, `cid_nome`),
    PRIMARY KEY (`id_cidades`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `gpc002` ADD CONSTRAINT `gpc002_cod_cid_fkey` FOREIGN KEY (`cod_cid`) REFERENCES `gp_cidades`(`id_cidades`) ON DELETE RESTRICT ON UPDATE CASCADE;
