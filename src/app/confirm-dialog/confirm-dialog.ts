import { Component, ElementRef, input, output, viewChild } from '@angular/core';

let nextId = 0;

/**
 * Modal "are you sure?" window. The body text goes between the tags; the parent calls open(),
 * does the work on (confirmed) and calls close() when it succeeds.
 */
@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.html',
})
export class ConfirmDialog {
  readonly title = input.required<string>();
  readonly confirmLabel = input('Delete');
  readonly busyLabel = input('Deleting…');
  /** While true both buttons are disabled and the dialog can't be dismissed. */
  readonly busy = input(false);
  readonly error = input<string | null>(null);
  readonly confirmed = output<void>();

  /** Unique so several dialogs on one page each label themselves. */
  protected readonly titleId = `confirm-title-${nextId++}`;

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  open(): void {
    this.dialog().nativeElement.showModal();
  }

  close(): void {
    this.dialog().nativeElement.close();
  }

  protected dismiss(event: Event): void {
    if (this.busy()) event.preventDefault();
  }
}
