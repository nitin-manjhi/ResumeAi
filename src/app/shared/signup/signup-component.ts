import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../service/auth.service';

@Component({
    selector: 'app-signup',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        CardModule,
        InputTextModule,
        PasswordModule,
        ButtonModule,
        ToastModule,
        RouterLink
    ],
    templateUrl: './signup-component.html',
    styleUrl: './signup-component.scss'
})
export class SignupComponent {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(Router);
    private messageService = inject(MessageService);

    signupForm: FormGroup;
    loading = signal(false);

    constructor() {
        this.signupForm = this.fb.group({
            name: ['', [Validators.required]],
            username: ['', [Validators.required, Validators.minLength(3)]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]]
        }, { validator: this.passwordMatchValidator });
    }

    passwordMatchValidator(g: FormGroup) {
        return g.get('password')?.value === g.get('confirmPassword')?.value
            ? null : { 'mismatch': true };
    }

    onSignup() {
        if (this.signupForm.invalid) {
            this.signupForm.markAllAsTouched();
            return;
        }

        this.loading.set(true);
        const { confirmPassword, ...userData } = this.signupForm.value;

        this.authService.register(userData).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Registration Successful',
                    detail: 'Your account has been created and is awaiting administrator approval. You will be able to login once approved.'
                });
                setTimeout(() => {
                    this.router.navigate(['/login']);
                }, 2000);
            },
            error: (err) => {
                this.loading.set(false);
                const isUnapproved = err.status === 403 && err.error?.message?.includes('approval');
                
                if (isUnapproved) {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Registration Successful',
                        detail: 'Your account has been created and is awaiting administrator approval. You will be able to login once approved.'
                    });
                    setTimeout(() => {
                        this.router.navigate(['/login']);
                    }, 4000);
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: err.error?.message || 'Registration failed. Please try again.'
                    });
                }
            },
            complete: () => {
                this.loading.set(false);
            }
        });
    }
}
