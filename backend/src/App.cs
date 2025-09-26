using System;


Globals = Obj(new
{
    debugOn = true,
    detailedAclDebug = false,
    aclOn = false,
    aclRules = new object[] { },
    isSpa = false, 
    port = 3001,
    serverName = "Minimal API Backend",


    dbPath = @"C:\Users\William\source\repos\exemple-branching-dev\backend\db_template\_db.sqlite3",

    frontendPath = @"C:\Users\William\source\repos\exemple-branching-dev\frontend\dist",

    sessionLifeTimeHours = 2
});


Console.WriteLine($"[BOOT] dbPath={Globals.dbPath}");


Server.Start();
