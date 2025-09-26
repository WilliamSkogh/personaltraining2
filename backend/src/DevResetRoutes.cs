namespace WebApp;

public static class DevResetRoutes
{
    public static void Start()
    {
        if ((bool)(Globals.debugOn ?? false) == false) return;

        var handler = (HttpContext context) =>
        {
            try
            {
                SQLQuery(@"DROP TABLE IF EXISTS Users;", null, context);
                SQLQuery(@"
                    CREATE TABLE IF NOT EXISTS Users (
                        Id INTEGER PRIMARY KEY AUTOINCREMENT,
                        Username TEXT NOT NULL UNIQUE,
                        Email TEXT NOT NULL UNIQUE,
                        PasswordHash TEXT NOT NULL,
                        Role TEXT DEFAULT 'user',
                        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
                    );
                ", null, context);

                return Results.Text(JSON.Stringify(new { status = "Users table recreated." }),
                    "application/json; charset=utf-8");
            }
            catch (Exception ex)
            {
                var dbg = (bool)(Globals.debugOn ?? false);
                return dbg
                    ? Results.BadRequest(new { error = "RESET_FAILED", detail = ex.Message })
                    : Results.StatusCode(500);
            }
        };

        App.MapGet ("/api/dev/reset-users", handler);
        App.MapPost("/api/dev/reset-users", handler);
    }
}
