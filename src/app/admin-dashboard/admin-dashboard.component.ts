import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, UpgradeRequest } from '../service/admin.service';
import { AuthService, UserProfile } from '../service/auth.service';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        ButtonModule,
        InputNumberModule,
        FormsModule,
        ToastModule,
        CardModule,
        DialogModule,
        SelectModule,
        TooltipModule
    ],
    providers: [MessageService],
    templateUrl: './admin-dashboard.component.html',
    styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
    private adminService = inject(AdminService);
    private messageService = inject(MessageService);
    authService = inject(AuthService);

    users = signal<UserProfile[]>([]);
    upgradeRequests = signal<UpgradeRequest[]>([]);
    loadingUsers = signal(false);
    loadingRequests = signal(false);

    showApproveDialog = signal(false);
    selectedRequestId: number | null = null;
    currentRequestUsername = signal('');
    newUsageLimit = signal(50); // Default or proposed limit

    roles = [
        { label: 'User', value: 'USER' },
        { label: 'Admin', value: 'ADMIN' }
    ];

    ngOnInit() {
        this.loadUsers();
        this.loadUpgradeRequests();
    }

    loadUsers() {
        this.loadingUsers.set(true);
        this.adminService.getAllUsers().subscribe({
            next: (users) => {
                this.users.set(users);
                this.loadingUsers.set(false);
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load users' });
                this.loadingUsers.set(false);
            }
        });
    }

    loadUpgradeRequests() {
        this.loadingRequests.set(true);
        this.adminService.getPendingUpgradeRequests().subscribe({
            next: (requests) => {
                this.upgradeRequests.set(requests);
                this.loadingRequests.set(false);
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load upgrade requests' });
                this.loadingRequests.set(false);
            }
        });
    }

    saveUsage(user: UserProfile) {
        this.adminService.updateUserUsage(user.id, user.analysisCount, user.generationCount, user.usageLimit, user.role).subscribe({
            next: (updatedUser) => {
                this.messageService.add({ severity: 'success', summary: 'Success', detail: `Updated usage for ${user.username}` });
                // Update local state by merging the updated fields
                this.users.update(users => users.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u));
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update usage' });
            }
        });
    }

    processRequest(requestId: number, status: 'APPROVED' | 'REJECTED') {
        if (status === 'APPROVED') {
            this.selectedRequestId = requestId;
            const request = this.upgradeRequests().find(r => r.id === requestId);
            this.currentRequestUsername.set(request?.username || '');

            // Try to find the user's current limit to propose an increase
            const user = this.users().find(u => u.username === request?.username);
            this.newUsageLimit.set((user?.usageLimit || 20) + 10); // Propose current + 10

            this.showApproveDialog.set(true);
            return;
        }

        this.executeProcessRequest(requestId, 'REJECTED');
    }

    confirmApprove() {
        if (this.selectedRequestId) {
            this.executeProcessRequest(this.selectedRequestId, 'APPROVED', this.newUsageLimit());
            this.showApproveDialog.set(false);
            this.selectedRequestId = null;
        }
    }

    private executeProcessRequest(requestId: number, status: 'APPROVED' | 'REJECTED', newLimit?: number) {
        this.adminService.processUpgradeRequest(requestId, status, newLimit).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: `Request ${status === 'APPROVED' ? 'approved' : 'rejected'}`
                });
                this.loadUpgradeRequests(); // Reload requests
                if (status === 'APPROVED') this.loadUsers(); // Reload users to see updated usage
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to process request' });
            }
        });
    }
}
