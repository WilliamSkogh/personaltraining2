namespace WebApp;

public static class Acl
{

    private static Arr rules = Arr();


    public static async void Start()
    {

        if (!(Globals.aclOn is bool on) || !on)
        {
            Console.WriteLine("[ACL] Avstängd (aclOn=false). Hoppar över.");
            return;
        }

        Console.WriteLine("[ACL] På (aclOn=true). Laddar regler från DB var 60s…");
        while (true)
        {
            try
            {

                var fetched = SQLQuery("SELECT * FROM acl ORDER BY allow");
                UnpackRules(fetched);
            }
            catch (Exception ex)
            {
                Console.WriteLine("[ACL] Kunde inte läsa regler: " + ex.Message);
            }
            await Task.Delay(60000);
        }
    }


    public static void UnpackRules(Arr allRules)
    {
        rules = allRules ?? Arr();
    }


    public static bool Allow(HttpContext context)
    {
        // ACL av → tillåt
        if (!(Globals.aclOn is bool on) || !on) return true;

        var method = context.Request?.Method ?? "GET";
        var path = context.Request?.Path.Value ?? "/";
        return Allow(context, method, path);
    }


    public static bool Allow(HttpContext context, string method, string path)
    {

        if (!(Globals.aclOn is bool on) || !on) return true;


        bool allowed = true;


        try
        {

            var user = Session.Get(context, "user"); 
            var userRole = (string)(user?.Role ?? "anon");
            var userEmail = (string)(user?.Email ?? "");

            var toLog = Obj(new
            {
                userRole,
                userEmail = string.IsNullOrWhiteSpace(userEmail) ? null : userEmail,
                aclAllowed = allowed,
                method,
                path
            });
            DebugLog.Add(context, toLog);
        }
        catch
        {
            // Ignorera loggfel
        }

        return allowed;
    }
}
