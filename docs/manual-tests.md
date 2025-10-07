# Checklist manual de validação

## Preparação

- Inicie o jogo a partir da BootScene e utilize o teclado (setas + espaço).
- Ative o painel de debug do navegador (F12) apenas se quiser verificar logs de spawn.
- Execute cada checklist reiniciando a fase correspondente para garantir consistência.

## Fase 1 – Condores e escorpiões

- [ ] Verificar que condor surge alternadamente pelos dois lados sem aviso visual.
- [ ] Confirmar que a animação de voo usa a spritesheet nova (`condor-fly`).
- [ ] Permitir que um condor acerte o jogador durante a escalada e observar a queda + perda de 6 segundos.
- [ ] Observar escorpiões aparecendo em galhos próximos e patrulhando o segmento limitado.
- [ ] Colidir com escorpião sobre a escada e verificar emissão de partículas e som `enemy-hit`.

## Fase 2 – Inclusão de macacos

- [ ] Verificar spawn de macacos nos lados do tronco, subindo e descendo entre dois pontos.
- [ ] Confirmar animação de escalada e de arremesso (`monkey-climb` / `monkey-throw`).
- [ ] Capturar um coco em mid-air e validar a drenagem de 4 segundos + som `time-drain`.
- [ ] Garantir que cocos colidindo com galhos são destruídos com partículas.

## Fase 3 – Cobras dos buracos

- [ ] Identificar cobras emergindo alternadamente dos buracos do tronco.
- [ ] Validar que o tween de subida ocorre ao spawn (`snake-rise`).
- [ ] Ser atingido por uma cobra para confirmar knockdown e consumo de tempo.

## Fase 4 – Aranhas penduradas

- [ ] Observar aranhas descendo de galhos superiores e oscilando com a animação `spider-sway`.
- [ ] Confirmar que, ao completar o ciclo e retornar ao galho, elas desaparecem.
- [ ] Ser atingido por uma aranha para checar partículas, som e perda de tempo.

## Regressão geral

- [ ] Coletar frutas e certificar-se de que tempo/placar atualizam corretamente (texto flutuante + HUD).
- [ ] Vencer uma fase e verificar que spawners da próxima fase são atualizados (novo mix de inimigos).
- [ ] Perder todo o tempo restante para garantir que `TEMPO ESGOTOU` dispara o game over.
- [ ] Checar que o jogo reinicia no estágio correto após vitória ou game over.
