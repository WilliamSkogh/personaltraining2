using System.IO;

namespace WebApp;

public static class FileServer
{
    public static void Start()
    {

        if (!(Globals.isSpa is bool spa && spa))
        {
            Console.WriteLine("[FileServer] isSpa=false → hoppar över SPA-serving.");
            return;
        }

        ServeFiles();
    }

    private static void ServeFiles()
    {
        string frontendRootPath = Globals.frontendPath as string ?? "";
        if (string.IsNullOrWhiteSpace(frontendRootPath) || !Directory.Exists(frontendRootPath))
        {
            Console.WriteLine($"[FileServer] Frontend-mapp saknas: '{frontendRootPath}'. Hoppar över SPA-serving.");
            return; 
        }


        Console.WriteLine($"[FileServer] Serving static files from: {frontendRootPath}");
    }
}
