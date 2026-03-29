import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, UpgradeRequest, PasswordResetRequest } from '../service/admin.service';
import { AuthService, UserProfile } from '../service/auth.service';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TagModule } from 'primeng/tag';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { FileUploadModule } from 'primeng/fileupload';
import { NotificationService } from '../service/notification.service';

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
        TooltipModule,
        ToggleSwitchModule,
        SelectButtonModule,
        TagModule,
        ConfirmDialogModule,
        InputTextModule,
        IconFieldModule,
        InputIconModule,
        FileUploadModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './admin-dashboard.component.html',
    styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
    private adminService = inject(AdminService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);
    private notificationService = inject(NotificationService);
    authService = inject(AuthService);

    users = signal<UserProfile[]>([]);
    pendingUsers = signal<UserProfile[]>([]);
    upgradeRequests = signal<UpgradeRequest[]>([]);
    passwordResets = signal<PasswordResetRequest[]>([]);
    loadingUsers = signal<boolean>(false);
    loadingPending = signal<boolean>(false);
    loadingRequests = signal<boolean>(false);
    loadingResets = signal<boolean>(false);

    filterText = signal('');
    filteredUsers = computed(() => {
        const query = this.filterText().toLowerCase().trim();
        if (!query) return this.users();
        
        return this.users().filter(u => 
            u.username.toLowerCase().includes(query) || 
            u.email.toLowerCase().includes(query) ||
            u.name?.toLowerCase().includes(query)
        );
    });

    showApproveDialog = signal(false);
    selectedRequestId: number | null = null;
    currentRequestUsername = signal('');
    newUsageLimit = signal(50); // Default or proposed limit

    // Edit Usage Dialog Signals
    showEditUsageDialog = signal(false);
    editingUser = signal<UserProfile | null>(null);

    isMobile = signal(window.innerWidth < 768);

    activeView = signal('users'); // 'users', 'requests', 'pending', 'password-resets' or 'db'
    viewOptions = [
        { label: 'Manage Users', value: 'users', icon: 'pi pi-users' },
        { label: 'Pending Approvals', value: 'pending', icon: 'pi pi-user-plus' },
        { label: 'Upgrade Requests', value: 'requests', icon: 'pi pi-envelope' },
        { label: 'Password Resets', value: 'password-resets', icon: 'pi pi-key' },
        { label: 'Database Admin', value: 'db', icon: 'pi pi-database' }
    ];

    dbBackupPath = signal('');
    restorePath = signal('');
    isBackingUp = signal(false);
    isRestoring = signal(false);

    roles = [
        { label: 'User', value: 'USER' },
        { label: 'Admin', value: 'ADMIN' }
    ];

    constructor() {
        window.addEventListener('resize', () => {
            this.isMobile.set(window.innerWidth < 768);
        });
    }

    ngOnInit() {
        this.loadUsers();
        this.loadUpgradeRequests();
        this.loadPendingUsers();
        this.loadPasswordResets();

        // Subscribe to live dashboard refresh from WebSocket
        this.notificationService.refreshAdminData$.subscribe(() => {
            console.log('Live refresh triggered via WebSocket');
            this.loadUsers();
            this.loadUpgradeRequests();
            this.loadPendingUsers();
            this.loadPasswordResets();
        });

        // Proactive notifications for Admin on login
        const user = this.authService.currentUser();
        if (user?.role === 'ADMIN') {
            if (user.pendingApprovalsCount && user.pendingApprovalsCount > 0) {
                this.messageService.add({
                    severity: 'info',
                    summary: 'Pending Registrations',
                    detail: `You have ${user.pendingApprovalsCount} new user registrations awaiting approval.`,
                    sticky: true
                });
            }
            if (user.pendingPasswordResetsCount && user.pendingPasswordResetsCount > 0) {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Password Resets',
                    detail: `There are ${user.pendingPasswordResetsCount} password reset requests needing review.`,
                    sticky: true
                });
            }
        }
    }

    loadUsers() {
        this.loadingUsers.set(true);
        this.adminService.getAllUsers().subscribe({
            next: (users) => {
                const sanitizedUsers = users.map(u => ({
                    ...u,
                    analysisCount: u.analysisCount ?? 0,
                    generationCount: u.generationCount ?? 0,
                    usageLimit: u.usageLimit ?? 0,
                    premiumUsageLimit: u.premiumUsageLimit ?? 0,
                    premiumUsageCount: u.premiumUsageCount ?? 0,
                    premiumActive: !!u.premiumActive,
                    suspended: !!u.suspended
                }));
                this.users.set(sanitizedUsers);
                this.loadingUsers.set(false);
            },
            error: (err) => {
                console.error('Failed to load users', err);
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

    loadPendingUsers() {
        this.loadingPending.set(true);
        this.adminService.getPendingUsers().subscribe({
            next: (users) => {
                this.pendingUsers.set(users);
                this.loadingPending.set(false);
            },
            error: (err) => {
                console.error('Failed to load pending users', err);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load pending users' });
                this.loadingPending.set(false);
            }
        });
    }

    loadPasswordResets() {
        this.loadingResets.set(true);
        this.adminService.getPendingPasswordResets().subscribe({
            next: (resets) => {
                this.passwordResets.set(resets);
                this.loadingResets.set(false);
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load password resets' });
                this.loadingResets.set(false);
            }
        });
    }

    approvePasswordResetValue(request: PasswordResetRequest) {
        this.adminService.approvePasswordReset(request.id).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Reset Approved', detail: `Password for ${request.username} has been updated!` });
                this.passwordResets.update(resets => resets.filter(r => r.id !== request.id));
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to approve password reset' });
            }
        });
    }

    rejectPasswordResetValue(request: PasswordResetRequest) {
        this.adminService.rejectPasswordReset(request.id).subscribe({
            next: () => {
                this.messageService.add({ severity: 'info', summary: 'Reset Rejected', detail: `Password reset request for ${request.username} was discarded.` });
                this.passwordResets.update(resets => resets.filter(r => r.id !== request.id));
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to reject password reset' });
            }
        });
    }

    approveUserRequest(user: UserProfile) {
        this.adminService.approveUser(user.id).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Approved', detail: `User ${user.username} approved successfully!` });
                this.pendingUsers.update(pending => pending.filter(u => u.id !== user.id));
                this.loadUsers();
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to approve user' });
            }
        });
    }

    rejectUserRequest(user: UserProfile) {
        this.confirmationService.confirm({
            message: `Are you sure you want to REJECT and DELETE the registration for ${user.username}?`,
            header: 'Reject Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Yes, Reject Now',
            acceptButtonStyleClass: "p-button-danger",
            accept: () => {
                this.adminService.rejectUser(user.id).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'info', summary: 'Rejected', detail: `User ${user.username} registration rejected.` });
                        this.pendingUsers.update(pending => pending.filter(u => u.id !== user.id));
                    },
                    error: (err) => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to reject user' });
                    }
                });
            }
        });
    }

    openEditUsage(user: UserProfile) {
        this.editingUser.set({ ...user });
        this.showEditUsageDialog.set(true);
    }

    saveEditUsage() {
        const user = this.editingUser();
        if (user) {
            this.saveUsage(user);
            this.showEditUsageDialog.set(false);
        }
    }

    saveUsage(user: UserProfile) {
        this.adminService.updateUserUsage(user.id, user.analysisCount, user.generationCount, user.usageLimit, user.role,
            user.premiumActive, user.premiumUsageLimit, user.premiumUsageCount, user.suspended).subscribe({
                next: (updatedUser) => {
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: `Updated configuration for ${user.username}` });
                    this.users.update(users => users.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u));
                },
                error: (err) => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update user' });
                }
            });
    }

    confirmDelete(user: UserProfile) {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete user ${user.username}?`,
            header: 'Delete Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: "p-button-danger p-button-text",
            rejectButtonStyleClass: "p-button-text p-button-text",
            acceptIcon: "none",
            rejectIcon: "none",
            accept: () => {
                this.deleteUser(user.id);
            }
        });
    }

    deleteUser(userId: number) {
        this.adminService.deleteUser(userId).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'User deleted successfully' });
                this.users.update(users => users.filter(u => u.id !== userId));
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete user' });
            }
        });
    }

    processRequest(requestId: number, status: 'APPROVED' | 'REJECTED') {
        if (status === 'APPROVED') {
            this.selectedRequestId = requestId;
            const request = this.upgradeRequests().find(r => r.id === requestId);
            this.currentRequestUsername.set(request?.username || '');
            const user = this.users().find(u => u.username === request?.username);
            this.newUsageLimit.set((user?.usageLimit || 20) + 10);
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
                this.loadUpgradeRequests();
                if (status === 'APPROVED') this.loadUsers();
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to process request' });
            }
        });
    }

    onBackup() {
        this.isBackingUp.set(true);
        this.adminService.backupDatabase().subscribe({
            next: (path) => {
                this.dbBackupPath.set(path);
                this.messageService.add({ severity: 'success', summary: 'Backup Success', detail: 'Database backup created!' });
                this.isBackingUp.set(false);
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Backup Failed', detail: err.error?.message || 'Check server logs' });
                this.isBackingUp.set(false);
            }
        });
    }

    onRestore() {
        if (!this.restorePath()) {
            this.messageService.add({ severity: 'warn', summary: 'Path Required', detail: 'Enter backup file path.' });
            return;
        }
        this.confirmationService.confirm({
            message: 'Restore current database data? This will OVERWRITE existing data.',
            header: 'Restore Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Yes, Restore Now',
            acceptButtonStyleClass: "p-button-danger",
            accept: () => {
                this.isRestoring.set(true);
                this.adminService.restoreDatabase(this.restorePath()).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Restore Success', detail: 'Reset' });
                        this.isRestoring.set(false);
                        this.loadUsers();
                    },
                    error: (err) => {
                        this.messageService.add({ severity: 'error', summary: 'Restore Failed', detail: err.error?.message });
                        this.isRestoring.set(false);
                    }
                });
            }
        });
    }

    onUploadRestore(event: any) {
        const file = event.files[0];
        if (!file) return;
        this.confirmationService.confirm({
            message: `Restore from ${file.name}?`,
            header: 'Critical Restore',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Restore',
            acceptButtonStyleClass: "p-button-danger",
            accept: () => {
                this.isRestoring.set(true);
                this.adminService.uploadAndRestoreDatabase(file).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Restore Success', detail: 'Restored from upload' });
                        this.isRestoring.set(false);
                        this.loadUsers();
                    },
                    error: (err) => {
                        this.messageService.add({ severity: 'error', summary: 'Restore Failed', detail: err.error?.message });
                        this.isRestoring.set(false);
                    }
                });
            }
        });
    }
}
