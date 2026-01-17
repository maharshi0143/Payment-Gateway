import './styles.css';

export class Modal {
    constructor() {
        this.element = null;
    }

    create(iframeUrl, onClose) {
        // Container
        this.element = document.createElement('div');
        this.element.id = 'payment-gateway-modal';
        this.element.setAttribute('data-test-id', 'payment-modal');

        // Overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.onclick = onClose;
        this.element.appendChild(overlay);

        // Content
        const content = document.createElement('div');
        content.className = 'modal-content';

        // Iframe
        const iframe = document.createElement('iframe');
        iframe.src = iframeUrl;
        iframe.setAttribute('data-test-id', 'payment-iframe');
        content.appendChild(iframe);

        // Close Button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-button';
        closeBtn.setAttribute('data-test-id', 'close-modal-button');
        closeBtn.innerHTML = '×';
        closeBtn.onclick = onClose;
        content.appendChild(closeBtn);

        this.element.appendChild(content);
        document.body.appendChild(this.element);
    }

    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
    }
}
