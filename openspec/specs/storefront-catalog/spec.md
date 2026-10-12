# storefront-catalog Specification

## Purpose

Definir quais produtos podem ser consultados publicamente na vitrine de cada loja, respeitando publicação e isolamento entre lojas.

## Requirements

### Requirement: Visibilidade de produtos publicados

A vitrine pública SHALL exibir somente produtos com status `ACTIVE` pertencentes à loja identificada pelo domínio, inclusive para visitantes sem sessão, em ordem decrescente de criação.

#### Scenario: Catálogo com produtos ativos e rascunhos
- **WHEN** um visitante sem sessão acessa uma loja com produtos `ACTIVE` e `DRAFT`
- **THEN** somente os produtos `ACTIVE` dessa loja são exibidos, dos mais recentes aos mais antigos

#### Scenario: Isolamento entre lojas
- **WHEN** um visitante acessa a vitrine da loja A e existem produtos `ACTIVE` nas lojas A e B
- **THEN** somente os produtos `ACTIVE` da loja A são exibidos

#### Scenario: Loja com somente rascunhos
- **WHEN** um visitante acessa uma loja cujos produtos estão todos em `DRAFT`
- **THEN** a vitrine exibe o estado vazio, sem cards de produtos

#### Scenario: Loja sem produtos
- **WHEN** um visitante acessa uma loja sem produtos cadastrados
- **THEN** a vitrine exibe o estado vazio
