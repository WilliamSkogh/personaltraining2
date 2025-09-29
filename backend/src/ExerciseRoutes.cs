namespace WebApp;
public static class ExerciseRoutes
{
    public static void Start()
    {

        App.MapGet("/api/exercises/stats", (HttpContext context) =>
        {
            var user = Session.Get(context, "user");
            
            if (user == null)
            {
                return RestResult.Parse(context, new { error = "Not authenticated." });
            }

            var userId = user.Id;


            var sql = @"
                SELECT 
                    e.id as exercise_id,
                    COUNT(DISTINCT we.id) as times_used,
                    SUM(we.sets * we.reps * COALESCE(we.weight, 0)) as total_volume,
                    MAX(w.date) as last_used
                FROM exercises e
                LEFT JOIN workout_exercises we ON e.id = we.exerciseId
                LEFT JOIN workouts w ON we.workoutId = w.id AND w.userId = $userId
                GROUP BY e.id
                HAVING times_used > 0
            ";

            var stats = SQLQuery(sql, new { userId }, context);


            var filteredStats = ((Arr)stats).Filter(stat => 
            {
                var timesUsed = stat.times_used;
                return timesUsed != null && ((long)timesUsed) > 0;
            });

            return RestResult.Parse(context, filteredStats);
        });


        App.MapGet("/api/exercises/stats/{id}", (HttpContext context, string id) =>
        {
            var user = Session.Get(context, "user");
            
            if (user == null)
            {
                return RestResult.Parse(context, new { error = "Not authenticated." });
            }

            var userId = user.Id;

            var sql = @"
                SELECT 
                    e.id as exercise_id,
                    e.name as exercise_name,
                    COUNT(DISTINCT we.id) as times_used,
                    SUM(we.sets * we.reps * COALESCE(we.weight, 0)) as total_volume,
                    MAX(w.date) as last_used,
                    AVG(we.weight) as avg_weight,
                    MAX(we.weight) as max_weight,
                    MIN(we.weight) as min_weight
                FROM exercises e
                LEFT JOIN workout_exercises we ON e.id = we.exerciseId
                LEFT JOIN workouts w ON we.workoutId = w.id AND w.userId = $userId
                WHERE e.id = $exerciseId
                GROUP BY e.id
            ";

            var stat = SQLQueryOne(sql, new { userId, exerciseId = id }, context);

            return RestResult.Parse(context, stat);
        });

  
        App.MapGet("/api/exercises/popular", (HttpContext context) =>
        {
            var user = Session.Get(context, "user");
            
            if (user == null)
            {
                return RestResult.Parse(context, new { error = "Not authenticated." });
            }

            var userId = user.Id;
            var limit = context.Request.Query["limit"];
            var limitValue = limit.Count > 0 ? limit[0] : "10";

            var sql = $@"
                SELECT 
                    e.id,
                    e.name,
                    e.category,
                    COUNT(DISTINCT we.id) as times_used,
                    SUM(we.sets * we.reps * COALESCE(we.weight, 0)) as total_volume
                FROM exercises e
                INNER JOIN workout_exercises we ON e.id = we.exerciseId
                INNER JOIN workouts w ON we.workoutId = w.id AND w.userId = $userId
                GROUP BY e.id
                ORDER BY times_used DESC
                LIMIT {limitValue}
            ";

            var popular = SQLQuery(sql, new { userId }, context);

            return RestResult.Parse(context, popular);
        });


        App.MapGet("/api/exercises/categories", (HttpContext context) =>
        {
            var sql = @"
                SELECT 
                    category,
                    COUNT(*) as count
                FROM exercises
                GROUP BY category
                ORDER BY category
            ";

            var categories = SQLQuery(sql, null, context);

            return RestResult.Parse(context, categories);
        });
    }
}