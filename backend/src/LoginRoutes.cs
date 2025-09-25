using System.Text;
using System.Text.Json;

namespace WebApp;

public static class LoginRoutes
{
    private static Obj GetUser(HttpContext context) => Session.Get(context, "user");

    private static void EnsureUsersTable(HttpContext context)
    {
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
    }

    private static async Task<string> ReadRawBodyAsync(HttpContext ctx)
    {
        ctx.Request.EnableBuffering();
        using var reader = new StreamReader(ctx.Request.Body, Encoding.UTF8, false, 1024, true);
        var raw = await reader.ReadToEndAsync();
        ctx.Request.Body.Position = 0;
        return raw ?? string.Empty;
    }

    private static string GetProp(JsonElement obj, string name)
    {
        if (obj.ValueKind != JsonValueKind.Object) return "";
        foreach (var p in obj.EnumerateObject())
        {
            if (p.NameEquals(name) || p.Name.Equals(name, StringComparison.OrdinalIgnoreCase))
                return p.Value.ValueKind == JsonValueKind.String ? (p.Value.GetString() ?? "") : p.Value.ToString();
        }
        return "";
    }

    private static Obj ToPublicUser(dynamic row)
    {
        var id        = row.Id        ?? row.id;
        var username  = row.Username  ?? row.username;
        var email     = row.Email     ?? row.email;
        var role      = row.Role      ?? row.role ?? "user";
        var createdAt = row.CreatedAt ?? row.createdAt;

        return Obj(new
        {
            Id        = id,
            Username  = username,
            Email     = email,
            Role      = role,
            CreatedAt = createdAt
        });
    }

    private static async Task<(string email, string username, string password, string role)> ReadCredsAsync(HttpContext ctx, bool includeUsername)
    {
        string email = "", username = "", password = "", role = "user";

        try
        {
            var raw = await ReadRawBodyAsync(ctx);
            if (!string.IsNullOrWhiteSpace(raw))
            {
                using var doc = JsonDocument.Parse(raw);
                var root = doc.RootElement;
                email    = GetProp(root, "email");
                password = GetProp(root, "password");
                if (includeUsername) username = GetProp(root, "username");
                var roleTry = GetProp(root, "role");
                if (!string.IsNullOrWhiteSpace(roleTry)) role = roleTry;
            }
        } catch { }


        try
        {
            if (ctx.Request.HasFormContentType)
            {
                var form = await ctx.Request.ReadFormAsync();
                email    = string.IsNullOrWhiteSpace(email)    ? form["email"].ToString()    : email;
                password = string.IsNullOrWhiteSpace(password) ? form["password"].ToString() : password;
                if (includeUsername)
                    username = string.IsNullOrWhiteSpace(username) ? form["username"].ToString() : username;
                role     = string.IsNullOrWhiteSpace(role)     ? (form["role"].ToString() == "" ? "user" : form["role"].ToString()) : role;
            }
        } catch { }


        var q = ctx.Request.Query;
        email    = string.IsNullOrWhiteSpace(email)    ? q["email"].ToString()    : email;
        password = string.IsNullOrWhiteSpace(password) ? q["password"].ToString() : password;
        if (includeUsername)
            username = string.IsNullOrWhiteSpace(username) ? q["username"].ToString() : username;
        role     = (string.IsNullOrWhiteSpace(role) ? (q["role"].ToString() == "" ? "user" : q["role"].ToString()) : role) ?? "user";

        return (email?.Trim() ?? "", username?.Trim() ?? "", password?.Trim() ?? "", role?.Trim() ?? "user");
    }

    public static void Start()
    {

        App.MapPost("/api/register", async (HttpContext context) =>
        {
            try
            {
                EnsureUsersTable(context);

                var (email, username, password, role) = await ReadCredsAsync(context, includeUsername: true);

                if (string.IsNullOrWhiteSpace(email) ||
                    string.IsNullOrWhiteSpace(username) ||
                    string.IsNullOrWhiteSpace(password))
                {
                    return Results.BadRequest(new { error = "Email, username och password krävs." });
                }

                var exists = SQLQueryOne("SELECT 1 FROM Users WHERE Email = $Email",
                                         new { Email = email }, context);
                if (exists != null && !exists.HasKey("error"))
                {
                    return Results.BadRequest(new { error = "E-postadressen är redan registrerad." });
                }

                var hashed = Password.Encrypt(password);

                SQLQuery(@"
                    INSERT INTO Users (Email, Username, Password, Role)
                    VALUES ($Email, $Username, $Password, $Role);
                ", new {
                    Email = email,
                    Username = username,
                    Password = hashed,
                    Role = role
                }, context);

                var userPublic = Obj(new {
                    Id        = (object)null,
                    Username  = username,
                    Email     = email,
                    Role      = role,
                    CreatedAt = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss")
                });


                Session.Set(context, "user", userPublic);

                return Results.Text(JSON.Stringify(userPublic), "application/json; charset=utf-8");
            }
            catch (Exception ex)
            {
                var dbg = (bool)(Globals.debugOn ?? false);
                return dbg
                    ? Results.BadRequest(new { error = "REGISTER_FAILED", detail = ex.Message })
                    : Results.StatusCode(500);
            }
        });


        App.MapPost("/api/login", async (HttpContext context) =>
        {
            try
            {
                EnsureUsersTable(context);

                var (email, _, password, _) = await ReadCredsAsync(context, includeUsername: false);
                if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
                    return Results.BadRequest(new { error = "Email och password krävs." });

                dynamic row = SQLQueryOne(@"
                    SELECT Id, Email, Username, Password, Role, CreatedAt
                    FROM Users
                    WHERE Email = $Email
                    LIMIT 1;
                ", new { Email = email }, context);

                if (row == null || row.HasKey("error"))
                    return Results.Unauthorized();

                string encrypted = (string)(row.Password ?? row.password ?? "");
                if (!Password.Verify(password, encrypted))
                    return Results.Unauthorized();

                var userPublic = ToPublicUser(row);
                Session.Set(context, "user", userPublic);

                return Results.Text(JSON.Stringify(userPublic), "application/json; charset=utf-8");
            }
            catch (Exception ex)
            {
                var dbg = (bool)(Globals.debugOn ?? false);
                return dbg
                    ? Results.BadRequest(new { error = "LOGIN_FAILED", detail = ex.Message })
                    : Results.StatusCode(500);
            }
        });


        App.MapGet("/api/login", async (HttpContext context) =>
        {

            var q = context.Request.Query;
            var qEmail = q["email"].ToString();
            var qPass  = q["password"].ToString();

            if (!string.IsNullOrWhiteSpace(qEmail) && !string.IsNullOrWhiteSpace(qPass))
            {
                EnsureUsersTable(context);

                dynamic row = SQLQueryOne(@"
                    SELECT Id, Email, Username, Password, Role, CreatedAt
                    FROM Users
                    WHERE Email = $Email
                    LIMIT 1;
                ", new { Email = qEmail }, context);

                if (row == null || row.HasKey("error"))
                    return Results.Unauthorized();

                string encrypted = (string)(row.Password ?? row.password ?? "");
                if (!Password.Verify(qPass, encrypted))
                    return Results.Unauthorized();

                var userPublicFromGet = ToPublicUser(row);
                Session.Set(context, "user", userPublicFromGet);

                return Results.Text(JSON.Stringify(userPublicFromGet), "application/json; charset=utf-8");
            }


            var user = GetUser(context);
            if (user == null) return Results.NoContent();
            return Results.Text(JSON.Stringify(user), "application/json; charset=utf-8");
        });

        App.MapDelete("/api/login", (HttpContext context) =>
        {
            Session.Set(context, "user", null);
            return Results.Text(JSON.Stringify(new { status = "Successful logout." }), "application/json; charset=utf-8");
        });
    }
}
