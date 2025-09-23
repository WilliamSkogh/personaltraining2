class WorkoutController {
    private workouts: Array<{ id: number; name: string; duration: number; type: string }> = [];
    private nextId: number = 1;

    createWorkout(name: string, duration: number, type: string) {
        const newWorkout = { id: this.nextId++, name, duration, type };
        this.workouts.push(newWorkout);
        return newWorkout;
    }

    getWorkouts() {
        return this.workouts;
    }

    updateWorkout(id: number, name?: string, duration?: number, type?: string) {
        const workout = this.workouts.find(w => w.id === id);
        if (!workout) {
            throw new Error('Workout not found');
        }
        if (name) workout.name = name;
        if (duration) workout.duration = duration;
        if (type) workout.type = type;
        return workout;
    }

    deleteWorkout(id: number) {
        const index = this.workouts.findIndex(w => w.id === id);
        if (index === -1) {
            throw new Error('Workout not found');
        }
        this.workouts.splice(index, 1);
        return { message: 'Workout deleted' };
    }
}

export default WorkoutController;