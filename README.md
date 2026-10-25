GitGen Studio 📱
Gerenciador mobile de repositórios GitHub + gerador de PWA instalável — criado para quem só tem um celular.

O que é
O GitGen Studio permite gerenciar repositórios do GitHub direto do navegador do celular, sem precisar de computador. Também gera páginas de instalação PWA para transformar qualquer projeto em um "app" instalável no Android.

Funcionalidades
🔑 Conexão via token pessoal do GitHub (armazenado apenas no localStorage do aparelho — nunca vai para servidor)
📁 Criar projetos/repositórios
📝 Criar, editar e excluir arquivos
🖼️ Upload de imagens
🔄 Visualizar mudanças feitas nos arquivos
📲 Gerador de PWA: preencha nome, ícone e cores e gere uma página de instalação com manifest
Como usar
Abra o app no navegador do celular
Gere um token pessoal no GitHub (recomendo um token fine-grained, com acesso apenas aos repositórios que vai usar)
Cole o token no app — ele fica salvo só no seu aparelho
Gerencie seus repositórios
Demonstração
👉 Abrir GitGen Studio

Tecnologias
HTML • CSS • JavaScript • GitHub REST API • PWA (Web App Manifest) • LocalStorage

Segurança
O token nunca sai do seu aparelho. Recomenda-se usar tokens fine-grained e revogá-los ao trocar de dispositivo.

Feito por Yuri Foster (HypeLab) — desenvolvido 100% no celular.

