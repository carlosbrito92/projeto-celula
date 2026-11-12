// Atualização do app instalado/aberto (PWA) sem o usuário limpar cache.
//
// O navegador só procura um service worker novo quando há navegação. No
// celular, voltar para o app (ou para uma aba aberta há dias) não navega, então
// a versão antiga seguia rodando — e a orientação "limpe os dados do site"
// apagava as anotações pessoais (localStorage). Duas regras:
//   1. Procura versão nova sempre que o app volta a ficar visível.
//   2. Quando a versão nova assume, recarrega só num momento seguro: nunca com
//      um campo de texto em foco (nota sendo escrita, editor). Espera o campo
//      perder o foco, o app ir para segundo plano ou a próxima troca de tela.
// As anotações ficam no localStorage, que a atualização não toca.

type RegisterSW = (opcoes: {
  immediate?: boolean;
  onNeedReload?: () => void;
  onRegisteredSW?: (url: string, registro: ServiceWorkerRegistration | undefined) => void;
}) => unknown;

let pendente = false;
let recarregar: () => void = () => window.location.reload();

/** Há versão nova esperando a recarga (o Router usa para trocar de tela com carga completa). */
export function atualizacaoPendente(): boolean {
  return pendente;
}

/** Campo de texto em foco: recarregar agora perderia o que está sendo digitado. */
export function digitando(doc: Document = document): boolean {
  const el = doc.activeElement as HTMLElement | null;
  if (!el) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (tag !== 'INPUT') return false;
  const tipo = (el as HTMLInputElement).type;
  return !['button', 'submit', 'reset', 'checkbox', 'radio', 'range', 'color', 'file', 'image'].includes(tipo);
}

function tentarRecarregar(): void {
  if (pendente && (document.visibilityState === 'hidden' || !digitando())) {
    pendente = false;
    recarregar();
  }
}

export function iniciarAtualizacao(registerSW: RegisterSW, opcoes: { recarregar?: () => void } = {}): void {
  pendente = false;
  if (opcoes.recarregar) recarregar = opcoes.recarregar;

  registerSW({
    immediate: true,
    onNeedReload() {
      pendente = true;
      tentarRecarregar();
    },
    onRegisteredSW(_url, registro) {
      if (!registro) return;
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') registro.update().catch(() => {});
      });
    },
  });

  document.addEventListener('visibilitychange', tentarRecarregar);
  // focusout dispara antes do foco ir para o próximo elemento; espera um tique
  // para não recarregar quando o usuário só pulou de um campo para outro.
  document.addEventListener('focusout', () => setTimeout(tentarRecarregar, 0));
}
