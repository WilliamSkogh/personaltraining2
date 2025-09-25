using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;




int portValue = 3001;


string dbPathValue = "C:\\Users\\William\\source\\repos\\exemple-branching-dev\\db_template\\_db.sqlite3";


string frontendPathValue = @"C:\Users\William\source\repos\exemple-branching-dev\frontend\dist";


Globals = Obj(new
{
    debugOn = true,
    detailedAclDebug = false,
    aclOn = false,                
    aclRules = new object[] { },  
    isSpa = false,                 
    port = portValue,
    serverName = "Minimal API Backend",
    frontendPath = frontendPathValue, 
    dbPath = dbPathValue,
    sessionLifeTimeHours = 2
});


Server.Start();
