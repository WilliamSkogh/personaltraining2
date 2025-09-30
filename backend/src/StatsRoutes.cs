namespace WebApp;
public static class StatsRoutes
{
    public static void Start()
    {
        // GET /api/stats/workout-frequency - Träningsfrekvens per vecka/månad
        App.MapGet("/api/stats/workout-frequency", (HttpContext context) =>
        {
            var user = Session.Get(context, "user");
            
            if (user == null)
            {
                return RestResult.Parse(context, new { error = "Not authenticated." });
            }

            var userId = user.Id;
            var period = context.Request.Query["period"].FirstOrDefault() ?? "weeks";
            var limitStr = context.Request.Query["limit"].FirstOrDefault() ?? "12";
            
            if (!int.TryParse(limitStr, out var limit))
            {
                limit = 12;
            }

            // Hämta alla workouts för användaren
            var workouts = SQLQuery(
                "SELECT id, date, duration FROM workouts WHERE userId = $userId ORDER BY date DESC",
                new { userId },
                context
            );

            // Gruppera per period i C#
            var grouped = new Dictionary<string, (int count, long totalDuration, string periodStart)>();
            
            foreach (var workout in workouts)
            {
                var date = DateTime.Parse(workout.date.ToString());
                string periodKey;
                string periodStart;

                if (period == "weeks")
                {
                    var weekOfYear = System.Globalization.CultureInfo.CurrentCulture.Calendar.GetWeekOfYear(
                        date, 
                        System.Globalization.CalendarWeekRule.FirstFourDayWeek,
                        DayOfWeek.Monday
                    );
                    periodKey = $"{date.Year}-W{weekOfYear:D2}";
                    
                    // Beräkna veckans start (måndag)
                    int delta = DayOfWeek.Monday - date.DayOfWeek;
                    if (delta > 0) delta -= 7;
                    var monday = date.AddDays(delta);
                    periodStart = monday.ToString("yyyy-MM-dd");
                }
                else
                {
                    periodKey = date.ToString("yyyy-MM");
                    periodStart = "";
                }

                if (!grouped.ContainsKey(periodKey))
                {
                    grouped[periodKey] = (0, 0, periodStart);
                }

                var current = grouped[periodKey];
                grouped[periodKey] = (
                    current.count + 1,
                    current.totalDuration + (workout.duration ?? 0),
                    current.periodStart
                );
            }

            // Konvertera till array och sortera
            var result = Arr();
            foreach (var kvp in grouped.OrderByDescending(x => x.Key).Take(limit))
            {
                result.Push(Obj(new
                {
                    period = kvp.Key,
                    period_start = kvp.Value.periodStart,
                    workouts = kvp.Value.count,
                    total_duration = kvp.Value.totalDuration
                }));
            }

            return RestResult.Parse(context, result);
        });

        // GET /api/stats/top-exercises - Mest använda övningar
        App.MapGet("/api/stats/top-exercises", (HttpContext context) =>
        {
            var user = Session.Get(context, "user");
            
            if (user == null)
            {
                return RestResult.Parse(context, new { error = "Not authenticated." });
            }

            var userId = user.Id;

            // Hämta alla workouts för användaren
            var workouts = SQLQuery(
                "SELECT id FROM workouts WHERE userId = $userId",
                new { userId },
                context
            );

            // Samla workout IDs
            var workoutIds = new HashSet<long>();
            foreach (var w in workouts)
            {
                workoutIds.Add(Convert.ToInt64(w.id));
            }

            if (workoutIds.Count == 0)
            {
                return RestResult.Parse(context, Arr());
            }

            // Hämta alla workout_exercises
            var allWorkoutExercises = SQLQuery(
                "SELECT * FROM workout_exercises",
                null,
                context
            );

            // Filtrera till endast användarens workouts
            var userWorkoutExercises = new List<dynamic>();
            foreach (var we in allWorkoutExercises)
            {
                var wid = Convert.ToInt64(we.workoutId);
                if (workoutIds.Contains(wid))
                {
                    userWorkoutExercises.Add(we);
                }
            }

            // Hämta alla exercises
            var exercises = SQLQuery("SELECT id, name, category FROM exercises", null, context);
            var exerciseDict = new Dictionary<long, dynamic>();
            foreach (var ex in exercises)
            {
                var exId = Convert.ToInt64(ex.id);
                exerciseDict[exId] = ex;
            }

            // Gruppera per exercise med Dictionary av objekt
            var statsDict = new Dictionary<long, Dictionary<string, object>>();
            
            foreach (var we in userWorkoutExercises)
            {
                var exerciseId = Convert.ToInt64(we.exerciseId);
                var workoutId = Convert.ToInt64(we.workoutId);
                
                if (!statsDict.ContainsKey(exerciseId))
                {
                    statsDict[exerciseId] = new Dictionary<string, object>
                    {
                        ["totalSets"] = 0L,
                        ["totalReps"] = 0L,
                        ["totalVolume"] = 0L,
                        ["workoutIds"] = new HashSet<long>()
                    };
                }

                var stat = statsDict[exerciseId];
                var wids = (HashSet<long>)stat["workoutIds"];
                wids.Add(workoutId);
                
                var sets = Convert.ToInt64(we.sets ?? 0);
                var reps = Convert.ToInt64(we.reps ?? 0);
                var weight = Convert.ToInt64(we.weight ?? 0);

                stat["totalSets"] = (long)stat["totalSets"] + sets;
                stat["totalReps"] = (long)stat["totalReps"] + (sets * reps);
                stat["totalVolume"] = (long)stat["totalVolume"] + (sets * reps * weight);
            }

            // Sortera och ta top 10
            var result = Arr();
            foreach (var kvp in statsDict.OrderByDescending(x => ((HashSet<long>)x.Value["workoutIds"]).Count).Take(10))
            {
                if (exerciseDict.ContainsKey(kvp.Key))
                {
                    var ex = exerciseDict[kvp.Key];
                    var wids = (HashSet<long>)kvp.Value["workoutIds"];
                    
                    result.Push(Obj(new
                    {
                        id = kvp.Key,
                        name = ex.name,
                        category = ex.category,
                        times_used = wids.Count,
                        total_sets = (long)kvp.Value["totalSets"],
                        total_reps = (long)kvp.Value["totalReps"],
                        total_volume = (long)kvp.Value["totalVolume"]
                    }));
                }
            }

            return RestResult.Parse(context, result);
        });

        // GET /api/stats/exercise-progression/:id - Progression för specifik övning
        App.MapGet("/api/stats/exercise-progression/{exerciseId}", (HttpContext context, string exerciseId) =>
        {
            var user = Session.Get(context, "user");
            
            if (user == null)
            {
                return RestResult.Parse(context, new { error = "Not authenticated." });
            }

            var userId = user.Id;
            var limitStr = context.Request.Query["limit"].FirstOrDefault() ?? "50";
            
            if (!int.TryParse(limitStr, out var limit))
            {
                limit = 50;
            }

            // Hämta workout_exercises för denna övning
            var workoutExercises = SQLQuery(@"
                SELECT we.*, w.date, w.name as workout_name
                FROM workout_exercises we
                INNER JOIN workouts w ON we.workoutId = w.id
                WHERE we.exerciseId = $exerciseId AND w.userId = $userId
                ORDER BY w.date DESC
            ", new { exerciseId, userId }, context);

            // Filtrera och formatera
            var result = Arr();
            var count = 0;
            
            foreach (var we in workoutExercises)
            {
                var weight = we.weight ?? 0;
                if (weight > 0 && count < limit)
                {
                    var sets = (long)(we.sets ?? 0);
                    var reps = (long)(we.reps ?? 0);
                    
                    result.Push(Obj(new
                    {
                        date = we.date,
                        workout_name = we.workout_name,
                        sets = sets,
                        reps = reps,
                        weight = weight,
                        volume = sets * reps * weight
                    }));
                    count++;
                }
            }

            return RestResult.Parse(context, result);
        });

        // GET /api/stats/volume-progression - Total volym över tid
        App.MapGet("/api/stats/volume-progression", (HttpContext context) =>
        {
            var user = Session.Get(context, "user");
            
            if (user == null)
            {
                return RestResult.Parse(context, new { error = "Not authenticated." });
            }

            var userId = user.Id;
            var limitStr = context.Request.Query["limit"].FirstOrDefault() ?? "30";
            
            if (!int.TryParse(limitStr, out var limit))
            {
                limit = 30;
            }

            // Hämta alla workouts
            var workouts = SQLQuery(
                "SELECT id, date, name FROM workouts WHERE userId = $userId ORDER BY date DESC LIMIT $limit",
                new { userId, limit },
                context
            );

            // Hämta alla workout_exercises
            var allWorkoutExercises = SQLQuery(
                "SELECT workoutId, sets, reps, weight, exerciseId FROM workout_exercises",
                null,
                context
            );

            // Gruppera per workout
            var weByWorkout = new Dictionary<long, List<dynamic>>();
            foreach (var we in allWorkoutExercises)
            {
                var wid = (long)we.workoutId;
                if (!weByWorkout.ContainsKey(wid))
                {
                    weByWorkout[wid] = new List<dynamic>();
                }
                weByWorkout[wid].Add(we);
            }

            // Beräkna volym för varje workout
            var result = Arr();
            foreach (var workout in workouts)
            {
                var workoutId = (long)workout.id;
                long totalVolume = 0;
                var exerciseIds = new HashSet<long>();

                if (weByWorkout.ContainsKey(workoutId))
                {
                    foreach (var we in weByWorkout[workoutId])
                    {
                        var sets = (long)(we.sets ?? 0);
                        var reps = (long)(we.reps ?? 0);
                        var weight = (long)(we.weight ?? 0);
                        totalVolume += sets * reps * weight;
                        exerciseIds.Add((long)we.exerciseId);
                    }
                }

                result.Push(Obj(new
                {
                    date = workout.date,
                    name = workout.name,
                    total_volume = totalVolume,
                    exercise_count = exerciseIds.Count
                }));
            }

            return RestResult.Parse(context, result);
        });

        // GET /api/stats/personal-records - Personliga rekord
        App.MapGet("/api/stats/personal-records", (HttpContext context) =>
        {
            var user = Session.Get(context, "user");
            
            if (user == null)
            {
                return RestResult.Parse(context, new { error = "Not authenticated." });
            }

            var userId = user.Id;

            // Hämta alla workout_exercises för användaren
            var workoutExercises = SQLQuery(@"
                SELECT we.*, w.userId, w.date
                FROM workout_exercises we
                INNER JOIN workouts w ON we.workoutId = w.id
                WHERE w.userId = $userId
            ", new { userId }, context);

            // Hämta exercises
            var exercises = SQLQuery("SELECT id, name, category FROM exercises", null, context);
            var exerciseDict = new Dictionary<long, dynamic>();
            foreach (var ex in exercises)
            {
                exerciseDict[(long)ex.id] = ex;
            }

            // Beräkna max för varje övning
            var records = new Dictionary<long, (long maxWeight, long maxReps, long maxVolume, string recordDate)>();
            
            foreach (var we in workoutExercises)
            {
                var weight = (long)(we.weight ?? 0);
                if (weight <= 0) continue;

                var exerciseId = (long)we.exerciseId;
                var sets = (long)(we.sets ?? 0);
                var reps = (long)(we.reps ?? 0);
                var volume = sets * reps * weight;
                var date = we.date.ToString();

                if (!records.ContainsKey(exerciseId))
                {
                    records[exerciseId] = (weight, reps, volume, date);
                }
                else
                {
                    var current = records[exerciseId];
                    records[exerciseId] = (
                        Math.Max(current.maxWeight, weight),
                        Math.Max(current.maxReps, reps),
                        Math.Max(current.maxVolume, volume),
                        volume > current.maxVolume ? date : current.recordDate
                    );
                }
            }

            // Sortera efter max vikt
            var result = Arr();
            foreach (var kvp in records.OrderByDescending(x => x.Value.maxWeight))
            {
                if (exerciseDict.ContainsKey(kvp.Key))
                {
                    var ex = exerciseDict[kvp.Key];
                    result.Push(Obj(new
                    {
                        id = kvp.Key,
                        name = ex.name,
                        category = ex.category,
                        max_weight = kvp.Value.maxWeight,
                        max_reps = kvp.Value.maxReps,
                        max_volume = kvp.Value.maxVolume,
                        record_date = kvp.Value.recordDate
                    }));
                }
            }

            return RestResult.Parse(context, result);
        });

        // GET /api/stats/summary - Översikt av all statistik
        App.MapGet("/api/stats/summary", (HttpContext context) =>
        {
            var user = Session.Get(context, "user");
            
            if (user == null)
            {
                return RestResult.Parse(context, new { error = "Not authenticated." });
            }

            var userId = user.Id;

            // Total workouts
            var totalWorkouts = SQLQueryOne(
                "SELECT COUNT(*) as count FROM workouts WHERE userId = $userId",
                new { userId },
                context
            ).count;

            // Total duration
            var totalDuration = SQLQueryOne(
                "SELECT COALESCE(SUM(duration), 0) as total FROM workouts WHERE userId = $userId",
                new { userId },
                context
            ).total;

            // Workouts this week
            var workoutsThisWeek = SQLQueryOne(
                @"SELECT COUNT(*) as count FROM workouts 
                  WHERE userId = $userId 
                  AND date >= date('now', '-7 days')",
                new { userId },
                context
            ).count;

            // Workouts this month
            var workoutsThisMonth = SQLQueryOne(
                @"SELECT COUNT(*) as count FROM workouts 
                  WHERE userId = $userId 
                  AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')",
                new { userId },
                context
            ).count;

            // Total volume - beräkna i C#
            var userWorkoutsForVolume = SQLQuery(
                "SELECT id FROM workouts WHERE userId = $userId",
                new { userId },
                context
            );

            var userWorkoutIdsForVolume = new HashSet<long>();
            foreach (var w in userWorkoutsForVolume)
            {
                userWorkoutIdsForVolume.Add(Convert.ToInt64(w.id));
            }

            var allWorkoutExercises = SQLQuery(
                "SELECT workoutId, sets, reps, weight FROM workout_exercises",
                null,
                context
            );

            long totalVolume = 0;
            foreach (var we in allWorkoutExercises)
            {
                var wid = Convert.ToInt64(we.workoutId);
                if (userWorkoutIdsForVolume.Contains(wid))
                {
                    long sets = we.sets == null ? 0 : Convert.ToInt64(we.sets);
                    long reps = we.reps == null ? 0 : Convert.ToInt64(we.reps);
                    long weight = we.weight == null ? 0 : Convert.ToInt64(we.weight);
                    totalVolume += sets * reps * weight;
                }
            }

            // Favorite exercise - beräkna i C#
            var userWorkouts = SQLQuery(
                "SELECT id FROM workouts WHERE userId = $userId",
                new { userId },
                context
            );

            var userWorkoutIdSet = new HashSet<long>();
            foreach (var w in userWorkouts)
            {
                userWorkoutIdSet.Add(Convert.ToInt64(w.id));
            }

            var allWE = SQLQuery("SELECT workoutId, exerciseId FROM workout_exercises", null, context);
            var allExercises = SQLQuery("SELECT id, name FROM exercises", null, context);
            
            var exerciseNameDict = new Dictionary<long, string>();
            foreach (var ex in allExercises)
            {
                exerciseNameDict[Convert.ToInt64(ex.id)] = ex.name?.ToString() ?? "Okänd";
            }

            var exerciseCounts = new Dictionary<long, int>();
            foreach (var we in allWE)
            {
                var wid = Convert.ToInt64(we.workoutId);
                if (userWorkoutIdSet.Contains(wid))
                {
                    var eid = Convert.ToInt64(we.exerciseId);
                    if (!exerciseCounts.ContainsKey(eid))
                    {
                        exerciseCounts[eid] = 0;
                    }
                    exerciseCounts[eid]++;
                }
            }

            var favoriteExercise = "Ingen än";
            if (exerciseCounts.Count > 0)
            {
                var favExId = exerciseCounts.OrderByDescending(x => x.Value).First().Key;
                if (exerciseNameDict.ContainsKey(favExId))
                {
                    favoriteExercise = exerciseNameDict[favExId];
                }
            }

            var summary = Obj(new
            {
                totalWorkouts,
                totalDuration,
                workoutsThisWeek,
                workoutsThisMonth,
                totalVolume,
                favoriteExercise
            });

            return RestResult.Parse(context, summary);
        });
    }
}