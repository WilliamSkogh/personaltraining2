namespace WebApp;

public static partial class Session
{
    private static dynamic GetRawSession(HttpContext context)
    {
        var inContext = context.Items["session"];
        if (inContext != null) return inContext;

        context.Request.Cookies.TryGetValue("session", out string cookieValue);
        if (string.IsNullOrEmpty(cookieValue))
        {
            cookieValue = Guid.NewGuid().ToString();

            var opts = new CookieOptions
            {
                Path = "/",
                HttpOnly = true,
                SameSite = SameSiteMode.Lax,
                Secure = context.Request.IsHttps,
                MaxAge = TimeSpan.FromHours(2)
            };

            context.Response.Cookies.Append("session", cookieValue, opts);
        }

        var session = SQLQueryOne(
            "SELECT * FROM sessions WHERE id = $id",
            new { id = cookieValue }
        );

        if (session == null)
        {
            SQLQuery("INSERT INTO sessions(id) VALUES($id)", new { id = cookieValue });
            session = Obj(new { id = cookieValue, data = "{}" });
        }

        context.Items["session"] = session;
        return session;
    }

    public static void Start()
    {
        DeleteOldSessions();
    }

    public static dynamic Get(HttpContext context, string key)
    {
        var session = GetRawSession(context);
        var data = JSON.Parse(session.data ?? "{}");
        return data[key];
    }

    public static void Set(HttpContext context, string key, object value)
    {
        var session = GetRawSession(context);
        var data = JSON.Parse(session.data ?? "{}");
        data[key] = value;

        var hasModified = false;
        try
        {
            var info = SQLQueryOne("SELECT COUNT(*) AS Cnt FROM pragma_table_info('sessions') WHERE name = 'modified'");
            int cnt = 0;
            try { cnt = Convert.ToInt32(info.Cnt); } catch { try { cnt = Convert.ToInt32($"{info.Cnt}"); } catch { } }
            hasModified = cnt > 0;
        }
        catch { }

        if (hasModified)
        {
            SQLQuery(
                @"UPDATE sessions 
                  SET modified = DATETIME('now'), data = $data
                  WHERE id = $id",
                new { session.id, data = JSON.Stringify(data) }
            );
        }
        else
        {
            SQLQuery(
                @"UPDATE sessions 
                  SET data = $data
                  WHERE id = $id",
                new { session.id, data = JSON.Stringify(data) }
            );
        }
    }
}
