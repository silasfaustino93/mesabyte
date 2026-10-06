# MesaByte App

Aplicativo de autoatendimento mobile-first para restaurantes.

## Como rodar

1. Abra a pasta do projeto no terminal.
2. Execute:

```bash
python3 -m http.server 8000
```

3. Acesse no navegador:

```text
http://localhost:8000
```

## Funcionalidades

- identificação de mesa via simulação de QR code
- cardápio com busca e filtro por categoria
- sacola com quantidade e cálculo de subtotal/taxa/total
- confirmação de pedido com histórico
- UI mobile-first com navegação por tabs
- persistência em localStorage

## Arquivos principais

- `index.html` — estrutura da interface
- `styles.css` — visual e responsividade
- `app.js` — lógica do app e estado

## Observação

Este projeto foi pensado como versão estática e pode ser evoluído para backend real com API, autenticação e integrações com pedidos do restaurante.

























