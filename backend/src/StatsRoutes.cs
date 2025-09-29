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

            string sql;
            
            if (period == "weeks")
            {
                sql = @"
                    SELECT 
                        strftime('%Y-W%W', date) as period,
                        strftime('%Y-%m-%d', date, 'weekday 0', '-6 days') as period_start,
                        COUNT(*) as workouts,
                        COALESCE(SUM(duration), 0) as total_duration
                    FROM workouts
                    WHERE userId = $userId
                    GROUP BY period
                    ORDER BY period DESC
                    LIMIT $limit
                ";
            }
            else // months
            {
                sql = @"
                    SELECT 
                        strftime('%Y-%m', date) as period,
                        COUNT(*) as workouts,
                        COALESCE(SUM(duration), 0) as total_duration
                    FROM workouts
                    WHERE userId = $userId
                    GROUP BY period
                    ORDER BY period DESC
                    LIMIT $limit
                ";
            }

            var stats = SQLQuery(sql, new { userId, limit }, context);

            return RestResult.Parse(context, stats);
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

            // Hämta alla övningar som använts med deras stats i EN query
            var topExercises = SQLQuery(@"
                SELECT 
                    e.id,
                    e.name,
                    e.category,
                    COUNT(DISTINCT we.workoutId) as times_used,
                    COALESCE(SUM(we.sets), 0) as total_sets,
                    COALESCE(SUM(we.sets * we.reps), 0) as total_reps,
                    COALESCE(SUM(we.sets * we.reps * COALESCE(we.weight, 0)), 0) as total_volume
                FROM exercises e
                INNER JOIN workout_exercises we ON e.id = we.exerciseId
                INNER JOIN workouts w ON we.workoutId = w.id
                WHERE w.userId = $userId
                GROUP BY e.id, e.name, e.category
                ORDER BY times_used DESC
                LIMIT 10
            ", new { userId }, context);

            return RestResult.Parse(context, topExercises);
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

            var sql = @"
                SELECT 
                    w.date,
                    w.name as workout_name,
                    we.sets,
                    we.reps,
                    we.weight,
                    (we.sets * we.reps * COALESCE(we.weight, 0)) as volume
                FROM workout_exercises we
                INNER JOIN workouts w ON we.workoutId = w.id
                WHERE we.exerciseId = $exerciseId 
                  AND w.userId = $userId
                  AND we.weight IS NOT NULL
                  AND we.weight > 0
                ORDER BY w.date DESC
                LIMIT $limit
            ";

            var progression = SQLQuery(sql, new { exerciseId, userId, limit }, context);

            return RestResult.Parse(context, progression);
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

            var sql = @"
                SELECT 
                    w.date,
                    w.name,
                    COALESCE(SUM(we.sets * we.reps * COALESCE(we.weight, 0)), 0) as total_volume,
                    COUNT(DISTINCT we.exerciseId) as exercise_count
                FROM workouts w
                LEFT JOIN workout_exercises we ON w.id = we.workoutId
                WHERE w.userId = $userId
                GROUP BY w.id, w.date, w.name
                ORDER BY w.date DESC
                LIMIT $limit
            ";

            var progression = SQLQuery(sql, new { userId, limit }, context);

            return RestResult.Parse(context, progression);
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

            var sql = @"
                SELECT 
                    e.id,
                    e.name,
                    e.category,
                    MAX(we.weight) as max_weight,
                    MAX(we.reps) as max_reps,
                    MAX(we.sets * we.reps * COALESCE(we.weight, 0)) as max_volume,
                    w.date as record_date
                FROM exercises e
                INNER JOIN workout_exercises we ON e.id = we.exerciseId
                INNER JOIN workouts w ON we.workoutId = w.id
                WHERE w.userId = $userId AND we.weight > 0
                GROUP BY e.id
                ORDER BY max_weight DESC
            ";

            var records = SQLQuery(sql, new { userId }, context);

            return RestResult.Parse(context, records);
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

            // Total volume
            var totalVolume = SQLQueryOne(
                @"SELECT COALESCE(SUM(we.sets * we.reps * COALESCE(we.weight, 0)), 0) as total
                  FROM workout_exercises we
                  INNER JOIN workouts w ON we.workoutId = w.id
                  WHERE w.userId = $userId",
                new { userId },
                context
            ).total;

            // Favorite exercise
            var favoriteExercise = SQLQueryOne(
                @"SELECT e.name
                  FROM exercises e
                  INNER JOIN workout_exercises we ON e.id = we.exerciseId
                  INNER JOIN workouts w ON we.workoutId = w.id
                  WHERE w.userId = $userId
                  GROUP BY e.id
                  ORDER BY COUNT(*) DESC
                  LIMIT 1",
                new { userId },
                context
            );

            var summary = Obj(new
            {
                totalWorkouts,
                totalDuration,
                workoutsThisWeek,
                workoutsThisMonth,
                totalVolume,
                favoriteExercise = favoriteExercise?.name ?? "Ingen än"
            });

            return RestResult.Parse(context, summary);
        });
    }
}