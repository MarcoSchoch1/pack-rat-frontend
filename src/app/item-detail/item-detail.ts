import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CONDITIONS, Image, Item, ItemService } from '../service/item.service';

/** Same limit as the backend's spring.servlet.multipart.max-file-size. */
const MAX_PICTURE_BYTES = 5 * 1024 * 1024;

@Component({
  imports: [RouterLink, CurrencyPipe, DatePipe],
  selector: 'app-item-detail',
  styleUrl: './item-detail.css',
  templateUrl: './item-detail.html',
})
export class ItemDetail {
  protected readonly itemService = inject(ItemService);
  private readonly router = inject(Router);
  private readonly itemId = inject(ActivatedRoute).snapshot.paramMap.get('id')!;

  protected readonly conditions = CONDITIONS;
  protected readonly item = signal<Item | null>(null);
  protected readonly images = signal<Image[]>([]);
  protected readonly selected = signal(0);
  protected readonly error = signal<string | null>(null);
  protected readonly deleting = signal(false);

  constructor() {
    this.itemService.get(this.itemId).subscribe({
      next: (item) => this.item.set(item),
      error: () => this.error.set('Could not load the item, try again'),
    });
    // Pictures are optional; if they fail to load the item still shows.
    this.itemService.images(this.itemId).subscribe((images) => this.images.set(images));
  }

  protected addPicture(files: FileList | null): void {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > MAX_PICTURE_BYTES) {
      this.error.set('The picture must be an image of 5 MB or smaller');
      return;
    }
    this.error.set(null);
    this.itemService.uploadImage(this.itemId, file).subscribe({
      next: (image) => {
        this.images.update((images) => [...images, image]);
        this.selected.set(this.images().length - 1);
      },
      error: () => this.error.set('Uploading the picture failed, try again'),
    });
  }

  protected deleteItem(): void {
    if (this.deleting() || !confirm(`Delete "${this.item()?.name}"? This can't be undone.`)) return;
    this.deleting.set(true);
    this.error.set(null);
    this.itemService.delete(this.itemId).subscribe({
      next: () => void this.router.navigateByUrl('/'),
      error: () => {
        this.deleting.set(false);
        this.error.set('Deleting the item failed, try again');
      },
    });
  }
}
