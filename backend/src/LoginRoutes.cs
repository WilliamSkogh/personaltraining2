using System.Text;
using System.Text.Json;

namespace WebApp;

public static class LoginRoutes
{

    private const string T_USERS = "Users";
    private const string C_ID = "Id";
    private const string C_EMAIL = "Email";
    private const string C_USERNAME = "Username";
    private const string C_PASSWORD = "PasswordHash";
    private const string C_ROLE = "Role";
    private const string C_CREATED = "CreatedAt";

    private static Obj GetUser(HttpContext context) => Session.Get(context, "user");

    private static void EnsureUsersTable(HttpContext context)
    {
        SQLQuery($@"
            CREATE TABLE IF NOT EXISTS {T_USERS} (
                {C_ID} INTEGER PRIMARY KEY AUTOINCREMENT,
                {C_USERNAME} TEXT NOT NULL UNIQUE,
                {C_EMAIL} TEXT NOT NULL UNIQUE,
                {C_PASSWORD} TEXT NOT NULL,
                {C_ROLE} TEXT DEFAULT 'user',
                {C_CREATED} DATETIME DEFAULT CURRENT_TIMESTAMP
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
            if (p.NameEquals(name) || p.Name.Equals(name, StringComparison.OrdinalIgnoreCase))
                return p.Value.ValueKind == JsonValueKind.String ? (p.Value.GetString() ?? "") : p.Value.ToString();
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

    private static bool LooksLikeBcrypt(string s) =>
        !string.IsNullOrWhiteSpace(s) && s.StartsWith("$2");

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


                var dup = SQLQueryOne($@"
                    SELECT 1
                    FROM {T_USERS}
                    WHERE {C_EMAIL} = $Email OR {C_USERNAME} = $Username
                    LIMIT 1;
                ", new { Email = email, Username = username }, context);
                if (dup != null && !dup.HasKey("error"))
                    return Results.BadRequest(new { error = "E-post eller användarnamn är redan registrerat." });

                var hashed = Password.Encrypt(password);


                SQLQuery($@"
                    INSERT INTO {T_USERS} ({C_EMAIL}, {C_USERNAME}, {C_PASSWORD}, {C_ROLE})
                    VALUES ($Email, $Username, $PasswordHash, $Role);
                ", new {
                    Email = email,
                    Username = username,
                    PasswordHash = hashed,
                    Role = role
                }, context);


                dynamic created = SQLQueryOne($@"
                    SELECT 
                        {C_ID}       AS Id,
                        {C_USERNAME} AS Username,
                        {C_EMAIL}    AS Email,
                        {C_ROLE}     AS Role,
                        {C_CREATED}  AS CreatedAt
                    FROM {T_USERS}
                    WHERE {C_EMAIL} = $Email
                    LIMIT 1;
                ", new { Email = email }, context);

                if (created == null || created.HasKey("error"))
                    return Results.StatusCode(500);

                var userPublic = ToPublicUser(created);
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

                var list = SQLQuery($@"
                    SELECT 
                        {C_ID}       AS Id,
                        {C_EMAIL}    AS Email,
                        {C_USERNAME} AS Username,
                        {C_PASSWORD} AS PasswordHash,  -- aliasas som PasswordHash i resultatet
                        {C_ROLE}     AS Role,
                        {C_CREATED}  AS CreatedAt
                    FROM {T_USERS}
                    WHERE {C_EMAIL} = $Email
                    LIMIT 1;
                ", new { Email = email }, context);

                if (list == null || list.Length == 0) return Results.Unauthorized();
                dynamic row = list[0];
                if (row == null || row.HasKey("error")) return Results.Unauthorized();

                string encrypted = "";
                try { encrypted = (string)(row.PasswordHash ?? row.passwordhash ?? ""); } catch { encrypted = ""; }
                if (!LooksLikeBcrypt(encrypted)) return Results.Unauthorized();
                if (!Password.Verify(password, encrypted)) return Results.Unauthorized();

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


        App.MapGet("/api/login", (HttpContext context) =>
        {
            var q = context.Request.Query;
            var qEmail = q["email"].ToString();
            var qPass  = q["password"].ToString();

            if (!string.IsNullOrWhiteSpace(qEmail) && !string.IsNullOrWhiteSpace(qPass))
            {
                EnsureUsersTable(context);

                var list = SQLQuery($@"
                    SELECT 
                        {C_ID}       AS Id,
                        {C_EMAIL}    AS Email,
                        {C_USERNAME} AS Username,
                        {C_PASSWORD} AS PasswordHash,
                        {C_ROLE}     AS Role,
                        {C_CREATED}  AS CreatedAt
                    FROM {T_USERS}
                    WHERE {C_EMAIL} = $Email
                    LIMIT 1;
                ", new { Email = qEmail }, context);

                if (list == null || list.Length == 0) return Results.Unauthorized();
                dynamic row = list[0];
                if (row == null || row.HasKey("error")) return Results.Unauthorized();

                string encrypted = "";
                try { encrypted = (string)(row.PasswordHash ?? row.passwordhash ?? ""); } catch { encrypted = ""; }
                if (!LooksLikeBcrypt(encrypted)) return Results.Unauthorized();
                if (!Password.Verify(qPass, encrypted)) return Results.Unauthorized();

                var userPublicFromGet = ToPublicUser(row);
                Session.Set(context, "user", userPublicFromGet);

                return Results.Text(JSON.Stringify(userPublicFromGet), "application/json; charset=utf-8");
            }

            var me = GetUser(context);
            if (me == null) return Results.NoContent();
            return Results.Text(JSON.Stringify(me), "application/json; charset=utf-8");
        });


        App.MapDelete("/api/login", (HttpContext context) =>
        {
            Session.Set(context, "user", null);
            return Results.Text(JSON.Stringify(new { status = "Successful logout." }), "application/json; charset=utf-8");
        });
    }
}
