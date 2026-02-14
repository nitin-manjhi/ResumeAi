import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, UpgradeRequest } from '../service/admin.service';
import { UserProfile } from '../service/auth.service';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';

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
        CardModule
    ],
    providers: [MessageService],
    templateUrl: './admin-dashboard.component.html',
    styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
    private adminService = inject(AdminService);
    private messageService = inject(MessageService);

    users = signal<UserProfile[]>([]);
    upgradeRequests = signal<UpgradeRequest[]>([]);
    loadingUsers = signal(false);
    loadingRequests = signal(false);

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
        this.adminService.updateUserUsage(user.id, user.analysisCount, user.generationCount, user.usageLimit).subscribe({
            next: (updatedUser) => {
                this.messageService.add({ severity: 'success', summary: 'Success', detail: `Updated usage for ${user.username}` });
                // Update local state
                this.users.update(users => users.map(u => u.id === updatedUser.id ? updatedUser : u));
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update usage' });
            }
        });
    }

    processRequest(requestId: number, status: 'APPROVED' | 'REJECTED') {
        this.adminService.processUpgradeRequest(requestId, status).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: `Request ${status === 'APPROVED' ? 'approved' : 'rejected'}`
                });
                this.loadUpgradeRequests(); // Reload requests
                if (status === 'APPROVED') this.loadUsers(); // Reload users to see updated usage if changed
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to process request' });
            }
        });
    }
}
