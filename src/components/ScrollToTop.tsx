import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Reseta o scroll para o topo a cada mudança de rota.
 * Essencial para entrar na área interna pós-login já no início da tela.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
