import { DatePipe } from '@angular/common';
import { Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Invite, InviteService } from '../service/invite.service';

/**
 * "Invite a friend" window. Every open() creates a new single-use invite (ADR-021) and copies its
 * link; closing doesn't revoke it.
 */
@Component({
  imports: [DatePipe],
  selector: 'app-invite-dialog',
  templateUrl: './invite-dialog.html',
})
export class InviteDialog {
  private readonly invites = inject(InviteService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly invite = signal<Invite | null>(null);
  protected readonly copied = signal(false);
  protected readonly error = signal<string | null>(null);

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  open(): void {
    this.invite.set(null);
    this.copied.set(false);
    this.error.set(null);
    this.dialog().nativeElement.showModal();

    this.invites
      .create()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (invite) => {
          this.invite.set(invite);
          void this.copy();
        },
        error: () => this.error.set('Creating the invite failed, try again'),
      });
  }

  protected close(): void {
    this.dialog().nativeElement.close();
  }

  /** Some browsers refuse clipboard access outside a click; then the "Copy link" button still works. */
  protected async copy(): Promise<void> {
    const invite = this.invite();
    if (!invite) return;
    try {
      await navigator.clipboard.writeText(invite.url);
      this.copied.set(true);
    } catch {
      this.copied.set(false);
    }
  }
}
