import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../../service/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        CardModule,
        InputTextModule,
        PasswordModule,
        ButtonModule,
        CheckboxModule,
        ToastModule,
        RouterLink
    ],
    templateUrl: './login-component.html',
    styleUrl: './login-component.scss'
})
export class LoginComponent {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private messageService = inject(MessageService);

    loginForm: FormGroup;
    loading = signal(false);

    constructor() {
        this.loginForm = this.fb.group({
            username: ['', [Validators.required]],
            password: ['', [Validators.required]],
            rememberMe: [false]
        });
    }

    onLogin() {
        if (this.loginForm.invalid) {
            this.loginForm.markAllAsTouched();
            return;
        }

        this.loading.set(true);
        this.authService.login(this.loginForm.value).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Login successful!' });
                setTimeout(() => {
                    const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
                    this.router.navigateByUrl(returnUrl);
                }, 1000);
            },
            error: (err) => {
                this.loading.set(false);
                const errorMsg = err.error?.message || '';
                const isUnapproved = err.status === 403 && errorMsg.includes('approval');
                const isNotFound = errorMsg.includes('does not exist');

                if (isNotFound) {
                    this.messageService.add({
                        severity: 'info',
                        summary: 'Account Not Found',
                        detail: 'Account does not exist. Redirecting to signup...'
                    });
                    setTimeout(() => {
                        this.router.navigate(['/signup']);
                    }, 2000);
                } else {
                    this.messageService.add({
                        severity: isUnapproved ? 'warn' : 'error',
                        summary: isUnapproved ? 'Pending Approval' : 'Login Failed',
                        detail: isUnapproved 
                            ? 'Your account is currently awaiting administrator approval.' 
                            : (errorMsg || 'Invalid username or password. Please try again.')
                    });
                }
            },
            complete: () => {
                this.loading.set(false);
            }
        });
    }
}
