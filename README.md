# UERJBotz — Site Institucional

A UERJBotz é a equipe de robótica e projeto de extensão da Universidade do Estado do Rio de Janeiro, fundada em 2013. Reúne estudantes em Computação, Eletrônica, Mecânica, Gestão, Marketing e MPR (Meu Primeiro Robô), desenvolvendo robôs, participando de competições e promovendo formação prática.

O site apresenta a equipe, membros, projetos, conquistas, parceiros, recrutamento e canais de contato. A identidade visual usa preto, vermelho e branco, o logo da equipe e a imagem do nome com sua tipografia original.

## Estrutura

Projeto estático em HTML, CSS e JavaScript, sem framework, backend ou banco de dados. Utiliza JSONs para organização de dados da equipe.

| Arquivo/pasta | Função |
| --- | --- |
| `index.html` | Estrutura, conteúdo institucional, navegação e metadados |
| `styles.css` | Identidade visual, componentes, responsividade e movimento reduzido |
| `script.js` | Carregamento dos JSONs, cartões, abas, menu mobile e ano do rodapé |
| `assets/` | Imagens aprovadas para publicação, incluindo `logo-uerjbotz.jpg` e `nome-uerjbotz.png` |
| `data/` | Somente JSONs públicos e aprovados pela equipe |
| `.nojekyll` | Dispensa o processamento Jekyll na publicação estática pelo GitHub Pages |

## Dados

- `equipe.json`: objeto com `fundacao` (número ou texto).
- `membros.json`: objeto com `areas` e `membros`. Cada área usa `id` (texto único), `codigo`, `nome` e `descricao`. Cada membro usa `nome`, `area` (ID da área), `ativo` (booleano), `cargo`, e opcionalmente `foto`, `lideranca` e `subarea` (ID de outra área).
- `projetos.json`: lista com `nome`, `codigo`, `categoria`, `descricao`, `tags` (lista) e opcionalmente `imagem`.
- `conquistas.json`: lista com `ano`, `competicao`, `categoria`, `descricao` e `colocacao` (ausência/zero exibe “Menção”).
- `parceiros.json`: lista com `nome`, `ativo` (booleano) e opcionalmente `logo`.

Fotos e imagens aceitam caminhos relativos ao HTML ou URLs HTTPS. Textos dos JSONs são tratados como texto, não HTML. Cada arquivo tem validação básica e falhas independentes; um JSON indisponível não esconde o restante da página. Estatísticas ausentes aparecem como “—”, sem inventar números.

## Desenvolvimento

Na pasta que contém o HTML, execute `python -m http.server 8000` (Windows: `py -m http.server 8000`) e abra `http://localhost:8000`.

Atualize conteúdo dinâmico nos JSONs e texto institucional no HTML. Confirme nomes, cargos, resultados, parceiros, contatos e afirmações de recrutamento antes da publicação oficial. 

## Manutenção

Manter responsáveis da equipe para conteúdo, domínio e hospedagem, revisão por outro membro antes do deploy, cópias de segurança e (possível) acesso institucional com autenticação em dois fatores. Não há painel administrativo nem área restrita nesta versão (pode existir no futuro).
