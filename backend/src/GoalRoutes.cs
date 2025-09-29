namespace WebApp;
public static class GoalRoutes
{
    public static void Start()
    {

       App.MapGet("/api/goals", (HttpContext context) =>
{
    var user = Session.Get(context, "user");
    
    if (user == null)
    {
        return RestResult.Parse(context, new { error = "Not authenticated." });
    }

    var userId = user.Id;


    var sql = "SELECT * FROM goals WHERE userId = $userId";

    var goals = SQLQuery(sql, new { userId }, context);

    return RestResult.Parse(context, goals);
});

 
        App.MapGet("/api/goals/{id}", (HttpContext context, string id) =>
        {
            var user = Session.Get(context, "user");
            
            if (user == null)
            {
                return RestResult.Parse(context, new { error = "Not authenticated." });
            }

            var userId = user.Id;

            var sql = @"
                SELECT * FROM goals 
                WHERE id = $goalId AND userId = $userId
            ";

            var goal = SQLQueryOne(sql, new { goalId = id, userId }, context);

            return RestResult.Parse(context, goal);
        });


        App.MapPost("/api/goals", (HttpContext context, JsonElement bodyJson) =>
        {
            var user = Session.Get(context, "user");
            
            if (user == null)
            {
                return RestResult.Parse(context, new { error = "Not authenticated." });
            }

            var body = JSON.Parse(bodyJson.ToString());
            body.userId = user.Id;
            body.currentValue = 0;
            body.isCompleted = 0;

            var sql = @"
                INSERT INTO goals (userId, title, description, targetValue, currentValue, unit, targetDate, isCompleted)
                VALUES ($userId, $title, $description, $targetValue, $currentValue, $unit, $targetDate, $isCompleted)
            ";

            var result = SQLQueryOne(sql, body, context);

            if (!result.HasKey("error"))
            {
                result.insertId = SQLQueryOne(
                    "SELECT id AS __insertId FROM goals ORDER BY id DESC LIMIT 1"
                ).__insertId;
            }

            return RestResult.Parse(context, result);
        });


        App.MapPut("/api/goals/{id}", (HttpContext context, string id, JsonElement bodyJson) =>
        {
            var user = Session.Get(context, "user");
            
            if (user == null)
            {
                return RestResult.Parse(context, new { error = "Not authenticated." });
            }

            var body = JSON.Parse(bodyJson.ToString());
            body.id = id;
            body.userId = user.Id;

            var sql = @"
                UPDATE goals 
                SET title = $title, 
                    description = $description, 
                    targetValue = $targetValue, 
                    currentValue = $currentValue, 
                    unit = $unit, 
                    targetDate = $targetDate, 
                    isCompleted = $isCompleted
                WHERE id = $id AND userId = $userId
            ";

            var result = SQLQueryOne(sql, body, context);

            return RestResult.Parse(context, result);
        });


        App.MapPatch("/api/goals/{id}/progress", (HttpContext context, string id, JsonElement bodyJson) =>
        {
            var user = Session.Get(context, "user");
            
            if (user == null)
            {
                return RestResult.Parse(context, new { error = "Not authenticated." });
            }

            var body = JSON.Parse(bodyJson.ToString());
            var currentValue = body.currentValue;
            var userId = user.Id;


            var goal = SQLQueryOne(
                "SELECT * FROM goals WHERE id = $id AND userId = $userId",
                new { id, userId },
                context
            );

            if (goal == null || goal.HasKey("error"))
            {
                return RestResult.Parse(context, new { error = "Goal not found." });
            }


            var isCompleted = currentValue >= goal.targetValue ? 1 : 0;

            var sql = @"
                UPDATE goals 
                SET currentValue = $currentValue,
                    isCompleted = $isCompleted
                WHERE id = $id AND userId = $userId
            ";

            var result = SQLQueryOne(sql, new { id, userId, currentValue, isCompleted }, context);

            return RestResult.Parse(context, result);
        });


        App.MapPatch("/api/goals/{id}/complete", (HttpContext context, string id) =>
        {
            var user = Session.Get(context, "user");
            
            if (user == null)
            {
                return RestResult.Parse(context, new { error = "Not authenticated." });
            }

            var userId = user.Id;

            var sql = @"
                UPDATE goals 
                SET isCompleted = 1
                WHERE id = $id AND userId = $userId
            ";

            var result = SQLQueryOne(sql, new { id, userId }, context);

            return RestResult.Parse(context, result);
        });

    
        App.MapDelete("/api/goals/{id}", (HttpContext context, string id) =>
        {
            var user = Session.Get(context, "user");
            
            if (user == null)
            {
                return RestResult.Parse(context, new { error = "Not authenticated." });
            }

            var userId = user.Id;

            var sql = @"
                DELETE FROM goals 
                WHERE id = $id AND userId = $userId
            ";

            var result = SQLQueryOne(sql, new { id, userId }, context);

            return RestResult.Parse(context, result);
        });

 
        App.MapGet("/api/goals/stats", (HttpContext context) =>
        {
            var user = Session.Get(context, "user");
            
            if (user == null)
            {
                return RestResult.Parse(context, new { error = "Not authenticated." });
            }

            var userId = user.Id;

            var stats = Obj(new
            {
                total = SQLQueryOne(
                    "SELECT COUNT(*) as count FROM goals WHERE userId = $userId",
                    new { userId }
                ).count,
                completed = SQLQueryOne(
                    "SELECT COUNT(*) as count FROM goals WHERE userId = $userId AND isCompleted = 1",
                    new { userId }
                ).count,
                inProgress = SQLQueryOne(
                    "SELECT COUNT(*) as count FROM goals WHERE userId = $userId AND isCompleted = 0",
                    new { userId }
                ).count,
                averageProgress = SQLQueryOne(
                    @"SELECT AVG(CAST(currentValue AS REAL) / CAST(targetValue AS REAL) * 100) as avg 
                      FROM goals 
                      WHERE userId = $userId AND targetValue > 0",
                    new { userId }
                ).avg ?? 0
            });

            return RestResult.Parse(context, stats);
        });
    }
}