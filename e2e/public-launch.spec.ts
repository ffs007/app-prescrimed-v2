import { expect, test } from "../playwright-fixture";

test("landing direciona o plano mensal para o cadastro", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Prescreva e gere documentos clínicos em poucos minutos." }),
  ).toBeVisible();

  await page.locator('a[href="/cadastro?plan=pro_monthly"]').click();
  await expect(page).toHaveURL(/\/cadastro\?plan=pro_monthly$/);
  await expect(page.getByRole("heading", { name: "Criar conta grátis" })).toBeVisible();
});

test("páginas públicas essenciais estão acessíveis", async ({ page }) => {
  await page.goto("/termos");
  await expect(page.getByRole("heading", { name: "Termos de uso" })).toBeVisible();

  await page.goto("/privacidade");
  await expect(page.getByRole("heading", { name: "Privacidade e LGPD" })).toBeVisible();

  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Fazer login" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Esqueci minha senha" })).toBeVisible();
});
