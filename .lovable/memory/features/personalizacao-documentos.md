---
name: Personalização de documentos (branding + templates)
description: Módulo doc-branding — logos, dados institucionais, campos extras, layout, QR, galeria e templates compartilháveis
type: feature
---

# Módulo `src/modules/doc-branding/`

- `lib/types.ts` — DocumentBranding (logos, institution, customFields, layout) + DocTypeKey.
- `lib/defaults.ts` — defaults, `normalizeBranding` (tolerante a versões antigas) e `GALLERY` de modelos padrão embutidos.
- `lib/renderDocument.ts` — motor único de HTML/CSS de impressão (preview + PDF). Sem biblioteca pesada de PDF: CSS `@page` nativo, PDF pelo diálogo do navegador. Suporta variáveis `{{instituicao.nome}}`, `{{paciente.nome}}`, `{{documento.codigo}}` etc.
- `lib/validation.ts` — registro extensível de regras (`TEMPLATE_RULES`) com referência normativa; base para validação regulatória futura.
- `lib/qr.ts` — QR em data URL via `qrcode`.
- `BrandingChrome.tsx` — cabeçalho/rodapé aplicados na folha real (`PrintArea`) + `brandingPrintCss`.
- `DocumentCustomizationDialog.tsx` — modal com abas Logos / Dados / Campos / Layout / Modelos e preview ao vivo em iframe.
- `hooks/useDocumentBranding.ts` — perfil ativo em localStorage; `hooks/useDocumentTemplates.ts` — CRUD na tabela `documento_templates`.

Regras:
- Receita em **paisagem (2 vias)** ignora a personalização de layout — formato é exigência legal.
- Tabela `documento_templates`: visibilidade privado/instituicao/publico; galeria (`is_galeria`) só admin.
- Entrada na UI: Configurações → aba **Layout**.
