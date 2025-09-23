export class WorkoutModel {
    id: number;
    name: string;
    duration: number; // minutes
    type: string; // cardio, strength, flexibility

    constructor(id: number, name: string, duration: number, type: string) {
        this.id = id;
        this.name = name;
        this.duration = duration;
        this.type = type;
    }

    validate(): boolean {
        if (!this.name || this.duration <= 0 || !this.type) {
            return false;
        }
        return true;
    }
}