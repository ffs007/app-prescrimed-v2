const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div className="w-full border-b border-destructive/40 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
        Os pagamentos ainda não estão liberados nesta versão publicada.
      </div>
    );
  }
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="w-full border-b border-border bg-muted px-4 py-2 text-center text-sm text-muted-foreground">
        Ambiente de teste: nenhuma cobrança real é feita nesta pré-visualização.
      </div>
    );
  }
  return null;
}

export default PaymentTestModeBanner;
