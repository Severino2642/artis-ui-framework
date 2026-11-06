import { ModalDismissedError } from './modal.models';

/**
 * Référence à une modale ouverte. Injectable dans le composant enfant :
 * `private ref = inject(ModalRef<Client>); … this.ref.close(client);`
 */
export class ModalRef<R = unknown> {
  private _resolve!: (v: R | undefined) => void;
  private _reject!: (e: unknown) => void;
  private _done = false;

  /** Résolue à la fermeture avec le résultat (ou `undefined` si fermée sans résultat). */
  readonly result: Promise<R | undefined> = new Promise((res, rej) => { this._resolve = res; this._reject = rej; });

  /** @internal appelé par le service pour détruire la vue. */
  onClosed: () => void = () => undefined;

  constructor(readonly id: number, private readonly rejectOnDismiss = false) {}

  get isClosed(): boolean { return this._done; }

  /** Ferme la modale en retournant un résultat à l'appelant. */
  close(result?: R): void {
    if (this._done) return;
    this._done = true;
    this._resolve(result);
    this.onClosed();
  }

  /** Ferme sans résultat (équivaut à Échap / clic sur le fond / ✕). */
  dismiss(): void {
    if (this._done) return;
    this._done = true;
    if (this.rejectOnDismiss) this._reject(new ModalDismissedError());
    else this._resolve(undefined);
    this.onClosed();
  }
}
