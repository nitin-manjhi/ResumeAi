import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';

@Component({
    standalone: true,
    imports: [CommonModule, ButtonModule],
    template: `
    <div class="flex flex-column gap-3">
      <div class="jd-content p-3 surface-50 border-round-lg border-1 surface-border" 
           style="white-space: pre-line; line-height: 1.6; font-size: 0.95rem; color: #4b5563;">
        {{ config.data.content }}
      </div>
      
      <div class="flex justify-content-end gap-2 mt-2 pt-3 border-top-1 border-100">
        <p-button label="Copy JD" icon="pi pi-copy" severity="info" [text]="true" (onClick)="copyJd()" />
        <p-button label="Close" icon="pi pi-times" severity="secondary" (onClick)="close()" />
      </div>
    </div>
  `,
    styles: [`
    .jd-content {
      max-height: 60vh;
      overflow-y: auto;
    }
  `]
})
export class JdModalComponent {
    config = inject(DynamicDialogConfig);
    ref = inject(DynamicDialogRef);
    private messageService = inject(MessageService);

    copyJd() {
        const text = this.config.data.content;
        if (text) {
            navigator.clipboard.writeText(text);
            this.messageService.add({
                severity: 'success',
                summary: 'Copied',
                detail: 'Job description copied to clipboard. You can now use it in Analysis.',
                life: 3000
            });
        }
    }

    close() {
        this.ref.close();
    }
}
