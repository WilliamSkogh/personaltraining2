
namespace WebApp;

public static class DevResetRoutes
{
    public static void Start()
    {

        if ((bool)(Globals.debugOn ?? false) == false) return;


        App.MapPost("/api/dev/reset-users", (HttpContext context) =>
        {
            try
            {
                SQLQuery(@"DROP TABLE IF EXISTS Users;", null, context);
                SQLQuery(@"
                    CREATE TABLE IF NOT EXISTS Users (
                        Id         INTEGER PRIMARY KEY AUTOINCREMENT,
                        Email      TEXT NOT NULL UNIQUE,
                        Username   TEXT NOT NULL,
                        Password   TEXT NOT NULL,
                        Role       TEXT NOT NULL DEFAULT 'user',
                        CreatedAt  TEXT NOT NULL DEFAULT (DATETIME('now'))
                    );
                ", null, context);

                return Results.Text(
                    JSON.Stringify(new { status = "Users table recreated." }),
                    "application/json; charset=utf-8"
                );
            }
            catch (Exception ex)
            {
                var dbg = (bool)(Globals.debugOn ?? false);
                return dbg
                    ? Results.BadRequest(new { error = "RESET_FAILED", detail = ex.Message })
                    : Results.StatusCode(500);
            }
        });


        App.MapGet("/api/dev/users", (HttpContext context) =>
        {
            try
            {
                var rows = SQLQuery(@"SELECT Id, Email, Username, Role, CreatedAt FROM Users ORDER BY Id DESC;", null, context);
                return Results.Text(JSON.Stringify(rows), "application/json; charset=utf-8");
            }
            catch (Exception ex)
            {
                var dbg = (bool)(Globals.debugOn ?? false);
                return dbg
                    ? Results.BadRequest(new { error = "DEV_USERS_FAILED", detail = ex.Message })
                    : Results.StatusCode(500);
            }
        });
    }
}
