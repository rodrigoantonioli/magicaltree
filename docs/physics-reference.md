# Magical Tree (MSX) – Referência de Física

Para reproduzir o comportamento do original de MSX, registrei capturas do jogo rodando a 60 fps no emulador openMSX (clock Z80 padrão). Contando quadros e deslocamentos de pixel em sequência frame-a-frame foi possível medir a velocidade média dos principais movimentos. A árvore usa tiles de 8 px; a largura útil do tronco é de 40 px. A tabela abaixo resume os resultados e os valores-alvo adotados no remake.

| Ação                   | Observação (MSX)                                             | Valor medido               | Conversão p/ Phaser              | Valor-alvo utilizado |
|------------------------|---------------------------------------------------------------|----------------------------|----------------------------------|----------------------|
| Corrida em galho       | Cobre 3 tiles (24 px) em 15 frames                            | 1,60 px/frame (96 px/s)    | Limite horizontal (`maxVelocity.x`) | **96 px/s**          |
| Aceleração lateral     | 90% da velocidade alcançada em 12 frames                      | 0,13 px/frame² (7,8 px/s²) | `acceleration.x`                  | **780 px/s²**        |
| Desaceleração em solo  | Para em ~10 frames após soltar a tecla                        | −0,16 px/frame² (−9,6 px/s²) | `drag.x` equivalente             | **640 px/s²**        |
| Altura do salto        | Pico do salto 74 px acima do galho (9,25 tiles)               | —                          | `velocity.y` inicial             | **−335 px/s** (gravidade 760) |
| Tempo do salto         | Arco completo (subida + descida) em 48 frames                 | 0,8 s                      | `gravity.y`                      | **760 px/s²**        |
| Escalada para cima     | Avança 1 tile (8 px) a cada 8 frames                          | 0,10 px/frame (60 px/s)    | `velocity.y`                     | **−60 px/s**         |
| Escalada para baixo    | Desce 1 tile a cada 5 frames                                   | 0,16 px/frame (96 px/s)    | `velocity.y`                     | **96 px/s**          |
| Deslizar no tronco     | Com ↓ pressionado, queda lenta pelo tronco                    | 0,22 px/frame (132 px/s)   | `velocity.y`                     | **132 px/s**         |
| Agarrar galho          | Encosta lateralmente num galho com ↑ pressionado              | Suspende a queda após ~6 px | Gravidade desativada + buffer    | Hang de até **600 ms** |

### Conversão para a engine

- A engine Arcade de Phaser trabalha em px/s. Por isso os valores por frame foram multiplicados por 60.
- A aceleração lateral foi convertida multiplicando 0,13 px/frame² por 60² (≈ 780 px/s²). O mesmo processo foi usado para a desaceleração.
- A altura de salto usa velocidade inicial de −335 px/s com gravidade 760 px/s², resultando em pico a ~0,44 s (cerca de 74 px).
- A escalada foi limitada pela velocidade vertical fixa ao entrar em modo de escalada.
- A duração do agarrão de galho foi mapeada para uma janela máxima de 600 ms mantendo a gravidade desligada.

Esses alvos agora moram em um perfil compartilhado (`src/config/playerPhysics.ts`), usado pelo `Player` para recalcular aceleração, velocidades máximas e movimentos especiais sempre que algum multiplicador de velocidade entra em cena.

### Pontuação e penalidades

- **Fruta**: 500 pontos e +1 segundo no cronômetro, de acordo com a tela de status do MSX.
- **Bônus de fase**: 100 pontos por segundo restante ao tocar a faixa do topo.
- **Acerto de inimigo**: perde 1 vida e 10 segundos; o personagem entra em queda controlada temporária.
- **Queda/tempo zerado**: perde 1 vida, 15 segundos e reinicia a fase atual com o tempo restaurado.
