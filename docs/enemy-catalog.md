# Catálogo de inimigos do Magical Tree (MSX)

| Inimigo | Aparência original (MSX) | Comportamento clássico | Condição de spawn implementada |
| --- | --- | --- | --- |
| Condor Azul | Ave azul que cruza a tela batendo as asas. | Sobrevoa horizontalmente, realizando leves mergulhos enquanto tenta derrubar o jogador da trepadeira. | Surge fora da tela, à esquerda ou direita, em altura próxima ao jogador. A velocidade e a frequência crescem com o avanço das fases. |
| Escorpião Vermelho | Enxerido que patrulha os galhos baixos da árvore. | Caminha para frente e para trás, alternando direção ao atingir a borda do galho. | Materializa-se em galhos próximos ao jogador, respeitando o espaço lateral daquele galho e sincronizando com o padrão "sai do buraco" do MSX. |
| Macaco Trepador | Macaco marrom pendurado na trepadeira central. | Sobe e desce alternando pausas curtas e arremessa cocos em arco. | Ativado quando o jogador entra na faixa vertical do macaco. Oscila entre dois pontos da árvore e lança projéteis temporizados conforme a fase. |
| Cobra de Buraco | Cobra verde que brota dos buracos do tronco. | Emerge rapidamente, desliza alguns passos e retorna para o esconderijo. | Escolhe aleatoriamente um dos buracos laterais do tronco em altura semelhante ao galho atual do jogador. O tempo entre aparições reduz conforme a dificuldade. |
| Aranha da Videira | Aranha roxa que desce pendurada por fios. | Desce até certa altura, balança e retorna para o galho de origem. | Seleciona galhos superiores ao jogador, desce até quase encostar e sobe novamente, reproduzindo o comportamento de queda súbita do original. |
| Coco arremessado | Projéteis castanhos lançados pelos macacos. | Descreve arco curto e, ao acertar, reduz o tempo restante. | Gerado pelos macacos conforme um temporizador interno, com velocidade aleatória e direção baseada no lado do jogador. |

> **Referências utilizadas**: mapas de inimigos da versão MSX presentes em longplays, manuais digitalizados e o quadro de inimigos publicado nas revistas MSX Fan (1986). As decisões de spawn imitam as origens originais: buracos do tronco, bordas de galho ou aparições laterais.
