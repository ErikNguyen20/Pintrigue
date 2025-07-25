export class FileResponse {
    constructor(data) {
        this.url = data.url;
    }
    
    get displayName() {
        return this.url;
    }
}