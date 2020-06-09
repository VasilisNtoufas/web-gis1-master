export class TitleForm {

    constructor(changeCallback) {
        this.titleInput = document.querySelector('#title');
        this.titleSizeInput = document.querySelector('#titleSize');
        this.titleColorInput = document.querySelector('#titleColor');

        this.titleInput.addEventListener('input', () => changeCallback(this.getValues()));
        this.titleSizeInput.addEventListener('input', () => changeCallback(this.getValues()));
        this.titleColorInput.addEventListener('input', () => changeCallback(this.getValues()));
    }

    getValues() {
        return {
            text: this.titleInput.value,
            size: this.titleSizeInput.value,
            color: this.titleColorInput.value,
        };
    }

}
