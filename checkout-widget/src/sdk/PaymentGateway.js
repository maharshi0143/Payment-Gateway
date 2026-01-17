import { Modal } from './modal';

class PaymentGateway {
    constructor(options) {
        this.options = options || {};
        this.modal = new Modal();
        this.handleMessage = this.handleMessage.bind(this);
    }

    open() {
        const { key, orderId } = this.options;
        if (!key || !orderId) {
            console.error('PaymentGateway: key and orderId are required');
            if (this.options.onFailure) {
                this.options.onFailure({ error: 'Missing configuration' });
            }
            return;
        }

        // Determine base URL (script src origin or default to same domain for dev)
        // In production, this would be hardcoded to gateway domain.
        // For this project: http://localhost:3001
        const baseUrl = 'http://localhost:3001';
        const iframeUrl = `${baseUrl}/checkout?order_id=${orderId}&embedded=true`;

        this.modal.create(iframeUrl, () => this.close());

        window.addEventListener('message', this.handleMessage);
    }

    close() {
        this.modal.destroy();
        window.removeEventListener('message', this.handleMessage);
        if (this.options.onClose) {
            this.options.onClose();
        }
    }

    handleMessage(event) {
        // Validate origin if needed, but spec says '*' is acceptable for project.
        // if (event.origin !== 'http://localhost:3001') return;

        const { type, data } = event.data;

        if (type === 'payment_success') {
            if (this.options.onSuccess) {
                this.options.onSuccess(data);
            }
            this.close();
        } else if (type === 'payment_failed') {
            if (this.options.onFailure) {
                this.options.onFailure(data);
            }
            // Do not close on failure automatically? Spec doesn't say. 
            // Usually we let user retry in iframe. 
            // BUT if it's a "terminal" failure passed back, maybe we should.
            // For now, keep open so user can retry or close manually, unless it's a crash.
        } else if (type === 'close_modal') {
            this.close();
        }
    }
}

// Global Export
window.PaymentGateway = PaymentGateway;
export default PaymentGateway;
