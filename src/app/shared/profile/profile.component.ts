import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../service/auth.service';
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

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
        ToastModule
    ],
    providers: [MessageService],
    templateUrl: './profile.component.html',
    styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
    authService = inject(AuthService);
    private messageService = inject(MessageService);
    user = this.authService.currentUser;

    ngOnInit() {
        // Fetch latest profile data when entering profile page
        this.authService.getUserProfile().subscribe();
    }

    upgradePlan() {
        this.messageService.add({
            severity: 'info',
            summary: 'Coming Soon',
            detail: 'Premium plans and payment integration are currently being developed. You will be notified once they are available!',
            life: 5000
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
