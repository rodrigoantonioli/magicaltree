# Magical Tree Remake

Remake em HTML5/TypeScript do clássico **Magical Tree** (Konami, MSX). Este projeto inicial coloca um pequeno aventureiro para escalar uma grande árvore, pulando de galho em galho, coletando frutas e evitando perigos enquanto o tempo corre. 

Teste no [Github Pages](https://rodrigoantonioli.github.io/magicaltree/)

## Tecnologias
- [Phaser 3](https://phaser.io/) para o motor 2D
- TypeScript + Vite para bundler e ambiente de desenvolvimento rápido

## Rodando o projeto
```bash
npm install
npm run dev
```
O servidor local do Vite será aberto automaticamente (porta padrão 5173). Use as setas para mover: esquerda/direita para correr, cima para subir na árvore, baixo para deslizar, espaço ou seta para cima para pular.

## Estrutura inicial
- `src/scenes/BootScene.ts` gera texturas procedurais e inicia o jogo
- `src/scenes/GameScene.ts` implementa a lógica principal (árvore, plataformas, frutas, perigos, HUD)
- `src/objects/Player.ts` controla movimentos, escalada e interações do personagem

## Características atuais
- Resolução retro 256×240 com `pixelArt` habilitado para manter o visual MSX
- Fases progressivas: disposição dos galhos, chance de frutas e velocidade dos perigos escalam com a fase
- Dois tipos de inimigos (voadores e cocos em queda) e marcador visual de chegada ao topo
- Coleta de frutas aumenta a pontuação e adiciona alguns segundos ao cronômetro

## Próximos passos sugeridos
- Adicionar sprites e áudio mais fiéis ao original (sons de subida, coleta e game over)
- Implementar inimigos específicos do jogo (macacos, morcegos, cobras) e padrões variados
- Construir fases com layout idêntico ao MSX e incluir chefes/objetivos adicionais
- Introduzir placar com persistência e tela de título inspirada no jogo original

## Publicando no GitHub Pages
1. Garanta que o repositório seja chamado `magicaltree` ou ajuste `repoName` em `vite.config.ts`.
2. Execute o build com a base correta e envie para a branch `gh-pages`:
   ```bash
   npm run predeploy
   npm run deploy
   ```
3. No GitHub, habilite **Settings › Pages** apontando para a branch `gh-pages` (pasta root).

O site será servido em `https://<seu-usuario>.github.io/magicaltree/`. Para atualizar, rode novamente os dois comandos acima.
