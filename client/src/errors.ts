import { RequestIndicator } from './request';

interface ErrorParameters {
    summary?: string;
    debug?: object;
    error?: Error;
}

export class AppError {
    // shown to the user
    message: string = 'An unknown error occurred.';
    summary?: string;
    // goes to the console
    debug: object;
    error?: Error;
    constructor({ summary, debug, error }: ErrorParameters) {
        this.summary = summary;
        this.debug = debug || {};
        this.error = error;
    }
    // alerts are handled by RequestIndicator
    report() {
        // specify class name for easy default?
        console.error('Error occurred:', this.debug, this.error);
    }
}

export class CodeError extends AppError {
    message = 'A bug in the code caused an error. Refreshing the page should usually fix this.';
    // A bug; an unexpected error due to an unforeseen circumstance
    // not properly handled in the codebase.
    // This is the default error.

    // show developer debug summaryrmation (TODO: disable with production envvar)
    report() {
        console.error('CodeError occurred:', this.debug, this.error);
    }
}

export class BadRequestError extends CodeError {}
export class AuthError extends AppError {}
export class NetworkError extends AppError {}
