# Portfólio Wesley Santos — correção real
- O banner usa um recorte da arte ilustrada original de referência, não uma captura de tela do site inteiro.
- A seção Sobre mim usa um recorte de retrato separado da mesma arte, sem miniatura da página.
- Corrigido o HTML quebrado que fechava uma div a mais na seção Sobre mim.
- A faixa de serviços aparece uma única vez, abaixo do banner.
- Auri IA permanece como projeto principal.
- O botão de contato aponta para https://wa.me/5511967110613.
- Não altera Vercel, Auri ou Executor Nexus.

Termux:
```bash
mkdir -p ~/portfolio-wesley-corrigido-de-verdade
cd ~/portfolio-wesley-corrigido-de-verdade
unzip -o ~/storage/downloads/portfolio-wesley-corrigido-de-verdade.zip
python -m http.server 8093
```
Abra http://127.0.0.1:8093
