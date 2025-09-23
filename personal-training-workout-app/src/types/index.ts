export interface Workout {
    id: string;
    name: string;
    duration: number; // minutes
    type: string; // cardio, strength, flexibility
}

export interface WorkoutInput {
    name: string;
    duration: number; //minutes
    type: string; //  cardio, strength, flexibility
}