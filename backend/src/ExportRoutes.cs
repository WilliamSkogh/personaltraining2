namespace WebApp;
using System.Text;

public static class ExportRoutes
{
    public static void Start()
    {
        // GET /api/export/workouts/json - Exportera all träningsdata som JSON
        App.MapGet("/api/export/workouts/json", (HttpContext context) =>
        {
            var user = Session.Get(context, "user");
            
            if (user == null)
            {
                return RestResult.Parse(context, new { error = "Not authenticated." });
            }

            var userId = user.Id;

            // Hämta workouts
            var workouts = SQLQuery(
                "SELECT * FROM workouts WHERE userId = $userId ORDER BY date DESC",
                new { userId },
                context
            );

            // Hämta alla workout_exercises
            var allWE = SQLQuery("SELECT * FROM workout_exercises", null, context);
            
            // Hämta alla exercises
            var exercises = SQLQuery("SELECT id, name, category FROM exercises", null, context);
            var exerciseDict = new Dictionary<long, dynamic>();
            foreach (var ex in exercises)
            {
                exerciseDict[Convert.ToInt64(ex.id)] = ex;
            }

            // Bygg komplett data
            var exportData = Arr();
            foreach (var workout in workouts)
            {
                var workoutId = Convert.ToInt64(workout.id);
                
                // Hitta övningar för detta workout
                var workoutExercises = Arr();
                foreach (var we in allWE)
                {
                    if (Convert.ToInt64(we.workoutId) == workoutId)
                    {
                        var exId = Convert.ToInt64(we.exerciseId);
                        var exerciseName = exerciseDict.ContainsKey(exId) 
                            ? exerciseDict[exId].name?.ToString() ?? "Okänd"
                            : "Okänd";

                        workoutExercises.Push(Obj(new
                        {
                            exercise = exerciseName,
                            sets = we.sets,
                            reps = we.reps,
                            weight = we.weight,
                            notes = we.notes
                        }));
                    }
                }

                exportData.Push(Obj(new
                {
                    id = workout.id,
                    name = workout.name,
                    date = workout.date,
                    duration = workout.duration,
                    notes = workout.notes,
                    exercises = workoutExercises
                }));
            }

            context.Response.Headers["Content-Disposition"] = 
                $"attachment; filename=\"training-data-{DateTime.Now:yyyy-MM-dd}.json\"";
            
            return RestResult.Parse(context, exportData);
        });

        // GET /api/export/workouts/csv - Exportera träningsdata som CSV
        App.MapGet("/api/export/workouts/csv", (HttpContext context) =>
        {
            var user = Session.Get(context, "user");
            
            if (user == null)
            {
                context.Response.StatusCode = 401;
                return Results.Text("Not authenticated");
            }

            var userId = user.Id;

            // Hämta workouts
            var workouts = SQLQuery(
                "SELECT * FROM workouts WHERE userId = $userId ORDER BY date DESC",
                new { userId },
                context
            );

            // Hämta alla workout_exercises
            var allWE = SQLQuery("SELECT * FROM workout_exercises", null, context);
            
            // Hämta alla exercises
            var exercises = SQLQuery("SELECT id, name, category FROM exercises", null, context);
            var exerciseDict = new Dictionary<long, dynamic>();
            foreach (var ex in exercises)
            {
                exerciseDict[Convert.ToInt64(ex.id)] = ex;
            }

            // Bygg CSV
            var csv = new StringBuilder();
            csv.AppendLine("Workout Name,Date,Duration (min),Exercise,Category,Sets,Reps,Weight (kg),Volume (kg),Notes");

            foreach (var workout in workouts)
            {
                var workoutId = Convert.ToInt64(workout.id);
                var workoutName = EscapeCsv(workout.name?.ToString() ?? "");
                var date = workout.date?.ToString() ?? "";
                var duration = workout.duration?.ToString() ?? "";
                
                bool hasExercises = false;
                
                foreach (var we in allWE)
                {
                    if (Convert.ToInt64(we.workoutId) == workoutId)
                    {
                        hasExercises = true;
                        var exId = Convert.ToInt64(we.exerciseId);
                        var exerciseName = "Okänd";
                        var category = "";
                        
                        if (exerciseDict.ContainsKey(exId))
                        {
                            exerciseName = exerciseDict[exId].name?.ToString() ?? "Okänd";
                            category = exerciseDict[exId].category?.ToString() ?? "";
                        }

                        var sets = we.sets?.ToString() ?? "0";
                        var reps = we.reps?.ToString() ?? "0";
                        var weight = we.weight?.ToString() ?? "0";
                        
                        long setsNum = we.sets == null ? 0 : Convert.ToInt64(we.sets);
                        long repsNum = we.reps == null ? 0 : Convert.ToInt64(we.reps);
                        long weightNum = we.weight == null ? 0 : Convert.ToInt64(we.weight);
                        long volume = setsNum * repsNum * weightNum;
                        
                        var notes = EscapeCsv(we.notes?.ToString() ?? "");

                        csv.AppendLine($"{workoutName},{date},{duration},{EscapeCsv(exerciseName)},{EscapeCsv(category)},{sets},{reps},{weight},{volume},{notes}");
                    }
                }

                // Om workout saknar övningar, lägg till rad ändå
                if (!hasExercises)
                {
                    csv.AppendLine($"{workoutName},{date},{duration},,,,,,");
                }
            }

            context.Response.Headers["Content-Type"] = "text/csv; charset=utf-8";
            context.Response.Headers["Content-Disposition"] = 
                $"attachment; filename=\"training-data-{DateTime.Now:yyyy-MM-dd}.csv\"";

            return Results.Text(csv.ToString());
        });
    }

    private static string EscapeCsv(string value)
    {
        if (string.IsNullOrEmpty(value))
            return "";
            
        if (value.Contains(",") || value.Contains("\"") || value.Contains("\n"))
        {
            return "\"" + value.Replace("\"", "\"\"") + "\"";
        }
        
        return value;
    }
}