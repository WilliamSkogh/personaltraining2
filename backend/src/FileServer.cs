namespace WebApp;
public static class FileServer
{
    private static string FPath;

    public static void Start()
    {
        // Convert frontendPath to an absolute path
        FPath = Path.Combine(
            Directory.GetCurrentDirectory(),
            Globals.frontendPath
        );


        if (!Directory.Exists(FPath))
        {
            Directory.CreateDirectory(FPath);
            var message = @"<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <title>Build Required</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            text-align: center;
            padding: 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        h1 { margin-bottom: 20px; }
        code {
            background: rgba(0, 0, 0, 0.3);
            padding: 10px 20px;
            border-radius: 5px;
            display: inline-block;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class='container'>
        <h1>⚠️ Build Required</h1>
        <p>The frontend needs to be built first.</p>
        <p>Run this command in the project root:</p>
        <code>npm run build</code>
        <p style='margin-top: 20px;'>Then refresh this page.</p>
    </div>
</body>
</html>";
            File.WriteAllText(Path.Combine(FPath, "index.html"), message);
        }

        HandleStatusCodes();
        ServeFiles();
        ServeFileLists();
    }

    // Write status codes as response bodies
    // and if the app is an SPA serve index.html on non-file 404:s
    private static void HandleStatusCodes()
    {
        App.UseStatusCodePages(async statusCodeContext =>
        {
            var context = statusCodeContext.HttpContext;
            var request = context.Request;
            var response = context.Response;
            var statusCode = response.StatusCode;
            var isInApi = request.Path.StartsWithSegments("/api");
            var isFilePath = (request.Path + "").Contains('.');
            var type = isInApi || statusCode != 404 ?
                "application/json; charset=utf-8" : "text/html";
            var error = statusCode == 404 ?
                "404. Not found." : "Status code: " + statusCode;

            response.ContentType = type;
            if (Globals.isSpa && !isInApi && !isFilePath && statusCode == 404)
            {
                // For SPA:s server the index.html on routes not matching
                // any folders (thus handing the routing to the frontend)
                response.StatusCode = 200;
                await response.WriteAsync(
                    File.ReadAllText(Path.Combine(FPath, "index.html"))
                );
            }
            else
            {
                await response.WriteAsJsonAsync(new { error });
            }
        });
    }

    private static void ServeFiles()
    {
        // Serve static frontend files (middleware)
        App.UseFileServer(new FileServerOptions
        {
            FileProvider = new PhysicalFileProvider(FPath)
        });
    }

    private static void ServeFileLists()
    {
        // Get a list of files from a subfolder in the frontend
        App.MapGet("/api/files/{folder}", (HttpContext context, string folder) =>
        {
            object result = null;
            try
            {
                result = Arr(Directory.GetFiles(Path.Combine(FPath, folder)))
                    .Map(x => Arr(x.Split('/')).Pop())
                    .Filter(x => Acl.Allow(context, "GET", "/content/" + x));
            }
            catch (Exception) { }
            return RestResult.Parse(context, result);
        });
    }
}