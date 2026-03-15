import { inject, Injectable, signal, effect } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { AuthService } from './auth.service';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { ResumeAnalysisService } from './resume-analysis-service';

@Injectable({
    providedIn: 'root',
})
export class NotificationService {
    private authService = inject(AuthService);
    private messageService = inject(MessageService);
    private router = inject(Router);
    private resumeService = inject(ResumeAnalysisService);

    private stompClient: Client | null = null;
    private readonly _notifications = signal<string[]>([]);
    readonly notifications = this._notifications.asReadonly();

    private readonly _latestResultId = signal<string | null>(null);
    readonly latestResultId = this._latestResultId.asReadonly();

    private readonly _currentProgress = signal<number>(0);
    readonly currentProgress = this._currentProgress.asReadonly();

    private readonly _currentProgressMessage = signal<string>('');
    readonly currentProgressMessage = this._currentProgressMessage.asReadonly();

    constructor() {
        effect(() => {
            if (this.authService.isLoggedIn()) {
                this.connect();
            } else {
                this.disconnect();
            }
        });
    }

    private connect() {
        if (this.stompClient?.active) return;

        const user = this.authService.currentUser();
        if (!user) return;

        const socket = new SockJS('/api/ws-resume');
        this.stompClient = new Client({
            webSocketFactory: () => socket,
            debug: (msg) => console.log(msg),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        this.stompClient.onConnect = (frame) => {
            console.log('Connected: ' + frame);
            this.stompClient?.subscribe(`/topic/notifications-${user.id}`, (message: IMessage) => {
                this.handleNotification(message.body);
            });
        };

        this.stompClient.onStompError = (frame) => {
            console.error('Broker reported error: ' + frame.headers['message']);
            console.error('Additional details: ' + frame.body);
        };

        this.stompClient.activate();
    }

    private disconnect() {
        if (this.stompClient) {
            this.stompClient.deactivate();
            this.stompClient = null;
        }
    }

    private handleNotification(message: string) {
        try {
            const data = JSON.parse(message);
            console.log('Received WebSocket Notification:', data);

            if (data.type === 'PROGRESS') {
                this._currentProgress.set(data.progress);
                this._currentProgressMessage.set(data.message);

                // If we got a resultId during progress (e.g., at 40%), allow early view
                if (data.resultId && data.resultId !== 'null') {
                    this._latestResultId.set(data.resultId);

                    // IF we are already viewing a result, or have one in memory, refresh it to show partial doc generation
                    if (this.resumeService.currentResult()) {
                        this.resumeService.getAnalysisResult(data.resultId).subscribe();
                    }
                }

                if (data.progress === 100) {
                    this.resumeService.setAnalyzing(false);
                    // Reset document generation flags if they were active
                    if (data.message?.includes('Cover Letter')) this.resumeService.setGeneratingCL(false);
                    if (data.message?.includes('Email Draft')) this.resumeService.setGeneratingEmail(false);
                }
                return;
            }

            if (data.type === 'QUOTA_UPDATE') {
                this.authService.getUserProfile().subscribe();
                this.messageService.add({
                    severity: 'info',
                    summary: 'Account Updated',
                    detail: data.message || 'Your account limits or premium status have been updated.',
                    life: 5000
                });
                return;
            }

            if (data.type === 'ERROR') {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Operation Failed',
                    detail: data.message,
                    life: 10000
                });
                this.resumeService.setAnalyzing(false);
                return;
            }

            if (data.type === 'JOB_SEARCH_SUCCESS') {
                return; // Polling in JobSearchComponent handles this
            }

            this._notifications.update(prev => [...prev, data.message]);

            // Clear analyzing state as we got result
            this.resumeService.setAnalyzing(false);
            this._currentProgress.set(100);
            this._currentProgressMessage.set('Complete');

            // Check if resultId is actually a valid UUID string and not "null"
            if (data.resultId && data.resultId !== 'null') {
                this._latestResultId.set(data.resultId);
            }

            this.messageService.add({
                severity: 'success',
                summary: 'Analysis Complete',
                detail: 'Your resume analysis is ready to view.',
                life: 15000,
                sticky: true,
                data: { resultId: data.resultId }
            });
        } catch (e) {
            const displayMessage = (typeof message === 'string' && message.includes('Analysis complete'))
                ? 'Your resume analysis is complete.'
                : message;

            this._notifications.update(prev => [...prev, displayMessage]);
            this.messageService.add({
                severity: 'info',
                summary: 'Notification',
                detail: displayMessage,
                life: 10000
            });
        }

        // Refresh profile to show new usage numbers
        this.authService.getUserProfile().subscribe();
    }

    viewResult(resultId: string) {
        this.resumeService.getAnalysisResult(resultId).subscribe({
            next: () => {
                this.router.navigate(['/analyse-resume']);
                this.messageService.clear();
                this.clearLatestResultId();
            },
            error: (err) => {
                console.error('Failed to fetch result', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Could not fetch analysis result. Please try again from your history.'
                });
            }
        });
    }

    clearLatestResultId() {
        this._latestResultId.set(null);
    }
}
