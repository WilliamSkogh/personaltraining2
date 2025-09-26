namespace WebApp;

public static class Server
{
    public static void Start()
    {
        int port = 3001;
        try { port = (int)(Globals.port ?? 3001); } catch { }

        var builder = WebApplication.CreateBuilder();


        builder.WebHost.UseUrls($"http://localhost:{port}", $"http://0.0.0.0:{port}");

        Shared.App = builder.Build();
        var app = Shared.App;


        Middleware(app);
        DebugLog.Start();
        Acl.Start();
        ErrorHandler.Start();
        FileServer.Start();
        LoginRoutes.Start();
        RestApi.Start();
        Session.Start();
        DevResetRoutes.Start();


        var urls = app.Urls?.ToArray() ?? Array.Empty<string>();
        if (urls.Length == 0) urls = new[] { $"http://localhost:{port}" };
        Console.WriteLine("[SERVER] Listening on:");
        foreach (var u in urls) Console.WriteLine($"  • {u}");


        app.Run();
    }

    private static void Middleware(WebApplication app)
    {
        app.Use(async (ctx, next) =>
        {
            var t0 = DateTime.UtcNow;
            await next();
            var ms = (int)(DateTime.UtcNow - t0).TotalMilliseconds;
            Console.WriteLine($"[{DateTime.Now:HH:mm:ss}] {ctx.Request.Method} {ctx.Request.Path}  {ctx.Response.StatusCode}  ({ms} ms)");
        });
    }
}
