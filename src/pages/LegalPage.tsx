import { Link } from "react-router-dom";
import PageMeta from "@/components/seo/PageMeta";
import { LEGAL_VERSION, PRIVACY_POLICY, TERMS_OF_USE } from "@/modules/security/lib/legalTexts";

type LegalKind = "terms" | "privacy";

type Props = {
  kind: LegalKind;
};

const CONFIG = {
  terms: {
    title: "Termos de uso",
    description: "Termos de uso do PrescriMed.",
    path: "/termos",
    content: TERMS_OF_USE,
  },
  privacy: {
    title: "Privacidade e LGPD",
    description: "Política de privacidade e proteção de dados do PrescriMed.",
    path: "/privacidade",
    content: PRIVACY_POLICY,
  },
} as const;

export default function LegalPage({ kind }: Props) {
  const page = CONFIG[kind];

  return (
    <main className="min-h-screen bg-paper text-ink">
      <PageMeta title={`${page.title} | PrescriMed`} description={page.description} path={page.path} />
      <header className="border-b border-ink-soft">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
          <Link to="/" className="font-serif text-xl tracking-tight">PrescriMed+</Link>
          <Link to="/cadastro" className="text-xs font-semibold uppercase tracking-editorial hover:text-canon-blue">
            Criar conta
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-4xl px-6 py-12 md:py-16">
        <p className="mb-4 text-[11px] font-medium uppercase tracking-editorial text-ink-muted">
          Versão {LEGAL_VERSION}
        </p>
        <h1 className="font-serif text-4xl tracking-tight md:text-5xl">{page.title}</h1>
        <div className="mt-10 whitespace-pre-line text-base leading-8 text-ink-muted">
          {page.content.replace(/^### .+\n+/, "")}
        </div>
      </article>
    </main>
  );
}
