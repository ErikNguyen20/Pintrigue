export class Location {
    constructor(data) {
        this.name = data.name || "Planet Earth";
        this.latitude = data.latitude || 0;
        this.longitude = data.longitude || 0;
    }
    
    get displayName() {
        return this.name || "Unknown Location";
    }
}