// Global settings
Globals = Obj(new
{
    debugOn = true,
    detailedAclDebug = false,
    aclOn = false, // temporärt false för att slippa krångel med ACL under utveckling
    isSpa = true,
    port = args[0],
    serverName = "Minimal API Backend",
    frontendPath = args[1],
    dbPath = args[2],
    sessionLifeTimeHours = 2
});

Server.Start();