import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../service/auth.service';
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { AdminService } from '../../service/admin.service';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { TextareaModule } from 'primeng/textarea';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [
        CommonModule,
        CardModule,
        ProgressBarModule,
        ButtonModule,
        DividerModule,
        TagModule,
        DialogModule,
        FormsModule,
        TextareaModule
    ],
    templateUrl: './profile.component.html',
    styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
    authService = inject(AuthService);
    private adminService = inject(AdminService);
    private messageService = inject(MessageService);
    user = this.authService.currentUser;

    showUpgradeDialog = false;
    upgradeReason = '';
    submitting = false;

    ngOnInit() {
        // Fetch latest profile data when entering profile page
        this.authService.getUserProfile().subscribe();
    }

    upgradePlan() {
        this.showUpgradeDialog = true;
    }

    submitUpgradeRequest() {
        if (!this.upgradeReason.trim()) return;

        this.submitting = true;
        this.adminService.createUpgradeRequest(this.upgradeReason).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Request Sent',
                    detail: 'Your upgrade request has been sent to the admin. You will be notified once it is processed.',
                });
                this.showUpgradeDialog = false;
                this.upgradeReason = '';
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to send upgrade request. Please try again.',
                });
            },
            complete: () => this.submitting = false
        });
    }

    get analysisPercentage(): number {
        const user = this.user();
        if (!user) return 0;
        return (user.analysisCount / user.usageLimit) * 100;
    }

    get generationPercentage(): number {
        const user = this.user();
        if (!user) return 0;
        return (user.generationCount / user.usageLimit) * 100;
    }

    getSeverity(percentage: number): 'success' | 'warn' | 'danger' {
        if (percentage < 70) return 'success';
        if (percentage < 90) return 'warn';
        return 'danger';
    }

    get usageSeverity(): 'success' | 'warn' | 'danger' {
        return this.getSeverity(this.analysisPercentage);
    }
}
